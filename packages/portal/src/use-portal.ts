/**
 * Vue 层 —— 容器创建与复用、嵌套顺序队列、z-index 继承。
 *
 * 对应 `@rc-component/portal@2.1.0` 的 `useDom.js` + `Portal.js` 的容器部分，
 * 以及 antd 的 `_util/hooks/useZIndex.ts` + `_util/zindexContext.ts`。
 *
 * ## 与 React 版的结构差异
 *
 * React 用 `context`（`OrderContext` / `ZIndexContext`）向下传两个值；
 * Vue 用 `provide` / `inject` 配对。语义一致：
 *
 * | React | Vue |
 * |---|---|
 * | `OrderContext.Provider value={queueCreate}` | `provide(PORTAL_ORDER_KEY, enqueue)` |
 * | `useContext(OrderContext)` | `inject(PORTAL_ORDER_KEY, null)` |
 * | `ZIndexContext` | `provide/inject(ZINDEX_KEY)` |
 */

import { canUseDom, devUseWarning, isDev } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  type InjectionKey,
  inject,
  onMounted,
  onUnmounted,
  onUpdated,
  provide,
  type Ref,
  type ShallowRef,
  shallowRef,
  watch,
} from 'vue';

import type { AppendFn, ContainerLike, GetContainer, ResolvedContainer } from './container';
import {
  computeZIndex,
  enqueueAppend,
  flushAppendQueue,
  resolveContainer,
  shouldWarnZIndex,
  type ZIndexComponentType,
} from './container';

// ---------------------------------------------------------------------------
// 注入键
// ---------------------------------------------------------------------------

/** 父级 Portal 提供的「把自己的 append 交给父」函数；`null` = 我是顶层 */
export const PORTAL_ORDER_KEY: InjectionKey<(appendFn: AppendFn) => void> =
  Symbol('apollo-portal-order');

/**
 * 父级浮层的 z-index。
 *
 * ⚠️ 传的是 `ComputedRef` 而不是裸数值：`provide` 一个标量不会让子孙更新，
 *    必须传响应式容器，子孙再 `.value` 读取才能建立依赖。
 *    这是 Vue 相对 React `useContext` 的必要改写（antd 靠重新渲染拿到新值）。
 */
export const ZINDEX_KEY: InjectionKey<ComputedRef<number>> = Symbol('apollo-z-index');

// ---------------------------------------------------------------------------
// 容器
// ---------------------------------------------------------------------------

export interface UsePortalContainerOptions {
  /** 想要的可见性。响应式 */
  open: () => boolean;
  /** 关闭后是否卸载内容。默认 `true`（与 antd 一致） */
  autoDestroy?: boolean;
  /**
   * 容器来源。四种形态见 `GetContainer`。
   * 不传 ⇒ 创建默认容器挂到 `document.body`。
   *
   * ⭐ 这里是**两层**：本选项是一个「取 spec 的 getter」，`GetContainer` 本身又可以是
   *    一个函数（antd 的写法）。两层都不能省：
   *
   *   · 少了外层 ⇒ 组件侧读不到最新的 props（Vue 的 props 是响应式的，每次 update
   *     都得重新读一次，而 `reResolveContainer` 正是挂在 `onUpdated` 上的）
   *   · 少了内层（直接返回元素）⇒ `resolveContainer` 拿到 `undefined` 时只能给 `null`，
   *     「未就绪」这个第三态就没了，内容会先渲染进默认容器再搬一次家
   *
   * 典型写法：`getContainer: () => props.getContainer`。
   */
  getContainer?: () => GetContainer;
  /** dev 下给默认容器打 `data-debug`，便于在 DOM 里认出它 */
  debug?: string;
  /** 注入点，仅测试用。默认 `document` */
  doc?: () => Document | null;
}

export interface UsePortalContainerReturn {
  /**
   * 最终要 teleport 到的目标。
   * `false` = 内联渲染 ｜ `null` = 还不能渲染（未就绪或 SSR）
   */
  container: ComputedRef<ContainerLike | false | null>;
  /** 是否已经可以渲染（对应 `Portal.js:78-80` 的三条判据合取） */
  shouldRender: ComputedRef<boolean>;
  /** 默认容器（本 Portal 自建的那个 div），供测试与调试观察 */
  defaultContainer: ShallowRef<HTMLElement | null>;
}

