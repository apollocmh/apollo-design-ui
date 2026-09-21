/**
 * Affix 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/affix/style/index.js` 的 `prepareComponentToken`。
 * **名称、数量、默认值计算方式逐条对齐**（规则 R7）。
 *
 * ── antd 原文 ─────────────────────────────────────────────────────────────────
 *
 * ```js
 * export const prepareComponentToken = token => ({
 *   zIndexPopup: token.zIndexBase + 10
 * });
 * ```
 *
 * 只有一个 token：`zIndexPopup`。它由**别名 token 派生**（`zIndexBase + 10`），
 * 但我们的 `tokens.css` 里**没有** `--apollo-z-index-base`（theme 的 CSS 变量只覆盖
 * 颜色/间距/字号这类会被主题切换的值，`zIndexBase = 0` 恒定不随主题变）。
 *
 * ⇒ 按 divider 的既定模式：**在 `prepareComponentToken` 里算出定值，由
 *   `style/index.ts` 内联**。这不是 H9 的硬编码 —— 来源是本文件这个 Token 定义，
 *   且计算方式与 antd 逐字相同（`zIndexBase + 10`）。
 *
 * ⚠️ 已知缺口（登记在 `README.md` §7）：没有「Component Token → CSS 变量」管线，
 *    用户无法通过 `theme.components.Affix` 覆盖 `zIndexPopup`。
 */

import type { AliasToken } from '@apollo-design/theme';

/** Affix 的 Component Token。与 antd 的接口逐字段对齐。 */
export interface ComponentToken {
  /** 固钉层的 z-index。antd 默认 `zIndexBase + 10`。 */
  zIndexPopup: number;
}

/**
 * 由别名 token 派生 Affix 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐条对应**：
 *
 * ```ts
 * export const prepareComponentToken = (token) => ({
 *   zIndexPopup: token.zIndexBase + 10,
 * });
 * ```
 */
export const prepareComponentToken = (token: Pick<AliasToken, 'zIndexBase'>): Partial<ComponentToken> => ({
  zIndexPopup: token.zIndexBase + 10,
});

/** 默认值（供 `style/index.ts` 内联与文档 Design Token 表使用）。 */
export const DEFAULT_Z_INDEX_POPUP = prepareComponentToken({ zIndexBase: 0 }).zIndexPopup ?? 10;
