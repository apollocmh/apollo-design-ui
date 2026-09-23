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
