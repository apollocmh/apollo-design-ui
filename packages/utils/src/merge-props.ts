/**
 * `mergeProps` —— 合并多个 props 对象，**跳过值为 `undefined` 的键**。
 *
 * 契约来源：`@rc-component/util/mergeProps`。
 *
 * 与 `Object.assign` / `{...a, ...b}` 的唯一区别就是「跳过 undefined」。
 * 这个区别非常关键：组件常这样用 ——
 *
 *   mergeProps(defaultProps, props, { className: clsx(...) })
 *
 * 如果 `props` 里某个键存在但值是 `undefined`（父组件显式传了 `undefined`），
 * `Object.assign` 会用 `undefined` 覆盖掉前面的默认值，而 `mergeProps` 不会。
 *
 * 反过来说：`null` / `0` / `''` / `false` **会**覆盖（只有 `undefined` 被跳过）。
 */

type Mergeable = Record<string, unknown> | null | undefined;

export default function mergeProps<A, B>(a: A, b: B): B & A;
export default function mergeProps<A, B, C>(a: A, b: B, c: C): C & B & A;
export default function mergeProps<A, B, C, D>(a: A, b: B, c: C, d: D): D & C & B & A;
export default function mergeProps(...items: Mergeable[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const item of items) {
    if (!item) continue;
    // 只遍历自身可枚举字符串键 —— 不含 Symbol、不含原型链。
    for (const key of Object.keys(item)) {
      const value = item[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}
