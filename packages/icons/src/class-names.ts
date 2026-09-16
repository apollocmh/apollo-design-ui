/**
 * 类名拼接。语义等价于 `@ant-design/icons` 用的 `clsx`。
 *
 * 为什么不引 `clsx`：它只有 200 字节，为它增加一条依赖（还要进 catalog）不划算；
 * 而 Vue 侧的公开 API 里没有 `clsx` 的等价物（`normalizeClass` 只在 `@vue/shared` 内部，
 * 未从 `vue` 导出 —— 已实测 `vue@3.5.42` 的 `dist/vue.d.ts` 里查不到）。
 *
 * 覆盖 `clsx` 在本包用到的全部形态：字符串、数字、对象（值为真才取键）、嵌套数组、假值跳过。
 */

/** 可参与拼接的类名取值。 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, unknown>
  | readonly ClassValue[];

/** 把任意形态的类名取值拼成一个以空格分隔的字符串。 */
export function classNames(...values: readonly ClassValue[]): string {
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
      continue;
    }
    if (Array.isArray(value)) {
      const nested = classNames(...value);
      if (nested) parts.push(nested);
      continue;
    }
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) parts.push(key);
    }
  }
  return parts.join(' ');
}
