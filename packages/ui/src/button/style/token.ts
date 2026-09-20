/**
 * Button 的 Component Token。
 *
 * 契约来源：antd 6.6.4 `es/button/style/token.js` 的 `prepareComponentToken` 与
 * `es/button/style/token.d.ts` 的 `ComponentToken`。**名称、数量、默认值算法逐条对齐**。
 *
 * ── 数量（读 `token.d.ts` 数出来的，不是估算） ──────────────────────────────────
 *
 * | 项 | 数量 | 说明 |
 * |---|---:|---|
 * | antd `ComponentToken` 接口字段 | **43** | `token.d.ts:4-231` |
 * | antd `prepareComponentToken` 返回的键 | **58** | 43 + 13 个 `${colorKey}ShadowColor` + 2 个「返回了但没写进接口」的键 |
 *
 * 那 2 个「返回了但没写进接口」的键是 `groupBorderColor`（`token.js:54`，`style/group.js`
 * 真的消费它）与 `defaultBorderColorDisabled`（`token.js:63`，目前无人消费）。
 * 本文件把它们**声明进接口** —— 否则 TS 会拒绝返回它们，而丢掉等于丢掉 `group` 的边框色。
 *
 * ── ⚠️ 缺口 1：`solidTextColor` 无法计算（未编造，如实登记） ──────────────────────
 *
 * antd 的算法是（`token.js:28`）：
 *
 * ```ts
 * const solidTextColor = isBright(new AggregationColor(token.colorBgSolid), '#fff') ? '#000' : '#fff';
 * ```
 *
 * `isBright` 与 `AggregationColor` 都来自 **color-picker**（`es/color-picker/components/ColorPresets`、
 * `es/color-picker/color`）。本仓库**未实现 color-picker**，且已 grep 确认：
 * `packages/utils/src/color/` 只有 `Color` / `generatePalette`，`packages/theme` 也没有
 * `isBright` / `AggregationColor` 的等价能力 ⇒ **没有等价实现**，不是"换个名字就有"。
 *
 ⇒ `prepareComponentToken` 的返回里**不含** `solidTextColor`（类型上它是可选的）。
 *    消费方 `style/index.ts` 对「default + solid」这条组合的落地方式见那里的注释。
 *
 * ── ⚠️ 缺口 2（不是缺口，是可解的）：13 个 `${colorKey}ShadowColor` ────────────────
 *
 * `token.js:29-32`：`0 ${controlOutlineWidth} 0 ${getAlphaColor(token[`${k}1`], token.colorBgContainer)}`。
 * `getAlphaColor` 本仓库**有**（`packages/theme/src/shared/get-alpha-color.ts`，与 antd 逐字同构），
 * `PresetColors` 也有（`packages/theme/src/seed.ts`）⇒ 可以在**拿到 token 对象**时算出来。
 * 所以 `prepareComponentToken` 完整返回这 13 个值。
 *
 * 但它们**不能**写成 `var(--apollo-*)`：`getAlphaColor` 是一个「反解不透明色」的
 * 迭代算法（O(100) 暴力搜索 alpha），CSS 里没有等价表达式。⇒ 由 `style/index.ts`
 * 在**构建期**把 `prepareComponentToken(getDesignToken())` 的结果内联进 CSS，
 * 代价是这 13 个阴影色不随 dark 主题自适应（差异 D7 家族，文档里登记）。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明 `solidTextColor` 的取值（那是缺口 1）。
 *   - 没证明视觉正确（L6 的逐像素比对负责）。
 */

import {
  type AliasToken,
  getAlphaColor,
  getLineHeight,
  type PresetColorKey,
  PresetColors,
} from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

/** 13 个预设色派生的阴影色。antd 里它属于 `ButtonToken`，不在 `ComponentToken` 内。 */
export type PresetShadowColorToken = {
  [K in PresetColorKey as `${K}ShadowColor`]: string;
};

/**
 * Button 的 Component Token。
 *
 * 与 antd 的 `ComponentToken` 逐字段对齐；注释里的 `@desc` / `@descEN` 与 antd 同构
 * （文档表格由它们生成）。
 *
 * ⚠️ `solidTextColor` 是本项目唯一**无法**给出默认值的字段（缺口 1），
 *    因此它在 `prepareComponentToken` 的返回里缺省 —— 类型上标成可选以让这一点显式。
 */
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
): Partial<ComponentToken> & PresetShadowColorToken {
  const contentFontSize = token.contentFontSize ?? token.fontSize;
  const contentFontSizeSM = token.contentFontSizeSM ?? token.fontSize;
  // ⚠️ 大号回落的是 `fontSizeLG`，不是 `fontSize`（`token.js:24`）
  const contentFontSizeLG = token.contentFontSizeLG ?? token.fontSizeLG;
  const contentLineHeight = getLineHeight(contentFontSize);
  const contentLineHeightSM = getLineHeight(contentFontSizeSM);
  const contentLineHeightLG = getLineHeight(contentFontSizeLG);

  // antd 这里写的是 `PresetColors.reduce((prev, k) => ({...prev, ...}))`；
  // 我们改成循环 —— 语义相同，但避开 accumulator 上的展开（biome noAccumulatingSpread）。
  const shadowColorTokens = {} as PresetShadowColorToken;
  for (const colorKey of PresetColors) {
    shadowColorTokens[`${colorKey}ShadowColor`] =
      `0 ${token.controlOutlineWidth}px 0 ${getAlphaColor(token[`${colorKey}1`], token.colorBgContainer)}`;
  }

  const defaultBgDisabled = token.colorBgContainerDisabled;
  const dashedBgDisabled = token.colorBgContainerDisabled;

  return {
    ...shadowColorTokens,
    fontWeight: 400,
    iconGap: token.marginXS,
    defaultShadow: `0 ${token.controlOutlineWidth}px 0 ${token.controlTmpOutline}`,
    primaryShadow: `0 ${token.controlOutlineWidth}px 0 ${token.controlOutline}`,
    dangerShadow: `0 ${token.controlOutlineWidth}px 0 ${token.colorErrorOutline}`,
    primaryColor: token.colorTextLightSolid,
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
    defaultBorderColorDisabled: token.colorBorder,
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