/**
 * 容器解析 + 默认容器的创建/复用/卸载 + 嵌套入队。
 *
 * 五条必须照抄的时序（错一条就会出现顺序闪烁、SSR 崩溃或容器泄漏）：
 *   1. 默认容器在 **setup** 里就建（对齐 `useState(() => canUseDom() ? create : null)`），
 *      但 SSR 下 `canUseDom()` 为 false ⇒ 一个 div 都不许建；
 *   2. `innerContainer` 的**首次**解析在 setup（可能是 `undefined`），
 *      之后每次 commit 都要重解析一次并 `?? null`（antd 的 effect **没有依赖数组**）；
 *   3. `undefined`（未就绪）时**不渲染**，等下一次 commit；
 *   4. append 的门控是 `mergedRender && !innerContainer` —— 用了自定义容器就不 append 默认容器；
 *   5. 顶层立即 append，嵌套的把 append **交给祖先队列**（保证祖先先入 DOM）。
 */
export function usePortalContainer(options: UsePortalContainerOptions): UsePortalContainerReturn {
  const { open, autoDestroy = true, getContainer, debug, doc } = options;

  const getDoc = (): Document | null =>
    doc ? doc() : typeof document !== 'undefined' ? document : null;

  // ---- innerContainer：解析用户给的容器 ----
  // 首次解析对齐 `useState(() => getPortalContainer(getContainer))`：
  // 结果**可能是 undefined**（典型：`getContainer()` 依赖 ref，首帧还没挂上）。
  const innerContainer = shallowRef<ResolvedContainer>(
    getContainer ? resolveContainer(getContainer(), getDoc()) : null,
  );

  /**
   * 对齐 antd 那个**没有依赖数组**的 `useEffect` —— 每次 commit 后都重解析一次，
   * 并且结果 `?? null`（effect 里永远不会是 undefined）。
   * Vue 侧用 `onMounted` + `onUpdated` 组合等价覆盖；值不变时 shallowRef 不会再触发更新。
   */
  function reResolveContainer(): void {
    if (!getContainer) return;
    innerContainer.value = resolveContainer(getContainer(), getDoc()) ?? null;
  }

  // ---- shouldRender：`mergedRender = shouldRender || open` ----
  const rendered = shallowRef(open());
  watch(open, (next) => {
    if (autoDestroy || next) rendered.value = next;
  });
  const mergedRender = computed(() => rendered.value || open());

  // ---- 默认容器（useDom.js:10-23）----
  // ⚠️ 不是「用时才建」，而是 setup 阶段就建 —— antd 是 `useState(() => ...)`。
  //    差别可观察：若惰性创建，首帧 `container` 会是 null，而 antd 首帧就已经有容器了。
  function createDefaultContainer(): HTMLElement | null {
    if (!canUseDom()) return null;
    const target = getDoc();
    if (!target) return null;
    const ele = target.createElement('div');
    if (debug && isDev) {
      ele.setAttribute('data-debug', debug);
    }
    return ele;
  }

  const defaultContainer: ShallowRef<HTMLElement | null> = shallowRef(createDefaultContainer());

  // ---- 嵌套顺序（useDom.js:25-67）----
  const parentEnqueue = inject(PORTAL_ORDER_KEY, null);
  const queue = shallowRef<AppendFn[]>([]);
  const appended = shallowRef(false);

  /**
   * 传给子孙的 enqueue：
   *   · 有祖先 ⇒ 原样透传（整棵子树共用同一个祖先队列，祖先必然先入 DOM）
   *   · 自己已 append ⇒ 子孙拿到 `undefined`，于是它们**立刻**自己 append
   *     （antd 的语义：既然我已在 DOM 里，子级直接挂是安全的）
   *
   * ⚠️ 第二点不能用「提供 no-op 函数」实现 —— 那会让子孙的 append 永远不被执行、
   *     容器进不了 DOM。必须等价于「立即执行」。
   */
  const mergedEnqueue: (appendFn: AppendFn) => void = parentEnqueue
    ? parentEnqueue
    : (appendFn: AppendFn) => {
        if (appended.value) {
          appendFn();
          return;
        }
        queue.value = enqueueAppend(queue.value, appendFn);
      };
  provide(PORTAL_ORDER_KEY, mergedEnqueue);

  function append(): void {
    const ele = defaultContainer.value;
    if (ele && !ele.parentElement) {
      getDoc()?.body?.appendChild(ele);
    }
    appended.value = true;
  }

  function cleanup(): void {
    const ele = defaultContainer.value;
    ele?.parentElement?.removeChild(ele);
    appended.value = false;
  }

  // `useLayoutEffect(..., [render])`，`render = mergedRender && !innerContainer`
  const shouldAppend = computed(() => mergedRender.value && !innerContainer.value);

  function runAppend(next: boolean): void {
    if (next) {
      if (parentEnqueue) {
        parentEnqueue(append);
      } else {
        append();
      }
    } else {
      cleanup();
    }
  }

  // ⭐⭐ 首次必须用 `onMounted` 而不是 `watch(..., { immediate: true })`。
  //    `immediate` 会在 **setup 里同步**执行，而 setup 是自顶向下的 —— 父级会在子级
  //    被创建之前就 `append()` 并置 `appended = true`，于是子级认为「父已入 DOM」，
  //    立刻自己 append ⇒ **子容器排在父容器前面**，嵌套顺序反转。
  //    antd 用 `useLayoutEffect`，React 的 effect 是自底向上跑的；Vue 的 `onMounted`
  //    同样是自底向上（子先于父），所以二者等价。
  onMounted(() => runAppend(shouldAppend.value));
  // 之后的变化（open 切换）用 post-flush watcher
  watch(shouldAppend, runAppend, { flush: 'post' });

  onMounted(reResolveContainer);
  onUpdated(reResolveContainer);
  onUnmounted(cleanup);

  // flush 队列（useDom.js:60-64）
  watch(
    queue,
    (next) => {
      if (next.length) {
        flushAppendQueue(next);
        queue.value = [];
      }
    },
    { flush: 'post' },
  );

  const container = computed<ContainerLike | false | null>(() => {
    if (innerContainer.value === false) return false;
    return innerContainer.value ?? defaultContainer.value;
  });

  // `Portal.js:78` —— ⚠️ 这里**不**检查 `container !== null`：
  // antd 也没检查，因为 `canUseDom()` 为真时默认容器必然已建。
  // 多余的检查会变成覆盖率里的死角分支，见 position 包 `getWin` 的教训。
  const shouldRender = computed(
    () => mergedRender.value && canUseDom() && innerContainer.value !== undefined,
  );

  return { container, shouldRender, defaultContainer };
}

