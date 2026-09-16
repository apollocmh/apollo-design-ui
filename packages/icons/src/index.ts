/**
 * @apollo-design/icons
 *
 * Vue 图标组件集。数据源是 `@ant-design/icons-svg`，由 `registry/tools/gen-icons.mjs`
 * 生成 848 个 Vue 组件（251 Filled / 447 Outlined / 150 TwoTone）。
 *
 * 兼容目标：`@ant-design/icons` 6.3.4（antd 6.6.4 的对应版本）。
 * DOM 契约由 `tests/compat/baselines/icons.dom.json`（机械 oracle，直接渲染 React 版）
 * 钉住，逐字比对见 `src/__tests__/semantic.test.ts`。
 *
 * 本文件分三段，**不要混**：
 *   1. 与上游对齐的 API —— 名字、签名、行为都要与 `@ant-design/icons` 一致
 *   2. 类型 —— 上游公开的类型
 *   3. 本项目增量 —— 上游没有对应物，为「零运行时」与 codegen 而加。
 *      增量不等于差异：它们不改变任何已有 API 的行为。清单见
 *      `docs/foundation/icons-contract.md`。
 */

export type { IconContextProps } from './context';
// 前缀与调色板的读取口。默认前缀是 apollo-icon（上游为 anticon，见 D14）。
export { DEFAULT_ICON_PREFIX_CLS, IconProvider, useIconContext } from './context';
// ── 3. 本项目增量（上游无对应物）─────────────────────────────────────────────
// createIcon：codegen 用它把图标定义包成组件；自定义图标也可以直接用。
export { createIcon } from './create-icon';
// ── 2. 类型 ──────────────────────────────────────────────────────────────────
// 上游 index.d.ts 只公开 TwoToneColor；其余类型靠深导入。我们把包内自有的类型一并导出，
// 因为 Vue 侧的 `$attrs` 透传模型下，使用者需要它们来标注自定义包装组件。
export type { CustomIconComponentProps } from './icon';
export { Icon, Icon as default } from './icon';
export type { CustomIconOptions } from './icon-font';
export { createFromIconfontCN } from './icon-font';
// ── 1. 与 @ant-design/icons 对齐的公开 API ────────────────────────────────────
// 对应上游 es/index.js 的 5 条导出：`export * from './icons'` + 4 个具名/默认导出。
export * from './icons';
export { isIconDefinition } from './render';
// getIconStyle：零运行时路径的样式出口（上游是运行时注入，见 COMPATIBILITY.md D15）。
// 由 `ui` 的静态样式层消费。
export { getIconStyle } from './style';
export type {
  TwoToneColor,
  TwoToneColorPalette,
  TwoToneColorPaletteSetter,
} from './two-tone-color';
export {
  DEFAULT_TWOTONE_COLOR,
  getSecondaryColor,
  getTwoToneColor,
  getTwoToneColors,
  setTwoToneColor,
  setTwoToneColors,
} from './two-tone-color';
export type {
  AbstractNode,
  AntdIconProps,
  IconDefinition,
  ThemeType,
  ThemeTypeUpperCase,
} from './types';
