/**
 * 测试用的非空断言替代 —— `need(value, 上下文)`。
 *
 * ## 为什么需要它
 *
 * `biome` 把非空断言 `!` 列为 error（`lint/style/noNonNullAssertion`），所以
 * `const [node] = contractOf(html)` 之后不能写 `node!.attrs`。
 * 但**换成断言不是修法，只是把问题藏起来** —— 真正的问题是：
 *
 * ```ts
 * const [node] = contractOf(html);
 * expect(node!.attrs).toEqual([]);   // 失败了只报 "Cannot read properties of undefined"
 * ```
 *
 * 这条断言失败时，你看不出**是哪一段 HTML** 没产出节点。而 `need()` 会把上下文
 * 带进错误信息：
 *
 * ```ts
 * expect(need(node, `contractOf(${html})`).attrs).toEqual([]);
 * // → 断言失败：contractOf(<div …>) 应当存在，实际为 undefined
 * ```
 *
 * ## 为什么不放进包的公开 API
 *
 * 这是**测试自己**的辅助，不是给组件测试用的共享契约（T2 说的复用是后者）。
 * 放进 `index.ts` 会让 `@apollo-design/test-utils` 的公开面无谓地变大。
 *
 * @param value 待判空的值
 * @param what 用于错误信息的上下文（建议把输入 HTML / 表达式原样传进来）
 * @throws 值为 `undefined` 或 `null` 时抛错 —— 这是**断言失败**，不是运行时异常
 */
export function need<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) {
    throw new Error(`断言失败：${what} 应当存在，实际为 ${String(value)}`);
  }
  return value;
}
