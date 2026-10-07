/**
 * `clsx` 的等价物（本仓没有 `clsx` 依赖 —— R7：发布包零 `@ant-design/*`，也不引第三方）。
 *
 * ── 为什么它必须在这里 ────────────────────────────────────────────────────────
 *
 * 2026-10-07 之前它定义在 `packages/ui/src/notification/engine/util.ts`，
 * 而被 **20 个文件 / 8 个组件**跨目录 import（`tree` ×6、`table` ×5、`progress` ×4、
 * `transfer`、`steps`、`float-button`、`message` ×2、`notification` 自己）。
 * 那违反 `packages/ui/README.md` 的合同
 * 「组件间不得互相 import 组件目录；共享 context 与工具必须放在 `src/_internal/`」。
 *
 * 搬到这里是裁决 `early-extract-table-core-tree-core` = **C** 的同一条准则：
 * **消费者 ≥2 且无视觉语义 ⇒ 放共享层**。
 *
 * ── 为什么需要它（而不是用 Vue 的 class 数组）─────────────────────────────────
 *
 * Vue 的 `class` **数组**只对**元素**生效；传给**子组件**的 `class` prop 必须是
 * 字符串，否则会触发类型告警。所以子组件边界上需要一个拼字符串的 clsx。
 *
 * ⚠️ **支持对象参数**（`{ [k]: on }`）—— `steps/Steps.ts` 曾有一条注释说本仓 clsx
 *    「不支持对象参数」，那是**过期的**：下面的实现有 object 分支。已按实订正。
 */

/** 把任意个 class 值拼成一个字符串。falsy / 空串被丢弃。 */
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
