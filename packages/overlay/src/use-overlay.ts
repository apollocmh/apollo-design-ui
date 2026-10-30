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
 * rc-trigger 用 `cloneElement(child, cloneProps)` 把事件处理器注入子元素。
 * 这里返回两个原生事件 props 对象，供 Vue 宿主明确绑定到实际 DOM：
 *
 * ```vue
 * <button v-bind="targetProps">触发</button>
 * <div v-if="open" ref="popupRef" v-bind="popupProps">浮层</div>
 * ```
 *
 * 宿主可通过模板绑定、h() 或 cloneVNode 合并原生事件，顺序取决于绑定/渲染方式。
 * 本包只提供所属事件动作，不读取、缓存或手动重复调用宿主监听器。
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

import { canUseDom, useControlledValue } from '@apollo-design/utils';
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

function isFocusScope(node: Node): node is Document | ShadowRoot {
  return node.nodeType === 9 || (node.nodeType === 11 && 'host' in node);
}

function isActiveFrameDocument(doc: Document): boolean {
  if (!doc.hasFocus()) return false;
  for (
    let frame = doc.defaultView?.frameElement;
    frame;
    frame = frame.ownerDocument.defaultView?.frameElement
  ) {
    const root = frame.getRootNode();
    if ((isFocusScope(root) ? root.activeElement : frame.ownerDocument.activeElement) !== frame)
      return false;
  }
  return true;
}

export interface UseOverlayOptions {
  /** 默认动作。`showAction` / `hideAction` 未指定时的回落值，默认 `'hover'`。 */
  action?: MaybeRefOrGetter<OverlayActionInput>;
  showAction?: MaybeRefOrGetter<OverlayActionInput>;
  hideAction?: MaybeRefOrGetter<OverlayActionInput>;

  /** 受控值。`undefined` 表示非受控。 */
  open?: MaybeRefOrGetter<boolean | undefined>;
  /** 非受控时的初始值。默认 `false`。 */
  defaultOpen?: boolean;
  /** 开关请求回调；请求值与当前 rawOpen 不同时调用。受控时由父级决定是否接受。 */
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

  /** Esc 栈注入。测试隔离用，默认按浮层所属窗口共享。 */
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
  /** 显式开合。`delay` 单位秒，省略、undefined 或 0 均同步执行。 */
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
  /** 本浮层在 Esc 栈里的实例 id；不用于 DOM 或 SSR 水合。 */
  escId: string;
}

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

/** 不用当前 realm 的 Node 构造器判断 iframe 内的原生节点。 */
function isNode(target: EventTarget): target is Node {
  return 'nodeType' in target;
}

/** `ele === host || host.contains(ele)`。传 `null` 一律 false。 */
function containsOrIs(host: HTMLElement | null, ele: EventTarget | null): boolean {
  if (!host || !ele) {
    return false;
  }
  if (ele === host) {
    return true;
  }
  return isNode(ele) ? host.contains(ele) : false;
}

/** 取元素的 shadow host（没有则 `null`）。对应 rc 的 `getShadowRoot(ele)?.host`。 */
function getShadowHost(element: HTMLElement | null): Element | null {
  if (!element?.getRootNode) {
    return null;
  }
  const root = element.getRootNode();
  return isFocusScope(root) && 'host' in root ? root.host : null;
}

const globalEscStacks = new WeakMap<Window, EscStack>();
let nextEscId = 0;

function getEscStackForWindow(win: Window): EscStack {
  let stack = globalEscStacks.get(win);
  if (!stack) {
    stack = createEscStack({ win });
    globalEscStacks.set(win, stack);
  }
  return stack;
}

/** 当前窗口的共享 Esc 栈。SSR 返回独立的无 DOM 栈，不保留请求状态。 */
export function getGlobalEscStack(): EscStack {
  return canUseDom() ? getEscStackForWindow(window) : createEscStack();
}

// ---------------------------------------------------------------------------
// 主实现
// ---------------------------------------------------------------------------

