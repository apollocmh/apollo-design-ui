/**
 * 通知内核的小工具。
 *
 * `clsx` 的等价物：本仓没有 `clsx` 依赖（R7），而 Vue 的 `class` 数组只对**元素**
 * 生效 —— 传给**子组件**的 `className` prop 必须是字符串，否则会触发类型告警。
 */
export function clsx(...values: unknown[]): string {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (!v) return;
    if (typeof v === 'string') {
      if (v !== '') out.push(v);
    } else if (typeof v === 'number') {
      out.push(String(v));
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (typeof v === 'object') {
      for (const [k, on] of Object.entries(v)) {
        if (on && k) out.push(k);
      }
    }
  };
  values.forEach(walk);
  return out.join(' ');
}
