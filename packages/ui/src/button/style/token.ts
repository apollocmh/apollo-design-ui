/**
 * Existing Button tokens: 45 explicit fields and 13 preset shadow colours.
 * prepareComponentToken derives every default from the current source theme.
 * Button projects scoped values as static CSS variables; explicit foreground
 * overrides remain authoritative and native CSS supplies automatic contrast.
 * The complete consumption inventory is recorded in the Button contract audit.
 */

import {
  type AliasToken,
  getAlphaColor,
  getLineHeight,
  type PresetColorKey,
} from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

/** 13 个预设色派生的阴影色。antd 里它属于 `ButtonToken`，不在 `ComponentToken` 内。 */
export type PresetShadowColorToken = {
  [K in PresetColorKey as `${K}ShadowColor`]: string;
};

/** Existing public fields; runtime defaults are complete. */
export interface ComponentToken {
  /** @desc 文字字重 @descEN Font weight of text */
  fontWeight: CSSProperties['fontWeight'];
  /** @desc 图标文字间距 @descEN Gap between icon and text */
  iconGap: CSSProperties['gap'];
  /** @desc 默认按钮阴影 @descEN Shadow of default button */
  defaultShadow: string;
  /** @desc 主要按钮阴影 @descEN Shadow of primary button */
  primaryShadow: string;
  /** @desc 危险按钮阴影 @descEN Shadow of danger button */
  dangerShadow: string;
  /** @desc 主要按钮文本颜色 @descEN Text color of primary button */
  primaryColor: string;
  /** @desc 默认按钮文本颜色 @descEN Text color of default button */
  defaultColor: string;
  /** @desc 默认按钮背景色 @descEN Background color of default button */
  defaultBg: string;
  /** @desc 默认按钮边框颜色 @descEN Border color of default button */
  defaultBorderColor: string;
  /** @desc 危险按钮文本颜色 @descEN Text color of danger button */
  dangerColor: string;
  /** @desc 默认按钮悬浮态背景色 @descEN Background color of default button when hover */
  defaultHoverBg: string;
  /** @desc 默认按钮悬浮态文本颜色 @descEN Text color of default button when hover */
  defaultHoverColor: string;
  /** @desc 默认按钮悬浮态边框颜色 @descEN Border color of default button when hover */
  defaultHoverBorderColor: string;
  /** @desc 默认按钮激活态背景色 @descEN Background color of default button when active */
  defaultActiveBg: string;
  /** @desc 默认按钮激活态文字颜色 @descEN Text color of default button when active */
  defaultActiveColor: string;
  /** @desc 默认按钮激活态边框颜色 @descEN Border color of default button when active */
  defaultActiveBorderColor: string;
  /** @desc 禁用状态边框颜色 @descEN Border color of disabled button */
  borderColorDisabled: string;
  /**
   * 禁用态（default）的边框色。`token.js:63` 返回它，但**没有**写进 antd 的
   * `ComponentToken` 接口；当前也没有样式消费它（disabled 走 `colorBorderDisabled`）。
   * 保留是为了让返回值与上游逐键对齐。
   */
  defaultBorderColorDisabled: string;
  /**
   * 按钮组的分隔线颜色。`token.js:54` 返回它，同样没写进 antd 的接口，
   * 但 `style/group.js` 会消费 ⇒ 必须保留。
   */
  groupBorderColor: string;
  /** @desc 默认幽灵按钮文本颜色 @descEN Text color of default ghost button */
  defaultGhostColor: string;
  /** @desc 幽灵按钮背景色 @descEN Background color of ghost button */
  ghostBg: string;
  /** @desc 默认幽灵按钮边框颜色 @descEN Border color of default ghost button */
  defaultGhostBorderColor: string;
  /**
   * @desc 默认实心按钮的文本色
   * @descEN Default text color for solid buttons
   *
   * ⚠️ 见文件头的「缺口 1」：依赖 color-picker 的 `isBright`，本仓库无等价能力。
   */
  solidTextColor?: string;
  /** @desc 默认文本按钮的文本色 @descEN Default text color for text buttons */
  textTextColor: string;
  /** @desc 默认文本按钮悬浮态文本颜色 @descEN Default text color for text buttons on hover */
  textTextHoverColor: string;
  /** @desc 默认文本按钮激活态文字颜色 @descEN Default text color for text buttons on active */
  textTextActiveColor: string;
  /** @desc 按钮横向内间距 @descEN Horizontal padding of button */
  paddingInline: CSSProperties['paddingInline'];
  /** @desc 大号按钮横向内间距 @descEN Horizontal padding of large button */
  paddingInlineLG: CSSProperties['paddingInline'];
  /** @desc 小号按钮横向内间距 @descEN Horizontal padding of small button */
  paddingInlineSM: CSSProperties['paddingInline'];
  /** @desc 按钮纵向内间距 @descEN Vertical padding of button */
  paddingBlock: CSSProperties['paddingBlock'];
  /** @desc 大号按钮纵向内间距 @descEN Vertical padding of large button */
  paddingBlockLG: CSSProperties['paddingBlock'];
  /** @desc 小号按钮纵向内间距 @descEN Vertical padding of small button */
  paddingBlockSM: CSSProperties['paddingBlock'];
  /** @desc 只有图标的按钮图标尺寸 @descEN Icon size of button which only contains icon */
  onlyIconSize: number | string;
  /** @desc 大号只有图标的按钮图标尺寸 @descEN Icon size of large button which only contains icon */
  onlyIconSizeLG: number | string;
  /** @desc 小号只有图标的按钮图标尺寸 @descEN Icon size of small button which only contains icon */
  onlyIconSizeSM: number | string;
  /** @desc 链接按钮悬浮态背景色 @descEN Background color of link button when hover */
  linkHoverBg: string;
  /** @desc 文本按钮悬浮态背景色 @descEN Background color of text button when hover */
  textHoverBg: string;
  /** @desc 按钮内容字体大小 @descEN Font size of button content */
  contentFontSize: number;
  /** @desc 大号按钮内容字体大小 @descEN Font size of large button content */
  contentFontSizeLG: number;
  /** @desc 小号按钮内容字体大小 @descEN Font size of small button content */
  contentFontSizeSM: number;
  /** @desc 按钮内容字体行高 @descEN Line height of button content */
  contentLineHeight: number;
  /** @desc 大号按钮内容字体行高 @descEN Line height of large button content */
  contentLineHeightLG: number;
  /** @desc 小号按钮内容字体行高 @descEN Line height of small button content */
  contentLineHeightSM: number;
  /** @desc type='default' 禁用状态下的背景颜色 @descEN background color when type='default' is disabled */
  defaultBgDisabled: string;
  /** @desc type='dashed' 禁用状态下的背景颜色 @descEN background color when type='dashed' is disabled */
  dashedBgDisabled: string;
}

