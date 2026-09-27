/**
 * Rate 的 Component Token（antd prepareComponentToken 全 **6 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/rate/style/index.js` 的 `prepareComponentToken`。
 *
 * ── 落地形态 ──────────────────────────────────────────────────────────────────
 *
 * 派生字段按 antd 公式用 alias token 计算（layout 范式）：
 *   starColor      = yellow6                       （默认 #fadb14）
 *   starSize       = controlHeight * 0.625         （默认 20）
 *   starSizeSM     = controlHeightSM * 0.625       （默认 15）
 *   starSizeLG     = controlHeightLG * 0.625       （默认 25）
 *   starHoverScale = 'scale(1.1)'                  （常量）
 *   starBg         = colorFillContent              （默认 rgba(0,0,0,0.06)）
 *
 * `lineWidthFocus` 是 **alias token**（`focusOutline === false ? 0 : lineWidth * 3`；
 * antd 的 prepareComponentToken 里那句 `=== 0 ? 0 : lineWidth` 分支是 cssinjs
 * 合并顺序防御，语义等价）—— 不进 ComponentToken 声明块，样式里直接
 * `var(--apollo-line-width-focus)` 消费（radio 的焦点环同判）。
 *
 * 三个 starSize 在 antd cssVar 产物里是**实值 px**（非 unitless）—— 落 var() 派生。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 星星颜色（= yellow6）。 */
  starColor: string;
  /** 星星尺寸（= controlHeight * 0.625）。 */
  starSize: number;
  /** 小星星尺寸（= controlHeightSM * 0.625）。 */
  starSizeSM: number;
  /** 大星星尺寸（= controlHeightLG * 0.625）。 */
  starSizeLG: number;
  /** 星星悬浮时的缩放（常量 'scale(1.1)'）。 */
  starHoverScale: string;
  /** 星星背景色（= colorFillContent）。 */
  starBg: string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  starColor: token.yellow6,
  starSize: token.controlHeight * 0.625,
  starSizeSM: token.controlHeightSM * 0.625,
  starSizeLG: token.controlHeightLG * 0.625,
  starHoverScale: 'scale(1.1)',
  starBg: token.colorFillContent,
});
