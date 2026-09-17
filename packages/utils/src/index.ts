/**
 * `@apollo-design/utils` —— 全库的地基（L0）。
 *
 * 公开 API 的取舍依据见 `docs/foundation/rc-util-contract.md`。
 * 那个文档逐符号记录了「为什么保留 / 为什么重设计 / 为什么不实现」，
 * 是理解本包边界的第一入口。
 *
 * 分层约束（ARCHITECTURE.md §3.1）：
 *   R1 单向：不依赖任何其它 @apollo-design/* 包
 *   R3 纯净：不含任何组件视觉语义（无颜色 / 圆角 / 尺寸 / 阴影）
 *   R4 无样式：不产出任何 CSS
 *   R7 自持：运行时不依赖任何 @ant-design/*（`src/color/` 是上游颜色算法的移植，
 *            由 `color.oracle.test.ts` 对上游做差分验证，不是重新发明）
 *
 * 命名约定：
 *   - 去掉 React 色彩的改名已在 rc-util-contract.md §8 登记（`isReactRenderable` → `isRenderable` 等）
 *   - 新增的 Vue 专有能力在注释里标 `[Vue]`
 */

export { BRAND, BRAND_BRACKET, warningPrefix } from './brand';
export type { ChildrenInput, ToArrayOptions } from './children/to-array';
// ---------------------------------------------------------------------------
// 子节点
// ---------------------------------------------------------------------------
export { default as toArray } from './children/to-array';
export type {
  ColorInput,
  ColorObject,
  GenerateOptions,
  HslColor,
  HsvColor,
  Rgba,
  RgbColor,
} from './color';
// ---------------------------------------------------------------------------
// 颜色（纯数学，供 theme / icons 共用；不得含任何色值字面量）
// ---------------------------------------------------------------------------
export { Color, generatePalette } from './color';
export type { DevWarning, WarningContextValue } from './dev-warning';
export { devUseWarning, resetDevWarned, useDevWarning, warningContextKey } from './dev-warning';
export type { InputFocusOptions, ScrollTarget } from './dom';
// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
export {
  canUseDom,
  contains,
  getDOM,
  getElement,
  getElementFromVNode,
  getFocusNodeList,
  getScroll,
  isStyleSupport,
  isVisible,
  lockFocus,
  resetFocusLock,
  triggerFocus,
  useLockFocus,
} from './dom';
// ---------------------------------------------------------------------------
// 环境
// ---------------------------------------------------------------------------
export { isDev, isProd, isTest } from './env';
export {
  buildEventNameMap,
  buildVueEventNameMap,
  isReactEventName,
  needsSemanticHandling,
  SEMANTIC_MISMATCH_EVENTS,
  toNativeEventName,
  toVueEventName,
} from './event-name';
export type {
  ControlledUpdater,
  DelayConfig,
  SetDelayState,
  SetState,
  UpdateEffectDeps,
  UseControlledValueOptions,
} from './hooks';
// ---------------------------------------------------------------------------
// composable
// ---------------------------------------------------------------------------
export { useControlledValue, useDelayState, useId, useSafeState, useUpdateEffect } from './hooks';
// ---------------------------------------------------------------------------
// 类型判断
// ---------------------------------------------------------------------------
export {
  isCommentVNode,
  isComponentVNode,
  isDOM,
  isDocument,
  isElementVNode,
  isEmptyVNode,
  isFragmentVNode,
  isFunction,
  isHTMLElement,
  isNonNullable,
  isNumber,
  isPlainObject,
  isPlainObjectStrict,
  isPrimitive,
  isRenderable,
  isString,
  isTextVNode,
  isThenable,
  isTransitionEvent,
  // [Vue] vnode 层判定
  isVNode,
  isWindow,
} from './is';
export { default as isEqual } from './is-equal';
// ---------------------------------------------------------------------------
// 键盘
// ---------------------------------------------------------------------------
export { default as KeyCode } from './key-code';
export { default as mergeProps } from './merge-props';
export type { MergeFn, Path } from './object';
export { default as get, merge, mergeWith, set } from './object';
export type {
  MutationCallback,
  ResizeCallback,
  ResizeObserverSize,
  UseMutationObserverOptions,
  UseResizeObserverOptions,
} from './observers';
// ---------------------------------------------------------------------------
// 观察器
// ---------------------------------------------------------------------------
export {
  DEFAULT_MUTATION_OPTIONS,
  observeMutation,
  observeResize,
  resetMutationObserver,
  resetResizeObserver,
  useMutationObserver,
  useResizeObserver,
} from './observers';
// ---------------------------------------------------------------------------
// 对象工具
// ---------------------------------------------------------------------------
export { default as omit } from './omit';
export type { PickConfig } from './pick-attrs';

// ---------------------------------------------------------------------------
// 属性透传
// ---------------------------------------------------------------------------
export { default as pickAttrs } from './pick-attrs';
// ---------------------------------------------------------------------------
// 调度
// ---------------------------------------------------------------------------
export { cancelRaf, default as raf } from './raf';
export type { RefLike } from './ref';

// ---------------------------------------------------------------------------
// ref
// ---------------------------------------------------------------------------
export { composeRef, fillRef, getNodeRef, supportNodeRef, supportRef, useComposeRef } from './ref';
export type { CancelOptions, DebounceOptions, ThrottledFn, ThrottleOptions } from './throttle';
export { debounce, throttle } from './throttle';
export type { ThrottledByAnimationFrameFn } from './throttle-by-animation-frame';
export { default as throttleByAnimationFrame } from './throttle-by-animation-frame';
export type { ToListConfig } from './to-list';
export { capitalize, default as toList } from './to-list';
export type { PreMessageFn } from './warning';
// ---------------------------------------------------------------------------
// 告警
// ---------------------------------------------------------------------------
export {
  call as callWarning,
  note,
  noteOnce,
  preMessage,
  resetWarned,
  warning,
  warningOnce,
} from './warning';
