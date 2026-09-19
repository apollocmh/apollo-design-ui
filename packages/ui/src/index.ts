/**
 * `@apollo-design/ui` — 组件库本体。
 *
 * Vue 3 native reimplementation of Ant Design。Ant Design React 是**兼容性规格**，
 * 不是代码来源（`AGENTS.md` §0）。
 *
 * ── 当前进度 ────────────────────────────────────────────────────────────────
 *
 * 已落地 1 / 72 个组件（见 `registry/components.json`）。这个数字不写在这里 ——
 * 手写的进度数字必然滞后，看 registry。
 *
 * ── 样式 ────────────────────────────────────────────────────────────────────
 *
 * 零运行时（`H6`：禁止 CSS-in-JS）。样式是**构建期静态 CSS**：
 *
 * ```ts
 * import '@apollo-design/theme/dist/tokens.css';   // 主题变量（--apollo-*），必须先引
 * import '@apollo-design/ui/empty/style.css';     // 按需：单个组件
 * // 或
 * import '@apollo-design/ui/style.css';           // 汇总：全部组件
 * ```
 *
 * 自定义 `prefixCls`（如 `my-app`）时用 `genComponentCss('empty', 'my-app')`
 * 自行产出 CSS —— 静态 CSS 只覆盖 `STATIC_PREFIX_CLS` 里列出的前缀。
 */

export type {
  MaybeSource,
  SemanticInfo,
  SemanticInput,
  UseMergeSemanticResult,
} from './_internal/use-merge-semantic';
// ---------------------------------------------------------------------------
// 内部工具（组件间共享，供需要自建语义合并的封装方复用）
// ---------------------------------------------------------------------------
export {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  semanticRootStyle,
  styleAttrs,
  useMergeSemantic,
} from './_internal/use-merge-semantic';
export type { WithInstall } from './_internal/with-install';
export { withInstall } from './_internal/with-install';
export type {
  ComponentConfigLike,
  ConfigProviderProps,
  ConfigProviderThemeConfig,
  CSPConfig,
  FormConfig,
  GlobalConfigProps,
  PopupOverflow,
  RenderEmptyComponentName,
  RenderEmptyHandler,
  SizeType,
  UseConfigResult,
  Variant,
  WaveConfig,
} from './config-provider';
// ---------------------------------------------------------------------------
// ConfigProvider —— 全库的运行时网关（theme / locale / size / disabled / prefixCls）
//
// ⚠️ 组件配置 prop 是**渐进式**的：只声明了已落地组件的精确类型，其余走
//    `components` 弱类型逃生口（`docs/analysis/config-provider.md` §6.1，差异 D25）。
// ---------------------------------------------------------------------------
export {
  ConfigProvider,
  DefaultRenderEmpty,
  defaultRenderEmpty,
  disabledContextKey,
  globalConfig,
  setGlobalConfig,
  sizeContextKey,
  useConfig,
  useDirection,
  useDisabled,
  useSize,
} from './config-provider';
export type {
  ComponentConfig,
  ComponentConfigBase,
  ComponentStyleConfig,
  ConfigContextBase,
  ConfigContextValue,
  DirectionType,
  GetPrefixCls,
} from './config-provider/context';
// ---------------------------------------------------------------------------
// ConfigProvider 的上下文（叶子模块）
//
// ⚠️ 目前只落了 Empty 需要的最小可用集：`getPrefixCls` / `direction` /
//    `useComponentConfig`。ConfigProvider **组件**本身（theme / locale / size /
//    disabled 的统一入口）尚未实现，走它自己的 G0→G14。
// ---------------------------------------------------------------------------
export {
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
  defaultGetPrefixCls,
  defaultIconPrefixCls,
  defaultPrefixCls,
  useComponentConfig,
  useConfigContext,
} from './config-provider/context';
export type {
  DividerConfig,
  DividerProps,
  DividerRef,
  DividerSemanticAllType,
  DividerSemanticClassNames,
  DividerSemanticStyles,
  DividerSemanticType,
  DividerSemanticValue,
  DividerSize,
  DividerSlot,
  DividerVariant,
  Orientation,
  TitlePlacement,
} from './divider';
// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------
export { Divider } from './divider';
export type {
  EmptyConfig,
  EmptyImage,
  EmptyProps,
  EmptyRef,
  EmptySemanticAllType,
  EmptySemanticClassNames,
  EmptySemanticStyles,
  EmptySemanticType,
  EmptySemanticValue,
} from './empty';
export {
  Empty,
  PRESENTED_IMAGE_DEFAULT,
  PRESENTED_IMAGE_SIMPLE,
} from './empty';
export type {
  SpinComponentToken,
  SpinConfig,
  SpinIndicator,
  SpinPercent,
  SpinProps,
  SpinRef,
  SpinSemanticAllType,
  SpinSemanticClassNames,
  SpinSemanticStyles,
  SpinSemanticType,
  SpinSemanticValue,
  SpinSize,
  SpinSlot,
} from './spin';
export { getDefaultIndicator, Spin, setDefaultIndicator } from './spin';
export type { ComponentStyleEntry } from './style';
// ---------------------------------------------------------------------------
// 样式生成（构建期与自定义 prefixCls）
// ---------------------------------------------------------------------------
export {
  COMPONENT_STYLES,
  genAllStyles,
  genComponentCss,
  genComponentStyleMap,
  genComponentStyleSheet,
  STATIC_PREFIX_CLS,
} from './style';
