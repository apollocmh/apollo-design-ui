/**
 * motion 的**状态机内核** —— 纯函数层。
 *
 * 对应 `@rc-component/motion@3.x`（antd 6.6.4 用 `^1.3.3`）的：
 *   · `es/interface.d.ts`      —— 常量
 *   · `es/hooks/useStatus.js`  —— 状态选取、结束判定、样式合并
 *   · `es/hooks/useStepQueue.js` —— 步进队列
 *   · `es/CSSMotion.js` 92–146 —— class 组装与渲染分支
 *   · `es/util/motion.js`      —— getTransitionName
 *
 * 与 AR1 的切法对称：几何内核（`position/src/align.ts`）是纯函数、
 * DOM 测量是外壳；这里**状态机内核是纯函数、帧与事件驱动是外壳**。
 * 于是 AR2 的风险可以被差分测试穷举，而不必先实现整个组件。
 *
 * 逐条契约与推导见 `docs/foundation/motion-contract.md`。
 */

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

export const STATUS_NONE = 'none';
export const STATUS_APPEAR = 'appear';
export const STATUS_ENTER = 'enter';
export const STATUS_LEAVE = 'leave';

export type MotionStatus =
  | typeof STATUS_NONE
  | typeof STATUS_APPEAR
  | typeof STATUS_ENTER
  | typeof STATUS_LEAVE;

/**
 * ⚠️ `STEP_ACTIVATED` 的值**不是** `'activated'`，是 `'end'`。
 *    它表示「动画已经在跑、正在等结束事件」，与 `STEP_ACTIVE` 在 class 上表现一致，
 *    但在步进队列里是**终点**（不再前进）。常量名与值对不上是上游的命名，
 *    照抄 —— 改名会让读代码的人与 antd 源码对不上行。
 */
export const STEP_NONE = 'none';
export const STEP_PREPARE = 'prepare';
export const STEP_START = 'start';
export const STEP_ACTIVE = 'active';
export const STEP_ACTIVATED = 'end';
/** 仅 `!supportMotion` 时出现：prepare 之后直接收尾，跳过 start/active。 */
export const STEP_PREPARED = 'prepared';

export type StepStatus =
  | typeof STEP_NONE
  | typeof STEP_PREPARE
  | typeof STEP_START
  | typeof STEP_ACTIVE
  | typeof STEP_ACTIVATED
  | typeof STEP_PREPARED;

/** 内联样式。刻意不引 `CSSProperties`：本包不依赖任何 Vue/DOM 具体实现。 */
export type MotionStyle = Record<string, string | number>;

/** 结束事件的**可判定部分**。DOM 事件对象不进纯函数层。 */
export interface MotionEndEventLike {
  /** `motionDeadline` 兜底触发时为 true —— 此时不做 target 校验 */
  deadline?: boolean;
  /** 事件源元素。缺省视为 undefined（非 DOM 调用） */
  target?: unknown;
  /** transition 的属性名，仅 collapse 这类 transition 语义用到 */
  propertyName?: string;
}

// ---------------------------------------------------------------------------
// 步进
// ---------------------------------------------------------------------------

/** 完整队列（`supportMotion` 时） */
export const FULL_STEP_QUEUE: readonly StepStatus[] = [
  STEP_PREPARE,
  STEP_START,
  STEP_ACTIVE,
  STEP_ACTIVATED,
];
/** 简队列（不支持动画时）：prepare 之后直接 prepared 收尾 */
export const SIMPLE_STEP_QUEUE: readonly StepStatus[] = [STEP_PREPARE, STEP_PREPARED];

/** `isActive`（`useStepQueue.js:13`）—— active 与 end 都算「在动」。 */
export function isActiveStep(step: StepStatus): boolean {
  return step === STEP_ACTIVE || step === STEP_ACTIVATED;
}

/**
 * 队列中的下一步（`useStepQueue.js:24-26`）。
 *
 * ⚠️ 不存在的 step 会得到 `indexOf === -1`，于是 `nextStep` 是队列首项 `prepare`。
 *    原实现的调用点有 `step !== NONE && step !== ACTIVATED` 守卫，所以走不到；
 *    这里保留同样的行为（返回首项）而不是抛错，是为了让差分测试能覆盖到它。
 */
export function nextStepInQueue(step: StepStatus, prepareOnly: boolean): StepStatus | undefined {
  const queue = prepareOnly ? SIMPLE_STEP_QUEUE : FULL_STEP_QUEUE;
  return queue[queue.indexOf(step) + 1];
}