/**
 * 子孙组件取用祖先的 enqueue。
 *
 * 与 `usePortalContainer` 内部的 `inject` 是同一个键 —— 组件若自己不建容器、
 * 只想把 append 交给祖先（例如 ui 层的浮层内容），就用这个。
 */
export function usePortalOrder(): ((appendFn: AppendFn) => void) | null {
  return inject(PORTAL_ORDER_KEY, null);
}

// ---------------------------------------------------------------------------
// z-index
// ---------------------------------------------------------------------------

export interface UseZIndexOptions {
  /** `token.zIndexPopupBase`。不传用 `DEFAULT_Z_INDEX_POPUP_BASE` */
  zIndexPopupBase?: number;
}

/**
 * z-index 层级（`_util/hooks/useZIndex.ts`）。
 *
 * ⭐ 返回 `undefined` 是**正常且预期**的：最外层浮层不设 z-index，靠 DOM 顺序堆叠。
 * 只有嵌套在父浮层里才会拿到数值。想强制指定就传 `customZIndex`。
 */
export function useZIndex(
  componentType: ZIndexComponentType,
  customZIndex?: () => number | undefined,
  options: UseZIndexOptions = {},
): ComputedRef<number | undefined> {
  const parentZIndexRef = inject(ZINDEX_KEY, null);
  const { zIndexPopupBase } = options;

  const pair = computed(() =>
    computeZIndex({
      componentType,
      customZIndex: customZIndex?.(),
      parentZIndex: parentZIndexRef?.value,
      ...(zIndexPopupBase !== undefined ? { zIndexPopupBase } : {}),
    }),
  );

  // 把算出来的值 provide 给子孙（对应 `<ZIndexContext.Provider value={contextZIndex}>`）
  provide(
    ZINDEX_KEY,
    computed(() => pair.value[1]),
  );

  if (isDev) {
    const warned = shallowRef(false);
    watch(
      pair,
      ([current]) => {
        if (warned.value) return;
        if (
          shouldWarnZIndex({
            customZIndex: customZIndex?.(),
            currentZIndex: current,
            ...(zIndexPopupBase !== undefined ? { zIndexPopupBase } : {}),
          })
        ) {
          warned.value = true;
          devUseWarning(componentType)(
            false,
            '`zIndex` is over design token `zIndexPopupBase` too much. It may cause unexpected override.',
          );
        }
      },
      { immediate: true },
    );
  }

  return computed(() => pair.value[0]);
}

/** 供组件拿到「容器 ref」的类型别名，避免各处写 `Ref<ContainerLike | null>` */
export type PortalContainerRef = Ref<ContainerLike | null>;