export function useOverlay(options: UseOverlayOptions = {}): UseOverlayReturn {
  const {
    defaultOpen = false,
    escStack: injectedEscStack,
    delayInvoker: injectedDelayInvoker,
  } = options;

  const delayInvoker = injectedDelayInvoker ?? createDelayInvoker();

  // ============================ 元素 ============================
  const targetRef = ref<HTMLElement | null>(null);
  const popupRef = ref<HTMLElement | null>(null);
  const mousePos = ref<MousePosition | null>(null);

  /** 子浮层。非响应式 —— 只在事件回调里读。 */
  const subPopupElements = new Map<string, HTMLElement>();

  // ============================ 开合 ============================
  const [rawOpenRef, setRawOpen] = useControlledValue<boolean>({
    defaultValue: defaultOpen,
    getValue: () => toValue(options.open),
    onChange: (next) => options.onOpenChange?.(next),
  });

  const disabled = computed(() => toValue(options.disabled) ?? false);
  const open = computed(() => rawOpenRef.value && !disabled.value);

  // Accepted state changes supersede older delayed trigger requests, including
  // a controlled close/reopen within the same render tick.
  watch(rawOpenRef, () => delayInvoker.clear(), { flush: 'sync' });

  let returningFocus = false;
  // Only actual accepted hiding returns focus. Refused controlled requests and
  // focus already moved outside this popup retain their current owner.
  watch(open, (next, previous) => {
    if (next || !previous) return;
    const popup = popupRef.value,
      target = targetRef.value;
    if (!popup || !target?.isConnected || !isActiveFrameDocument(popup.ownerDocument)) return;
    const root = popup.getRootNode();
    const active = isFocusScope(root) ? root.activeElement : popup.ownerDocument.activeElement;
    if (active && popup.contains(active)) {
      returningFocus = true;
      try {
        target.focus({ preventScroll: true });
      } finally {
        returningFocus = false;
      }
    }
  });

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
    if (
      'clientX' in event &&
      'clientY' in event &&
      typeof event.clientX === 'number' &&
      typeof event.clientY === 'number'
    ) {
      mousePos.value = [event.clientX, event.clientY];
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
        enabled: open.value && clickToHide.value && popup !== null && (!mask || maskClosable),
        popup,
        target: targetRef.value,
      };
    },
    (current, _previous, onCleanup) => {
      if (!current.enabled || !current.popup) {
        return;
      }
      const windows = new Set([
        current.popup.ownerDocument.defaultView,
        current.target?.ownerDocument.defaultView,
      ]);
      popupPointerDown = false;

      /** window 的 capture 阶段先置 false —— 顺序在 popup 的 capture 之前。 */
      const onWindowPointerDown = (): void => {
        popupPointerDown = false;
      };
      const onTriggerClose = (event: Event): void => {
        const composedTarget = event.composedPath()[0];
        const ele = composedTarget ?? event.target;
        if (open.value && !inPopupOrChild(ele) && !popupPointerDown) {
          // 外部点击**不带延迟**
          setOpen(false);
        }
      };

      for (const win of windows) {
        win?.addEventListener('pointerdown', onWindowPointerDown, true);
        win?.addEventListener('mousedown', onTriggerClose, true);
        win?.addEventListener('contextmenu', onTriggerClose, true);
      }

      onCleanup(() => {
        for (const win of windows) {
          win?.removeEventListener('pointerdown', onWindowPointerDown, true);
          win?.removeEventListener('mousedown', onTriggerClose, true);
          win?.removeEventListener('contextmenu', onTriggerClose, true);
        }
      });
    },
    { flush: 'sync', immediate: true },
  );

  // ============================ Esc（契约 §3.11） ============================
  const escId = `apollo-overlay-${++nextEscId}`;

  watch(
    () => {
      if (!open.value) return null;
      if (injectedEscStack) return injectedEscStack;
      const doc = popupRef.value?.ownerDocument ?? targetRef.value?.ownerDocument;
      const win = doc ? doc.defaultView : canUseDom() ? window : null;
      return win ? getEscStackForWindow(win) : null;
    },
    (escStack, _previous, onCleanup) => {
      if (!escStack) return;
      escStack.push({ id: escId, onEsc: ({ top }) => top && setOpen(false) });
      escStack.attach();
      onCleanup(() => {
        escStack.remove(escId);
        if (escStack.size === 0) escStack.detach();
      });
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
    if (clickToShow || clickToHide.value || show.has('touch') || hide.has('touch')) {
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
      props.onFocus = () => {
        if (!returningFocus) triggerOpen(true, focusDelay());
      };
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
        if ((open.value || inMotion()) && popup && containsOrIs(popup, event.target)) {
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
    subPopupElements.clear();
  });

  return {
    open,
    rawOpen: rawOpenRef,
    setOpen,
    targetRef,
    popupRef,
    targetProps,
    popupProps,
    mousePos,
    registerSubPopup: (id, element) => {
      if (element) subPopupElements.set(id, element);
      else subPopupElements.delete(id);
    },
    escId,
  };
}
