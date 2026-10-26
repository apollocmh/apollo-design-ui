/**
 * `useMotionStatus` —— 把 §5.1 的状态机与 §5.2 的驱动接进 Vue 的生命周期。
 *
 * ## 与 `<Transition>` 的关系
 *
 * **不用** `<Transition>`（见 `motion-contract.md` §6 的四处根本差异）。
 * Vue 在这里只提供三件事：`onMounted` 对应 React 的 layout effect、
 * `watch` 对应 props 变化、`onUnmounted` 对应清理。过渡语义全部自研，
 * 由 `createMotionDriver` 承担。
 *
 * ## 为什么驱动是**框架无关**的
 *
 * `driver.ts` 不 import vue，只通过 `onChange` 回调把快照推出来。
 * 这样 L2 测试可以**不挂载任何组件**、用可注入的帧泵逐帧断言时间线 ——
 * 也就是 P1 选方案 A 的意义（jsdom 没有帧语义，时间必须是显式输入）。
 */

import {
  type ComputedRef,
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
  shallowRef,
  ssrContextKey,
  watch,
} from 'vue';

import type { MotionDomAdapter, MotionHooks, MotionScheduler } from './driver';
import { createMotionDriver } from './driver';
import type { MotionEndEventLike, MotionStatus, RenderMode, StepStatus } from './status';
import {
  getMotionClassName,
  getStyleReady,
  normalizeMotionStyle,
  pickRenderMode,
  STATUS_NONE,
  STEP_NONE,
} from './status';
import { detectSupportMotion } from './support';

export interface UseMotionStatusOptions {
  /** 想要的可见性。响应式 —— 变化会触发 appear/enter/leave */
  visible: () => boolean;
  /** 动画名前缀，如 `apollo-zoom`。留空则完全没有 motion class */
  motionName?: string | (() => string | undefined);
  /**
   * 环境是否支持 CSS transition/animation。
   * 不传则调 `detectSupportMotion()` 探测（SSR 下为 false）。
   */
  supportMotion?: boolean | (() => boolean);
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** > 0 时启用兜底定时器：CSS 事件没来也会在此时长后判结束 */
  motionDeadline?: number;
  removeOnLeave?: boolean;
  forceRender?: boolean;
  leavedClassName?: string;
  hooks?: MotionHooks;
  /**
   * 可见性**最终生效后**的通知（rc-motion `useStatus` 的 `onVisibleChanged`）。
   *
   * ⚠️ 判据（rc-motion `es/hooks/useStatus.js` 尾部）：
   *
   * ```js
   * useEffect(() => {
   *   if (asyncVisible) firstMountChangeRef.current = true;
   *   if (asyncVisible !== undefined && currentStatus === STATUS_NONE) {
   *     if (firstMountChangeRef.current || asyncVisible) onVisibleChanged(asyncVisible);
   *     firstMountChangeRef.current = true;
   *   }
   * }, [asyncVisible, currentStatus]);
   * ```
   *
   * 三条要点，缺一都会在 Tree 上翻车（2026-10-17 实测）：
   *   1. 只在 **`status === NONE`** 时发 —— 动效没跑完就发会让调用方提前收尾。
   *   2. **首帧「不可见」不发**（`firstMountChange` 守卫）—— 否则「一上来就是
   *      visible=false 且没动画」的组件会白收一条 `onVisibleChanged(false)`。
   *   3. `visible=true` 且无动画时**首帧也要发** —— rc 靠 `asyncVisible` 为真
   *      绕过守卫。Tree 的 `show` 型 motion（`motionAppear` 被关掉或环境不支持）
   *      正是靠这条才能在挂载后立刻收尾；缺了它哨兵节点永远清不掉。
   */
  onVisibleChanged?: (visible: boolean) => void;
  /** 测试注入点：帧泵与 DOM 适配器 */
  scheduler?: MotionScheduler;
  dom?: MotionDomAdapter;
}

export interface UseMotionStatusReturn {
  /** 供模板 `ref` 绑定的元素引用。驱动靠它拿 DOM 来挂事件与读测量值 */
  elementRef: Ref<Element | null>;
  status: ComputedRef<MotionStatus>;
  step: ComputedRef<StepStatus>;
  /** 本帧应挂的 motion class（含裸的 `{n}`，见 §6 第 2 条） */
  className: ComputedRef<string>;
  /** 本帧应写的内联样式；`null` 表示不写 */
  style: ComputedRef<Record<string, string | number> | null>;
  renderMode: ComputedRef<RenderMode>;
  /** 模板里挂 `@transitionend` / `@animationend` 时用 */
  onMotionEnd: (event: MotionEndEventLike) => void;
}

