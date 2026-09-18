/**
 * `useOverlay` —— 锚定浮层的「何时开、何时关」。
 *
 * 契约来源：`@rc-component/trigger@3.10.1/es/index.js` + `es/hooks/useWinClick.js` +
 * `@rc-component/portal@2.2.1/es/useEscKeyDown.js`。
 * 逐条对照见 `docs/foundation/overlay-contract.md` §3。
 *
 * ---------------------------------------------------------------------------
 * 与 React 的形态差异（H3：禁止机械翻译）
 * ---------------------------------------------------------------------------
 *
 * rc-trigger 用 `cloneElement(child, cloneProps)` 把事件处理器**注入**子元素。
 * Vue 没有（也不该有）clone 语义。这里改为**返回两个 props 对象**供模板 `v-bind`：
 *
 * ```vue
 * <button v-bind="targetProps">触发</button>
 * <div v-if="open" ref="popupRef" v-bind="popupProps">浮层</div>
 * ```
 *
 * 这样「事件挂在哪」在模板里一眼可见，也天然满足契约 §3.4 的顺序要求 ——
 * Vue 对「`v-bind` 的 `onClick` + 模板里的 `@click`」会合并成数组并**按此顺序**调用，
 * 正好是 rc 里「先 `triggerOpen`，后 `originChildProps[eventName]`」的次序。
 *
 * ---------------------------------------------------------------------------
 * 不做的事
 * ---------------------------------------------------------------------------
 *
 * - 定位几何 / 翻转 / 滚动测量 → `position`
 * - 挂载容器 / z-index 数值 → `portal`
 * - 焦点陷阱 → `a11y`
 * - 离场动画的**产生** → `motion`（本包只把 `inMotion` 当作入参消费）
 */

import { canUseDom, useControlledValue, useId } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  ref,
  toValue,
  watch,
} from 'vue';
import { isClickToHide, type OverlayActionInput, resolveActions } from './actions';
import { createDelayInvoker, type DelayInvoker } from './delay';
import { createEscStack, type EscStack } from './esc-stack';

/** 鼠标位置。`alignPoint`（右键菜单）定位用，单位是视口坐标。 */
export type MousePosition = readonly [number, number];

export interface UseOverlayOptions {
  /** 默认动作。`showAction` / `hideAction` 未指定时的回落值，默认 `'hover'`。 */
  action?: MaybeRefOrGetter<OverlayActionInput>;
  showAction?: MaybeRefOrGetter<OverlayActionInput>;
  hideAction?: MaybeRefOrGetter<OverlayActionInput>;

  /** 受控值。`undefined` 表示非受控。 */
  open?: MaybeRefOrGetter<boolean | undefined>;
  /** 非受控时的初始值。默认 `false`。 */
  defaultOpen?: boolean;
  /** 受控/非受控变化时回调。**只在真的变了才调用**。 */
  onOpenChange?: (open: boolean) => void;

  /** 压制渲染但不改变状态（契约 §3.3）。默认 `false`。 */
  disabled?: MaybeRefOrGetter<boolean | undefined>;

  /** 单位**秒**。 */
  mouseEnterDelay?: MaybeRefOrGetter<number | undefined>;
  /** 单位**秒**。rc 的默认 `0.1`。 */
  mouseLeaveDelay?: MaybeRefOrGetter<number | undefined>;
  focusDelay?: MaybeRefOrGetter<number | undefined>;
  blurDelay?: MaybeRefOrGetter<number | undefined>;

  /** 有遮罩时，外部点击是否仍能关闭（契约 §3.10 第 1 条）。默认 `true`。 */
  mask?: MaybeRefOrGetter<boolean | undefined>;
  maskClosable?: MaybeRefOrGetter<boolean | undefined>;

  /** 按鼠标位置定位（右键菜单）。默认 `false`。 */
  alignPoint?: MaybeRefOrGetter<boolean | undefined>;

  /** 离场动画进行中。`motion` 提供，本包只消费（契约 §3.6 第 3 条）。 */
  inMotion?: MaybeRefOrGetter<boolean | undefined>;

  /** Esc 栈注入。测试隔离用，默认用模块级单例。 */
  escStack?: EscStack;
  /** 延迟器注入。测试用。 */
  delayInvoker?: DelayInvoker;
}

/** 事件处理器集合。`v-bind` 到触发元素 / 浮层元素上。 */
export type OverlayEventProps = Record<string, (event: Event) => void>;

