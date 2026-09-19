/**
 * @apollo-design/theme — Token 类型
 *
 * 命名与字段集合必须与 antd 6.6.4 完全一致（这是 L1/L2 兼容性契约的一部分）：
 *   Seed(34，不含 13 个预设色) → Map(140) → Alias(82 own) → Component(70 组)
 * 数字来自 registry/tokens.json（由 antd 产物提取），不是估算。
 *
 * 类型是「重新定义」而非复制：antd 的类型文件带大量 JSDoc，逐字搬运会让我们
 * 在自己的注释里说别人的话。这里只保留契约本身（名称 + 类型），
 * 语义说明写在我们自己的文档中。
 */

/** antd 的 13 个预设色。pink 是 magenta 的废弃别名，值相同。 */
export type PresetColorKey =
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'volcano'
  | 'geekblue'
  | 'lime'
  | 'gold';

export type PresetColorType = Record<PresetColorKey, string>;

/**
 * 预设色板展开后的键：`blue-1`…`blue-10` 与 `blue1`…`blue10`。
 * 两种写法 antd 都产出，且值相同（历史兼容）。
 */
export type PresetColorPalettes = {
  [K in PresetColorKey as `${K}-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`]: string;
} & {
  [K in PresetColorKey as `${K}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`]: string;
};

/** 色板梯度：1 最浅 → 10 最深（antd 用的是 1-based，不是 0-based） */
export type ColorPalette = Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, string>;

// ---------------------------------------------------------------------------
// L0 Seed
// ---------------------------------------------------------------------------

export interface SeedToken extends PresetColorType {
  // 语义色
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;
  colorLink: string;
  colorTextBase: string;
  colorBgBase: string;

  // 字体
  fontFamily: string;
  fontFamilyCode: string;
  fontSize: number;

  // 线
  lineWidth: number;
  lineType: string;

  // 圆角
  borderRadius: number;
  /**
   * 完美圆的圆角值（`'100%'`）。是几何常量，不是视觉设计值 —— `1em × 1em` 的方块
   * 套这个值会渲染成圆。给 `borderRadiusCircle` 留一个变量是组件层去掉硬编码 `100%`
   * 的最小代价；它不在 design-system 调色板上，主题切换也不会改它。
   */
  borderRadiusCircle: string;

  // 尺寸
  sizeUnit: number;
  sizeStep: number;
  sizePopupArrow: number;
  controlHeight: number;

  // 层级
  zIndexBase: number;
  zIndexPopupBase: number;
  opacityImage: number;

  // 动效
  motionUnit: number;
  motionBase: number;
  motionEaseOutCirc: string;
  motionEaseInOutCirc: string;
  motionEaseOut: string;
  motionEaseInOut: string;
  motionEaseOutBack: string;
  motionEaseInBack: string;
  motionEaseInQuint: string;
  motionEaseOutQuint: string;

  // 开关
  wireframe: boolean;
  focusOutline: boolean;
  motion: boolean;
}

// ---------------------------------------------------------------------------
// L1 Map
// ---------------------------------------------------------------------------

/** 中性色 + 功能色梯度。由 genColorMapToken 产出。 */
export interface ColorNeutralMapToken {
  colorBgBase: string;
  colorTextBase: string;
  colorShadow: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextTertiary: string;
  colorTextQuaternary: string;
  colorFill: string;
  colorFillSecondary: string;
  colorFillTertiary: string;
  colorFillQuaternary: string;
  colorBgSolid: string;
  colorBgSolidHover: string;
  colorBgSolidActive: string;
  colorBgLayout: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorBgSpotlight: string;
  colorBgBlur: string;
  colorBorder: string;
  colorBorderDisabled: string;
  colorBorderSecondary: string;
}

/** 功能色（primary / success / warning / error / info / link）的 11 档梯度 */
export interface FunctionalColorMapToken {
  colorPrimaryBg: string;
  colorPrimaryBgHover: string;
  colorPrimaryBorder: string;
  colorPrimaryBorderHover: string;
  colorPrimaryHover: string;
  colorPrimary: string;
  colorPrimaryActive: string;
  colorPrimaryTextHover: string;
  colorPrimaryText: string;
  colorPrimaryTextActive: string;