// ---------------------------------------------------------------------------
// 状态选取
// ---------------------------------------------------------------------------

export interface PickStatusInput {
  /** 是否已经挂载过（antd 的 `mountedRef`） */
  mounted: boolean;
  visible: boolean;
  motionAppear: boolean;
  motionEnter: boolean;
  motionLeave: boolean;
  motionLeaveImmediately: boolean;
}

/**
 * 选出下一个 status（`useStatus.js:161-176`）。
 *
 * ⚠️ 三个 if **不是** else-if：后面的条件可以覆盖前面的结果。
 *    照抄这个顺序，不要"优化"成 else-if —— 语义会变。
 */
export function pickStatus(input: PickStatusInput): MotionStatus | undefined {
  const { mounted, visible, motionAppear, motionEnter, motionLeave, motionLeaveImmediately } =
    input;
  let nextStatus: MotionStatus | undefined;

  // Appear
  if (!mounted && visible && motionAppear) {
    nextStatus = STATUS_APPEAR;
  }

  // Enter
  if (mounted && visible && motionEnter) {
    nextStatus = STATUS_ENTER;
  }

  // Leave
  if (
    (mounted && !visible && motionLeave) ||
    (!mounted && motionLeaveImmediately && !visible && motionLeave)
  ) {
    nextStatus = STATUS_LEAVE;
  }

  return nextStatus;
}

/**
 * 是否真的开始动（`useStatus.js:180`）。
 *
 * ⚠️ `|| hasPrepare` 是关键：**即便不支持动画，只要传了 prepare handler 也要走队列** ——
 *    collapse 依赖它在隐藏状态下测量元素高度。
 */
export function shouldStartMotion(input: {
  nextStatus: MotionStatus | undefined;
  supportMotion: boolean;
  hasPrepare: boolean;
}): boolean {
  return Boolean(input.nextStatus) && (input.supportMotion || input.hasPrepare);
}

// ---------------------------------------------------------------------------
// 结束判定
// ---------------------------------------------------------------------------

export interface MotionEndInput {
  status: MotionStatus;
  /** `activeRef.current`，即 `isActiveStep(step)` */
  active: boolean;
  /** 子元素冒泡上来的事件要被忽略 */
  element: unknown;
  event?: MotionEndEventLike;
  /**
   * `onXxxEnd` 的返回值。
   *  `undefined` = 没有 handler 或 handler 没表态 → 视为同意
   *  `false`     = handler **否决**结束
   */
  // biome-ignore lint/suspicious/noConfusingVoidType: void 在此必需（同上，改 undefined 会破坏 API）
  endVerdict?: boolean | void;
}

/**
 * 这次事件是否应当结束动画（`useStatus.js:51-79`）。
 *
 * 三条早退，顺序照抄：
 *   1. 不在任何动画状态 → 不处理（deadline 触发过就会出现）
 *   2. 有事件、非 deadline、且 target 不是本元素 → 忽略（子元素冒泡）
 *   3. 不在 active → 不结束
 */
export function shouldEndMotion(input: MotionEndInput): boolean {
  const { status, active, element, event, endVerdict } = input;

  if (status === STATUS_NONE) {
    return false;
  }

  if (event && !event.deadline && event.target !== element) {
    return false;
  }

  if (!active) {
    return false;
  }

  // `canEnd !== false`：handler 返回 false 才能否决，返回 undefined 视为同意
  return endVerdict !== false;
}

// ---------------------------------------------------------------------------
// class 与样式
// ---------------------------------------------------------------------------

/**
 * `getTransitionName`（`util/motion.js`）。
 *
 * ⚠️ 本轮只实现字符串形态。`motionName` 为对象时上游会把
 *    `transitionType` 转小驼峰去取值，本轮没有组件用到（见契约文档 §9.6）。
 */
export function getTransitionName(
  motionName: string | undefined,
  transitionType: string,
): string | null {
  if (!motionName) return null;
  return `${motionName}-${transitionType}`;
}

/**
 * class 后缀（`CSSMotion.js:127-134`）。
 *
 * ⚠️ `STEP_PREPARED` / `STEP_NONE` 返回 `undefined` —— 调用方据此**不挂**后缀 class。
 *    上游在这里会先拼出 `${motionName}-${status}-undefined` 再用 `motionCls && statusSuffix`
 *    挡掉，净效果与「压根不拼」相同；这里直接返回 undefined，省掉那个坑。
 */
