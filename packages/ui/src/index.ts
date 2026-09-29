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
// ⚠️ G2 阶段只落**类型面**；样式导出（genPaginationStyle / preparePaginationComponentToken）
//    留给 G4 补在本块末尾。
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
