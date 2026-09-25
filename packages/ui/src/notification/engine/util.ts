/**
 * 通知内核的小工具。
 *
 * `clsx` 的等价物：本仓没有 `clsx` 依赖（R7），而 Vue 的 `class` 数组只对**元素**
 * 生效 —— 传给**子组件**的 `className` prop 必须是字符串，否则会触发类型告警。
 */
export function clsx(...values: unknown[]): string {
  return values.filter((v) => typeof v === 'string' && v !== '').join(' ');
}
