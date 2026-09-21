/**
 * Badge 的 Component Token（9 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/style/index.js` 的 `ComponentToken` 与
 * `prepareComponentToken`（名称、数量、默认值计算方式逐条对齐，规则 R7）。
 *
 * ── 9 个 token 的落地形态 ─────────────────────────────────────────────────────
 *
 * antd 在 cssVar 模式下把它们声明成组件级 CSS 变量（真实产物，extractStyle 提取）：
 *
 * ```css
 * .css-var-root.apollo-badge{
 *   --apollo-badge-indicator-z-index:auto;
 *   --apollo-badge-indicator-height:20px;
 *   --apollo-badge-indicator-height-sm:14px;
 *   --apollo-badge-dot-size:6px;
 *   --apollo-badge-text-font-size:12px;
 *   --apollo-badge-text-font-size-sm:12px;
 *   --apollo-badge-text-font-weight:normal;
 *   --apollo-badge-status-size:6px;
 *   --apollo-badge-padding-inline:8px;
 * }
 * ```
 *
 * 我们的零运行时管线把同一份声明直接放进 `genBadgeStyle` 的输出
 * （`.apollo-badge{...}` 与 `.apollo-ribbon-wrapper{...}`，B7 已允许组件 CSS
 * 内的局部声明 —— grid 落地时扩展）。规则侧全部经 `var()` 消费。
 *
 * ── 默认值的派生（与 antd 的 prepareComponentToken 逐字同式）────────────────
 *
 * | token | antd 计算 | seed 代入 | 常量 |
 * |---|---|---|---|
 * | indicatorZIndex | `\'auto\'` | — | `\'auto\'` |
 * | indicatorHeight | `round(fontSize*lineHeight)-2*lineWidth` | 22-2 | **20px** |
 * | indicatorHeightSM | `fontSize` | 14 | **14px** |
 * | dotSize | `fontSizeSM/2` | 12/2 | **6px** |
 * | textFontSize | `fontSizeSM` | 12 | **12px** |
 * | textFontSizeSM | `fontSizeSM` | 12 | **12px** |
 * | textFontWeight | `\'normal\'` | — | **normal** |
 * | statusSize | `fontSizeSM/2` | 12/2 | **6px** |
 * | paddingInline | `paddingXS` | 8 | **8px** |
 *
 * ⚠️ 派生乘除无法用 calc 表达 unitless line-height 乘法 —— 与 grid 断点同源：
 * 以 theme 默认 seed 算出常量为唯一真源，**主题覆盖 alias token 不会改变这里**。
 * 登记 README §7 已知边界。
 */

import type { AliasToken } from '@apollo-design/theme';

/** antd 的 `Math.round(fontSize * lineHeight) - 2 * lineWidth`（默认 seed 代入 = 20）。 */
export const INDICATOR_HEIGHT = 20;
/** antd 的 `fontSize`（= 14）。 */
export const INDICATOR_HEIGHT_SM = 14;
/** antd 的 `fontSizeSM / 2`（= 6）。 */
export const DOT_SIZE = 6;
/** antd 的 `fontSizeSM`（= 12）。 */
export const TEXT_FONT_SIZE = 12;
/** antd 的 `fontSizeSM`（= 12）。 */
export const TEXT_FONT_SIZE_SM = 12;
/** antd 的 `\'normal\'`。 */
export const TEXT_FONT_WEIGHT = 'normal';
/** antd 的 `fontSizeSM / 2`（= 6）。 */
export const STATUS_SIZE = 6;
/** antd 的 `paddingXS`（= 8）。 */
export const PADDING_INLINE = 8;

/** Badge 的 Component Token 类型（与 antd 的 `ComponentToken` 同构）。 */
export interface ComponentToken {
  /** 指示器的 z-index。 */
  indicatorZIndex?: string | number;
  /** 指示器（count）高度。 */
  indicatorHeight?: number;
  /** 小尺寸指示器高度。 */
  indicatorHeightSM?: number;
  /** 小红点尺寸。 */
  dotSize?: number;
  /** 状态文本字号。 */
  textFontSize?: number;
  /** 小尺寸状态文本字号。 */
  textFontSizeSM?: number;
  /** 状态文本字重。 */
  textFontWeight?: string | number;
  /** 状态点尺寸。 */
  statusSize?: number;
  /** 多字符 count 的水平内边距。 */
  paddingInline?: number;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({
  indicatorZIndex: 'auto',
  indicatorHeight: INDICATOR_HEIGHT,
  indicatorHeightSM: INDICATOR_HEIGHT_SM,
  dotSize: DOT_SIZE,
  textFontSize: TEXT_FONT_SIZE,
  textFontSizeSM: TEXT_FONT_SIZE_SM,
  textFontWeight: TEXT_FONT_WEIGHT,
  statusSize: STATUS_SIZE,
  paddingInline: PADDING_INLINE,
});

/** token 名 → 组件级 CSS 变量名。 */
export const token2Var = (token: string, prefix = 'apollo'): string =>
  `var(--${prefix}-badge-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`;
