/**
 * `@rc-component/table@1.11.1` 的 `es/utils/valueUtil.js`（29 行）—— **逐字移植**。
 */

/** 列 key 的兜底前缀（上游同名字面量）。 */
const INTERNAL_KEY_PREFIX = 'RC_TABLE_KEY';

/** `undefined` / `null` ⇒ `[]`；非数组 ⇒ 包成单元素数组。 */
function toArray<T>(arr: T | T[] | undefined | null): T[] {
  if (arr === undefined || arr === null) return [];
  return Array.isArray(arr) ? arr : [arr];
}

/**
 * 给每一列算一个**唯一**的 key（供 `<col>` / React key / `data-menu-id` 用）。
 *
 * 三条判据（逐字）：
 *  1. `key || toArray(dataIndex).join('-' )`（`dataIndex` 可以是数组）→ 都没有则用
 *     `'RC_TABLE_KEY'`；
 *     ⚠️ 是**真值**判据（不是 `validateValue`）⇒ **`key: 0` / `key: ''` 会**往下落**
 *     到 `dataIndex` / `RC_TABLE_KEY`**（实测：本文件自己的 L1 用例先写错了期望，
 *     被测试抓出来）。别「顺手」改成 `isNonNullable`。
 *  2. **冲突时不断追加 `_next`**（`a` → `a_next` → `a_next_next`…）——
 *     注意是 `while` 循环，不是加一个后缀就算；
 *  3. 判重表是**本次调用内**的（同一批 columns 内唯一，跨调用不保证）。
 *
 * ⚠️ 上游的 `keys` 是普通对象字面量 ⇒ 键 `__proto__` 会命中原型链（`keys[__proto__]`
 *    是 truthy）⇒ 该列会被立刻改名。本仓用 `Object.create(null)` 避开这个边界，
 *    差异只在这一个病态键名上（**登记为 INTENDED**）。
 */
export function getColumnsKey(
  columns: readonly (Record<string, unknown> | undefined | null)[],
): string[] {
  const columnKeys: string[] = [];
  const keys: Record<string, boolean> = Object.create(null);
  for (const column of columns) {
    const { key, dataIndex } = column || {};
    let mergedKey =
      (key as string | undefined) ||
      toArray(dataIndex as string | string[] | undefined).join('-') ||
      INTERNAL_KEY_PREFIX;
    while (keys[mergedKey]) {
      mergedKey = `${mergedKey}_next`;
    }
    keys[mergedKey] = true;
    columnKeys.push(mergedKey);
  }
  return columnKeys;
}

/**
 * 与 antd / rc 同名的「有没有给值」判据。
 *
 * 🚨 **这是 Table 里最重要的一个判据**：`0` / `` / `false` 都算「给了」，
 * 只有 `null` / `undefined` 算「没给」。受控判定全靠它 ⇒ **别改成真值判断**。
 */
export function validateValue<T>(val: T | null | undefined): val is T {
  return val !== null && val !== undefined;
}

/** `typeof number && !NaN`（`scroll.x/y` 的数字形态判据）。 */
export function validNumberValue(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}
