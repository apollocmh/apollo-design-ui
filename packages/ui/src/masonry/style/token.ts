/**
 * Masonry 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/masonry/style/index.js`：
 *
 * ```js
 * // biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
 * export interface ComponentToken {}
 * export default genStyleHooks('Masonry', genMasonryStyle);
 * ```
 *
 * **Masonry 没有 Component Token**（registry 数据：`tokenCount = 0`）——
 * 上游的 `ComponentToken` 是**空接口**，且 `genStyleHooks` 没传 `prepareComponentToken`
 * ⇒ 走默认实现（返回空对象）。
 *
 * ⚠️ 与 Flex 的关键差别：Flex 至少还有三个 `mergeToken` 派生值（`flexGapSM/FlexGap/FlexGapLG`），
 * **Masonry 连派生值都没有** —— `genMasonryStyle` 只消费**全局 alias**：
 * `motionDurationSlow` / `motionDurationFast` / `motionEaseOut`。
 *
 * 本文件保留 `prepareComponentToken`（返回空对象）以维持与其它组件一致的导出面，
 * 供 registry 的 tokens 清单与「Component Token → CSS 变量」管线统一处理。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * Masonry 的 Component Token。与上游逐字对齐：**空类型**。
 *
 * （上游用空接口 + 默认 `prepareComponentToken` 表达「该组件无 Component Token」；
 * 这里用同构的空类型，避免引入无意义的占位字段 —— flex 同判。）
 */
export type ComponentToken = Record<string, never>;

/** 与上游的默认 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
