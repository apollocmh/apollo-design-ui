/**
 * `@apollo-design/test-utils`
 *
 * 共享测试契约。对应 antd 的 `tests/shared/*`，但**不是**它的翻译 ——
 * 逐模块的「上游做了什么 / 我们为什么不同」见
 * [`docs/foundation/test-utils-contract.md`](../../../docs/foundation/test-utils-contract.md)，
 * 那是理解本包边界的第一入口。
 *
 * 职责边界（`README.md`）：**不包含任何具体组件的测试用例**。
 * 本包只提供契约函数；组件的行为测试属于各组件自己的 `__tests__/`。
 *
 * ── 三条贯穿全包的原则 ────────────────────────────────────────────────────────
 * 1. **不允许沉默的例外**。所有「允许不达标」的入口都要 `reason`（`Allowance`），
 *    且未被命中的豁免会让测试失败（防腐烂）。
 * 2. **确定性**。不提供 `sleep`；等待只能表达成 `flushAll()` / `waitFrames(n)`（T5/T6、A3）。
 * 3. **复用而非重写**。`resetWarned` 直接复用 `@apollo-design/utils` 的实现（T2）——
 *    去重表是那边模块私有的，重写不可能，也不该。
 */

// ---------------------------------------------------------------------------
// 共享契约（`TESTING.md` §7 的模块清单）
//
// 每个模块都同时提供**具名导出**与默认导出：具名便于本包内部与测试引用，
// 默认导出保留上游 antd `tests/shared/*` 的写法，便于迁移时按原样 import。
// ---------------------------------------------------------------------------
export type { A11yAllowance, A11yDemoTestOptions } from './a11y-demo-test';
export { a11yDemoTest } from './a11y-demo-test';
export { AllowanceError, assertAllowance, assertAllowances } from './allowance';
export type { DemoTestOptions } from './demo-test';
export { demoTest } from './demo-test';

// ---------------------------------------------------------------------------
// L4 · DOM 契约
// ---------------------------------------------------------------------------
export type {
  ContractOptions,
  DomBaseline,
  DomBaselineCase,
  DomContractOptions,
  DomNode,
  DomRenderResult,
  ProjectionProfile,
} from './dom-contract';
export {
  contractOf,
  diffContract,
  diffHtml,
  domContractTest,
  normalizeStyle,
  parseFragment,
  projectNode,
} from './dom-contract';
export type { FocusTestOptions } from './focus-test';
export { focusTest } from './focus-test';
export type { MountTestOptions } from './mount-test';
export { describeObserverLeaks, mountTest } from './mount-test';
export type { RootPropsTestOptions } from './root-props-test';
export { ROOT_PROPS_DEFAULTS, rootPropsTest } from './root-props-test';
export type { RtlTestOptions } from './rtl-test';
export { rtlTest } from './rtl-test';
export type { ThemeTestOptions, ThemeTokenOverride, ThemeVariant } from './theme-test';
export { themeTest } from './theme-test';
// ---------------------------------------------------------------------------
// 确定性等待
// ---------------------------------------------------------------------------
export { flushAll, waitFrames } from './timing';
// ---------------------------------------------------------------------------
// 类型与豁免
// ---------------------------------------------------------------------------
export type {
  Allowance,
  DemoModules,
  PropsRenderFactory,
  RenderFactory,
  RenderSource,
  WarningAllowance,
  Wrap,
} from './types';
// ---------------------------------------------------------------------------
// 告警
// ---------------------------------------------------------------------------
export type { WarningCapture, WarningRecord } from './warnings';
export {
  assertNoUnexpectedWarnings,
  captureWarnings,
  excludeAllWarning,
  excludeWarning,
  partitionWarnings,
  resetDevWarned,
  resetWarned,
} from './warnings';
