/**
 * Radio 的 Component Token（antd prepareComponentToken 全 **16 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/radio/style/index.js` 的 `prepareComponentToken`。
 *
 * ── 落地形态 ──────────────────────────────────────────────────────────────────
 *
 * 派生字段按 antd 公式用 alias token 计算（layout 范式）：
 *   radioSize   = fontSizeLG                       （默认 16）
 *   dotSize     = radioSize - (dotPadding + lineWidth) × 2（wireframe=false；默认 6）
 *   buttonPaddingInline = padding - lineWidth      （默认 15）
 * wireframe 分支（dotPadding×2 / colorPrimary 点 / colorBgContainer 底）依赖
 * theme token 注入，本仓尚未落地 —— 全按 **wireframe=false** 取值（PLATFORM，
 * 与 demo 的 wireframe 等价替换同判）。
 *
 * antd unitless 集合：radioSize、dotSize（CSS 侧乘 1px）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 单选框尺寸（= fontSizeLG）。 */
  radioSize: number;
  /** 内点尺寸（= wireframe ? size-8 : size-(4+lineWidth)*2）。 */
  dotSize: number;
  /** 禁用点色（= colorTextDisabled）。 */
  dotColorDisabled: string;
  /** solid 按钮选中文字色（= colorTextLightSolid）。 */
  buttonSolidCheckedColor: string;
  /** solid 按钮选中背景（= colorPrimary）。 */
  buttonSolidCheckedBg: string;
  /** solid 按钮选中 hover 背景（= colorPrimaryHover）。 */
  buttonSolidCheckedHoverBg: string;
  /** solid 按钮选中 active 背景（= colorPrimaryActive）。 */
  buttonSolidCheckedActiveBg: string;
  /** 按钮背景（= colorBgContainer）。 */
  buttonBg: string;
  /** 按钮选中背景（= colorBgContainer）。 */
  buttonCheckedBg: string;
  /** 按钮文字色（= colorText）。 */
  buttonColor: string;
  /** 按钮选中禁用背景（= controlItemBgActiveDisabled）。 */
  buttonCheckedBgDisabled: string;
  /** 按钮选中禁用文字色（= colorTextDisabled）。 */
  buttonCheckedColorDisabled: string;
  /** 按钮水平内边距（= padding - lineWidth）。 */
  buttonPaddingInline: number;
  /** wrapper 的 inline-end 外边距（= marginXS）。 */
  wrapperMarginInlineEnd: number;
  /** 内点颜色（= wireframe ? colorPrimary : colorWhite）。 */
  radioColor: string;
  /** 选中背景（= wireframe ? colorBgContainer : colorPrimary）。 */
  radioBgColor: string;
}

/** antd 的 `dotPadding = 4`（固定值，非 token）。 */
export const RADIO_DOT_PADDING = 4;

export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const radioSize = token.fontSizeLG;
  return {
    // Radio
    radioSize,
    dotSize: radioSize - (RADIO_DOT_PADDING + token.lineWidth) * 2,
    dotColorDisabled: token.colorTextDisabled,
    // Radio buttons
    buttonSolidCheckedColor: token.colorTextLightSolid,
    buttonSolidCheckedBg: token.colorPrimary,
    buttonSolidCheckedHoverBg: token.colorPrimaryHover,
    buttonSolidCheckedActiveBg: token.colorPrimaryActive,
    buttonBg: token.colorBgContainer,
    buttonCheckedBg: token.colorBgContainer,
    buttonColor: token.colorText,
    buttonCheckedBgDisabled: token.controlItemBgActiveDisabled,
    buttonCheckedColorDisabled: token.colorTextDisabled,
    buttonPaddingInline: token.padding - token.lineWidth,
    wrapperMarginInlineEnd: token.marginXS,
    // internal（wireframe=false 分支）
    radioColor: token.colorWhite,
    radioBgColor: token.colorPrimary,
  };
};
