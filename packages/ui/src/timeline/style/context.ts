/**
 * Timeline 样式生成器的**共享上下文**。
 *
 * 为什么需要它：上游把纵向（`style/index.ts`）与横向（`style/horizontal.ts`）拆成两个文件，
 * 后者需要前者的三个变量构造器（全局 token / 组件 token / **Steps 的内部变量**）。
 * 本仓照同样的文件切分，于是把三个构造器与两个前缀打包成一个对象传递 —— 避免
 * 「横向文件自己重新拼变量名」而引入拼写漂移。
 */

/** 三个变量构造器 + 两个前缀。 */
export interface TimelineStyleContext {
  /** 组件前缀（`apollo` / `ant`）。 */
  p: string;
  /** 根类名（`.apollo-timeline`）。 */
  cls: string;
  /** 全局 token → `var(--apollo-*)`。 */
  v: (token: string) => string;
  /** 组件 token → `var(--apollo-timeline-*)`。 */
  tv: (name: string) => string;
  /**
   * **Steps 的内部变量** → `var(--apollo-cmp-steps-*)`。
   *
   * 🚨 这是 `Timeline` 复用 `Steps` 的**唯一耦合面**：Timeline 的样式表大量
   * **覆盖** Steps 的中间变量（`--{p}-cmp-steps-*`）来把「步骤条」改造成「时间轴」。
   * ⚠️ 变量名前缀是 **`cmp-steps`**（不是 `steps`）—— 与 `Steps.ts` 的
   * `--{rootPrefixCls}-cmp-steps-items-offset` 同一套命名。
   */
  sv: (name: string) => string;
}