export function getStatusSuffix(step: StepStatus): 'prepare' | 'start' | 'active' | undefined {
  if (step === STEP_PREPARE) return 'prepare';
  if (isActiveStep(step)) return 'active';
  if (step === STEP_START) return 'start';
  return undefined;
}

/**
 * 动画期间元素上的完整 class（`CSSMotion.js:135-141`）。
 *
 * 结果是 `clsx()` 的等价物，顺序与上游一致：
 *   `{n}-{status}` → `{n}-{status}-{suffix}` → **裸的 `{n}`**
 *
 * ⭐ 裸的 `{n}` 是必带的，Vue 的 `<Transition>` 从来不加它 —— 这是
 *    AR2 里最容易被漏掉、且漏掉后只表现为"某些动效样式不生效"的一条。
 */
export function getMotionClassName(
  motionName: string | undefined,
  status: MotionStatus,
  step: StepStatus,
): string {
  const parts: string[] = [];

  const statusCls = getTransitionName(motionName, status);
  if (statusCls) parts.push(statusCls);

  const suffix = getStatusSuffix(step);
  if (suffix) {
    const suffixCls = getTransitionName(motionName, `${status}-${suffix}`);
    if (suffixCls) parts.push(suffixCls);
  }

  if (typeof motionName === 'string' && motionName) parts.push(motionName);

  return parts.join(' ');
}

/**
 * 合并后的内联样式（`useStatus.js:225-231`）。
 *
 * 只有「传了 prepare handler 且当前是 start 步」时才注入 `transition: none` ——
 * 目的是让 start 态**立刻**生效而不被 CSS transition 缓动掉。
 */
export function getMotionStyle(input: {
  hasPrepare: boolean;
  step: StepStatus;
  handlerStyle: MotionStyle | null;
}): MotionStyle | null {
  const { hasPrepare, step, handlerStyle } = input;
  if (hasPrepare && step === STEP_START) {
    return { transition: 'none', ...handlerStyle };
  }
  return handlerStyle;
}

// ---------------------------------------------------------------------------
// 渲染分支
// ---------------------------------------------------------------------------

export type RenderMode =
  /** 动画中：挂 motion class 与 style */
  | 'motion'
  /** `status === none` 且可见：children 原样渲染 */
  | 'children'
  /** 离场结束但 `removeOnLeave=false` 且有 `leavedClassName`：留一个残骸 */
  | 'leaved'
  /** `forceRender` 或「不移除但没给 leavedClassName」：display:none 留在 DOM */
  | 'hidden'
  /** 什么都不渲染 */
  | 'null';

/**
 * `styleReady`（`useStatus.js:233-237`）。
 *
 * ⚠️ 哨兵值是**大写** `'NONE'`，与 `STATUS_NONE`（小写 `'none'`）不是一回事 ——
 *    上游就是这么写的，而且它和布尔值混在同一个返回值里。照抄大写，
 *    免得读代码的人与 `status === 'none'` 混淆时还要猜哪边是照抄的。
 *
 * 返回 `'NONE'` 时 `CSSMotion` 直接 `return null` ——
 * 即**支持动画且开了 appear 时首帧不渲染**，避免未带初始 class 的元素闪一帧。
 */
export function getStyleReady(input: {
  mounted: boolean;
  status: MotionStatus;
  supportMotion: boolean;
  motionAppear: boolean;
  step: StepStatus;
  styleStep: StepStatus | null;
}): 'NONE' | boolean {
  const { mounted, status, supportMotion, motionAppear, step, styleStep } = input;
  if (!mounted && status === STATUS_NONE && supportMotion && motionAppear) {
    return 'NONE';
  }
  return step === STEP_START || step === STEP_ACTIVE ? styleStep === step : true;
}

/**
 * 渲染分支（`CSSMotion.js:104-124`）。
 */
export function pickRenderMode(input: {
  styleReady: 'NONE' | boolean;
  status: MotionStatus;
  mergedVisible: boolean;
  removeOnLeave: boolean;
  forceRender: boolean;
  leavedClassName?: string;
  rendered: boolean;
}): RenderMode {
  const {
    styleReady,
    status,
    mergedVisible,
    removeOnLeave,
    forceRender,
    leavedClassName,
    rendered,
  } = input;

  if (styleReady === 'NONE') {
    return 'null';
  }

  if (status !== STATUS_NONE) {
    return 'motion';
  }

  if (mergedVisible) {
    return 'children';
  }
  if (!removeOnLeave && rendered && leavedClassName) {
    return 'leaved';
  }
  if (forceRender || (!removeOnLeave && !leavedClassName)) {
    return 'hidden';
  }
  return 'null';
}
