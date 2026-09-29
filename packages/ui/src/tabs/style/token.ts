/**
 * Tabs 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tabs/style/index.js` 的 `prepareComponentToken`
 * （+ `style/index.d.ts` 的 `ComponentToken` / `TabsToken` 接口）。
 * registry 数据：该组件 token 数 = **26**。
 *
 * ── 默认主题判定值（2026-09-30 与 antd 6.6.4 产物逐字对拍）──────────────────────
 *
 * | token | 判定值 | 派生 |
 * |---|---|---|
 * | `zIndexPopup` | `1050` | `zIndexPopupBase + 50` |
 * | `cardBg` | `rgba(0,0,0,0.02)` | `colorFillAlter` |
 * | `cardHeight` / `-SM` / `-LG` | `40` / `32` / `48` | `cardHeight ?? controlHeightLG` / `cardHeightSM ?? controlHeight` / `cardHeightLG ?? controlHeightLG + 8` |
 * | `cardPadding` / `-SM` / `-LG` | `8px 16px` / `4px 8px` / `11px 16px` | `(h − fontHeight)/2 − lineWidth` + `padding` / `paddingXS` / `padding` |
 * | `titleFontSize` / `-LG` / `-SM` | `14` / `16` / `14` | `fontSize` / `fontSizeLG` / `fontSize` |
 * | `inkBarColor` | `#1677ff` | `colorPrimary` |
 * | `horizontalMargin` | `0 0 16px 0` | `margin` |
 * | `horizontalItemGutter` | `32` | **固定值**（上游注释的 `// Fixed Value`） |
 * | `horizontalItemMargin` / `-RTL` | `''`（**空串**） | 占位；真实间距走内部 token（见下） |
 * | `horizontalItemPadding` / `-SM` / `-LG` | `12px 0` / `8px 0` / `16px 0` | `paddingSM` / `paddingXS` / `padding` |
 * | `verticalItemPadding` | `8px 24px` | `paddingXS` + `paddingLG` |
 * | `verticalItemMargin` | `16px 0 0 0` | `margin` |
 * | `itemColor` / `-SelectedColor` / `-HoverColor` / `-ActiveColor` | `rgba(0,0,0,0.88)` / `#1677ff` / `#4096ff` / `#0958d9` | `colorText` / `colorPrimary` / `colorPrimaryHover` / `colorPrimaryActive` |
 * | `cardGutter` | `2` | `marginXXS / 2` |
 *
 * 验证命令（可复现）：`node tests/visual/debug/extract-tabs-css.mjs --tokens`
 * （还会打印**规则引用的 45 个别名变量**，供 B7 核对是否都在 theme 声明）
 *
 * ── 为什么 `cardHeight` 家族是「合并后的值」────────────────────────────────────
 *
 * antd 的注释写得很清楚：
 *
 * ```js
 * // We can not pass this as valid value,
 * // Since `cardHeight` will lock nav add button height.
 * cardHeight: mergedCardHeight,
 * ```
 *
 * 即 `cardHeight` 是**可被用户覆盖**的 Component Token，`prepareComponentToken`
 * 收到的 `token.cardHeight` 已含用户覆盖，所以这里先 `?? controlHeightLG` 再回写。
 * `TabsSeedToken` 的三个可选字段就是这条覆盖通道的入口
 * （⚠️ 目前**没有**从 ConfigProvider 接进来的路径，见文件末的缺口说明）。
 *
 * ── 两个空串 token（`horizontalItemMargin` / `-RTL`）──────────────────────────
 *
 * antd 把它们**声明成空值**（实测产物逐字 `--ant-tabs-horizontal-item-margin:;`），
 * 注释是 `// Initialize with empty string, because horizontalItemMargin will be
 * calculated with horizontalItemGutter by default.`。真正的相邻间距来自**内部 token**
 * `tabsHorizontalItemMargin` —— 产物里被 cssinjs 的变量替换改写成
 * `margin: 0 0 0 var(--ant-tabs-horizontal-item-gutter)`。
 *
 * ⇒ 这两个 token **没有任何规则引用**，声明出来只为与上游的 26 个逐字对齐
 *   （少一个，「数量与名称对齐」这条判据就破了）。
 *
 * ── 内部 token（`TabsToken` 里不属于 `FullToken` 的部分）────────────────────────
 *
 * `mergeToken` 注入 **6** 个：
 *
 * | 内部 token | 判定值 | 形态 |
 * |---|---|---|
 * | `tabsCardPadding` | = `cardPadding` | 冗余别名 |
 * | `dropdownEdgeChildVerticalPadding` | `paddingXXS` = `4` | 别名 |
 * | `tabsDropdownHeight` | `200` | **字面量** |
 * | `tabsDropdownWidth` | `120` | **字面量** |
 * | `tabsHorizontalItemMargin` | `0 0 0 32px` | 由 `horizontalItemGutter` 拼串 |
 * | `tabsHorizontalItemMarginRTL` | `0 0 0 32px` | 同上（LTR/RTL 同值，方向由 RTL 段选择器负责） |
 *
 * ⚠️ `.d.ts` 里还有第 7 个 `tabsNavWrapPseudoWidth: number` —— 实测（2026-09-30）
 *    它在 antd 6.6.4 的整个 `es/` 里**只出现在类型声明里**（`grep` 全树仅 1 命中），
 *    既无赋值也无消费 ⇒ 上游的死字段，本仓**不实现**（登记于此，免得后来者以为漏了）。
 *
 * ── 已知缺口（登记在 `README.md` §7）──────────────────────────────────────────
 *
 * 本仓零运行时 + 静态 CSS 管线目前**没有**「Component Token → CSS 变量」那一段，
 * 也没把 ConfigProvider 的 `theme.components.Tabs` 接进来 ⇒ 用户**无法**覆盖这 26 个
 * 里的任何一个（与 divider / pagination 的同一处缺口同源）。
 * `TabsSeedToken` 里那三个可选字段是为该管线预留的入口。
 */

