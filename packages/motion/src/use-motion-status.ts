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
  onMounted,
  onUnmounted,
  type Ref,
  shallowRef,
  watch,
} from 'vue';

import type { MotionDomAdapter, MotionHooks, MotionScheduler } from './driver';
import { createMotionDriver } from './driver';
import type { MotionEndEventLike, MotionStatus, RenderMode, StepStatus } from './status';
import { getMotionClassName, pickRenderMode, STATUS_NONE } from './status';
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
    scheduler,
    dom,
  } = options;

  const elementRef: Ref<Element | null> = shallowRef(null);

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
  const initialSupport = resolve(supportMotion, detectSupportMotion());
  // 快照整体替换而不是逐字段 ref：驱动每次 emit 都是**一组**状态，
  // 分开放会出现「class 已更新但 style 还没」的中间态。
  const snapshot = shallowRef({
    status: STATUS_NONE as MotionStatus,
    step: 'none' as StepStatus,
    style: null as Record<string, string | number> | null,
    styleReady: !(initialSupport && motionAppear && initialVisible) as 'NONE' | boolean,
    mergedVisible: initialVisible,
    rendered: false,
  });

  const driver = createMotionDriver({
    supportMotion: resolve(supportMotion, detectSupportMotion()),
    motionAppear,
    motionEnter,
    motionLeave,
    motionLeaveImmediately,
    motionDeadline,
    getElement: () => elementRef.value,
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

  watch(visible, (next) => {
    driver.setVisible(next);
  });

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
    style: computed(() => snapshot.value.style),
    renderMode,
    onMotionEnd: (event: MotionEndEventLike) => driver.notifyEnd(event),
  };
}
