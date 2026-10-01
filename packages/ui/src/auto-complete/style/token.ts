/**
 * AutoComplete 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `（**上游没有 `style/` 目录**）`：
 *
 * ```js
 * // antd 的 components/auto-complete/ 下**没有 style/ 目录** ——
// AutoComplete 直接渲染 <Select>，样式全部来自 es/select/style。
// 已核：/tmp/antd-repo/ant-design-master/components/auto-complete/ 只有
// AutoComplete.tsx / index.tsx / demo / __tests__ / 两个 .md
 * ```
 *
 * **AutoComplete 没有 Component Token**（registry 数据：`tokenCount = 0`）——
 * 上游**根本没有 `style/` 目录** —— AutoComplete 渲染的是 `<Select>`，
 * 样式（含 `.{p}-select-*` 全套）来自 **select 包**。
 * ⇒ 本仓同样**没有自有样式模块**（`style/index.ts` 已删除；`watermark` 是「无 style 目录」的先例）。
 *
 * 本文件保留 `prepareComponentToken`（返回空对象）以维持与其它组件一致的导出面，
 * 供 registry 的 tokens 清单与「Component Token → CSS 变量」管线统一处理。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * AutoComplete 的 Component Token。与上游逐字对齐：**空类型**。
 *
 * （上游用空接口 + 默认 `prepareComponentToken` 表达「该组件无 Component Token」；
 * 这里用同构的空类型，避免引入无意义的占位字段 —— masonry / flex 同判。）
 */
export type ComponentToken = Record<string, never>;

/** 与上游的默认 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
