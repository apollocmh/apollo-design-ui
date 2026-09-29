/**
 * Cascader 的 Component Token（antd `prepareComponentToken` **8 个字段**，规则 R7）。
 *
 * 契约来源：antd 6.6.4 `es/cascader/style/index.js`。
 *
 *   controlWidth: 184（字面量）
 *   controlItemWidth: 111（字面量）
 *   dropdownHeight: 180（字面量）
 *   optionSelectedBg: controlItemBgActive
 *   optionSelectedFontWeight: fontWeightStrong（unitless）
 *   optionPadding: `{itemPaddingVertical}px {paddingSM}px` —— itemPaddingVertical
 *     是 `Math.round((controlHeight - fontSize * lineHeight) / 2)` 的**构建期数值**
 *     （与 radio 的 preset 阴影同判：本仓零运行时拿不到中间变量做 var() 派生）
 *   menuPadding: paddingXXS
 *   optionSelectedColor: colorText
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  controlWidth: number;
  controlItemWidth: number;
  dropdownHeight: number;
  optionSelectedBg: string;
  optionSelectedFontWeight: number;
  optionPadding: string;
  menuPadding: number;
  optionSelectedColor: string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const itemPaddingVertical = Math.round(
    (token.controlHeight - token.fontSize * token.lineHeight) / 2,
  );
  return {
    controlWidth: 184,
    controlItemWidth: 111,
    dropdownHeight: 180,
    optionSelectedBg: token.controlItemBgActive,
    optionSelectedFontWeight: token.fontWeightStrong,
    optionPadding: `${itemPaddingVertical}px ${token.paddingSM}px`,
    menuPadding: token.paddingXXS,
    optionSelectedColor: token.colorText,
  };
};

export default prepareComponentToken;
