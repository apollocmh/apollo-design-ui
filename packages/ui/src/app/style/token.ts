/**
 * App 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/app/style/index.ts`：
 *
 * ```js
 * // biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
export const prepareComponentToken = () => ({});
export default genStyleHooks('App', genBaseStyle, prepareComponentToken);
 * ```
 *
 * **App 没有 Component Token**（registry 数据：`tokenCount = 0`）——
 * 上游的 `ComponentToken` 是**空接口**，`prepareComponentToken` 恒返回 `{}`
 * ⇒ 组件样式只消费**全局 alias**（`colorText` / `fontSize` / `lineHeight` / `fontFamily`）。
 *
 * 本文件保留 `prepareComponentToken`（返回空对象）以维持与其它组件一致的导出面，
 * 供 registry 的 tokens 清单与「Component Token → CSS 变量」管线统一处理。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * App 的 Component Token。与上游逐字对齐：**空类型**。
 *
 * （上游用空接口 + 默认 `prepareComponentToken` 表达「该组件无 Component Token」；
 * 这里用同构的空类型，避免引入无意义的占位字段 —— masonry / flex 同判。）
 */
export type ComponentToken = Record<string, never>;

/** 与上游的默认 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
