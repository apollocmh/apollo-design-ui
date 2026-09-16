/**
 * motion 的**驱动外壳** —— 状态机内核（`status.ts`）之外，唯一有副作用的一层。
 *
 * 与 AR1 的切法对称：
 *   position  = 纯几何内核（align.ts） + DOM 测量外壳（measure.ts）
 *   motion    = 纯状态机内核（status.ts） + 帧驱动外壳（本文件）
 *
 * 内核回答「给定状态该输出什么」，本文件回答「**什么时候**推进到下一状态」：
 * 双 rAF、Promise 等待、DOM 结束事件、motionDeadline 兜底定时器。
 *
 * 对照 `@rc-component/motion@1.3.3`：
 *   · es/hooks/useStatus.js 108-138 —— 步进回调（prepare 跳过 / 普通步进 / deadline）
 *   · es/hooks/useStepQueue.js 19-48 —— 每步之间走 `nextFrame(cb, 2)`，即双 rAF
 *   · es/hooks/useDomMotionEvents.js —— 只在本元素上监听 transitionend / animationend
 *
 * ⚠️ 为什么调度器与 DOM 适配器都要**可注入**：jsdom 没有帧语义，
 *    `vi.useFakeTimers()` 又会伪造全部 timer 让 `flushPromises()` 死等。
 *    把「第几帧」变成显式输入，时间线才能被逐帧断言。
 */

import type { MotionEndEventLike, MotionStatus, MotionStyle, StepStatus } from './status';
import {
  getMotionStyle,
  getStyleReady,
  isActiveStep,
  nextStepInQueue,
  pickStatus,
  STATUS_APPEAR,
  STATUS_ENTER,
  STATUS_LEAVE,
  STATUS_NONE,
  STEP_ACTIVE,
  STEP_NONE,
  STEP_PREPARE,
  STEP_PREPARED,
  STEP_START,
  shouldEndMotion,
  shouldStartMotion,
} from './status';

// ---------------------------------------------------------------------------
// 可注入的外部依赖
// ---------------------------------------------------------------------------

/** 帧与定时器。默认实现走真实 rAF / setTimeout。 */
export interface MotionScheduler {
  /**
   * 安排一次「下一帧」回调。
   *
   * ⚠️ antd 的 `nextFrame(cb, delay = 2)` 是**双 rAF**（`useNextFrame.js`）。
   *    默认实现必须保持两帧，否则 `start → active` 之间没有绘制机会，
   *    CSS 动画不会从初始态开始（见契约文档 §3.3 / §3.4）。
   */
  nextFrame(cb: () => void): () => void;
  /** `motionDeadline` 的兜底定时器 */
  setDeadline(cb: () => void, ms: number): () => void;
  /**
   * 推进一帧。**只有测试用的帧泵需要实现它**。
   *
   * 真实环境里帧由浏览器自己跑，默认调度器不提供 `tick`，
   * 于是 `driver.tickFrame()` 是空操作 —— 这正是对的：生产代码不该手动推帧。
   */
  tick?(): void;
}

/** DOM 结束事件的挂接。抽出来是为了让测试不必依赖真实事件。 */
export interface MotionDomAdapter {
  attach(element: Element, onEnd: (event: MotionEndEventLike) => void): void;
  detach(element: Element): void;
}

