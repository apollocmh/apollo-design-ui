/** Space has no component tokens; existing Alias tokens supply preset gaps and Addon paint. */
import type { AliasToken } from '@apollo-design/theme';

// biome-ignore lint/suspicious/noEmptyInterface: Space currently defines no component-specific tokens
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