  colorSuccessBg: string;
  colorSuccessBgHover: string;
  colorSuccessBorder: string;
  colorSuccessBorderHover: string;
  colorSuccessHover: string;
  colorSuccess: string;
  colorSuccessActive: string;
  colorSuccessTextHover: string;
  colorSuccessText: string;
  colorSuccessTextActive: string;

  colorErrorBg: string;
  colorErrorBgHover: string;
  colorErrorBgFilledHover: string;
  colorErrorBgActive: string;
  colorErrorBorder: string;
  colorErrorBorderHover: string;
  colorErrorHover: string;
  colorError: string;
  colorErrorActive: string;
  colorErrorTextHover: string;
  colorErrorText: string;
  colorErrorTextActive: string;

  colorWarningBg: string;
  colorWarningBgHover: string;
  colorWarningBorder: string;
  colorWarningBorderHover: string;
  colorWarningHover: string;
  colorWarning: string;
  colorWarningActive: string;
  colorWarningTextHover: string;
  colorWarningText: string;
  colorWarningTextActive: string;

  colorInfoBg: string;
  colorInfoBgHover: string;
  colorInfoBorder: string;
  colorInfoBorderHover: string;
  colorInfoHover: string;
  colorInfo: string;
  colorInfoActive: string;
  colorInfoTextHover: string;
  colorInfoText: string;
  colorInfoTextActive: string;

  colorLinkHover: string;
  colorLink: string;
  colorLinkActive: string;

  colorBgMask: string;
  colorWhite: string;
}

/** 每个预设色派生的 Hover / Active 两档 */
export type PresetColorMapToken = {
  [K in PresetColorKey as `${K}Hover`]: string;
} & {
  [K in PresetColorKey as `${K}Active`]: string;
};

export type ColorMapToken = ColorNeutralMapToken & FunctionalColorMapToken & PresetColorMapToken;

export interface FontMapToken {
  fontSizeSM: number;
  fontSize: number;
  fontSizeLG: number;
  fontSizeXL: number;
  fontSizeHeading1: number;
  fontSizeHeading2: number;
  fontSizeHeading3: number;
  fontSizeHeading4: number;
  fontSizeHeading5: number;
  lineHeight: number;
  lineHeightLG: number;
  lineHeightSM: number;
  fontHeight: number;
  fontHeightLG: number;
  fontHeightSM: number;
  lineHeightHeading1: number;
  lineHeightHeading2: number;
  lineHeightHeading3: number;
  lineHeightHeading4: number;
  lineHeightHeading5: number;
}

export interface SizeMapToken {
  sizeXXL: number;
  sizeXL: number;
  sizeLG: number;
  sizeMD: number;
  sizeMS: number;
  size: number;
  sizeSM: number;
  sizeXS: number;
  sizeXXS: number;
}

export interface HeightMapToken {
  controlHeight: number;
  controlHeightSM: number;
  controlHeightXS: number;
  controlHeightLG: number;
}

export interface StyleMapToken {
  lineWidthBold: number;
  borderRadiusXS: number;
  borderRadiusSM: number;
  borderRadius: number;
  borderRadiusLG: number;
  borderRadiusOuter: number;
  borderRadiusCircle: string;
}

export interface CommonMapToken {
  motionDurationFast: string;
  motionDurationMid: string;
  motionDurationSlow: string;
}

export type MapToken = SeedToken &
  ColorMapToken &
  FontMapToken &
  SizeMapToken &
  HeightMapToken &
  StyleMapToken &
  CommonMapToken &
  PresetColorPalettes;

// ---------------------------------------------------------------------------
// L2 Alias（82 own）
// ---------------------------------------------------------------------------

export interface AliasToken extends MapToken {
  // 背景
  colorFillContent: string;
  colorFillContentHover: string;
  colorFillAlter: string;
  colorBgContainerDisabled: string;

  // 分割线
  colorBorderBg: string;
  colorSplit: string;

  // 文本
  colorTextPlaceholder: string;
  colorTextDisabled: string;
  colorTextHeading: string;
  colorTextLabel: string;
  colorTextDescription: string;
  colorTextLightSolid: string;
  colorHighlight: string;
  colorBgTextHover: string;
  colorBgTextActive: string;
  colorIcon: string;
  colorIconHover: string;
  colorErrorOutline: string;
  colorWarningOutline: string;
  colorErrorAffix: string;
  colorWarningAffix: string;

