/**
 * `@apollo-design/ui` — 组件库本体。
 *
 * Vue 3 native reimplementation of Ant Design。Ant Design React 是**兼容性规格**，
 * 不是代码来源（`AGENTS.md` §0）。
 *
 * ── 当前进度 ────────────────────────────────────────────────────────────────
 *
 * 进度数字**不写在这里** —— 手写的数字必然滞后，一律看 `registry/components.json`
 * （或 `node registry/tools/ask.mjs progress`）。
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
 * 自定义 `prefixCls`（如 `my-app`，**也包括 `ant`**）时用 `genComponentCss('empty', 'my-app')`
 * 自行产出 CSS —— 静态 CSS 只覆盖 `STATIC_PREFIX_CLS` 里列出的前缀，
 * 而该数组 2026-10-07 起**只有 `apollo`**（裁决 `css-ant-prefix-cost` = B，
 * 砍掉了占组件 CSS 32.8% 的 `ant` 变体）。不自行产 CSS 就换前缀 ⇒ 渲染出的类名没有样式。
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
// Breadcrumb —— 面包屑导航（复合组件：`Breadcrumb.Item` / `Breadcrumb.Separator`，都已废弃）
//
// ⚠️ 类名前缀 `apollo-breadcrumb`；**7 个 Component Token**（全部别名派生，无派生值）。
// ⚠️ **没有 `emits`** —— 根 `<nav>` 不挂组件事件；item 的 `onClick` 随 `items` 传入、
//    落到链接元素上（数据字段，不是组件事件）。
// ⚠️ `ref` 暴露的是 `{ nativeElement }`（**不是**元素本身，上游走 `useImperativeHandle`）。
// ⚠️ `Breadcrumb.Separator` 的 `prefixCls` 取自 **ConfigContext**（不接 prop）⇒
//    L4 / L6 的用例要包一层 `ConfigProvider`（PITFALLS 272 同族）。
// ---------------------------------------------------------------------------
export type {
  BreadcrumbExpose,
  BreadcrumbItemInput,
  BreadcrumbItemMenu,
  BreadcrumbItemProps,
  BreadcrumbItemSlots,
  BreadcrumbItemType,
  BreadcrumbKey,
  BreadcrumbMenuItem,
  BreadcrumbParams,
  BreadcrumbProps,
  BreadcrumbRef,
  BreadcrumbSemanticClassNames,
  BreadcrumbSemanticStyles,
  BreadcrumbSeparatorSlots,
  BreadcrumbSeparatorType,
  BreadcrumbSlots,
} from './breadcrumb';
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbWithSub,
} from './breadcrumb';
export { genBreadcrumbStyle, genTokenDecls as genBreadcrumbTokenDecls } from './breadcrumb/style';
export type { ComponentToken as BreadcrumbComponentToken } from './breadcrumb/style/token';
export { prepareComponentToken as prepareBreadcrumbComponentToken } from './breadcrumb/style/token';
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
// Radio —— 单选框
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **16** 个（CSS 变量形态，
//    其中 `radioSize` / `dotSize` 是 unitless 常量 —— 见 style/index.ts 文件头）。
//    复合组件：`Radio`（注册名 `ARadio`）+ 静态属性 `Radio.Group` / `Radio.Button`，
//    另有具名别名 `RadioGroup` / `RadioButton`；`Radio.__ANT_RADIO` 与上游同。
// ---------------------------------------------------------------------------
export type {
  AbstractRadioProps,
  RadioChangeEvent,
  RadioGroupButtonStyle,
  RadioGroupContextValue,
  RadioGroupOptionType,
  RadioGroupProps,
  RadioGroupRef,
  RadioOptionItem,
  RadioOptionLabel,
  RadioOrientation,
  RadioProps,
  RadioRef,
  RadioSemanticClassNames,
  RadioSemanticContext,
  RadioSemanticStyles,
  RadioValue,
} from './radio';
export { Radio, RadioButton, RadioGroup } from './radio';
export { genRadioStyle, genTokenDecls as genRadioTokenDecls } from './radio/style';
export type { ComponentToken as RadioComponentToken } from './radio/style/token';
export { prepareComponentToken as prepareRadioComponentToken } from './radio/style/token';
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
// Slider —— 滑动输入条（rc-slider 内核的 Vue 等价物）
//
// G4 起样式导出也在本块内（genSliderStyle / genSliderTokenDecls /
// prepareSliderComponentToken），与其它组件同构。
// ---------------------------------------------------------------------------
export type {
  SliderAriaValueFormat,
  SliderBaseProps,
  SliderDirection,
  SliderDotStyle,
  SliderEmits,
  SliderFormatter,
  SliderHandleInfo,
  SliderMarkObject,
  SliderMarks,
  SliderOrientation,
  SliderProps,
  SliderRange,
  SliderRangeConfig,
  SliderRangeProps,
  SliderRef,
  SliderSemanticClassNames,
  SliderSemanticStyles,
  SliderSingleProps,
  SliderSlots,
  SliderTooltipProps,
  SliderValue,
} from './slider';
export { Slider } from './slider';
export { genSliderStyle, genTokenDecls as genSliderTokenDecls } from './slider/style';
export type { ComponentToken as SliderComponentToken } from './slider/style/token';
export { prepareComponentToken as prepareSliderComponentToken } from './slider/style/token';
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
// Switch —— 开关
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **13** 个（构建期算好的解析值，
//    见 style/token.ts 文件头）。`Switch.__ANT_SWITCH` 与上游同。
// ---------------------------------------------------------------------------
export type {
  SwitchChangeEventHandler,
  SwitchClickEventHandler,
  SwitchEvent,
  SwitchProps,
  SwitchRef,
  SwitchSemanticClassNames,
  SwitchSemanticContext,
  SwitchSemanticStyles,
  SwitchSize,
} from './switch';
export { Switch } from './switch';
export { genSwitchStyle, genTokenDecls as genSwitchTokenDecls } from './switch/style';
export type { ComponentToken as SwitchComponentToken } from './switch/style/token';
export { prepareComponentToken as prepareSwitchComponentToken } from './switch/style/token';
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
// ---------------------------------------------------------------------------
// Alert —— 警告提示（复合组件：Alert.ErrorBoundary）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 4 个（borderRadius /
//    withDescriptionIconSize 别名派生；defaultPadding / withDescriptionPadding
//    为字符串拼装常量，antd cssVar 产物同为实串）。
// ---------------------------------------------------------------------------

export type {
  AlertClosable,
  AlertConfig,
  AlertProps,
  AlertRef,
  AlertSemanticAllType,
  AlertSemanticClassNames,
  AlertSemanticStyles,
  AlertSemanticValue,
  AlertType,
  AlertVariant,
  ErrorBoundaryProps,
} from './alert';
export { Alert, AlertErrorBoundary } from './alert';
export { genAlertStyle } from './alert/style';
export type { ComponentToken as AlertComponentToken } from './alert/style/token';
export { prepareComponentToken as prepareAlertComponentToken } from './alert/style/token';
// ---------------------------------------------------------------------------
// Anchor —— 锚点导航（复合组件：`Anchor.Link`）
//
// ⚠️ 类名前缀 `apollo-anchor`；**2 个 Component Token**（`linkPaddingBlock` /
//    `linkPaddingInlineStart`，都是别名派生）+ 4 个 `mergeToken` 派生值（见 style/token.ts）。
// ⚠️ **没有 `ref`/`expose`**（上游 `Anchor` 是 `React.FC`，无 forwardRef）。
// ⚠️ `onClick` 是**自定义签名**的 prop（不是 DOM 事件）⇒ 不声明 `click` 事件
//    （否则组件上的 `@click` 不再挂到根元素）。`onChange` 走 `emit('change')`。
// ⚠️ 组件实现是 `.ts` 渲染函数（COMPONENT-RULES §2 条件 2：递归 + 两分支共享内容）。
// ---------------------------------------------------------------------------
export type {
  AnchorAffixConfig,
  AnchorContainer,
  AnchorDirection,
  AnchorEmits,
  AnchorKey,
  AnchorLinkBaseProps,
  AnchorLinkInfo,
  AnchorLinkItemProps,
  AnchorLinkProps,
  AnchorLinkSlots,
  AnchorProps,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
  AnchorSlots,
} from './anchor';
export { Anchor, AnchorLink, AnchorWithLink } from './anchor';
export { genAnchorStyle, genTokenDecls as genAnchorTokenDecls } from './anchor/style';
export type { ComponentToken as AnchorComponentToken } from './anchor/style/token';
export { prepareComponentToken as prepareAnchorComponentToken } from './anchor/style/token';
export type { AppComponentType, AppConfig, AppProps, UseAppProps } from './app';
export { App } from './app';
export { genAppStyle } from './app/style';
export { useApp } from './app/useApp';
export type {
  AutoCompleteProps,
  AutoCompleteRef,
  AutoCompleteSemanticClassNames,
  AutoCompleteSemanticStyles,
  DataSourceItemObject,
  DataSourceItemType,
} from './auto-complete';
// ---------------------------------------------------------------------------
// AutoComplete —— 自动完成（Select 的 combobox 薄包装；C8-R2：popupRender → 插槽）
// ---------------------------------------------------------------------------
export { AutoComplete, AutoCompleteOption } from './auto-complete';
// ---------------------------------------------------------------------------
// Avatar —— 头像（复合组件：`Avatar.Group`）
//
// ⚠️ 类名前缀 `apollo-avatar`；**12 个 Component Token** + 2 个 `mergeToken` 派生
//    （`avatarBg`=colorTextPlaceholder / `avatarColor`=colorTextLightSolid —— 落**全局** token，
//    见 style/token.ts）。⚠️ 上游的 `AvatarToken.avatarBgColor` 是**死键**（mergeToken 里从没赋值）
//    ⇒ 本仓不引入。
// ⚠️ **没有 `classNames` / `styles` 语义化槽**（与 card / empty 不同）⇒ `AvatarConfig`
//    只有 `className` / `style`。
// ⚠️ `ref` 暴露的是 `{ nativeElement }`（上游 `Avatar` 是 `forwardRef<HTMLSpanElement>`，
//    本仓统一成对象）。
// ⚠️ **数字尺寸必须走 `toCssSize()`** —— Vue 的 `patchStyle` 不补 px，裸数字被静默丢弃
//    （PITFALLS 170）⇒ `size={40}` / 响应式尺寸会整个失效。
// ⚠️ `onError` 是**有返回值语义**的 prop（返回 `false` ⇒ 阻止内置回退）。
// ---------------------------------------------------------------------------
export type {
  AvatarConfig,
  AvatarContextType,
  AvatarGroupMax,
  AvatarGroupProps,
  AvatarGroupRef,
  AvatarGroupSlot,
  AvatarProps,
  AvatarRef,
  AvatarShape,
  AvatarSize,
  AvatarSlot,
  ScreenSizeMap,
} from './avatar';
export { Avatar, AvatarGroup } from './avatar';
export { genAvatarStyle, genTokenDecls as genAvatarTokenDecls } from './avatar/style';
export type { ComponentToken as AvatarComponentToken } from './avatar/style/token';
export { prepareComponentToken as prepareAvatarComponentToken } from './avatar/style/token';
export type {
  CalendarCellRender,
  CalendarCellRenderInfo,
  CalendarDate,
  CalendarEmits,
  CalendarExpose,
  CalendarFullCellRender,
  CalendarHeaderRender,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  CalendarSemanticValue,
  CalendarSlots,
  // ⚠️ `menu` 也导出了一个 `SelectInfo`（同名不同义）⇒ 本仓约定「重名用别名」（PITFALLS 6/158/168）
  SelectInfo as CalendarSelectInfo,
} from './calendar';
// ---------------------------------------------------------------------------
// Calendar —— 日历（面板**内联**，没有浮层）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（2026-10-02）；Component Token **6** 个，
//    但 `prepareComponentToken` 里 `...initPanelComponentToken(token)` 带进 **21** 个面板 token
//    ⇒ 实测 **27** 条 `--apollo-calendar-*` 声明。
// 🚨 **类名前缀是 `apollo-picker-calendar`**（上游 `getPrefixCls('picker')`），
//    而 CSS 变量是 `--apollo-calendar-*` —— **类名与变量名的命名空间不同**，
//    见 `calendar/style/index.ts` 的文件头。
// ⚠️ 上游 `Calendar` 上**没有**静态成员（不像 `DatePicker` 有 `RangePicker`）；
//    `ref` 也只暴露 `nativeElement`（上游 `CalendarRef` 没有 `focus` / `blur`）。
// ---------------------------------------------------------------------------
export { Calendar } from './calendar';
export { genCalendarStyle, genCalendarTokenDecls } from './calendar/style';
export type { ComponentToken as CalendarComponentToken } from './calendar/style/token';
export { prepareComponentToken as prepareCalendarComponentToken } from './calendar/style/token';
// ---------------------------------------------------------------------------
// Card —— 通用卡片容器（复合组件：`Card.Grid` / `Card.Meta`）
//
// ⚠️ 类名前缀 `apollo-card`；**13 个 Component Token** + 4 个 `mergeToken` 派生
//    （派生值落 `--apollo-box-shadow-card` / `--apollo-padding` / `--apollo-padding-lg`
//    / `--apollo-font-size` 这些**全局** token，见 style/token.ts）。
// ⚠️ **没有 `emits`** —— `onTabChange` 是上游的 **prop**（无 value/onChange 对，
//    C11 的双发不适用），所以按 prop 形态保留。
// ⚠️ `ref` 暴露的是 `{ nativeElement }`（**不是**元素本身；上游 `Card` 是
//    `forwardRef<HTMLDivElement>`，本仓按 badge/Ribbon 的既有约定统一成对象）。
// ⚠️ **同一组件族两个 ConfigProvider 键**：`components.card` 与 `components.cardMeta`
//    （`Card.Meta` 自己读后者）—— 都走 (B) 通道，类型未提升。
// ⚠️ `Card.Grid` 的 vnode 身份是 `-contain-grid` 的判据 ⇒ 别自己包一层新组件再传进来。
// ---------------------------------------------------------------------------
export type {
  CardConfig,
  CardGridProps,
  CardGridRef,
  CardGridSlot,
  CardMetaConfig,
  CardMetaProps,
  CardMetaRef,
  CardMetaSemanticAllType,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles,
  CardMetaSemanticType,
  CardMetaSemanticValue,
  CardMetaSlot,
  CardProps,
  CardRef,
  CardSemanticAllType,
  CardSemanticClassNames,
  CardSemanticStyles,
  CardSemanticType,
  CardSemanticValue,
  CardSize,
  CardSlot,
  CardTabListType,
  CardType,
} from './card';
export { Card, CardGrid, CardMeta } from './card';
export { genCardStyle, genTokenDecls as genCardTokenDecls } from './card/style';
export type { ComponentToken as CardComponentToken } from './card/style/token';
export { prepareComponentToken as prepareCardComponentToken } from './card/style/token';
// ---------------------------------------------------------------------------
// Carousel —— 走马灯（决策 B：自建 slick 引擎，见 engine.ts）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **8** 个（构建期解析值，
//    arrowLength=arrowSize/√2 的无理数几何用 JS 常量，见 style/token.ts 文件头）。
//    `beforeChange` / `afterChange` / `onSwipe` / `onEdge` 是 Vue 事件（C19）；
//    prevArrow / nextArrow 用 `#prev-arrow` / `#next-arrow` 插槽。
// ---------------------------------------------------------------------------
export type {
  CarouselAfterChangeEventHandler,
  CarouselAutoplay,
  CarouselBeforeChangeEventHandler,
  CarouselChildren,
  CarouselDots,
  CarouselEffect,
  CarouselProps,
  CarouselRef,
  CarouselSwipeDirection,
  DotPlacement,
} from './carousel';
export { Carousel } from './carousel';
export { genCarouselStyle, genTokenDecls as genCarouselTokenDecls } from './carousel/style';
export type { ComponentToken as CarouselComponentToken } from './carousel/style/token';
export { prepareComponentToken as prepareCarouselComponentToken } from './carousel/style/token';
// ---------------------------------------------------------------------------
// Cascader —— 级联选择
// ---------------------------------------------------------------------------
export type {
  BaseOptionType as CascaderBaseOptionType,
  DefaultOptionType as CascaderDefaultOptionType,
  FieldNames as CascaderFieldNames,
  RawValue as CascaderRawValue,
  ShowCheckedStrategy,
  ValueCell as CascaderValueCells,
} from './cascader';
export {
  Cascader,
  CascaderPanel,
  SHOW_CHILD as CASCADER_SHOW_CHILD,
  SHOW_PARENT as CASCADER_SHOW_PARENT,
} from './cascader';
export { genCascaderStyle, genTokenDecls as genCascaderTokenDecls } from './cascader/style';
export type { ComponentToken as CascaderComponentToken } from './cascader/style/token';
export { prepareComponentToken as prepareCascaderComponentToken } from './cascader/style/token';
// ---------------------------------------------------------------------------
// Checkbox —— 复选框（复合组件：Checkbox.Group）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token 0 个（全 alias token）。
// ---------------------------------------------------------------------------
export type {
  AbstractCheckboxProps,
  CheckboxChangeEvent,
  CheckboxChangeEventTarget,
  CheckboxGroupProps,
  CheckboxGroupRef,
  CheckboxOptionType,
  CheckboxProps,
  CheckboxRef,
  CheckboxSemanticClassNames,
  CheckboxSemanticStyles,
} from './checkbox';
export { Checkbox, CheckboxGroup } from './checkbox';
export { genCheckboxStyle } from './checkbox/style';
export type { ComponentToken as CheckboxComponentToken } from './checkbox/style/token';
// ---------------------------------------------------------------------------
// Collapse —— 折叠面板（engine/ = @rc-component/collapse 替换落点；动效复用
// @apollo-design/motion 的 CSSMotion + initCollapseMotion）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **10** 个（别名引用走
//    var()，padding 组合串构建期解析值）。复合组件 `Collapse.Panel`；
//    items 首选 / children deprecated；事件 change（C19）。
// ---------------------------------------------------------------------------
export type {
  CollapseItemType,
  CollapsePanelProps,
  CollapseProps,
  CollapseRef,
  CollapseSemanticClassNames,
  CollapseSemanticStyles,
  CollapsibleType,
  ExpandIconPlacement,
} from './collapse';
export { Collapse, CollapsePanel } from './collapse';
export { genCollapseStyle, genTokenDecls as genCollapseTokenDecls } from './collapse/style';
export type {
  ColorFormatType,
  ColorPickerColor,
  ColorPickerEmits,
  ColorPickerPanelRenderExtra,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
  ColorPickerSemanticType,
  ColorPickerSemanticValue,
  ColorPickerSlots,
  ColorValueType,
  LineGradientType,
  PresetsItem,
  SingleValueType,
  TriggerPlacement,
  TriggerType,
} from './color-picker';
// ---------------------------------------------------------------------------
// ColorPicker —— 颜色选择器（面板在 Popover 里；颜色引擎在 `color-picker/engine/`）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（2026-10-02）；**Component Token 0 个**
//    （上游 `export interface ComponentToken {}`，实测产物里 `--ant-color-picker-*` 声明 0 条），
//    但 9 个 `mergeToken` 派生值在本仓**声明成** `--apollo-color-picker-*`
//    （有意差异：H9 + E10 的 `box-shadow:inset` 前缀 + 主题自适应；计算值逐位相同）。
// ⚠️ 上游 `ColorPicker` **没有 ref 转发**（`ColorPicker.d.ts` 是裸 `React.FC`，
//    `ColorPicker.js` 里 `forwardRef` 出现 **0** 次）⇒ 本仓**不 expose**。
// ⚠️ 静态面板：`ColorPicker._InternalPanelDoNotUseOrYouWillBeFired` = `ColorPickerPurePanel`。
// ⚠️ 面板里的滑块**复用** `Slider`（`#handle` scoped slot 定制把手，见 PITFALLS 319）
//    ⇒ color-picker 的面板会引入整套 Slider 的 CSS（跨组件视觉面）。
// ---------------------------------------------------------------------------
export {
  ColorPicker,
  ColorPickerPanel,
  ColorPickerPurePanel,
  FORMAT_HEX,
  FORMAT_HSB,
  FORMAT_RGB,
} from './color-picker';
export { genColorPickerStyle, genColorPickerTokenDecls } from './color-picker/style';
export type { ComponentToken as ColorPickerComponentToken } from './color-picker/style/token';
export { prepareComponentToken as prepareColorPickerComponentToken } from './color-picker/style/token';
// ⚠️ **刻意不导出 `CustomTagProps`**：
//   1. **名字与 `select` 撞车**（本文件已有 `export type { CustomTagProps } from './select'`）
//      —— 两者是**不同的类型**（date-picker 的是 rc-picker 的 `{label: VNodeChild; value:
//      DatePickerDate; …}`，select 的是 rc-select 的 `{label?: unknown; isMaxTag; …}`），
//      同时导出会让 `vue-tsc` 报 `TS2300 Duplicate identifier`（2026-10-01 实测）。
//   2. **与上游一致**：antd 的 `es/date-picker/index.d.ts` **不导出**它
//      （它只是 rc-picker `SinglePicker.d.ts` 的内部类型）。
//   消费方要从 `DatePickerProps['tagRender']` 的形参推断，或从 `date-picker` 子模块取。
export type {
  CellRender,
  CellRenderInfo,
  CustomFormat,
  DatePickerDate,
  DatePickerDirection,
  DatePickerEmits,
  DatePickerExpose,
  DatePickerFormat,
  DatePickerGenerateConfig,
  DatePickerMode,
  DatePickerPanelMode,
  DatePickerPlacement,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  DatePickerSize,
  DatePickerSlots,
  DatePickerStatus,
  DatePickerVariant,
  DisabledDate,
  DisabledTimes,
  FormatType,
  LimitDate,
  MaskFormatConfig,
  NoUndefinedRangeValue,
  OpenConfig,
  PickerCommonProps,
  PickerPopupSemanticClassNames,
  PickerPopupSemanticStyles,
  PurePanelProps,
  PureRangePanelProps,
  RangePickerEmits,
  RangePickerExpose,
  RangePickerProps,
  RangeTimeProps,
  RangeValue,
  RangeValueDate,
  SharedTimeProps,
  SingleValue,
  ValueDate,
} from './date-picker';
// ---------------------------------------------------------------------------
// DatePicker —— 日期选择器（单值壳 + 范围壳）
//
// ⚠️ 类名前缀是 **`apollo-picker`**（上游 `getPrefixCls('picker', …)` 传的是字面量
//    `'picker'`），而 CSS 变量是 `--apollo-date-picker-*` —— **两者不同名**，
//    见 `date-picker/README.md` 的文件头。
// ⚠️ **两个组件共用同一份样式**（`genDatePickerStyle` / `COMPONENT_STYLES` 里
//    只有 `date-picker` 一项）—— 范围的面板样式与单值完全同源，不另注册。
// ⚠️ 上游的 `DatePicker.RangePicker` 静态成员由 `date-picker/index.ts` 的
//    `Object.assign` 原地挂上（`DatePickerWithRange`），所以**顶层导出里
//    `RangePicker` 与 `DatePicker.RangePicker` 都可用**。
//    ⚠️ `.WeekPicker` / `.QuarterPicker` 仍未实现（antd 侧它们是薄包装，
//    与本仓 `picker: 'week'` 的用法等价）。
// ---------------------------------------------------------------------------
export { DatePicker, DatePickerWithRange, RangePicker } from './date-picker';
export {
  genDatePickerStyle,
  genTokenDecls as genDatePickerTokenDecls,
} from './date-picker/style';
export type { ComponentToken as DatePickerComponentToken } from './date-picker/style/token';
export { prepareComponentToken as prepareDatePickerComponentToken } from './date-picker/style/token';
// ---------------------------------------------------------------------------
// Descriptions —— 描述列表（复合组件：Descriptions.Item）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **10** 个（radio D46 同判：
//    别名派生走 var()，titleMarginBottom 乘法派生走构建期解析值）。
//    三形态渲染分支（plain / bordered / vertical）见 docs/analysis/descriptions.md §3。
// ---------------------------------------------------------------------------
export type {
  DescriptionsColumn,
  DescriptionsItemSpan,
  DescriptionsItemType,
  DescriptionsProps,
  DescriptionsRef,
  DescriptionsRowItem,
  DescriptionsSemanticClassNames,
  DescriptionsSemanticStyles,
} from './descriptions';
export { Descriptions, DescriptionsItem } from './descriptions';
export {
  genDescriptionsStyle,
  genTokenDecls as genDescriptionsTokenDecls,
} from './descriptions/style';
export type { ComponentToken as DescriptionsComponentToken } from './descriptions/style/token';
export { prepareComponentToken as prepareDescriptionsComponentToken } from './descriptions/style/token';
export type {
  DrawerPlacement,
  DrawerProps,
  DrawerPurePanelProps,
  DrawerResizableConfig,
  DrawerSemanticType,
  DrawerSize,
  FocusableConfig as DrawerFocusableConfig,
  MaskType as DrawerMaskType,
  PushState as DrawerPushState,
} from './drawer';
// ---------------------------------------------------------------------------
// Drawer —— 抽屉（rc-drawer 的 Vue 自建：portal + mask + push + resizable）
//
// ⚠️ 尺寸轴随方位切换：`left`/`right` 用 `width`、`top`/`bottom` 用 `height`；
//    `size` 预设 `'large'` = 736、`'default'` = 378。**默认有 mask**（可点遮罩关闭）。
// ---------------------------------------------------------------------------
export { Drawer, DrawerPurePanel } from './drawer';
export { genDrawerStyle, genDrawerTokenDecls } from './drawer/style';
export type { ComponentToken as DrawerComponentToken } from './drawer/style/token';
export { prepareComponentToken as prepareDrawerComponentToken } from './drawer/style/token';
export type {
  DropdownArrowOptions,
  DropdownButtonProps,
  DropdownPlacement,
  DropdownPopupPlacement,
  DropdownProps,
  DropdownSemanticType,
  DropdownTriggerAction,
} from './dropdown';
export { Dropdown, DropdownButton, DropdownPurePanel } from './dropdown';
export { genDropdownStyle, genDropdownTokenDecls } from './dropdown/style';
export type { ComponentToken as DropdownComponentToken } from './dropdown/style/token';
export { prepareComponentToken as prepareDropdownComponentToken } from './dropdown/style/token';
export type {
  FloatButtonBackTopProps,
  FloatButtonBadgeProps,
  FloatButtonGroupPlacement,
  FloatButtonGroupProps,
  FloatButtonGroupRef,
  FloatButtonGroupTrigger,
  FloatButtonProps,
  FloatButtonRef,
  FloatButtonShape,
  FloatButtonType,
} from './float-button';
// ---------------------------------------------------------------------------
// FloatButton —— 浮动按钮（Group/BackTop/PurePanel compound；C8-R2：icon/content
// → 插槽，tooltip/badge 数据 prop）
// ---------------------------------------------------------------------------
export {
  FloatButton,
  FloatButtonBackTop,
  FloatButtonGroup,
  FloatButtonPurePanel,
  floatButtonPrefixCls,
} from './float-button';
// Form —— 表单（form-core 第一个 UI 消费者；BaseSelect 同源消费协议）
export type {
  ColProps as FormColProps,
  FeedbackIcons as FormFeedbackIcons,
  FormEmits,
  FormItemLayout,
  FormItemProps,
  FormItemTooltipType,
  FormLabelAlign,
  FormLayout,
  FormListProps,
  FormListSlots,
  FormProps,
  FormSemanticClassNames,
  FormSemanticStyles,
  RequiredMark,
  ScrollFocusOptions as FormScrollFocusOptions,
  ScrollOptions as FormScrollOptions,
  ValidateStatus,
} from './form';
export {
  ErrorListComponent as FormErrorList,
  Form,
  FormItem,
  FormList,
  useForm,
  useForm as useFormInstance,
  useWatch,
} from './form';
export { genFormStyle, genTokenDecls as genFormTokenDecls } from './form/style';
export type { ComponentToken as FormComponentToken } from './form/style/token';
export { prepareComponentToken as prepareFormComponentToken } from './form/style/token';
export type {
  ImageProps,
  ImageSemanticType,
  PreviewConfig,
  PreviewGroupProps,
} from './image';
export { Image, ImagePreviewGroup } from './image';
export { genImageStyle, genImageTokenDecls } from './image/style';
export type { ComponentToken as ImageComponentToken } from './image/style/token';
export { prepareComponentToken as prepareImageComponentToken } from './image/style/token';
// ---------------------------------------------------------------------------
// Input —— 输入框（引擎自建于 engine/：BaseInput 三层包裹 + IME 组合态 + 计数裁剪）
//
// ⚠️ 本轮范围：Input / TextArea / Input.Password / Input.Group。
//    Search 与 OTP 顺延（docs/analysis/input.md §7）。样式层：186 条规则
//    （产物逐条对拍）+ 18 Component Token（token.ts）。
// ---------------------------------------------------------------------------
export type {
  AllowClearProp as InputAllowClearProp,
  InputCountProp,
  InputFocusOptions,
  InputGroupProps,
  InputPasswordProps,
  InputProps,
  InputRef,
  InputSemanticClassNames,
  InputSemanticContext,
  InputSemanticStyles,
  PasswordSemanticClassNames,
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './input';
export { Input, InputGroup, InputPassword, TextArea } from './input';
export { genInputStyle, genTokenDecls as genInputTokenDecls } from './input/style';
export type { ComponentToken as InputComponentToken } from './input/style/token';
export { prepareComponentToken as prepareInputComponentToken } from './input/style/token';
// ---------------------------------------------------------------------------
// InputNumber —— 数字输入框（引擎自建于 engine/：Decimal + StepHandler + cursor）
//
// ⚠️ 样式已注册进 COMPONENT_STYLES；Component Token 9 个 + input 族基础 10 个
//    （别名色走 var(--apollo-*)；算式值/色彩合成为构建期解析值，见 style/token.ts）。
//    v-model:value 与 onChange 双通道（C11）；deprecated ×3（bordered/addon×2）。
//    form/context、form/hooks/useVariants 为本组件落的最小叶子模块。
// ---------------------------------------------------------------------------
export type {
  InputNumberControls,
  InputNumberMode,
  InputNumberProps,
  InputNumberRef,
  InputNumberSemanticClassNames,
  InputNumberSemanticContext,
  InputNumberSemanticStyles,
  InputNumberStepInfo,
} from './input-number';
export { InputNumber } from './input-number';
export {
  genInputNumberStyle,
  genTokenDecls as genInputNumberTokenDecls,
} from './input-number/style';
export type { ComponentToken as InputNumberComponentToken } from './input-number/style/token';
export { prepareComponentToken as prepareInputNumberComponentToken } from './input-number/style/token';
// ---------------------------------------------------------------------------
// Layout —— 布局（复合组件：Layout.Header / Footer / Content / Sider）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`（layout + layout-sider 两份）；
//    Component Token 19 个（两个字面常量 #001529 / #002140，其余别名派生）。
// ---------------------------------------------------------------------------
export type {
  Breakpoint as LayoutBreakpoint,
  CollapseType as LayoutCollapseType,
  LayoutProps,
  LayoutRef,
  SiderContextProps as LayoutSiderContextProps,
  SiderProps as LayoutSiderProps,
  SiderRef as LayoutSiderRef,
  SiderSemanticClassNames as LayoutSiderSemanticClassNames,
  SiderSemanticStyles as LayoutSiderSemanticStyles,
  SiderTheme as LayoutSiderTheme,
} from './layout';
export {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  LayoutSider,
} from './layout';
export { genLayoutStyle, genSiderStyle } from './layout/style';
export type { ComponentToken as LayoutComponentToken } from './layout/style/token';
export { prepareComponentToken as prepareLayoutComponentToken } from './layout/style/token';
// ---------------------------------------------------------------------------
// List —— 列表（⚠️ antd 6.6.4 已整体 deprecated，保留同款 console.error；
// 替代品是 Listy）
//
// ⚠️ 类名前缀 `apollo-list`；**11 个 Component Token** + 2 个 `mergeToken` 派生
//    （`listBorderedCls` / `minHeight`）。⚠️ css-var 声明块覆盖**两个根**：
//    `.apollo-list` + `.apollo-list-container`（上游 extraCssVarPrefixCls，D95 家族）。
//    复合组件：`List.Item` / `List.Item.Meta`。
// ---------------------------------------------------------------------------
export type {
  ColumnCount,
  ColumnType,
  ListConfig,
  ListConsumerProps,
  ListGridType,
  ListItemLayout,
  ListItemMetaProps,
  ListItemMetaRef,
  ListItemMetaSlot,
  ListItemProps,
  ListItemSemanticClassNames,
  ListItemSemanticName,
  ListItemSemanticStyles,
  ListItemSlot,
  ListLocale,
  ListProps,
  ListRef,
  ListSize,
  ListSlot,
} from './list';
export { List, ListItem, ListItemMeta } from './list';
export { genListStyle, genTokenDecls as genListTokenDecls } from './list/style';
export type { ComponentToken as ListComponentToken } from './list/style/token';
export { prepareComponentToken as prepareListComponentToken } from './list/style/token';
// ---------------------------------------------------------------------------
// Listy —— 轻量列表（antd v6 新增；引擎自建于 engine/，虚拟滚动复用
// @apollo-design/virtual-list）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **2** 个（纯别名引用 ⇒
//    var() 形态，radio D46 同判）。`itemRender` = default slot（作用域
//    `{ item, index }`）+ 同名 prop；`ref.scrollTo` 命令式定位（Raw 用
//    scrollIntoView，Virtual 走 virtual-list 迭代）。
// ---------------------------------------------------------------------------
export type {
  ListyClassNames,
  ListyGroup,
  ListyGroupScrollToConfig,
  ListyKey,
  ListyKeyScrollToConfig,
  ListyPositionScrollToConfig,
  ListyProps,
  ListyRef,
  ListyRowKey,
  ListyScrollAlign,
  ListyScrollToConfig,
  ListySemanticName,
  ListyStyles,
} from './listy';
export { Listy } from './listy';
export { genListyStyle, genTokenDecls as genListyTokenDecls } from './listy/style';
// ---------------------------------------------------------------------------
// Masonry —— 瀑布流
//
// ⚠️ 类名前缀 `apollo-masonry`；**没有 Component Token**（上游 `ComponentToken` 是空接口）。
// ⚠️ 它消费 grid 的两个 hook（`useBreakpoint` / `useGutter`），但**不依赖 Grid 组件**
//    （registry 的 `dependencies.components` 为空、`typeOnly` 是 `grid`）。
// ⚠️ `inheritAttrs: false`：上游不透传 `...restProps`（见组件文件头）。
// ---------------------------------------------------------------------------
export type {
  MasonryEmits,
  MasonryExpose,
  MasonryItemRenderInfo,
  MasonryItemType,
  MasonryKey,
  MasonryLayoutItem,
  MasonryProps,
  MasonryRef,
  MasonrySemanticClassNames,
  MasonrySemanticStyles,
} from './masonry';
export { Masonry } from './masonry';
export { genMasonryStyle } from './masonry/style';
export type { ComponentToken as MasonryComponentToken } from './masonry/style/token';
export { prepareComponentToken as prepareMasonryComponentToken } from './masonry/style/token';
// ---------------------------------------------------------------------------
// Mentions —— 提及（@ 触发候选）
//
// ⚠️ 引擎在 `mentions/engine/`（rc-mentions 的等价物，裁决 `in-ui`）：
//    textarea 复用 `input/engine/TextArea`，浮层复用 `_internal/trigger`，
//    候选列表**自建**（不复用 `menu/Menu`，理由见 engine/DropdownMenu.ts 文件头）。
// ⚠️ 静态成员：`Mentions.Option`（deprecated）/ `Mentions.getMentions` /
//    `Mentions._InternalPanelDoNotUseOrYouWillBeFired`。
// ⚠️ 不导出裸名 `Option`（避免与后续组件的 `Option` 撞名）—— 用 `MentionsOption`
//    或 `Mentions.Option`。
// ---------------------------------------------------------------------------
export type {
  MentionPlacement,
  MentionProps,
  MentionsConfig,
  MentionsEntity,
  MentionsOptionProps,
  MentionsProps,
  MentionsRef,
  MentionsSemanticClassNames,
  MentionsSemanticClassNamesFn,
  MentionsSemanticContext,
  MentionsSemanticStyles,
  MentionsSemanticStylesFn,
  OptionProps as MentionsOptionPropsDeprecated,
} from './mentions';
export { Mentions, MentionsOption } from './mentions';
export { genMentionsStyle, genTokenDecls as genMentionsTokenDecls } from './mentions/style';
export type { ComponentToken as MentionsComponentToken } from './mentions/style/token';
export { prepareComponentToken as prepareMentionsComponentToken } from './mentions/style/token';
export type {
  ItemType,
  MenuDividerType,
  MenuInfo,
  MenuItemGroupType,
  MenuItemType,
  MenuMode,
  MenuProps,
  MenuRef,
  MenuTheme,
  SelectInfo,
  SubMenuType,
} from './menu';
export { Menu, MenuDivider, MenuItem, MenuItemGroup, MenuSubMenu } from './menu';
export { genMenuStyle, genMenuTokenDecls } from './menu/style';
export type { ComponentToken as MenuComponentToken } from './menu/style/token';
export { prepareComponentToken as prepareMenuComponentToken } from './menu/style/token';
export type {
  ArgsProps as MessageArgsProps,
  ConfigOptions as MessageConfigOptions,
  JointContent as MessageJointContent,
  MessageInstance,
  MessageSemanticType,
  MessageType,
  NoticeType as MessageNoticeType,
  TypeOpen as MessageTypeOpen,
} from './message';
// ---------------------------------------------------------------------------
// Message —— 全局提示（命令式 API：`message.success(...)`）
//
// ⚠️ 导出名是**小写** `message`（与 antd 一致）—— 它是「方法集合」而不是组件，
//    没有 `<Message />` 这种用法（`_InternalPanel*` 是私有面板，仅供文档/调试）。
// ---------------------------------------------------------------------------
export { default as message } from './message';
export { genMessageStyle, genMessageTokenDecls } from './message/style';
export type { ComponentToken as MessageComponentToken } from './message/style/token';
export { prepareComponentToken as prepareMessageComponentToken } from './message/style/token';
export type {
  AutoFocusButton as ModalAutoFocusButton,
  ClosableConfig as ModalClosableConfig,
  ClosableType as ModalClosableType,
  FocusableConfig as ModalFocusableConfig,
  MaskConfig as ModalMaskConfig,
  MaskType as ModalMaskType,
  ModalButtonProps,
  ModalFuncProps,
  ModalGetContainer,
  ModalGlobalConfig,
  ModalHookAPI,
  ModalInstance,
  ModalLocale,
  ModalOkType,
  ModalProps,
  ModalPurePanelProps,
  ModalSemanticType,
  ModalType,
  MousePosition,
} from './modal';
// ---------------------------------------------------------------------------
// Modal —— 对话框（rc-dialog 的 Vue 自建：portal + 焦点陷阱 + 焦点归还）
//
// ⚠️ 静态方法：`Modal.confirm/info/success/error/warning/warn` 与 `Modal.destroyAll()`、
//    `Modal.useModal()`；`_InternalPanelDoNotUseOrYouWillBeFired` 是私有面板（L4/L6 取证用）。
//    `Modal.config` **已废弃**（请用 `ConfigProvider.config`）。
// ⚠️ 焦点三条是硬要求：陷阱（`focusTrap`，默认跟 mask 走）、归还（`focusTriggerAfterClose`，
//    默认 true）、`focusable.autoFocusButton`（confirm 默认 `'ok'`）。
// ---------------------------------------------------------------------------
export { default as Modal, ModalPurePanel } from './modal';
export { genModalStyle, genModalTokenDecls } from './modal/style';
export type { ComponentToken as ModalComponentToken } from './modal/style/token';
export { prepareComponentToken as prepareModalComponentToken } from './modal/style/token';
export type {
  ArgsProps as NotificationArgsProps,
  GlobalConfigProps as NotificationGlobalConfigProps,
  IconType as NotificationIconType,
  NotificationConfig,
  NotificationInstance,
  NotificationPlacement,
  NotificationSemanticType,
} from './notification';
// ---------------------------------------------------------------------------
// Notification —— 通知提醒框（命令式 API：`notification.success({ title })`）
//
// ⚠️ 与 message 的两处差异：`open()` 返回 **void**（没有 thenable 句柄）、
//    **默认就堆叠**（`{ offset: 8 }`）。导出名同样是**小写**（与 antd 一致）。
// ---------------------------------------------------------------------------
export { default as notification } from './notification';
export { genNotificationStyle, genNotificationTokenDecls } from './notification/style';
export type { ComponentToken as NotificationComponentToken } from './notification/style/token';
export {
  notificationDerivedValues,
  prepareComponentToken as prepareNotificationComponentToken,
  prepareNotificationToken,
} from './notification/style/token';
// ---------------------------------------------------------------------------
// Pagination —— 分页器（rc-pagination 内核的 Vue 等价物）
//
// G4 起样式导出也在本块内（genPaginationStyle / genPaginationTokenDecls /
// preparePaginationComponentToken）。
// ---------------------------------------------------------------------------
export type {
  PaginationAlign,
  PaginationConfig,
  PaginationEmits,
  PaginationItemRender,
  PaginationItemType,
  PaginationLocale,
  PaginationPosition,
  PaginationProps,
  PaginationRange,
  PaginationSemanticAllType,
  PaginationSemanticClassNames,
  PaginationSemanticStyles,
  PaginationSemanticValue,
  PaginationShowTotal,
  PaginationSimple,
  PaginationSizeChangerInfo,
  PaginationSlots,
} from './pagination';
export { Pagination } from './pagination';
export { genPaginationStyle, genTokenDecls as genPaginationTokenDecls } from './pagination/style';
export type { ComponentToken as PaginationComponentToken } from './pagination/style/token';
export { prepareComponentToken as preparePaginationComponentToken } from './pagination/style/token';
// ---------------------------------------------------------------------------
// Popconfirm —— 气泡确认框
// ---------------------------------------------------------------------------
export type {
  PopconfirmButtonProps,
  PopconfirmClassNames,
  PopconfirmProps,
  PopconfirmRef,
  PopconfirmSemanticType,
  PopconfirmStyles,
} from './popconfirm';
export { Popconfirm, PopconfirmPurePanel } from './popconfirm';
export { genPopconfirmStyle, genTokenDecls as genPopconfirmTokenDecls } from './popconfirm/style';
export type { ComponentToken as PopconfirmComponentToken } from './popconfirm/style/token';
export { prepareComponentToken as preparePopconfirmComponentToken } from './popconfirm/style/token';
export type {
  PopoverClassNames,
  PopoverProps,
  PopoverRef,
  PopoverSemanticType,
  PopoverStyles,
} from './popover';
export { Popover, PopoverPurePanel } from './popover';
export { genPopoverStyle, genPopoverTokenDecls } from './popover/style';
export type { ComponentToken as PopoverComponentToken } from './popover/style/token';
export { prepareComponentToken as preparePopoverComponentToken } from './popover/style/token';
export type {
  GapPlacement,
  GapPosition,
  PercentPositionType,
  ProgressGradient,
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
  ProgressSize,
  ProgressStatus,
  ProgressType,
  StringGradients,
  SuccessProps,
} from './progress';
// ---------------------------------------------------------------------------
// Progress —— 进度条（line/circle/dashboard/steps；SVG 内核自研，H5 不依赖
// rc-progress；C8-R2：format/rounding 为 fn prop 数据通道）
// ---------------------------------------------------------------------------
export { Progress } from './progress';
// ---------------------------------------------------------------------------
// QrCode —— 二维码（引擎 vendored：Nayuki qrcodegen，MIT；strategy=reuse 落定）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **1** 个
//    （QRCodeCoverBackgroundColor，构建期解析值）。type=canvas|svg 双形态；
//    status != 'active' ⇒ -cover 覆盖层（expired/loading/scanned）。
// ---------------------------------------------------------------------------
export type {
  QRCodeProps,
  QRCodeRef,
  QrCodeSemanticClassNames,
  QrCodeSemanticStyles,
  QrcodeLocale,
  QrcodeStatusType,
} from './qr-code';
export { QrCode } from './qr-code';
export { genQrCodeStyle, genTokenDecls as genQrCodeTokenDecls } from './qr-code/style';
export type { RateComponentToken, RateProps, RateRef, StarRenderInfo } from './rate';
// ---------------------------------------------------------------------------
// Rate —— 评分（rc-rate 1.0.1 内核自建 + antd 壳；C8-R2：character → #character 插槽）
// ---------------------------------------------------------------------------
export { prepareRateComponentToken, Rate } from './rate';
// ---------------------------------------------------------------------------
// Segmented —— 分段控制器
// ---------------------------------------------------------------------------
export type {
  SegmentedLabeledOption,
  SegmentedLabeledOptionWithIcon,
  SegmentedLabeledOptionWithoutIcon,
  SegmentedOption,
  SegmentedOptions,
  SegmentedProps,
  SegmentedRawOption,
  SegmentedRef,
  SegmentedSemanticClassNames,
  SegmentedSemanticStyles,
  SegmentedValue,
} from './segmented';
export { Segmented } from './segmented';
export { genSegmentedStyle, genTokenDecls as genSegmentedTokenDecls } from './segmented/style';
export type { ComponentToken as SegmentedComponentToken } from './segmented/style/token';
export { prepareComponentToken as prepareSegmentedComponentToken } from './segmented/style/token';
export type {
  CustomTagProps,
  DefaultOptionType,
  DisplayValueType,
  FieldNames as SelectFieldNames,
  FlattenOptionData,
  LabeledValue,
  LabelInValueType,
  OptGroupProps,
  OptionProps as SelectOptionProps,
  RawValueType,
  ScrollToArg,
  SearchConfig as SelectSearchConfig,
  SelectCommonPlacement,
  SelectEmits,
  SelectMode,
  SelectProps,
  SelectRef,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectSize,
  SelectSlots,
  SelectStatus,
  SelectValue,
  SelectVariant,
} from './select';
// ---------------------------------------------------------------------------
// Select —— 下拉选择器（rc-select 1.10.1 内核的 Vue 自建：值语义 + 交互外壳 +
// 选择器 DOM + 虚拟列表 + Trigger）。`Select.Option` / `Select.OptGroup` deprecated
// 但导出；`_InternalPanelDoNotUseOrYouWillBeFired` 对应 SelectPurePanel。
// ---------------------------------------------------------------------------
export { default as Select, SelectOptGroup, SelectOption, SelectPurePanel } from './select';
export { genSelectStyle, genSelectTokenDecls } from './select/style';
export type { ComponentToken as SelectComponentToken } from './select/style/token';
export { prepareComponentToken as prepareSelectComponentToken } from './select/style/token';
// ---------------------------------------------------------------------------
// Splitter —— 分割面板（引擎 hooks 自建于 hooks/；ResizeObserver 复用 utils）
//
// ⚠️ 样式已注册进 `COMPONENT_STYLES`；Component Token **4** 个（常量默认值，
//    构建期解析值，见 style/token.ts 文件头）。复合组件 `Splitter.Panel`；
//    事件五件套 C19 映射（resize-start/resize/resize-end/collapse/
//    dragger-double-click）；语义槽 {root,panel,dragger}（dragger 支持 string 展平）。
// ---------------------------------------------------------------------------
export type {
  PanelCollapsible,
  ShowCollapsibleIconMode,
  SplitterCollapsibleIcon,
  SplitterDraggerClassNames,
  SplitterDraggerStyles,
  SplitterPanelProps,
  SplitterProps,
  SplitterRef,
  SplitterSemanticClassNames,
  SplitterSemanticStyles,
} from './splitter';
export { Splitter, SplitterPanel } from './splitter';
export { genSplitterStyle, genTokenDecls as genSplitterTokenDecls } from './splitter/style';
export type {
  StepItem,
  StepsIconRenderSlotProps,
  StepsItemRenderSlotProps,
  StepsItemWrapperRenderSlotProps,
  StepsOrientation,
  StepsProgressDotSlotProps,
  StepsProps,
  StepsRenderInfo,
  StepsSemanticClassNames,
  StepsSemanticName,
  StepsSemanticStyles,
  StepsSize,
  StepsStatus,
  StepsType,
  StepsVariant,
} from './steps';
// ---------------------------------------------------------------------------
// Steps —— 步骤条（rc-steps 1.2.3 内核自建 + antd 壳；C8-R2：render fn → scoped slot）
// ---------------------------------------------------------------------------
export { Steps } from './steps';
export type { ComponentToken as StepsComponentToken } from './steps/style/token';
export { prepareStepsComponentToken, stepsTokenValues } from './steps/style/token';
export type {
  ColumnFilterItem as TableColumnFilterItem,
  ColumnGroupType as TableColumnGroupType,
  ColumnSorter as TableColumnSorter,
  ColumnsType as TableColumnsType,
  ColumnTitle as TableColumnTitle,
  ColumnTitleProps as TableColumnTitleProps,
  ColumnType as TableColumnInterface,
  CompareFn as TableCompareFn,
  ExpandableConfig as TableExpandableConfig,
  ExpandType as TableExpandType,
  FilterConfirmProps as TableFilterConfirmProps,
  FilterDropdownProps as TableFilterDropdownProps,
  FilterResetProps as TableFilterResetProps,
  FilterSearchType as TableFilterSearchType,
  FilterValue as TableFilterValue,
  GetPopupContainer as TableGetPopupContainer,
  GetRowKey as TableGetRowKey,
  RenderExpandIcon as TableRenderExpandIcon,
  RowClassName as TableRowClassName,
  RowSelectionType as TableRowSelectionType,
  RowSelectMethod as TableRowSelectMethod,
  SelectionItem as TableSelectionItem,
  SelectionItemSelectFn as TableSelectionItemSelectFn,
  SelectionSelectFn as TableSelectionSelectFn,
  SorterResult as TableSorterResult,
  SorterTooltipProps as TableSorterTooltipProps,
  SorterTooltipTarget as TableSorterTooltipTarget,
  SortOrder as TableSortOrder,
  TableAction,
  TableComponents,
  TableCurrentDataSource,
  TableKey,
  TableLocale,
  TablePaginationConfig,
  TablePaginationPlacement,
  TablePaginationPosition,
  TableProps,
  TableRowSelection,
  TableScrollConfig,
  TableSemanticClassNames,
  TableSemanticStyles,
  TableSticky,
} from './table';
// ---------------------------------------------------------------------------
// Table —— 表格（XL：引擎 + antd 壳两层，分片交付）
// ---------------------------------------------------------------------------
export {
  EXPAND_COLUMN,
  getColumnKey as getTableColumnKey,
  renderColumnTitle as renderTableColumnTitle,
  SELECTION_ALL,
  SELECTION_INVERT,
  SELECTION_NONE,
  Summary,
  Table,
  TableSELECTION_COLUMN as SELECTION_COLUMN,
} from './table';
export { genTableStyle, genTableTokenDecls } from './table/style';
// ---------------------------------------------------------------------------
// Tabs —— 标签页（rc-tabs 内核的 Vue 等价物）
//
// G4 起样式导出也在本块内（genTabsStyle / genTabsTokenDecls / prepareTabsComponentToken）。
// ---------------------------------------------------------------------------
export type {
  GetIndicatorSize,
  TabPlacement,
  TabPosition,
  TabsConfig,
  TabsEditAction,
  TabsEditableConfig,
  TabsEditEvent,
  TabsEmits,
  TabsExtraContent,
  TabsIndicator,
  TabsItem,
  TabsLocale,
  TabsMorePopupInfo,
  TabsMoreProps,
  TabsProps,
  TabsRef,
  TabsRenderTabBarProps,
  TabsSemanticAllType,
  TabsSemanticClassNames,
  TabsSemanticStyles,
  TabsSemanticValue,
  TabsSlots,
  TabsType,
} from './tabs';
export { Tabs } from './tabs';
export { genTabsStyle, genTokenDecls as genTabsTokenDecls } from './tabs/style';
export type { ComponentToken as TabsComponentToken } from './tabs/style/token';
export { prepareComponentToken as prepareTabsComponentToken } from './tabs/style/token';
// ---------------------------------------------------------------------------
// TimePicker —— 时间选择（🚨 它是 `DatePicker` 的**薄壳**：零自有样式）
//
// ⚠️ 类名前缀与 DOM 全部来自 `date-picker`（`apollo-picker`）—— 本组件**没有** `style/`，
//    也**没有** Component Token（`tokenStatus` / `styleStatus` 在 registry 里是 `n/a`）。
//    🚨 它读的 `ConfigProvider` 配置是 **`timePicker`**（不是 `datePicker`）——
//    判据是内层的 `pickerType` 由**入口组件名**决定，不是由 `picker` 模式决定。
//    ⚠️ `TimePicker.RangePicker` 的废弃告警**比单个多**（`bordered` / `popupClassName` /
//    `popupStyle` 在单个上被外层吞掉、在范围上原样透传）。
// ---------------------------------------------------------------------------
export type {
  TimeNoUndefinedRangeValue,
  TimePickerCellRenderInfo,
  TimePickerEmits,
  TimePickerExpose,
  TimePickerLocale,
  TimePickerPopupSemanticClassNames,
  TimePickerPopupSemanticStyles,
  TimePickerProps,
  TimePickerSemanticClassNames,
  TimePickerSemanticStyles,
  TimePickerSemanticValue,
  TimePickerSlots,
  TimePickerValue,
  TimePickerValueDate,
  TimeRangePickerEmits,
  TimeRangePickerExpose,
  TimeRangePickerProps,
  TimeRangePickerSlots,
  TimeRangeValue,
  TimeRangeValueDate,
} from './time-picker';
export { TimePicker, TimePickerWithRange, TimeRangePicker } from './time-picker';
// ---------------------------------------------------------------------------
// Timeline —— 时间轴（🚨 它是 `Steps` 的**薄壳**：没有自己的 DOM）
//
// ⚠️ 类名前缀 `apollo-timeline`；**6 个 Component Token**，但产物 css-var 块只有 **4 条**
//    —— `dotSize` / `dotBg` 上游刻意不声明（`prepareComponentToken` 返回 `undefined`，
//    保住 `var(custom, origin)` 的两层回退链）。
//    ⚠️ 组件实现是 **`.ts`**（不是 `.vue`）：它没有自己的 DOM，模板价值为零。
//    ⚠️ `Timeline.Item` 是**空壳**（上游同判）—— 只为「用了就发废弃告警」而存在。
// ---------------------------------------------------------------------------
export type {
  ItemPlacement,
  ItemPosition,
  TimelineColor,
  TimelineConfig,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineRef,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSlot,
  UseItemsContext,
} from './timeline';
export { Timeline, TimelineItemComponent, useItems } from './timeline';
export { genTimelineStyle, genTokenDecls as genTimelineTokenDecls } from './timeline/style';
export type { ComponentToken as TimelineComponentToken } from './timeline/style/token';
export { prepareComponentToken as prepareTimelineComponentToken } from './timeline/style/token';
export type {
  AdjustOverflow,
  TooltipArrow,
  TooltipClassNames,
  TooltipContent,
  TooltipPlacement,
  TooltipProps,
  TooltipRef,
  TooltipSemanticType,
  TooltipStyles,
} from './tooltip';
export { Tooltip, TooltipPurePanel } from './tooltip';
export { genTooltipStyle, genTooltipTokenDecls } from './tooltip/style';
export type { ComponentToken as TooltipComponentToken } from './tooltip/style/token';
export { prepareComponentToken as prepareTooltipComponentToken } from './tooltip/style/token';
// ---------------------------------------------------------------------------
// Tour —— 引导遮罩（rc-tour 2.4.0 内核自建 + antd 自研 Panel；C8-R2：
// title/description/cover/按钮文案 slot 优先；v-model:open/current 与
// change/close/finish 同发（C11））
// ---------------------------------------------------------------------------
export type {
  TourAnimatedConfig,
  TourArrowConfig,
  TourButtonProps,
  TourClosableConfig,
  TourEmits,
  TourGap,
  TourLocale,
  TourMaskConfig,
  TourPlacement,
  TourProps,
  TourPurePanelProps,
  TourSemanticAllType,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSemanticType,
  TourSemanticValue,
  TourSlots,
  TourStepProps,
  TourType,
} from './tour';
export { Tour, TourPurePanel } from './tour';
export { genTourStyle, genTourTokenDecls } from './tour/style';
export type { ComponentToken as TourComponentToken } from './tour/style/token';
export {
  prepareComponentToken as prepareTourComponentToken,
  tourTokenValues,
} from './tour/style/token';
export type {
  PaginationType as TransferPaginationType,
  RenderResult as TransferRenderResult,
  SelectAllLabelRender as TransferSelectAllLabel,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferListBodyProps,
  TransferLocale,
  TransferProps,
  TransferSemanticClassNames,
  TransferSemanticStyles,
} from './transfer';
export { Transfer, TransferList, TransferOperation, TransferSearch } from './transfer';
export { genTokenDecls as genTransferTokenDecls, genTransferStyle } from './transfer/style';
export type { ComponentToken as TransferComponentToken } from './transfer/style/token';
export { prepareComponentToken as prepareTransferComponentToken } from './transfer/style/token';
// ---------------------------------------------------------------------------
// Tree —— 树形控件（rc-tree 1.4.0 内核自建；四键 v-model 双发 C11；
// DirectoryTree shift/ctrl 范围多选；TreeNode children 形态 v6 deprecated 不实现）
// ---------------------------------------------------------------------------
export type {
  DirectoryTreeProps,
  TreeAllowDrop,
  TreeAllowDropOptions,
  TreeCheckedKeys,
  TreeCheckInfo,
  TreeDataEntity,
  TreeDragEnterEventInfo,
  TreeDragEventInfo,
  TreeDraggable,
  TreeDraggableConfig,
  TreeDropEventInfo,
  TreeEmits,
  TreeExpandAction,
  TreeExpandEventInfo,
  TreeFieldNames,
  TreeIconType,
  TreeKey,
  TreeLoadEventInfo,
  TreeProps,
  TreeRef,
  TreeScrollConfig,
  TreeSelectEventInfo,
  TreeSemanticClassNames,
  TreeSemanticStyles,
  TreeSemanticValue,
  TreeSlots,
} from './tree';
export { DirectoryTree, Tree } from './tree';
export { genTreeStyle, genTreeTokenDecls } from './tree/style';
export type { ComponentToken as TreeComponentToken } from './tree/style/token';
export { prepareComponentToken as prepareTreeComponentToken } from './tree/style/token';
// TreeSelect —— 树选择（BaseSelect 外壳 + 树型 OptionList；勾选级联 conductCheck
// 在本层算，内嵌树恒 checkStrictly；SHOW_* 静态属性；TreeNode children 不实现）
export type {
  ChangeEventExtra as TreeSelectChangeEventExtra,
  LabeledValueType as TreeSelectLabeledValueType,
  SimpleModeConfig as TreeSelectSimpleModeConfig,
  TreeSelectDataNode,
  TreeSelectValue,
} from './tree-select';
export { SHOW_ALL, SHOW_CHILD, SHOW_PARENT, TreeSelect } from './tree-select';
// ---------------------------------------------------------------------------
// Upload —— 上传（引擎自建于 engine/：AjaxUploader + XHR 请求器 + 目录递归）
//
// ⚠️ 样式已注册进 COMPONENT_STYLES；Component Token 2 个（actions-color /
//    picture-card-size）。v-model:fileList 与 onChange 双通道（C11）；
//    Progress/Tooltip 未落地 —— ListItem 内联 MiniProgress（P1）+ 原生 title
//    （P2），progress/tooltip 落地后替换（D 登记）。
// ---------------------------------------------------------------------------
export type {
  HttpRequestHeader,
  InternalUploadFile,
  ItemRender,
  ShowUploadListInterface,
  UploadChangeParam,
  UploadFile,
  UploadFileStatus,
  UploadListProgressProps,
  UploadListType,
  UploadLocale,
  UploadProps,
  UploadType,
} from './upload';
export { LIST_IGNORE, Upload, UploadDragger } from './upload';
export { genTokenDecls as genUploadTokenDecls, genUploadStyle } from './upload/style';
export type { ComponentToken as UploadComponentToken } from './upload/style/token';
export { prepareComponentToken as prepareUploadComponentToken } from './upload/style/token';
// ---------------------------------------------------------------------------
// Watermark —— 水印
//
// ⚠️ 无样式表（全内联 style + canvas）—— 不注册 COMPONENT_STYLES、无 Component
//    Token；运行时 token（zIndexPopupBase/colorFill/fontSizeLG）经 useToken 取实值。
// ---------------------------------------------------------------------------
export type {
  WatermarkContent,
  WatermarkFont,
  WatermarkProps,
  WatermarkRef,
  WatermarkText,
} from './watermark';
export { Watermark } from './watermark';
