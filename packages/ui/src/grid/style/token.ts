/**
 * Grid 的 Component Token（Row 与 Col）。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/style/index.js`：
 *
 * ```js
 * export const prepareRowComponentToken = () => ({});
 * export const prepareColComponentToken = () => ({});
 * ```
 *
 * **Grid 没有 Component Token**（registry 数据：tokenCount = 0）。
 * 栅格常量 `gridColumns = 24` 不是 token（mergeToken 注入的派生值，用户不可覆盖），
 * 由 style/index.ts 以常量消费。
 */

import type { AliasToken } from '@apollo-design/theme';

/** Row 的 Component Token。与 antd 逐字一致：空。 */
export type RowComponentToken = Record<string, never>;

/** Col 的 Component Token。与 antd 逐字一致：空。 */
export type ColComponentToken = Record<string, never>;

/** 与 antd 的 `prepareRowComponentToken` 逐字对应。 */
export const prepareRowComponentToken = (_token?: AliasToken): Partial<RowComponentToken> => ({});

/** 与 antd 的 `prepareColComponentToken` 逐字对应。 */
export const prepareColComponentToken = (_token?: AliasToken): Partial<ColComponentToken> => ({});