import { getDesignToken } from '@apollo-design/theme';
import { toCssSize } from '../../_internal/to-css-size';

/** 数值 → `px` 串（静态 CSS 不给裸数字补单位）。 */
const px = (value: number): string => toCssSize(value) ?? `${value}px`;

/** antd `ComponentToken` 的 **26** 个字段（名称、数量、类型逐条对齐）。 */
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
  /** 横向标签页标签外间距（**空串占位**，无规则引用）。 */
  horizontalItemMargin: string;
  /** 横向标签页标签外间距（RTL，**空串占位**，无规则引用）。 */
  horizontalItemMarginRTL: string;
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
  /** 标签激活态文本颜色（`colorPrimaryActive`）。 */
  itemActiveColor: string;
  /** 标签悬浮态文本颜色。 */
  itemHoverColor: string;
  /** 标签选中态文本颜色。 */
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
 * 后者是 antd 的「用户覆盖 → 回写合并值」通道；本仓目前没有接通它的路径（见文件头缺口）。
 */
export interface TabsSeedToken {
  /** 别名：`zIndexPopupBase`。 */
  zIndexPopupBase: number;
  /** 别名：`colorFillAlter`。 */
  colorFillAlter: string;
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
  /** 别名：`colorPrimaryHover`。 */
  colorPrimaryHover: string;
  /** 别名：`colorPrimaryActive`。 */
  colorPrimaryActive: string;
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
 * antd `prepareComponentToken` 的逐条对齐实现（**26** 个）。
 *
 * ⚠️ 三处算式逐字保留（`mergedCardHeight` 家族、`cardPadding` 家族的
 *    `(h − fontHeight)/2 − lineWidth`、`cardGutter` 的 `marginXXS/2`）——
 *    它们与判定值强绑定，改成「等效写法」会让对拍失真。
 */
export function prepareComponentToken(token: TabsSeedToken): ComponentToken {
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
    // Fixed Value
    // Initialize with empty string, because horizontalItemMargin will be calculated with horizontalItemGutter by default.
    horizontalItemMargin: '',
    horizontalItemMarginRTL: '',
    horizontalItemPadding: `${token.paddingSM}px 0`,
    horizontalItemPaddingSM: `${token.paddingXS}px 0`,
    horizontalItemPaddingLG: `${token.padding}px 0`,
    verticalItemPadding: `${token.paddingXS}px ${token.paddingLG}px`,
    verticalItemMargin: `${token.margin}px 0 0 0`,
    itemColor: token.colorText,
    itemSelectedColor: token.colorPrimary,
    itemHoverColor: token.colorPrimaryHover,
    itemActiveColor: token.colorPrimaryActive,
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
    tokenCache = prepareComponentToken(getDesignToken() as unknown as TabsSeedToken);
  }
  return tokenCache;
}

/** 内部 token 的构建期值（缓存）。 */
export function tabsInternalTokenValues(): TabsInternalToken {
  if (!internalCache) {
    const seed = getDesignToken() as unknown as TabsSeedToken;
    internalCache = prepareInternalToken(seed, tabsTokenValues());
  }
  return internalCache;
}
