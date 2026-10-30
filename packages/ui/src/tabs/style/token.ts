/** Tabs component defaults and geometry, derived from the original rc-tabs reference. */
import { getDesignToken } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { toCssSize } from '../../_internal/to-css-size';

/** 数值 → `px` 串（静态 CSS 不给裸数字补单位）。 */
const px = (value: number): string => toCssSize(value) ?? `${value}px`;

/** The 24 component tokens consumed by the Tabs stylesheet. */
export interface ComponentToken {
  /** 下拉菜单 z-index（`zIndexPopupBase + 50`）。 */
  zIndexPopup: number;
  /** 卡片标签页背景色。 */
  cardBg: string;
  /** 卡片标签页高度（**合并后**：用户覆盖 ?? `controlHeightLG`）。 */
  cardHeight: number;
  /** 小尺寸卡片标签页高度。 */
  cardHeightSM: number;
  /** 大尺寸卡片标签页高度。 */
  cardHeightLG: number;
  /** 卡片标签页内间距。 */
  cardPadding: string;
  /** 小号卡片标签页内间距。 */
  cardPaddingSM: string;
  /** 大号卡片标签页内间距。 */
  cardPaddingLG: string;
  /** 标签页标题文本大小。 */
  titleFontSize: number;
  /** 大号标签页标题文本大小。 */
  titleFontSizeLG: number;
  /** 小号标签页标题文本大小。 */
  titleFontSizeSM: number;
  /** 指示条颜色。 */
  inkBarColor: string;
  /** 横向标签页外间距。 */
  horizontalMargin: string;
  /** 横向标签页标签间距（**固定 32**）。 */
  horizontalItemGutter: number;
  /** 横向标签页标签内间距。 */
  horizontalItemPadding: string;
  /** 大号横向标签页标签内间距。 */
  horizontalItemPaddingLG: string;
  /** 小号横向标签页标签内间距。 */
  horizontalItemPaddingSM: string;
  /** 纵向标签页标签内间距。 */
  verticalItemPadding: string;
  /** 纵向标签页标签外间距。 */
  verticalItemMargin: string;
  /** 标签文本颜色。 */
  itemColor: string;
  /** 标签激活态文字；默认复用当前背景的可读主色。 */
  itemActiveColor: string;
  /** 标签悬浮态文字；默认复用当前背景的可读主色。 */
  itemHoverColor: string;
  /** 标签选中态文字；默认复用当前背景的可读主色。 */
  itemSelectedColor: string;
  /** 卡片标签间距。 */
  cardGutter: number;
}

/**
 * `mergeToken` 注入的内部 token。
 *
 * ⚠️ 上游 `.d.ts` 的 `TabsToken` 还有第 7 个 `tabsNavWrapPseudoWidth`（见文件头）——
 *    6.6.4 里是死字段，刻意**不在这里**。
 */
export interface TabsInternalToken {
  /** = `cardPadding`（冗余别名）。 */
  tabsCardPadding: string;
  /** = `paddingXXS`。 */
  dropdownEdgeChildVerticalPadding: number;
  /** 溢出下拉最大高度（**字面量 200**）。 */
  tabsDropdownHeight: number;
  /** 溢出下拉最小宽度（**字面量 120**）。 */
  tabsDropdownWidth: number;
  /** 相邻横向页签的间距（由 `horizontalItemGutter` 拼串）。 */
  tabsHorizontalItemMargin: string;
  /** 同上（RTL 口径；LTR/RTL 同值）。 */
  tabsHorizontalItemMarginRTL: string;
}

/**
 * `prepareComponentToken` 的入参面。
 *
 * `AliasToken` 的子集 + 三个**可选**的 Component Token 覆盖位（`cardHeight` 家族）。
 * 后者是 antd 的「用户覆盖 → 回写合并值」通道；运行时从当前主题的 Tabs 组件配置接入。
 */
export interface TabsSeedToken {
  /** 别名：`zIndexPopupBase`。 */
  zIndexPopupBase: number;
  /** 别名：`colorFillAlter`。 */
  colorFillAlter: string;
  colorBgContainer: string;
  /** 别名：`controlHeight`。 */
  controlHeight: number;
  /** 别名：`controlHeightLG`。 */
  controlHeightLG: number;
  /** 别名：`fontHeight`（= `fontSize × lineHeight`，**不是** `fontSize`）。 */
  fontHeight: number;
  /** 别名：`fontHeightLG`（= `fontSizeLG × lineHeightLG`）。 */
  fontHeightLG: number;
  /** 别名：`lineWidth`。 */
  lineWidth: number;
  /** 别名：`padding`。 */
  padding: number;
  /** 别名：`paddingXS`。 */
  paddingXS: number;
  /** 别名：`paddingSM`。 */
  paddingSM: number;
  /** 别名：`paddingLG`。 */
  paddingLG: number;
  /** 别名：`fontSize`。 */
  fontSize: number;
  /** 别名：`fontSizeLG`。 */
  fontSizeLG: number;
  /** 别名：`colorPrimary`。 */
  colorPrimary: string;
  colorPrimaryTextHover: string;
  colorPrimaryTextActive: string;
  /** 别名：`colorText`。 */
  colorText: string;
  /** 别名：`margin`。 */
  margin: number;
  /** 别名：`marginXXS`。 */
  marginXXS: number;
  /** 别名：`paddingXXS`（内部 token `dropdownEdgeChildVerticalPadding` 用）。 */
  paddingXXS: number;
  /** Component Token 覆盖位：卡片高度。 */
  cardHeight?: number;
  /** Component Token 覆盖位：小尺寸卡片高度。 */
  cardHeightSM?: number;
  /** Component Token 覆盖位：大尺寸卡片高度。 */
  cardHeightLG?: number;
}

