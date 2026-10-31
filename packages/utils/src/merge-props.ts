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

type Mergeable = object | null | undefined;
type Keys<T> = T extends object ? keyof T : never;
type Value<T, K> = T extends object ? (K extends keyof T ? T[K] : undefined) : undefined;
type DefinedKeys<T> = [T] extends [object]
  ? {
      [K in keyof T]-?: Partial<Pick<T, K>> extends Pick<T, K>
        ? never
        : undefined extends T[K]
          ? never
          : K;
    }[keyof T]
  : never;
type Values<A, B> = {
  [K in Extract<Keys<A> | Keys<B>, string | number>]:
    | Exclude<Value<B, K>, undefined>
    | (undefined extends Value<B, K> ? Exclude<Value<A, K>, undefined> : never);
};
type ResultShape<A, B> = Pick<
  Values<A, B>,
  Extract<DefinedKeys<A> | DefinedKeys<B>, keyof Values<A, B>>
> &
  Partial<Omit<Values<A, B>, DefinedKeys<A> | DefinedKeys<B>>>;
type Merged<A, B> = { [K in keyof ResultShape<A, B>]: ResultShape<A, B>[K] };

export default function mergeProps<A extends Mergeable, B extends Mergeable>(
  a: A,
  b: B,
): Merged<A, B>;
export default function mergeProps<A extends Mergeable, B extends Mergeable, C extends Mergeable>(
  a: A,
  b: B,
  c: C,
): Merged<Merged<A, B>, C>;
export default function mergeProps<
  A extends Mergeable,
  B extends Mergeable,
  C extends Mergeable,
  D extends Mergeable,
>(a: A, b: B, c: C, d: D): Merged<Merged<Merged<A, B>, C>, D>;
export default function mergeProps(...items: Mergeable[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const item of items) {
    if (!item) continue;
    // 只遍历自身可枚举字符串键 —— 不含 Symbol、不含原型链。
    for (const key of Object.keys(item)) {
      const value: unknown = Reflect.get(item, key);
      if (value !== undefined) {
        Object.defineProperty(result, key, {
          value,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    }
  }
  return result;
}