function resolve<T>(value: T | (() => T) | undefined, fallback: T): T {
  if (value === undefined) return fallback;
  return typeof value === 'function' ? (value as () => T)() : value;
}

export function useMotionStatus(options: UseMotionStatusOptions): UseMotionStatusReturn {
  const {
    visible,
    motionName,
    supportMotion,
    motionAppear = true,
    motionEnter = true,
    motionLeave = true,
    motionLeaveImmediately = false,
    motionDeadline = 0,
    removeOnLeave = true,
    forceRender = false,
    leavedClassName,
    hooks,
    onVisibleChanged,
    scheduler,
    dom,
  } = options;

  const elementRef: Ref<Element | null> = shallowRef(null);

  // ── 「支持动画」的两条判据（2026-09-29，tour 实测修复）───────────────────────
  //
  // rc-motion 的 CSSMotion.js：
  //     function isSupportTransition(props, contextMotion) {
  //       return !!(props.motionName && transitionSupport && contextMotion !== false);
  //     }
  // —— **`motionName` 缺失 ⇒ 完全没有动画**（状态机直接走 NONE，
  // appear/enter/leave 都同步完成、onVisibleChanged 立即触发）。
  // 之前只看环境探测 ⇒ Trigger 不传 motion（如 tour）时离场会等一个
  // jsdom/真实浏览器里都不存在的动画事件，`autoDestroy` 的卸载被无限推迟。
  // SSR 可能运行在有 window 的预渲染环境中；此时也必须同步输出内容。
  const isSSR = inject(ssrContextKey, null) !== null;
  const effectiveSupport = computed(() => {
    const name = resolve(motionName, undefined as string | undefined);
    return !isSSR && !!resolve(supportMotion, detectSupportMotion()) && !!name;
  });

  // ── 首帧语义（2026-09-22，badge 实测修复）──────────────────────────────────
  //
  // 初始快照必须以 props.visible 为准（rc-motion 的首帧是**同步渲染**的）：
  //   - visible=true 且不开 appear 动画（或环境不支持）→ 首帧就渲染 children；
  //     之前的实现 initial mergedVisible=false，首帧渲染 null，直到 onMounted
  //     的 emit 才补渲染 —— SSR 直接空、L4 契约全挂（badge 实测）。
  //   - visible=true 且开 appear 动画 → styleReady='NONE'（首帧 null，挂载后
  //     由驱动接管）—— 与 rc-motion 的首帧行为一致。
  // driver.mount() 在 onMounted 里会再 emit 一次，快照随后以驱动为准。
  const initialVisible = visible();
  // Vue attaches the existing server node to the component vnode before setup
  // during hydration. Match that SSR snapshot first; driver.mount still starts
  // the normal appear sequence after refs attach. Fresh client mounts keep NONE.
  const isHydrating = !isSSR && getCurrentInstance()?.vnode.el != null;
  const initialSupport = effectiveSupport.value && !isHydrating;
  // 快照整体替换而不是逐字段 ref：驱动每次 emit 都是**一组**状态，
  // 分开放会出现「class 已更新但 style 还没」的中间态。
  const snapshot = shallowRef({
    status: STATUS_NONE as MotionStatus,
    step: 'none' as StepStatus,
    style: null as Record<string, string | number> | null,
    styleReady: getStyleReady({
      mounted: false,
      status: STATUS_NONE,
      supportMotion: initialSupport,
      motionAppear,
      step: STEP_NONE,
      styleStep: null,
    }),
    mergedVisible: initialVisible,
    rendered: false,
  });

  const driver = createMotionDriver({
    supportMotion: () => effectiveSupport.value,
    motionAppear,
    motionEnter,
    motionLeave,
    motionLeaveImmediately,
    motionDeadline,
    getElement: () => elementRef.value,
    // 首帧为 null：先提交带 prepare class 的节点，ref 就绪后才能测量 start。
    scheduleRender: (callback) => {
      void nextTick(callback);
    },
    hooks,
    ...(scheduler ? { scheduler } : {}),
    ...(dom ? { dom } : {}),
    onChange: (next) => {
      snapshot.value = next;
    },
  });

  onMounted(() => {
    // ⚠️ 必须在挂载后：`mount()` 里 `isMounted === false`，这才走 appear 分支。
    //    在 setup 里调会把首次显示当成 enter。
    driver.mount(visible());
  });

  watch(
    () => [visible(), effectiveSupport.value] as const,
    ([next, support], [previous, previousSupport]) => {
      if (next !== previous || (!support && previousSupport)) driver.setVisible(next);
    },
  );

  // ── onVisibleChanged（rc `useStatus` 尾部 effect 的移植）──────────────────
  //
  // ⚠️ 这个 watch 必须**排在** `watch(visible, …)` 之后：驱动在 `setVisible`
  //    里同步 emit 新快照，先建的那个 watch 先跑，这里读到的 `status` 才是
  //    本次变更后的值（否则会拿上一帧的 NONE 误发一条通知）。
  if (onVisibleChanged) {
    // rc 的 `asyncVisible`：跟随 props.visible，但只在 effect 里更新，
    // 用来区分「还没跑过 effect」与「已经跑过」。
    const asyncVisible = shallowRef<boolean | undefined>(undefined);
    let firstMountChange = false;
    // ⚠️ 必须自己按「值对」去重，不能靠 watch 的 deps 比较：
    //    驱动每次 emit 都会换一个**新的快照对象**，而 `status` 常常没变（仍是 NONE），
    //    于是 watch 会重复触发 ⇒ `onVisibleChanged` 被发两遍（实测）。
    //    React 版 `[asyncVisible, currentStatus]` 是逐项 Object.is 比较，等价于此。
    let lastKey = '';

    const notify = (nextVisible: boolean, status: MotionStatus): void => {
      const key = `${nextVisible}|${status}`;
      if (key === lastKey) return;
      lastKey = key;

      asyncVisible.value = nextVisible;
      if (nextVisible) firstMountChange = true;

      if (asyncVisible.value !== undefined && status === STATUS_NONE) {
        if (firstMountChange || asyncVisible.value) {
          onVisibleChanged(asyncVisible.value);
        }
        firstMountChange = true;
      }
    };

    watch(
      () => [visible(), snapshot.value.status] as const,
      ([nextVisible, status]) => notify(nextVisible, status),
      { flush: 'post' },
    );

    // ⚠️ 首帧判断必须放在 `onMounted`（且在本组件 `driver.mount` 之后执行），
    //    不能用 `immediate: true`（2026-10-21 修，Tree 展开动效根因）：
    //    setup 期 `snapshot.status` 仍是 NONE，而带 appear 的节点此刻只是
    //    「还没开始动」——立即回调 `true` 会被 Tree 的 `MotionTreeNode`
    //    当成 appear 已结束（`targetVisible === true`）⇒ 哨兵容器刚渲染就被摘掉，
    //    `-treenode-motion` 一帧都留不下。挂载后 `driver.mount()` 已把状态同步
    //    推进到 appear，此时 status !== NONE，自然不回调；只有真正无动画
    //    （motionAppear=false / 不支持动效）时才会命中 NONE 并立即补发。
    onMounted(() => {
      notify(visible(), snapshot.value.status);
    });
  }

  onUnmounted(() => {
    driver.destroy();
  });

  const className = computed(() => {
    const name = resolve(motionName, undefined as string | undefined);
    // `status === none` 时 antd 不挂任何 motion class（终态就是元素的自然样式）
    if (snapshot.value.status === STATUS_NONE) return '';
    return getMotionClassName(name, snapshot.value.status, snapshot.value.step);
  });

  const renderMode = computed<RenderMode>(() =>
    pickRenderMode({
      styleReady: snapshot.value.styleReady,
      status: snapshot.value.status,
      mergedVisible: snapshot.value.mergedVisible,
      removeOnLeave,
      forceRender,
      leavedClassName,
      rendered: snapshot.value.rendered,
    }),
  );

  return {
    elementRef,
    status: computed(() => snapshot.value.status),
    step: computed(() => snapshot.value.step),
    className,
    // ⚠️ 必须补 px 再交给 Vue：Vue 的 style 对象不像 React 那样自动补单位，
    //    标准模式浏览器会**静默丢弃**无单位长度（`style.height = 140` 无效），
    //    而 antd 的 collapse 预设返回的是数字（`height: node.scrollHeight`）。
    //    不补的后果：Collapse / Tree / Alert 的高度过渡只剩 opacity 在动
    //    （2026-10-21 实测，Tree 展开内联样式停在 height: 0px）。
    style: computed(() => normalizeMotionStyle(snapshot.value.style)),
    renderMode,
    onMotionEnd: (event: MotionEndEventLike) => driver.notifyEnd(event),
  };
}