export interface UseOverlayReturn {
  /** 已含 `disabled` 压制 —— 渲染判定用这个。 */
  open: ComputedRef<boolean>;
  /** 未压制的原始状态。`motion` / 调试用。 */
  rawOpen: ComputedRef<boolean>;
  /** 显式开合。`delay` 单位秒，`0` 同步、`undefined` 下一宏任务。 */
  setOpen: (next: boolean, delay?: number) => void;
  /** 绑到触发元素上（`<button ref="targetRef" v-bind="targetProps">`）。 */
  targetRef: Ref<HTMLElement | null>;
  /** 绑到浮层元素上。 */
  popupRef: Ref<HTMLElement | null>;
  targetProps: ComputedRef<OverlayEventProps>;
  popupProps: ComputedRef<OverlayEventProps>;
  /** 最近一次**开启**动作时的鼠标位置。仅 `alignPoint` 场景有意义。 */
  mousePos: Readonly<Ref<MousePosition | null>>;
  /** 子浮层登记（契约 §3.12）。点子浮层也算"在浮层内"。 */
  registerSubPopup: (id: string, element: HTMLElement | null) => void;
  /** 本浮层在 Esc 栈里的 id。 */
  escId: string;
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

/** `ele === host || host.contains(ele)`。传 `null` 一律 false（rc 的可选链语义）。 */
function containsOrIs(host: HTMLElement | null, ele: EventTarget | null): boolean {
  if (!host || !ele) {
    return false;
  }
  if (ele === host) {
    return true;
  }
  return ele instanceof Node ? host.contains(ele) : false;
}

/** 取元素的 shadow host（没有则 `null`）。对应 rc 的 `getShadowRoot(ele)?.host`。 */
function getShadowHost(element: HTMLElement | null): Element | null {
  if (!element?.getRootNode) {
    return null;
  }
  const root = element.getRootNode();
  return root && root !== element && 'host' in root ? (root as ShadowRoot).host : null;
}

let globalEscStack: EscStack | null = null;

/** Esc 栈的模块级单例。SSR 下 `win` 为 `null`，`attach()` 是空操作。 */
export function getGlobalEscStack(): EscStack {
  if (!globalEscStack) {
    globalEscStack = createEscStack({ win: canUseDom() ? window : null });
  }
  return globalEscStack;
}

// ---------------------------------------------------------------------------
// 主实现
// ---------------------------------------------------------------------------

export function useOverlay(options: UseOverlayOptions = {}): UseOverlayReturn {
  const {
    defaultOpen = false,
    onOpenChange,
    escStack: injectedEscStack,
    delayInvoker: injectedDelayInvoker,
  } = options;

  const escStack = injectedEscStack ?? getGlobalEscStack();
  const delayInvoker = injectedDelayInvoker ?? createDelayInvoker();

  // ============================ 元素 ============================
  const targetRef = ref<HTMLElement | null>(null);
  const popupRef = ref<HTMLElement | null>(null);
  const mousePos = ref<MousePosition | null>(null) as Ref<MousePosition | null>;

  /** 子浮层。非响应式 —— 只在事件回调里读。 */
  const subPopupElements = new Map<string, HTMLElement | null>();

  // ============================ 开合 ============================
  const [rawOpenRef, setRawOpen] = useControlledValue<boolean>({
    defaultValue: defaultOpen,
    getValue: () => toValue(options.open),
    onChange: (next) => onOpenChange?.(next),
  });

  const disabled = computed(() => toValue(options.disabled) ?? false);
  const open = computed(() => rawOpenRef.value && !disabled.value);

  /**
   * 内部入口。`delay` **照原样**传给延迟器 ——
   * `undefined` 必须保持 `undefined`（走 `setTimeout(NaN ⇒ 0)`），不能被默认参数吃掉。
   *
   * ⭐ 只在 `rawOpen !== next` 时才写状态并回调 —— rc 的
   * `if (rawOpen !== nextOpen)`（`index.js:199`）。连续两次 `true` 只回调一次。
   */
  const triggerOpen = (next: boolean, delay: number | undefined): void => {
    delayInvoker.invoke(() => {
      if (rawOpenRef.value !== next) {
        setRawOpen(next);
      }
    }, delay);
  };

  /**
   * 对外入口。`delay` 默认 **0（同步）** —— 与 rc 的
   * `const triggerOpen = (nextOpen, delay = 0) => {`（`index.js:208`）一致。
   *
   * 想复刻「上游没给默认值」的 NaN 语义，请显式传 `undefined` 给内部路径，
   * 或调用 `setOpen(next, undefined)` 之外的写法 —— 这里刻意用默认参数屏蔽它。
   */
  const setOpen = (next: boolean, delay = 0): void => {
    triggerOpen(next, delay);
  };

  // ============================ 动作 ============================
  const actions = computed(() =>
    resolveActions({
      action: toValue(options.action),
      showAction: toValue(options.showAction),
      hideAction: toValue(options.hideAction),
    }),
  );
  const clickToHide = computed(() => isClickToHide(actions.value.hide));

  const mouseEnterDelay = () => toValue(options.mouseEnterDelay);
  const mouseLeaveDelay = () => toValue(options.mouseLeaveDelay) ?? 0.1;
  const focusDelay = () => toValue(options.focusDelay);
  const blurDelay = () => toValue(options.blurDelay);
  const inMotion = () => toValue(options.inMotion) ?? false;

  /** 触屏标记。触屏后忽略鼠标事件，由 click 复位（契约 §3.9）。 */
  const touched = ref(false);

  const setMousePosByEvent = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    if (typeof mouseEvent.clientX === 'number' && typeof mouseEvent.clientY === 'number') {
      mousePos.value = [mouseEvent.clientX, mouseEvent.clientY];
    }
  };