/**
 * `prepareComponentToken` 的入参：别名 token + 用户可能覆盖的组件 token。
 *
 * antd 的 `prepareComponentToken(token)` 里读的 `token.contentFontSize` 就是
 * 「用户在 `theme.components.Button` 里给的覆盖值」，没有时才回落到别名 token。
 * 所以入参必须带上这三个键的可选形态，否则那段 `??` 语义会丢。
 */
export type ButtonTokenInput = AliasToken &
  Partial<Pick<ComponentToken, 'contentFontSize' | 'contentFontSizeSM' | 'contentFontSizeLG'>>;

/**
 * 由别名 token 派生 Button 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken`（`token.js:21-83`）**逐条对应**，唯一的例外是
 * `solidTextColor`（缺口 1，见文件头）。
 */
export function prepareComponentToken(
  token: ButtonTokenInput,
): Required<ComponentToken> & PresetShadowColorToken {
  const font = (value: number | undefined, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
  const contentFontSize = font(token.contentFontSize, token.fontSize);
  const contentFontSizeSM = font(token.contentFontSizeSM, token.fontSize);
  const contentFontSizeLG = font(token.contentFontSizeLG, token.fontSizeLG);
  const lineHeight = (size: number): number =>
    size === 0 ? token.lineHeight : getLineHeight(size);
  const contentLineHeight = lineHeight(contentFontSize);
  const contentLineHeightSM = lineHeight(contentFontSizeSM);
  const contentLineHeightLG = lineHeight(contentFontSizeLG);

  const shadow = (color: PresetColorKey): string =>
    `0 ${token.controlOutlineWidth}px 0 ${getAlphaColor(token[`${color}1`], token.colorBgContainer)}`;
  const defaultBgDisabled = token.colorBgContainerDisabled;
  const dashedBgDisabled = token.colorBgContainerDisabled;

  return {
    blueShadowColor: shadow('blue'),
    purpleShadowColor: shadow('purple'),
    cyanShadowColor: shadow('cyan'),
    greenShadowColor: shadow('green'),
    magentaShadowColor: shadow('magenta'),
    pinkShadowColor: shadow('pink'),
    redShadowColor: shadow('red'),
    orangeShadowColor: shadow('orange'),
    yellowShadowColor: shadow('yellow'),
    volcanoShadowColor: shadow('volcano'),
    geekblueShadowColor: shadow('geekblue'),
    limeShadowColor: shadow('lime'),
    goldShadowColor: shadow('gold'),
    fontWeight: 400,
    iconGap: token.marginXS,
    defaultShadow: `0 ${token.controlOutlineWidth}px 0 ${token.controlTmpOutline}`,
    primaryShadow: `0 ${token.controlOutlineWidth}px 0 ${token.controlOutline}`,
    dangerShadow: `0 ${token.controlOutlineWidth}px 0 ${token.colorErrorOutline}`,
    primaryColor: token.colorTextLightSolid,
    solidTextColor: token.colorTextLightSolid,
    dangerColor: token.colorTextLightSolid,
    borderColorDisabled: token.colorBorderDisabled,
    defaultGhostColor: token.colorBgContainer,
    ghostBg: 'transparent',
    defaultGhostBorderColor: token.colorBgContainer,
    paddingInline: token.paddingContentHorizontal - token.lineWidth,
    paddingInlineLG: token.paddingContentHorizontal - token.lineWidth,
    // ⚠️ 这里的 `8` 是上游字面量（`token.js:50`），不是某个别名 token
    paddingInlineSM: 8 - token.lineWidth,
    onlyIconSize: 'inherit',
    onlyIconSizeSM: 'inherit',
    onlyIconSizeLG: 'inherit',
    groupBorderColor: token.colorPrimaryHover,
    linkHoverBg: 'transparent',
    textTextColor: token.colorText,
    textTextHoverColor: token.colorText,
    textTextActiveColor: token.colorText,
    textHoverBg: token.colorFillTertiary,
    defaultColor: token.colorText,
    defaultBg: token.colorBgContainer,
    defaultBorderColor: token.colorBorder,
    defaultBorderColorDisabled: token.colorBorderDisabled,
    defaultHoverBg: token.colorBgContainer,
    defaultHoverColor: token.colorPrimaryHover,
    defaultHoverBorderColor: token.colorPrimaryHover,
    defaultActiveBg: token.colorBgContainer,
    defaultActiveColor: token.colorPrimaryActive,
    defaultActiveBorderColor: token.colorPrimaryActive,
    contentFontSize,
    contentFontSizeSM,
    contentFontSizeLG,
    contentLineHeight,
    contentLineHeightSM,
    contentLineHeightLG,
    paddingBlock: Math.max(
      (token.controlHeight - contentFontSize * contentLineHeight) / 2 - token.lineWidth,
      0,
    ),
    paddingBlockSM: Math.max(
      (token.controlHeightSM - contentFontSizeSM * contentLineHeightSM) / 2 - token.lineWidth,
      0,
    ),
    paddingBlockLG: Math.max(
      (token.controlHeightLG - contentFontSizeLG * contentLineHeightLG) / 2 - token.lineWidth,
      0,
    ),
    defaultBgDisabled,
    dashedBgDisabled,
  };
}