/**
 * 当前 24 个组件默认值；保留原几何派生，文字使用当前背景的文本别名。
 *
 * ⚠️ 三处算式逐字保留（`mergedCardHeight` 家族、`cardPadding` 家族的
 *    `(h − fontHeight)/2 − lineWidth`、`cardGutter` 的 `marginXXS/2`）——
 *    它们与判定值强绑定，改成「等效写法」会让对拍失真。
 */
export function prepareComponentToken(token: TabsSeedToken): ComponentToken {
  const background = new Color(token.colorBgContainer);
  const darkBackground =
    /^(#|rgb|hsl)/.test(token.colorBgContainer) &&
    background.r * 0.299 + background.g * 0.587 + background.b * 0.114 < 128;
  // Reuse existing text aliases; the default palette intentionally shares its
  // ordinary primary/text shades, which are too light for small text on white.
  const primaryText = darkBackground ? token.colorPrimaryTextHover : token.colorPrimaryTextActive;
  const mergedCardHeight = token.cardHeight ?? token.controlHeightLG;
  const mergedCardHeightSM = token.cardHeightSM ?? token.controlHeight;
  // `controlHeight` missing XL variable, so we directly write it here:
  const mergedCardHeightLG = token.cardHeightLG ?? token.controlHeightLG + 8;

  return {
    zIndexPopup: token.zIndexPopupBase + 50,
    cardBg: token.colorFillAlter,
    // We can not pass this as valid value,
    // Since `cardHeight` will lock nav add button height.
    cardHeight: mergedCardHeight,
    cardHeightSM: mergedCardHeightSM,
    cardHeightLG: mergedCardHeightLG,
    // Initialize with empty string, because cardPadding will be calculated with cardHeight by default.
    cardPadding: `${(mergedCardHeight - token.fontHeight) / 2 - token.lineWidth}px ${token.padding}px`,
    cardPaddingSM: `${(mergedCardHeightSM - token.fontHeight) / 2 - token.lineWidth}px ${token.paddingXS}px`,
    cardPaddingLG: `${(mergedCardHeightLG - token.fontHeightLG) / 2 - token.lineWidth}px ${token.padding}px`,
    titleFontSize: token.fontSize,
    titleFontSizeLG: token.fontSizeLG,
    titleFontSizeSM: token.fontSize,
    inkBarColor: token.colorPrimary,
    horizontalMargin: `0 0 ${token.margin}px 0`,
    horizontalItemGutter: 32,
    horizontalItemPadding: `${token.paddingSM}px 0`,
    horizontalItemPaddingSM: `${token.paddingXS}px 0`,
    horizontalItemPaddingLG: `${token.padding}px 0`,
    verticalItemPadding: `${token.paddingXS}px ${token.paddingLG}px`,
    verticalItemMargin: `${token.margin}px 0 0 0`,
    itemColor: token.colorText,
    itemSelectedColor: primaryText,
    itemHoverColor: primaryText,
    itemActiveColor: primaryText,
    cardGutter: token.marginXXS / 2,
  };
}

/**
 * `mergeToken` 那一步的本地复刻（**6** 个内部 token）。
 *
 * ⚠️ `tabsHorizontalItemMargin` 上游是 `0 0 0 ${unit(gutter)}`，产物里再被 cssinjs 的
 *    变量替换改写成 `var(--apollo-tabs-horizontal-item-gutter)`。本仓没有那层替换魔法，
 *    ⇒ **G4 机械移植时直接写 var 形态**；这里保留 `32px` 的原始形态以对上判定值与
 *    `TabsInternalToken` 的类型（`string`）。
 */
export function prepareInternalToken(
  token: TabsSeedToken,
  component: ComponentToken,
): TabsInternalToken {
  const gutter = px(component.horizontalItemGutter);
  return {
    tabsCardPadding: component.cardPadding,
    dropdownEdgeChildVerticalPadding: token.paddingXXS,
    tabsDropdownHeight: 200,
    tabsDropdownWidth: 120,
    tabsHorizontalItemMargin: `0 0 0 ${gutter}`,
    tabsHorizontalItemMarginRTL: `0 0 0 ${gutter}`,
  };
}

let tokenCache: ComponentToken | null = null;
let internalCache: TabsInternalToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function tabsTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

/** 内部 token 的构建期值（缓存）。 */
export function tabsInternalTokenValues(): TabsInternalToken {
  if (!internalCache) {
    const seed = getDesignToken();
    internalCache = prepareInternalToken(seed, tabsTokenValues());
  }
  return internalCache;
}