export const defaultScheduler: MotionScheduler = {
  nextFrame: (cb) => {
    let inner = 0;
    let cancelled = false;
    const cancelOuter = () => {
      cancelled = true;
      if (inner) cancelAnimationFrame(inner);
    };
    const outer = requestAnimationFrame(() => {
      if (cancelled) return;
      inner = requestAnimationFrame(cb);
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelOuter();
    };
  },
  setDeadline: (cb, ms) => {
    const id = setTimeout(cb, ms);
    return () => clearTimeout(id);
  },
};

export const defaultDomAdapter: MotionDomAdapter = {
  attach: (element, onEnd) => {
    const listener = (event: Event) => onEnd(event as unknown as MotionEndEventLike);
    element.addEventListener('transitionend', listener);
    element.addEventListener('animationend', listener);
    (element as Element & { __motionListener?: EventListener }).__motionListener = listener;
  },
  detach: (element) => {
    const el = element as Element & { __motionListener?: EventListener };
    if (el.__motionListener) {
      element.removeEventListener('transitionend', el.__motionListener);
      element.removeEventListener('animationend', el.__motionListener);
      delete el.__motionListener;
    }
  },
};

// ---------------------------------------------------------------------------
// hooks
// ---------------------------------------------------------------------------

// 三处 `| void` 都是必需的，不是冗余：它们表达「handler 可以**不返回**」。
// 自动修复会改成 `| undefined`，那会破坏「部分路径无 return」的 handler
// （如 `el => { if (!el) return; doSomething(el); }`）—— 与
// `utils/src/hooks/use-update-effect.ts` 同一条规则、同一个结论。
// biome-ignore lint/suspicious/noConfusingVoidType: void 在此必需，改 undefined 会破坏公开 API
export type MotionPrepareHandler = (element: Element | null) => Promise<unknown> | void;
// biome-ignore lint/suspicious/noConfusingVoidType: 同上
export type MotionStepHandler = (element: Element | null) => MotionStyle | void;
export type MotionEndHandler = (
  element: Element | null,
  event?: MotionEndEventLike,
  // 紧贴诊断行：biome 的 ignore 注释只在下一行生效，写在 `export type` 上方会报 unused
  // biome-ignore lint/suspicious/noConfusingVoidType: 同上
) => boolean | void;

export interface MotionHooks {
  onAppearPrepare?: MotionPrepareHandler;
  onEnterPrepare?: MotionPrepareHandler;
  onLeavePrepare?: MotionPrepareHandler;
  onAppearStart?: MotionStepHandler;
  onEnterStart?: MotionStepHandler;
  onLeaveStart?: MotionStepHandler;
  onAppearActive?: MotionStepHandler;
  onEnterActive?: MotionStepHandler;
  onLeaveActive?: MotionStepHandler;
  onAppearEnd?: MotionEndHandler;
  onEnterEnd?: MotionEndHandler;
  onLeaveEnd?: MotionEndHandler;
  onVisibleChanged?: (visible: boolean) => void;
}

// ---------------------------------------------------------------------------
// 快照
// ---------------------------------------------------------------------------

export interface MotionSnapshot {
  status: MotionStatus;
  step: StepStatus;
  /** 合并后的内联样式（已含 prepare+start 的 `transition: none`） */
  style: MotionStyle | null;
  /** `'NONE'` 表示首帧不渲染；布尔值表示样式是否已与 step 同步 */
  styleReady: 'NONE' | boolean;
  /** 内核实际据以渲染的可见性 —— 离场动画期间它仍是 true */
  mergedVisible: boolean;
  /** 是否已经渲染过内容（决定 `removeOnLeave=false` 时是否留残骸） */
  rendered: boolean;
}

// ---------------------------------------------------------------------------
// 驱动
// ---------------------------------------------------------------------------

export interface MotionDriverOptions {
  supportMotion: boolean;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** > 0 时启用兜底定时器 */
  motionDeadline?: number;
  getElement: () => Element | null;
  hooks?: MotionHooks;
  scheduler?: MotionScheduler;
  dom?: MotionDomAdapter;
  onChange: (snapshot: MotionSnapshot) => void;
}

export interface MotionDriver {
  /** 首个 layout effect 等价物：`isMounted` 为 false */
  mount(visible: boolean): void;
  setVisible(visible: boolean): void;
  /** 推进一帧。双 rAF 意味着要调用两次才推进一个 step */
  tickFrame(): void;
  /** DOM 结束事件（transitionend / animationend）；deadline 由驱动自己造 */
  notifyEnd(event?: MotionEndEventLike): void;
  destroy(): void;
  getSnapshot(): MotionSnapshot;
}

/** `useStatus.js:83-106` 的 handlers 表 */
function pickHandlers(
  hooks: MotionHooks,
  status: MotionStatus,
): {
  prepare?: MotionPrepareHandler;
  start?: MotionStepHandler;
  active?: MotionStepHandler;
  end?: MotionEndHandler;
} {
  switch (status) {
    case STATUS_APPEAR:
      return {
        prepare: hooks.onAppearPrepare,
        start: hooks.onAppearStart,
        active: hooks.onAppearActive,
        end: hooks.onAppearEnd,
      };
    case STATUS_ENTER:
      return {
        prepare: hooks.onEnterPrepare,
        start: hooks.onEnterStart,
        active: hooks.onEnterActive,
        end: hooks.onEnterEnd,
      };
    case STATUS_LEAVE:
      return {
        prepare: hooks.onLeavePrepare,
        start: hooks.onLeaveStart,
        active: hooks.onLeaveActive,
        end: hooks.onLeaveEnd,
      };
    default:
      return {};
  }
}

export function createMotionDriver(options: MotionDriverOptions): MotionDriver {
  const {
    supportMotion,
    motionAppear = true,
    motionEnter = true,
    motionLeave = true,
    motionLeaveImmediately = false,
    motionDeadline = 0,
    getElement,
    hooks = {},
    scheduler = defaultScheduler,
    dom = defaultDomAdapter,
    onChange,
  } = options;

  const prepareOnly = !supportMotion;

  // ---- 状态（原本是 React 的 useState / useRef）----
  let visible = false;
  let mounted = false;
  let status: MotionStatus = STATUS_NONE;
  let step: StepStatus = STEP_NONE;
  let handlerStyle: MotionStyle | null = null;
  let styleStep: StepStatus | null = null;
  let rendered = false;
  let asyncVisible: boolean | undefined;
  let cancelFrame: (() => void) | null = null;
  let cancelDeadline: (() => void) | null = null;
  let attachedElement: Element | null = null;

  function handlers() {
    return pickHandlers(hooks, status);
  }

  function getSnapshot(): MotionSnapshot {
    return {
      status,
      step,
      style: getMotionStyle({
        hasPrepare: Boolean(handlers().prepare),
        step,
        handlerStyle,
      }),
      styleReady: getStyleReady({
        mounted,
        status,
        supportMotion,
        motionAppear,
        step,
        styleStep,
      }),
      mergedVisible: asyncVisible ?? visible,
      rendered,
    };
  }

  function emit(): void {
    if (getSnapshot().mergedVisible) {
      rendered = true;
    }
    onChange(getSnapshot());
  }

  // ---- 收尾 ----
  function finishMotion(): void {
    status = STATUS_NONE;
    handlerStyle = null;
    styleStep = null;
    clearDeadline();
    detachEvents();
    emit();
    maybeEmitVisibleChanged();
  }

  function maybeEmitVisibleChanged(): void {
    if (asyncVisible !== undefined && status === STATUS_NONE) {
      hooks.onVisibleChanged?.(asyncVisible);
    }
  }

  function clearDeadline(): void {
    cancelDeadline?.();
    cancelDeadline = null;
  }

  function detachEvents(): void {
    if (attachedElement) {
      dom.detach(attachedElement);
      attachedElement = null;
    }
  }

  function onDomEnd(event: MotionEndEventLike): void {
    const element = getElement();
    const verdict = (() => {
      if (status === STATUS_APPEAR) return handlers().end?.(element, event);
      if (status === STATUS_ENTER) return handlers().end?.(element, event);
      if (status === STATUS_LEAVE) return handlers().end?.(element, event);
      return undefined;
    })();

    if (
      shouldEndMotion({ status, active: isActiveStep(step), element, event, endVerdict: verdict })
    ) {
      finishMotion();
    }
  }

  // ---- 步进回调（useStatus.js:108-138）----
  /** 返回值语义：`false` = SkipStep；`true` = DoStep；其余 = 需等 Promise */
  function runStepCallback(currentStep: StepStatus): boolean | Promise<unknown> | undefined {
    const element = getElement();
    const h = handlers();

    // Only prepare step can be skip
    if (currentStep === STEP_PREPARE) {
      if (!h.prepare) return false; // SkipStep
      return h.prepare(element) ?? undefined;
    }

    // ⚠️ `prepared` 是简队列（!supportMotion）的终点：一到就收尾，不走 start/active。
    //    对应 useStatus.js:134-136。collapse 在「不支持动画」时靠这条不至于卡住。
    if (currentStep === STEP_PREPARED) {
      finishMotion();
      return true;
    }

    // Rest step is sync update
    //
    // ⭐ 两个分支末尾的 `emit()` 不是可选的：antd 这里是
    //    `setStyle([eventHandlers[newStep]?.(...) || null, newStep])`
    //    —— 一个 **setState**，会触发重渲染，start 态的样式因此才上屏。
    //    我们的 `handlerStyle` 是闭包变量，只赋值不会通知任何人；
    //    少了这次 emit，start 态样式永远不上屏，动画会从「自然样式」跳到终态，
    //    表现为「collapse 展开时高度从 auto 直接跳，没有过渡」。
    if (currentStep === STEP_START) {
      handlerStyle = h.start?.(element) ?? null;
      styleStep = STEP_START;
      emit();
    } else if (currentStep === STEP_ACTIVE) {
      handlerStyle = h.active?.(element) ?? null;
      styleStep = STEP_ACTIVE;
      emit();
    }

    if (currentStep === STEP_ACTIVE && status !== STATUS_NONE) {
      // Patch events when motion needed
      const el = getElement();
      if (el && el !== attachedElement) {
        detachEvents();
        dom.attach(el, onDomEnd);
        attachedElement = el;
      }
      if (motionDeadline > 0) {
        clearDeadline();
        cancelDeadline = scheduler.setDeadline(() => onDomEnd({ deadline: true }), motionDeadline);
      }
    }

    return true; // DoStep
  }

  // ---- 步进推进（useStepQueue.js:23-48）----
  function setStep(next: StepStatus | undefined): void {
    step = next ?? STEP_NONE;
    emit();
  }

  function runQueue(): void {
    // `step !== NONE && step !== ACTIVATED` 才继续；SkipStep 会在同一轮里同步连锁
    while (step !== STEP_NONE && step !== 'end') {
      const next = nextStepInQueue(step, prepareOnly);
      const result = runStepCallback(step);

      if (result === false) {
        // SkipStep —— 同步跳到下一步，不占帧
        if (!next) return;
        setStep(next);
        continue;
      }

      if (!next) return;

      const captured = next;
      cancelFrame?.();
      cancelFrame = scheduler.nextFrame(() => {
        cancelFrame = null;
        const advance = () => setStepAndContinue(captured);
        // `result === true` 时同步推进；其余（含 prepare 返回的 Promise）走微任务
        if (result === true) advance();
        else Promise.resolve(result).then(advance);
      });
      return;
    }
  }

  function setStepAndContinue(next: StepStatus): void {
    setStep(next);
    runQueue();
  }

  // ---- 对外 ----
  function applyVisible(nextVisible: boolean): void {
    const isMounted = mounted;
    visible = nextVisible;
    asyncVisible = nextVisible;
    mounted = true;

    const nextStatus = pickStatus({
      mounted: isMounted,
      visible: nextVisible,
      motionAppear,
      motionEnter,
      motionLeave,
      motionLeaveImmediately,
    });

    if (
      shouldStartMotion({
        nextStatus,
        supportMotion,
        hasPrepare: Boolean(pickHandlers(hooks, nextStatus ?? STATUS_NONE).prepare),
      })
    ) {
      status = nextStatus ?? STATUS_NONE;
      step = STEP_PREPARE;
      handlerStyle = null;
      styleStep = null;
      emit();
      runQueue();
    } else {
      status = STATUS_NONE;
      emit();
      maybeEmitVisibleChanged();
    }
  }

  return {
    mount(nextVisible) {
      applyVisible(nextVisible);
    },
    setVisible(nextVisible) {
      applyVisible(nextVisible);
    },
    tickFrame() {
      // 「两帧」这件事由 scheduler 负责；测试注入的帧泵通过 `tick()` 显式推进
      scheduler.tick?.();
    },
    notifyEnd(event) {
      // event 缺省表示「没有事件对象」—— 与 deadline 是两回事，别混
      onDomEnd(event as MotionEndEventLike);
    },
    destroy() {
      cancelFrame?.();
      cancelFrame = null;
      clearDeadline();
      detachEvents();
    },
    getSnapshot,
  };
}
