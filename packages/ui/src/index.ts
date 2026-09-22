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
export {
  Affix,
  default as AffixDefault,
  getFixedBottom,
  getFixedTop,
  getTargetRect,
} from './affix';
// ---------------------------------------------------------------------------
// Affix —— 固钉
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（`./style`），`dist/affix/style.css` 由构建钩子产出。
//    全库最小的组件样式（一条规则 + 一个组件 token），见 `./affix/style`。
//    判据纯函数（getFixedTop/Bottom/getTargetRect）从 `./affix/utils` 一并导出，
//    供 L1 单测直接钉死判据。
// ---------------------------------------------------------------------------
export type {
  AffixConfig,
  AffixProps,
  AffixRect,
  AffixRef,
  AffixSlot,
  AffixTarget,
} from './affix/interface';
export { genAffixStyle } from './affix/style';
export type { ComponentToken as AffixComponentToken } from './affix/style/token';
export { prepareComponentToken as prepareAffixComponentToken } from './affix/style/token';
// ---------------------------------------------------------------------------
// BackTop —— 回到顶部（antd 6.x 已 deprecated → FloatButton.BackTop）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 1 个（zIndexPopup）。
//    fade 动画无 CSS（antd 产物同样没有 `-fade` keyframes，G1 §2.8）。
// ---------------------------------------------------------------------------
export type { BackTopProps, BackTopTarget, ScrollToOptions } from './back-top';
export { BackTop, easeInOutCubic, scrollTo } from './back-top';
export { genBackTopStyle } from './back-top/style';
export type { ComponentToken as BackTopComponentToken } from './back-top/style/token';
export { prepareBackTopComponentToken } from './back-top/style/token';
// ---------------------------------------------------------------------------
// Badge —— 徽标数（Badge + Ribbon）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（`./style`），`dist/badge/style.css` 由构建钩子产出。
//    Component Token 9 个（antd 逐字一致）；`Badge.Ribbon` 复合用法与 antd 相同。
// ---------------------------------------------------------------------------
export type {
  BadgePresetColorKey,
  BadgePresetStatusColorType,
  BadgeProps,
  BadgeRef,
  BadgeSemanticClassNames,
  BadgeSemanticStyles,
  RibbonProps,
  RibbonRef,
  RibbonSemanticClassNames,
  RibbonSemanticStyles,
} from './badge';
export { Badge, Ribbon } from './badge';
export { genBadgeStyle } from './badge/style';
export type { ComponentToken as BadgeComponentToken } from './badge/style/token';
export { prepareComponentToken as prepareBadgeComponentToken } from './badge/style/token';
// ---------------------------------------------------------------------------
// BorderBeam —— 宿主边缘流光
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；无 Component Token（与 antd 逐字一致）。
//    运行时调参走 `--{root}-border-beam-*` CSS 变量（props 写在 Effect style 上）。
// ---------------------------------------------------------------------------
export type {
  BorderBeamColor,
  BorderBeamGradient,
  BorderBeamProps,
  BorderBeamSlot,
} from './border-beam';
export { BorderBeam, DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient } from './border-beam';
export { genBorderBeamStyle } from './border-beam/style';
export type { ComponentToken as BorderBeamComponentToken } from './border-beam/style/token';
// ---------------------------------------------------------------------------
// Button —— 按钮
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（`./style`），`dist/button/style.css` 由构建钩子产出。
//    两处已知的、如实登记的能力缺口见 `./button/style` 的文件头注释：
//    `solidTextColor`（依赖 color-picker 的 `isBright`）与 13 个预设阴影色（构建期求解）。
// ---------------------------------------------------------------------------
export type {
  ButtonColorType,
  ButtonConfig,
  ButtonHTMLType,
  ButtonIcon,
  ButtonIconPlacement,
  ButtonLoading,
  ButtonProps,
  ButtonRef,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
  ButtonSemanticType,
  ButtonShape,
  ButtonSize,
  ButtonSlot,
  ButtonType,
  ButtonVariantType,
} from './button';
export { Button } from './button';
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
// ---------------------------------------------------------------------------
// Flex —— 弹性布局
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（`./style`），`dist/flex/style.css` 由构建钩子产出。
//    Component Token 为 0 个（与 antd 逐字对齐）；gap 三档来自 padding 别名派生。
//    `flexWrapValues` 等枚举数组与 antd 同样不进 barrel（见 `./flex/index.ts`）。
// ---------------------------------------------------------------------------
export type {
  FlexAlign,
  FlexComponent,
  FlexConfig,
  FlexJustify,
  FlexProps,
  FlexRef,
  FlexSlot,
  FlexWrap,
  // `Orientation` 不从 barrel 导出：space 已导出同名类型（antd 也不从 flex 导出它）。
} from './flex';
export { default as FlexDefault, Flex } from './flex';
export { genFlexStyle } from './flex/style';
export type { ComponentToken as FlexComponentToken } from './flex/style/token';
export { prepareComponentToken as prepareFlexComponentToken } from './flex/style/token';
// ---------------------------------------------------------------------------
// Grid —— 栅格（Row + Col）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（`./style`），`dist/grid/style.css` 由构建钩子产出。
//    Row 与 Col 的 Component Token 各 0 个（与 antd 逐字一致）；
//    `parseFlex` 判据纯函数一并导出，供 L1 单测直接钉死。
// ---------------------------------------------------------------------------
export type {
  Breakpoint as GridBreakpoint,
  ColConfig,
  ColProps,
  ColSize,
  GridRef,
  GridSlot,
  Gutter,
  GutterValue,
  ResponsiveValue as GridResponsiveValue,
  RowAlign,
  RowConfig,
  RowContextValue,
  RowJustify,
  RowProps,
} from './grid';
export { Col, default as GridDefault, gridParseFlex, Row } from './grid';
export { default as useBreakpoint } from './grid/hooks/use-breakpoint';
export { genGridStyle } from './grid/style';
// ---------------------------------------------------------------------------
export type {
  ColComponentToken as GridColComponentToken,
  RowComponentToken as GridRowComponentToken,
} from './grid/style/token';
export {
  prepareColComponentToken as prepareGridColComponentToken,
  prepareRowComponentToken as prepareGridRowComponentToken,
} from './grid/style/token';
// ---------------------------------------------------------------------------
// Result —— 结果页
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 4 个（CSS 变量形态）。
//    PRESENTED_IMAGE_403/404/500 是静态插画组件（antd 逐字，hex 字面量不随主题）。
// ---------------------------------------------------------------------------
export type {
  ExceptionStatusType,
  ResultConfig,
  ResultProps,
  ResultRef,
  ResultSemanticClassNames,
  ResultSemanticStyles,
  ResultStatusType,
} from './result';
export {
  ExceptionMap,
  IconMap,
  PRESENTED_IMAGE_403,
  PRESENTED_IMAGE_404,
  PRESENTED_IMAGE_500,
  Result,
} from './result';
export { genResultStyle } from './result/style';
export type { ComponentToken as ResultComponentToken } from './result/style/token';
export { prepareResultComponentToken } from './result/style/token';
export type {
  SkeletonAvatarOwnProps,
  SkeletonAvatarProps,
  SkeletonButtonProps,
  SkeletonConfig,
  SkeletonElementProps,
  SkeletonElementSemanticClassNames,
  SkeletonElementSemanticStyles,
  SkeletonElementSemanticType,
  SkeletonElementSize,
  SkeletonImageProps,
  SkeletonInputProps,
  SkeletonNodeProps,
  SkeletonNodeSlot,
  SkeletonParagraphProps,
  SkeletonProps,
  SkeletonRef,
  SkeletonSemanticAllType,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles,
  SkeletonSemanticType,
  SkeletonSemanticValue,
  SkeletonShape,
  SkeletonSlot,
  SkeletonTitleProps,
  SkeletonWidthUnit,
} from './skeleton';
// ---------------------------------------------------------------------------
// Skeleton —— 骨架屏（`Skeleton.Avatar` / `Button` / `Input` / `Image` / `Node`
// 是同包的子组件）
//
// ⚠️ `loading={undefined}` 是本组件**唯一**与 antd 的行为差异（上游渲染 children、
//    我们渲染骨架）—— 三态表与理由见 `./skeleton/interface.ts`。
// ---------------------------------------------------------------------------
export {
  genSkeletonStyle,
  prepareSkeletonComponentToken,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from './skeleton';
// ---------------------------------------------------------------------------
// Space —— 间距容器（`Space.Compact` / `Space.Addon` 是同包的子组件）
//
// ⚠️ `useCompactItemContext` / `NoCompactStyle` / `spaceCompactItemContextKey` 是
//    **跨组件协议**：Button / Input / InputNumber / Select / TreeSelect / Cascader /
//    DatePicker / Dropdown.Button / ColorPicker 靠它拼自己的 `-compact-item` 类名，
//    浮层（Modal / Drawer / Tooltip / Dropdown）靠 `NoCompactStyle` 把子树隔离出去。
// ---------------------------------------------------------------------------
export type {
  InputStatus,
  SpaceAddonProps,
  SpaceAddonRef,
  SpaceAlign,
  SpaceCompactItemContextType,
  SpaceCompactProps,
  SpaceCompactRef,
  SpaceConfig,
  SpaceContextType,
  SpaceProps,
  SpaceRef,
  SpaceSemanticAllType,
  SpaceSemanticClassNames,
  SpaceSemanticStyles,
  SpaceSemanticType,
  SpaceSemanticValue,
  SpaceSize,
  SpaceSlot,
} from './space';
export {
  CompactItem,
  genSpaceStyle,
  getStatusClassNames,
  isPresetSize,
  isValidGapNumber,
  isValidOrientation,
  NoCompactStyle,
  prepareSpaceComponentToken,
  Space,
  SpaceAddon,
  SpaceCompact,
  spaceCompactItemContextKey,
  spaceContextKey,
  useCompactItemContext,
  useOrientation,
  useSpaceContext,
} from './space';
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
// ---------------------------------------------------------------------------
// Statistic —— 统计数值（复合组件：Statistic.Timer / Statistic.Countdown）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 2 个
//    （titleFontSize / contentFontSize，别名派生）。
//    Countdown 在 antd 6.x 已 @deprecated → `Statistic.Timer type="countdown"`。
// ---------------------------------------------------------------------------
export type {
  CountdownProps,
  CountdownValueType,
  StatisticFormatConfig,
  StatisticFormatter,
  StatisticProps,
  StatisticRef,
  StatisticSemanticAllType,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  StatisticSemanticValue,
  StatisticTimerProps,
  TimerType,
  ValueType,
} from './statistic';
export {
  formatCounter,
  formatTimeStr,
  Statistic,
  StatisticCountdown,
  StatisticTimer,
} from './statistic';
export { genStatisticStyle } from './statistic/style';
export type { ComponentToken as StatisticComponentToken } from './statistic/style/token';
export { prepareComponentToken as prepareStatisticComponentToken } from './statistic/style/token';
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
// ---------------------------------------------------------------------------
// Tag —— 标签（Tag / CheckableTag / CheckableTagGroup）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 3 个（CSS 变量形态）。
//    预设 13 色 × 3 variant 与状态四色 × 3 variant 的规则由生成器循环产出。
// ---------------------------------------------------------------------------
export type {
  CheckableTagGroupProps,
  CheckableTagOption,
  CheckableTagProps,
  TagColor,
  TagProps,
  TagRef,
  TagSemanticClassNames,
  TagSemanticStyles,
  TagVariant,
} from './tag';
export { CheckableTag, CheckableTagGroup, Tag } from './tag';
export { genTagStyle } from './tag/style';
export type { ComponentToken as TagComponentToken } from './tag/style/token';
export { prepareTagComponentToken } from './tag/style/token';
export type {
  ActionsConfig,
  AutoSizeType,
  BaseType,
  BaseTypographyProps,
  BlockProps,
  CopyConfig,
  EditConfig,
  EllipsisConfig,
  LinkProps,
  ParagraphProps,
  TextProps,
  TitleProps,
  TypographyConfig,
  TypographyProps,
  TypographyRef,
  TypographySemanticAllType,
  TypographySemanticClassNames,
  TypographySemanticStyles,
  TypographySemanticType,
  TypographySemanticValue,
  TypographySlot,
  TypographyTooltipProps,
} from './typography';
// ---------------------------------------------------------------------------
// Typography —— 复合组件（Text / Title / Paragraph / Link + ellipsis / copyable / editable）
// ---------------------------------------------------------------------------
export { Link, Paragraph, Text, Title, Typography } from './typography';
