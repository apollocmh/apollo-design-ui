/**
 * Breadcrumb 的组件内上下文（上游 `es/breadcrumb/BreadcrumbContext.ts` 的
 * `BreadcrumbContext`）。
 *
 * React 侧是 `React.createContext<BreadcrumbContextProps>({})`；Vue 的对应物是
 * `InjectionKey` + `provide` / `inject`。
 *
 * ── 🚨 为什么提供的是 `reactive` 对象（而不是每帧新建一个）────────────────────
 *
 * 上游用 `useMemo(() => ({ classNames, styles }), [mergedClassNames, mergedStyles])`
 * —— 值**身份**变化时 React 的消费者会重渲染。
 *
 * Vue 里没有这回事：`inject` 只在 `setup` 期解析**一次**，之后拿到的是同一个对象。
 * ⇒ 子组件（`BreadcrumbItem` / `BreadcrumbSeparator`）要在语义化槽变化时跟着变，
 *    就必须**读到被追踪的响应式值**。
 * ⇒ 本仓提供一个**身份稳定**的 `reactive` 对象，用一个 `watchEffect` 把最新的值
 *    `Object.assign` 进去（与 `Anchor` 的 `context.ts` **同一手法**）。
 *
 * ⚠️ 这是「Vue 的 provide 是快照」这一族差异的又一例（PITFALLS 20 / D27）。
 *
 * ── 为什么 context 里**只有**语义化两个槽 ──────────────────────────────────
 *
 * 上游的 `BreadcrumbContextProps` 就只有 `classNames` / `styles`：
 * `prefixCls` 走 **`ConfigContext`**（不是本 context），`separator` / `dropdownIcon`
 * 走 **prop 逐级下传**。别把这三样塞进来 —— 那会与上游的层级判断错位
 * （L4 的层数/类名断言会红）。
 */

import type { InjectionKey } from 'vue';
import type { BreadcrumbSemanticClassNames, BreadcrumbSemanticStyles } from './interface';

/** 上游 `BreadcrumbContextProps` 的 Vue 对应物。 */
export interface BreadcrumbContextValue {
  classNames?: BreadcrumbSemanticClassNames | undefined;
  styles?: BreadcrumbSemanticStyles | undefined;
}

/** 注入键。用 Symbol 避免与用户自己的 provide 键冲突。 */
export const breadcrumbContextKey: InjectionKey<BreadcrumbContextValue> =
  Symbol('apolloBreadcrumb');
