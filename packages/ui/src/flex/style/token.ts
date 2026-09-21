/**
 * Flex 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/flex/style/index.js` 的 `prepareComponentToken`：
 *
 * ```js
 * export const prepareComponentToken = () => ({});
 * ```
 *
 * **Flex 没有 Component Token**（registry 数据：tokenCount = 0）。
 * 但 Flex 的 gap 三档不是 0 —— 它们来自**别名 token 派生**（`mergeToken`）：
 *
 * ```js
 * const flexToken = mergeToken(token, {
 *   flexGapSM: token.paddingXS,
 *   flexGap:    token.padding,
 *   flexGapLG:  token.paddingLG,
 * });
 * ```
 *
 * 这三个值是**组件私有的派生 token**（不出现在 ComponentToken 接口里，
 * 用户不能通过 `theme.components.Flex` 覆盖 —— antd 同样不能），由
 * `style/index.ts` 直接以 `var(--apollo-padding-xs)` 等形式消费（B7 可校验）。
 *
 * 本文件保留 `prepareComponentToken`（返回空对象）以维持与其它组件一致的
 * 导出面，供 registry 的 tokens 清单与将来「Component Token → CSS 变量」管线
 * 统一处理 —— divider 的 token.ts 注释里登记的缺口对 Flex 同样适用。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * Flex 的 Component Token。与 antd 逐字对齐：**空类型**。
 *
 * （antd 用空接口 + `prepareComponentToken = () => ({})` 表达「该组件无
 * Component Token」；这里用同构的空类型，避免引入无意义的占位字段。）
 */
export type ComponentToken = Record<string, never>;

/** 与 antd 的 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
