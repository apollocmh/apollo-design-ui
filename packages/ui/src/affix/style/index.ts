/**
 * Affix 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/affix/style/index.js`（`genSharedAffixStyle` +
 * `prepareComponentToken`）。只有**一条**规则 —— 全库最小的组件样式。
 *
 * ── antd 原文 ─────────────────────────────────────────────────────────────────
 *
 * ```js
 * const genSharedAffixStyle = token => {
 *   const { componentCls } = token;
 *   return {
 *     [componentCls]: { position: 'fixed', zIndex: token.zIndexPopup }
 *   };
 * };
 * ```
 *
 * ⚠️ **没有 `resetComponent`**：antd 的 Affix 样式**不调用** `resetComponent(token)`，
 *    所以这里**不要**加 box-sizing / margin / color 那一组 —— 加了反而会与 antd
 *    产物不一致（L6 的 block-diff）。Affix 本身不渲染文本内容，用不到。
 *
 * ⚠️ 选择器是**顶级** `.apollo-affix`（不是后代、不是复合）—— 因为这条样式
 *    语义上只该作用于「正在固钉」的那一层，而类名本身就只在固钉时才出现
 *    （见 `Affix.vue` 的注释）。
 *
 * ── 为什么 `z-index` 是字面量 ────────────────────────────────────────────────
 *
 * `zIndexPopup = zIndexBase + 10`（见 `token.ts`）。`zIndexBase` 虽是 AliasToken，
 * 但 theme 的 `tokens.css` **没有**给它出 CSS 变量（`--apollo-z-index-*` 不存在），
 * 走 `var()` 会被 B7 拦下。⇒ 按既定模式内联定值，真源在 `token.ts`。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 负责）。
 *   - 没证明用户能覆盖 `zIndexPopup`（那是「Component Token → CSS 变量」管线的缺口）。
 */

import { DEFAULT_Z_INDEX_POPUP } from './token';

/**
 * 生成 Affix 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genAffixStyle(prefixCls: string): string {
  const cls = `.${prefixCls}-affix`;

  return [
    `${cls}{`,
    `  position:fixed;`,
    `  z-index:${DEFAULT_Z_INDEX_POPUP};`,
    `}`,
    '',
  ].join('\n');
}