  // 字体
  fontSizeIcon: number;

  // 线
  lineWidthFocus: number;

  // 控件
  controlOutlineWidth: number;
  controlInteractiveSize: number;
  controlItemBgHover: string;
  controlItemBgActive: string;
  controlItemBgActiveHover: string;
  controlItemBgActiveDisabled: string;
  controlTmpOutline: string;
  controlOutline: string;
  fontWeightStrong: number;
  opacityLoading: number;
  linkDecoration: string;
  linkHoverDecoration: string;
  linkFocusDecoration: string;
  controlPaddingHorizontal: number;
  controlPaddingHorizontalSM: number;

  // 间距
  paddingXXS: number;
  paddingXS: number;
  paddingSM: number;
  padding: number;
  paddingMD: number;
  paddingLG: number;
  paddingXL: number;
  paddingContentHorizontalLG: number;
  paddingContentVerticalLG: number;
  paddingContentHorizontal: number;
  paddingContentVertical: number;
  paddingContentHorizontalSM: number;
  paddingContentVerticalSM: number;
  marginXXS: number;
  marginXS: number;
  marginSM: number;
  margin: number;
  marginMD: number;
  marginLG: number;
  marginXL: number;
  marginXXL: number;

  // 阴影
  boxShadow: string;
  boxShadowSecondary: string;
  boxShadowTertiary: string;
  boxShadowPopoverArrow: string;
  dropShadowPopover: string;
  boxShadowCard: string;
  boxShadowDrawerRight: string;
  boxShadowDrawerLeft: string;
  boxShadowDrawerUp: string;
  boxShadowDrawerDown: string;
  boxShadowTabsOverflowLeft: string;
  boxShadowTabsOverflowRight: string;
  boxShadowTabsOverflowTop: string;
  boxShadowTabsOverflowBottom: string;

  // 断点
  screenXS: number;
  screenXSMin: number;
  screenXSMax: number;
  screenSM: number;
  screenSMMin: number;
  screenSMMax: number;
  screenMD: number;
  screenMDMin: number;
  screenMDMax: number;
  screenLG: number;
  screenLGMin: number;
  screenLGMax: number;
  screenXL: number;
  screenXLMin: number;
  screenXLMax: number;
  screenXXL: number;
  screenXXLMin: number;
  screenXXLMax: number;
  screenXXXL: number;
  screenXXXLMin: number;
}

// ---------------------------------------------------------------------------
// L3 Component
// ---------------------------------------------------------------------------

/**
 * 组件 Token 的类型入口。
 *
 * antd 的组件 token **默认值分散在各组件自己的 style 里**（`components/<x>/style/index.ts`
 * 的 `prepareComponentToken`），`theme/interface/components.ts` 只做类型聚合。
 * 本包遵循同样的分工：这里只声明类型与合并机制，默认值由 `packages/ui` 逐组件提供 ——
 * 见本包 README 的「明确不做」。
 */
export type ComponentTokenMap = Record<string, Record<string, string | number>>;

// ---------------------------------------------------------------------------
// 算法与配置
// ---------------------------------------------------------------------------

/**
 * 派生算法。
 *
 * 第二个参数 `mapToken` 是**前一个算法的结果**（antd 的 `Theme.getDerivativeToken`
 * 用 `reduce` 串联）。为 `undefined` 时表示自己是链上的第一个，需要自己先跑 default。
 * 这个「可组合」语义是 antd 的契约，不能改成「每个算法都从 seed 重算」。
 */
export type MappingAlgorithm = (seed: SeedToken, mapToken?: MapToken) => MapToken;

export interface ThemeConfig {
  token?: Partial<SeedToken & Record<string, string | number | boolean>>;
  algorithm?: MappingAlgorithm | MappingAlgorithm[];
  /** CSS 变量前缀。默认 `apollo`（已裁决：prefix-cls-default = A）。 */
  cssVarPrefix?: string;
  /** 组件级 token 覆盖，键为组件名 */
  components?: ComponentTokenMap;
  /** antd 兼容开关：把前缀改回 `ant` */
  prefixCls?: string;
}

/** getDesignToken 的完整输出 */
export type GlobalToken = AliasToken;
