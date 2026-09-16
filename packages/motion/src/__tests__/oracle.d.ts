/**
 * oracle.js 的类型声明。
 *
 * 为什么单独放一个 .d.ts：oracle.js 是**刻意保留的 JS**（它逐字复刻 antd 的实现，
 * 连分支形态与求值顺序都不许动，不参与生产构建）。但差分测试在 TS 里调用它，
 * 没有声明会退化成 implicit any —— 而本项目开了 `strict`，那是一个硬错误。
 *
 * 这里只声明**签名**，不声明实现，避免有人误以为它是受支持的公共 API。
 */

export const STATUS_NONE: 'none';
export const STATUS_APPEAR: 'appear';
export const STATUS_ENTER: 'enter';
export const STATUS_LEAVE: 'leave';

export const STEP_NONE: 'none';
export const STEP_PREPARE: 'prepare';
export const STEP_START: 'start';
export const STEP_ACTIVE: 'active';
export const STEP_ACTIVATED: 'end';
export const STEP_PREPARED: 'prepared';

export const FULL_STEP_QUEUE: readonly string[];
export const SIMPLE_STEP_QUEUE: readonly string[];

export function isActive(step: string): boolean;
export function getNextStep(step: string, prepareOnly: boolean): string | undefined;
export function getTransitionName(
  motionName: string | undefined,
  transitionType: string,
): string | null;

// ⚠️ 这个文件是 oracle（机械移植的对照物）的**手写声明**，`endVerdict` 的类型
//    必须与 `status.ts` 的 `MotionEndInput.endVerdict` 逐字一致 —— 差分测试比较的是
//    行为，类型不一致会让测试在编译期就被拒、从而静默失去覆盖。
export function shouldEndMotion(
  status: string,
  active: boolean,
  element: unknown,
  event: { deadline?: boolean; target?: unknown } | undefined,
  // 紧贴诊断行：ignore 注释只在下一行生效，写在 `export function` 上方会报 unused
  // biome-ignore lint/suspicious/noConfusingVoidType: 与被测签名保持一致，不可改
  endVerdict: boolean | void | undefined,
): boolean;

export function pickStatus(
  mounted: boolean,
  visible: boolean,
  motionAppear: boolean,
  motionEnter: boolean,
  motionLeave: boolean,
  motionLeaveImmediately: boolean,
): string | undefined;

export function shouldStartMotion(
  nextStatus: string | undefined,
  supportMotion: boolean,
  hasPrepare: boolean,
): boolean;

export function getMotionStyle(
  hasPrepare: boolean,
  step: string,
  handlerStyle: Record<string, string | number> | null,
): Record<string, string | number> | null;

/** 上游用大写 `'NONE'` 作哨兵，与布尔值混在同一个返回里 —— 这是 antd 的写法，照抄。 */
export function getStyleReady(
  mounted: boolean,
  status: string,
  supportMotion: boolean,
  motionAppear: boolean,
  step: string,
  styleStep: string | null,
): 'NONE' | boolean;

export function getMotionClassName(
  motionName: string | undefined,
  status: string,
  statusStep: string,
): string;

export function pickRenderMode(
  styleReady: 'NONE' | boolean,
  status: string,
  mergedVisible: boolean,
  removeOnLeave: boolean,
  forceRender: boolean,
  leavedClassName: string | undefined,
  rendered: boolean,
): string;
