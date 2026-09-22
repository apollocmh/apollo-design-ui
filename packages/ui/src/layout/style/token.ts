/**
 * Layout 的 Component Token（19 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/layout/style/index.js` 的 `prepareComponentToken`。
 *
 * ── 落地形态 ──────────────────────────────────────────────────────────────────
 *
 * antd 的 cssVar 产物是**实值**（`--apollo-layout-body-bg:#f5f5f5`）；本仓按既有
 * 约定（tag / alert / statistic）声明为 **var() 别名派生**，好处是随主题自适应。
 * 三个**字面常量**（headerBg / siderBg `#001529`、triggerBg `#002140`）保持原样 ——
 * 它们在 antd 里就没有别名来源（E10 对声明行豁免）。
 *
 * 派生链（实测值 ↔ 本仓表达式）：
 *   headerHeight    64px     = controlHeight × 2
 *   headerPadding   0 50px   = 0 (controlHeightLG × 1.25)
 *   footerPadding   24px 50px= controlHeightSM / (controlHeightLG × 1.25)
 *   triggerHeight   48px     = controlHeightLG + marginXXS × 2
 *   zeroTrigger*    40px     = controlHeightLG
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** @deprecated 用 `bodyBg`。 */
  colorBgBody: string;
  /** @deprecated 用 `headerBg`。 */
  colorBgHeader: string;
  /** @deprecated 用 `triggerBg`。 */
  colorBgTrigger: string;
  /** Layout 背景。 */
  bodyBg: string;
  /** Header 背景。 */
  headerBg: string;
  /** Header 高度。 */
  headerHeight: number;
  /** Header 内边距。 */
  headerPadding: string;
  /** Header 文字色。 */
  headerColor: string;
  /** Footer 内边距。 */
  footerPadding: string;
  /** Footer 背景。 */
  footerBg: string;
  /** Sider 背景。 */
  siderBg: string;
  /** 触发器高度。 */
  triggerHeight: number;
  /** 触发器背景。 */
  triggerBg: string;
  /** 触发器文字色。 */
  triggerColor: string;
  /** 零宽触发器宽度。 */
  zeroTriggerWidth: number;
  /** 零宽触发器高度。 */
  zeroTriggerHeight: number;
  /** light 主题 Sider 背景。 */
  lightSiderBg: string;
  /** light 主题触发器背景。 */
  lightTriggerBg: string;
  /** light 主题触发器文字色。 */
  lightTriggerColor: string;
}

/** 字面常量（antd 的 prepareComponentToken 里就是硬编码的）。 */
export const LAYOUT_HEADER_BG = '#001529';
export const LAYOUT_SIDER_BG = '#001529';
export const LAYOUT_TRIGGER_BG = '#002140';

export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const paddingInline = token.controlHeightLG * 1.25;
  return {
    // Deprecated 别名（与 antd 同值同义）
    colorBgHeader: LAYOUT_HEADER_BG,
    colorBgBody: token.colorBgLayout,
    colorBgTrigger: LAYOUT_TRIGGER_BG,

    bodyBg: token.colorBgLayout,
    headerBg: LAYOUT_HEADER_BG,
    headerHeight: token.controlHeight * 2,
    headerPadding: `0 ${paddingInline}px`,
    headerColor: token.colorText,
    footerPadding: `${token.controlHeightSM}px ${paddingInline}px`,
    footerBg: token.colorBgLayout,
    siderBg: LAYOUT_SIDER_BG,
    triggerHeight: token.controlHeightLG + token.marginXXS * 2,
    triggerBg: LAYOUT_TRIGGER_BG,
    triggerColor: token.colorTextLightSolid,
    zeroTriggerWidth: token.controlHeightLG,
    zeroTriggerHeight: token.controlHeightLG,
    lightSiderBg: token.colorBgContainer,
    lightTriggerBg: token.colorBgContainer,
    lightTriggerColor: token.colorText,
  };
};