  const inPopupOrChild = (ele: EventTarget | null): boolean => {
    const target = targetRef.value;
    const popup = popupRef.value;
    return (
      containsOrIs(target, ele) ||
      getShadowHost(target) === ele ||
      containsOrIs(popup, ele) ||
      getShadowHost(popup) === ele ||
      [...subPopupElements.values()].some((sub) => containsOrIs(sub, ele))
    );
  };

  // ======================= 外部点击（契约 §3.10） ========================
  /** 浮层内按下的标记。双保险的"内半" —— 见 §3.10 第 5 条。 */
  let popupPointerDown = false;

  watch(
    () => {
      const popup = popupRef.value;
      const mask = toValue(options.mask) ?? false;
      const maskClosable = toValue(options.maskClosable) ?? true;
      return {
        enabled: clickToHide.value && popup !== null && (!mask || maskClosable),
        popup,
      };
    },
    (current, _previous, onCleanup) => {
      if (!current.enabled || !current.popup) {
        return;
      }
      // 拿不到 ownerDocument.defaultView 时回落到当前 window ——
      // 不写成 `if (!win) return`，因为那条分支在 jsdom / 浏览器下都不可达，
      // 会白占一个永远测不到的分支（覆盖率口径下是纯粹的负债）。
      const win = current.popup.ownerDocument?.defaultView ?? window;

      /** window 的 capture 阶段先置 false —— 顺序在 popup 的 capture 之前。 */
      const onWindowPointerDown = (): void => {
        popupPointerDown = false;
      };
      const onTriggerClose = (event: Event): void => {
        const composedTarget = (
          typeof (event as { composedPath?: () => EventTarget[] }).composedPath === 'function'
            ? (event as { composedPath: () => EventTarget[] }).composedPath()[0]
            : undefined
        ) as EventTarget | undefined;
        const ele = composedTarget ?? event.target;
        if (open.value && !inPopupOrChild(ele) && !popupPointerDown) {
          // 外部点击**不带延迟**
          setOpen(false);
        }
      };

      win.addEventListener('pointerdown', onWindowPointerDown, true);
      win.addEventListener('mousedown', onTriggerClose, true);
      win.addEventListener('contextmenu', onTriggerClose, true);

      onCleanup(() => {
        win.removeEventListener('pointerdown', onWindowPointerDown, true);
        win.removeEventListener('mousedown', onTriggerClose, true);
        win.removeEventListener('contextmenu', onTriggerClose, true);
      });
    },
    { flush: 'sync', immediate: true },
  );

  // ============================ Esc（契约 §3.11） ============================
  const escId = useId();

