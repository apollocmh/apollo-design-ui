/**
 * Segmented 的 Component Token（antd prepareComponentToken 全 **8 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/segmented/style/index.js` 的 `prepareComponentToken`。
 *
 * ── 落地形态（与 radio / progress 同范式）────────────────────────────────────
 *
 * 8 个字段全部是 alias token 的**直接别名**（无公式派生）：
 *   trackPadding       = lineWidthBold
 *   trackBg            = colorBgLayout
 *   itemColor          = colorTextLabel
 *   itemHoverColor     = colorText
 *   itemHoverBg        = colorFillSecondary
 *   itemSelectedBg     = colorBgElevated
 *   itemActiveBg       = colorFill
 *   itemSelectedColor  = colorText
 *
 * 派生量 `segmentedPaddingHorizontal` / `segmentedPaddingHorizontalSM`
 * （= controlPaddingHorizontal − lineWidth / controlPaddingHorizontalSM − lineWidth）
 * 是 genStyleHooks 的 mergeToken 产物，不是 Component Token —— 落在样式生成里
 * （style/index.ts），不出现在本文件（与 antd 的 d.ts 一致）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 选项文本颜色（= colorTextLabel）。 */
  itemColor: string;
  /** 选项悬浮态文本颜色（= colorText）。 */
  itemHoverColor: string;
  /** 选项悬浮态背景色（= colorFillSecondary）。 */
  itemHoverBg: string;
  /** 选项激活态背景色（= colorFill）。 */
  itemActiveBg: string;
  /** 选项选中背景色（= colorBgElevated）。 */
  itemSelectedBg: string;
  /** 选项选中文字色（= colorText）。 */
  itemSelectedColor: string;
  /** 控件容器 padding（= lineWidthBold）。 */
  trackPadding: number;
  /** 控件容器背景色（= colorBgLayout）。 */
  trackBg: string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  itemColor: token.colorTextLabel,
  itemHoverColor: token.colorText,
  itemHoverBg: token.colorFillSecondary,
  itemActiveBg: token.colorFill,
  itemSelectedBg: token.colorBgElevated,
  itemSelectedColor: token.colorText,
  trackPadding: token.lineWidthBold,
  trackBg: token.colorBgLayout,
});

export default prepareComponentToken;
