/**
 * Menu 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `components/menu/style/index.ts`
 * （`prepareComponentToken`，registry 数据：组 token 数 = 78，绝大多数是
 * alias 派生的双命名 —— `colorXxx`/`xxxColor` 同值对，CSS 变量以 DECLS
 * 字面量落在 style/index.ts，本文件提供**构建期判定值**供 L7 对拍）。
 *
 * 快捷色（activeBarWidth 等）以缺省分支对齐；dark 主题的翻转由 `-dark`
 * 类族承担（颜色 token 在 DECLS 内为 light 值，dark 值在同块以
 * `.apollo-menu-dark` 选择器段覆盖 —— 与 antd 的 genMenuDarkStyle 同构）。
 */

import { getDesignToken } from '@apollo-design/theme';

/** prepareComponentToken 的公开面（关键判定值；全量 78 个见 DECLS）。 */
export interface ComponentToken {
  /** 下拉（vertical popup）宽度。 */
  dropdownWidth: number;
  /** `zIndexPopupBase + 50`。 */
  zIndexPopup: number;
  /** borderRadiusLG。 */
  radiusItem: number;
  itemBorderRadius: number;
  /** borderRadiusSM。 */
  radiusSubMenuItem: number;
  subMenuItemBorderRadius: number;
  activeBarWidth: number;
  activeBarHeight: number;
  activeBarBorderWidth: number;
  itemMarginInline: number;
}

/** prepareComponentToken 的入参面（AliasToken 子集 + menu 专属快捷）。 */
export interface MenuSeedToken {
  zIndexPopupBase: number;
  borderRadiusLG: number;
  borderRadiusSM: number;
  lineWidth: number;
  lineWidthBold: number;
  marginXXS: number;
  activeBarWidth?: number;
  activeBarBorderWidth?: number;
  itemMarginInline?: number;
}

/** antd `prepareComponentToken('Menu')` 的关键判定值（逐条对齐）。 */
export function prepareComponentToken(token: MenuSeedToken): ComponentToken {
  const activeBarWidth = token.activeBarWidth ?? 0;
  const activeBarBorderWidth = token.activeBarBorderWidth ?? token.lineWidth;
  const itemMarginInline = token.itemMarginInline ?? token.marginXXS;

  return {
    dropdownWidth: 160,
    zIndexPopup: token.zIndexPopupBase + 50,
    radiusItem: token.borderRadiusLG,
    itemBorderRadius: token.borderRadiusLG,
    radiusSubMenuItem: token.borderRadiusSM,
    subMenuItemBorderRadius: token.borderRadiusSM,
    activeBarWidth,
    activeBarHeight: token.lineWidthBold,
    activeBarBorderWidth,
    itemMarginInline,
  };
}

let tokenCache: ComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function menuTokenValues(): ComponentToken {
  if (!tokenCache) {
    const seed = getDesignToken() as unknown as MenuSeedToken;
    tokenCache = prepareComponentToken(seed);
  }
  return tokenCache;
}