  watch(
    () => open.value,
    (isOpen, _previous, onCleanup) => {
      // SSR 守卫不在这里 —— `escStack.attach()` 自己对 `win: null` 空操作
      // （`esc-stack.test.ts` 有专门用例）。在这里再判一次 `canUseDom()` 只是
      // 多一条不可达分支。
      if (isOpen) {
        escStack.push({ id: escId, onEsc: ({ top }) => top && setOpen(false) });
        escStack.attach();
        onCleanup(() => {
          escStack.remove(escId);
          if (escStack.size === 0) {
            escStack.detach();
          }
        });
        return;
      }
      escStack.remove(escId);
      if (escStack.size === 0) {
        escStack.detach();
      }
    },
    { flush: 'sync', immediate: true },
  );

  // ============================ 事件集合 ============================
  const targetProps = computed<OverlayEventProps>(() => {
    const { show, hide } = actions.value;
    const props: OverlayEventProps = {};

    // -------- Touch（§3.9） --------
    if (show.has('touch') || hide.has('touch')) {
      props.onTouchstart = () => {
        touched.value = true;
        if (open.value && hide.has('touch')) {
          setOpen(false);
        } else if (!open.value && show.has('touch')) {
          setOpen(true);
        }
      };
    }

    // -------- Click（§3.5） --------
    const clickToShow = show.has('click');
    if (clickToShow || clickToHide.value) {
      props.onClick = (event) => {
        if (open.value && clickToHide.value) {
          setOpen(false);
        } else if (!open.value && clickToShow) {
          setMousePosByEvent(event);
          setOpen(true);
        }
        touched.value = false;
      };
    }

    // -------- Hover（§3.6） --------
    if (show.has('hover')) {
      const onEnter = (event: Event): void => {
        if (!touched.value) {
          setMousePosByEvent(event);
          triggerOpen(true, mouseEnterDelay());
        }
      };
      props.onMouseenter = onEnter;
      props.onPointerenter = onEnter;
    }
    if (hide.has('hover')) {
      const onLeave = (): void => {
        if (!touched.value) {
          triggerOpen(false, mouseLeaveDelay());
        }
      };
      props.onMouseleave = onLeave;
      props.onPointerleave = onLeave;
    }

    // -------- Focus（§3.7） --------
    if (show.has('focus')) {
      props.onFocus = () => triggerOpen(true, focusDelay());
    }
    if (hide.has('focus')) {
      props.onBlur = () => triggerOpen(false, blurDelay());
    }

    // -------- ContextMenu（§3.8） --------
    if (show.has('contextMenu')) {
      props.onContextmenu = (event) => {
        if (open.value && hide.has('contextMenu')) {
          setOpen(false);
        } else {
          setMousePosByEvent(event);
          setOpen(true);
        }
        // 无条件阻止原生右键菜单（含关闭分支）
        event.preventDefault();
      };
    }

    return props;
  });

  const popupProps = computed<OverlayEventProps>(() => {
    const { show, hide } = actions.value;
    const props: OverlayEventProps = {};

    /**
     * ⭐⭐ 从 trigger 移到浮层上不会关闭的机制（§3.6 第 3 条）：
     * `onMouseLeave` 排了一个 `mouseLeaveDelay` 的**关闭**定时器，
     * 移入浮层时再排一个**同延迟的开启**定时器 —— 后者 `clearDelay()` 掉前者。
     *
     * 条件里的 `inMotion` 是为了离场动画期间移回来还能救活。
     */
    if (show.has('hover')) {
      props.onMouseenter = (event) => {
        const popup = popupRef.value;
        if (
          (open.value || inMotion()) &&
          popup &&
          event.target instanceof Node &&
          popup.contains(event.target)
        ) {
          triggerOpen(true, mouseEnterDelay());
        }
      };
      props.onPointerenter = props.onMouseenter;
    }
    if (hide.has('hover')) {
      const onLeave = (): void => triggerOpen(false, mouseLeaveDelay());
      props.onMouseleave = onLeave;
      props.onPointerleave = onLeave;
    }

    /** 外部点击双保险的"内半"（§3.10 第 5 条）。 */
    if (clickToHide.value || hide.has('touch')) {
      props.onPointerdownCapture = () => {
        popupPointerDown = true;
      };
    }

    return props;
  });

  // ============================ 清理 ============================
  onScopeDispose(() => {
    delayInvoker.clear();
    escStack.remove(escId);
  });

  return {
    open,
    rawOpen: rawOpenRef as ComputedRef<boolean>,
    setOpen,
    targetRef,
    popupRef,
    targetProps,
    popupProps,
    mousePos,
    registerSubPopup: (id, element) => {
      subPopupElements.set(id, element);
    },
    escId,
  };
}
