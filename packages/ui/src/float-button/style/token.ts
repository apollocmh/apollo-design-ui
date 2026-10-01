/**
 * FloatButton 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/float-button/style/index.ts`：
 *
 * ```js
 * export type ComponentToken = object;
export const prepareComponentToken = () => ({});
export default genStyleHooks('FloatButton', (token) => { … mergeToken … }, prepareComponentToken);
 * ```
 *
 * **Float-button 没有 Component Token**（registry 数据：`tokenCount = 0`）——
 * ⚠️ **要区分两个东西**：上游有内部派生类型 `FloatButtonToken`
 * （`floatButtonSize` / `floatButtonIconSize` / `floatButtonInsetBlockEnd` /
 * `floatButtonInsetInlineEnd`，由 `mergeToken` 从全局 token 算出），
 * 但 `prepareComponentToken` 恒返回 `{}` ⇒ 那 4 个值**用户不可覆盖**
 * ⇒ 计入 registry 的 Component Token 数是 **0**。
 * 本仓同判：4 个派生值在 `style/index.ts` 里手写（`calc` 展开），**不进**本文件。
 *
 * 本文件保留 `prepareComponentToken`（返回空对象）以维持与其它组件一致的导出面，
 * 供 registry 的 tokens 清单与「Component Token → CSS 变量」管线统一处理。
 */

import type { AliasToken } from '@apollo-design/theme';

/**
 * FloatButton 的 Component Token。与上游逐字对齐：**空类型**。
 *
 * （上游用空接口 + 默认 `prepareComponentToken` 表达「该组件无 Component Token」；
 * 这里用同构的空类型，避免引入无意义的占位字段 —— masonry / flex 同判。）
 */
export type ComponentToken = Record<string, never>;

/** 与上游的默认 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});
