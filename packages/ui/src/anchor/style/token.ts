/**
 * Anchor 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/anchor/style/index.js`：
 *
 * ```js
 * export interface ComponentToken {
 *   linkPaddingBlock: number;        // 链接纵向内间距
 *   linkPaddingInlineStart: number;  // 链接横向内间距
 * }
 * export const prepareComponentToken = (token) => ({
 *   linkPaddingBlock: token.paddingXXS,
 *   linkPaddingInlineStart: token.padding,
 * });
 * ```
 *
 * **2 个 Component Token**（registry 数据一致），两个都是**别名派生**
 * ⇒ 落 `var(--apollo-*)`，随主题自适应、B7 可校验。
 *
 * ── 另有 4 个 `mergeToken` 派生值（**不是** Component Token）──────────────────
 *
 * `genStyleHooks` 的第二参里 `mergeToken` 出的组件私有值 —— 用户**不能**通过
 * `theme.components.Anchor` 覆盖（antd 同样不能），由 `style/index.ts` 直接消费：
 *
 * | 派生 token | 计算 | 用在哪 |
 * |---|---|---|
 * | `holderOffsetBlock` | `paddingXXS` | wrapper 的 `marginBlockStart: -x` + `paddingBlockStart: x` |
 * | `anchorPaddingBlockSecondary` | `paddingXXS / 2` | **嵌套层** `.{p}-link` 的 `paddingBlock` |
 * | `anchorTitleBlock` | `fontSize / 14 * 3` | `.{p}-link-title` 的 `marginBlockEnd` |
 * | `anchorBallSize` | `fontSizeLG / 2` | ⚠️ **本仓的样式里没有消费者**（上游 6.6.4 也没有）—— 保留计算只为逐条对齐 |
 *
 * ⚠️ `anchorTitleBlock` 的 `fontSize / 14 * 3` 是**乘除复合**（不是 `calc()`）——
 * 本仓在构建期用 JS 算出数值再补 `px`（与 `splitter` 的派生值同一做法）。
 */

import type { AliasToken } from '@apollo-design/theme';

/** Anchor 的 Component Token。与上游逐字对齐（2 个，都是别名派生）。 */
export interface ComponentToken {
  /** @desc 链接纵向内间距 */
  linkPaddingBlock: number;
  /** @desc 链接横向内间距（只作用于 `padding-inline-start`） */
  linkPaddingInlineStart: number;
}

/** 与上游的 `prepareComponentToken` 逐字对应。 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  linkPaddingBlock: token.paddingXXS,
  linkPaddingInlineStart: token.padding,
});
