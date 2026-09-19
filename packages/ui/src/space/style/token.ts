/**
 * Space 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/space/style/index.js` 的 `ComponentToken` 接口与
 * `prepareComponentToken`。
 *
 * ── ⚠️ 它是**空的**，而且这是契约本身 ─────────────────────────────────────────
 *
 * ```ts
 * // antd：components/space/style/index.ts:7-8
 * // biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
 * export interface ComponentToken {}
 * export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
 * ```
 *
 * `Compact`（`style/compact.ts`）与 `Addon`（`style/addon.ts`）的 `ComponentToken`
 * 同样是空接口。所以**用户无法**通过 `theme.components.Space` 覆盖任何东西 ——
 * 这不是我们没做，是上游本来就没有。
 *
 * 依据「登记 0 个 token 并声称完成」与「确认它确实没有 token」是两件事的原则
 * （empty 的 §7 裁决），`registry/components.json` 里 space 的 `derived.tokenCount`
 * 是 `0`，且**不**往 `registry/tokens.json` 里加条目。
 *
 * ── 三个**内部** token（用户不可覆盖）─────────────────────────────────────────
 *
 * `genStyleHooks` 的回调里用 `mergeToken` 造了三个仅供 CSS 使用的 token：
 *
 * ```ts
 * const spaceToken = mergeToken<SpaceToken>(token, {
 *   spaceGapSmallSize:  token.paddingXS,
 *   spaceGapMiddleSize: token.padding,
 *   spaceGapLargeSize:  token.paddingLG,
 * });
 * ```
 *
 * 它们**不在** `ComponentToken` 里（用户覆盖不了），但它们是
 * `-gap-row-{size}` / `-gap-col-{size}` 那六条规则的取值来源 —— 所以必须有一个
 * 唯一真源，而不是把三个别名 token 名散落在 `style/index.ts` 里。
 *
 * 三条都派生自**别名 token**，所以零运行时下可以直接落成
 * `var(--apollo-padding-xs)` 这类引用（B7 可校验、随主题自适应）。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（那是 L6 的逐像素比对）。
 *   - 没证明变量名存在 —— `var(--apollo-*)` 写错不会报错、只会静默失效，
 *     由 `tests/build/run.mjs` 的 B7 校验。
 */

import type { AliasToken } from '@apollo-design/theme';

// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default（与 antd 逐字一致，见文件头）
export interface ComponentToken {}

/**
 * 三个内部 gap token 的**别名来源**。
 *
 * 值必须是 `AliasToken` 的键名（`token2CSSVar` 会把它们转成 `--apollo-*`）。
 * 用 `as const` 保留字面量类型，这样 `style/index.ts` 里的 `v()` 调用能被
 * 类型检查（写错键名会红）。
 */
export const SPACE_GAP_ALIASES = {
  small: 'paddingXS',
  middle: 'padding',
  large: 'paddingLG',
} as const satisfies Record<string, keyof AliasToken>;

/**
 * 由别名 token 派生 Space 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐条对应** —— 它返回空对象：
 *
 * ```ts
 * export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
 * ```
 *
 * ⚠️ 它**不是**死代码：`registry/components.json` 的 `tokenCount: 0`、文档的
 *    Design Token 表都以它为准。有它才能把「空」这件事写成代码，
 *    而不是靠「没人写」。
 */
export const prepareComponentToken = (_token: AliasToken): Partial<ComponentToken> => ({});
