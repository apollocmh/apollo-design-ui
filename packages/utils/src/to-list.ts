/**
 * `toList` / `capitalize`。
 *
 * 契约来源：antd `es/_util/toList.js` 与 `es/_util/capitalize.js`（antd 自己的 `_util`）。
 * 两者都极小，但使用面不算窄（`toList` 4 处、`capitalize` 1 处），且框架无关，
 * 放在 L0 比复制到 `ui` 更合适。
 */

import { isNonNullable } from './is';

export interface ToListConfig {
  /**
   * 为 `true` 时，`null` / `undefined` 输入返回**空数组**而不是 `[null]`。
   *
   * ⚠️ 注意判定用的是 `isNonNullable`：`0` / `''` / `false` **不算空**，
   *    所以 `toList('', { skipEmpty: true })` 返回 `['']`。这是 antd 的既定行为。
   */
  skipEmpty?: boolean;
}

/** 把单值或数组统一成数组。 */
export default function toList<T>(val: T | T[], config: ToListConfig = {}): T[] {
  if (!isNonNullable(val) && config.skipEmpty) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

/**
 * 首字母大写。非字符串输入**原样返回**（不抛错、不 `String()` 转换）。
 *
 * 与 `String.prototype.toUpperCase()` 的差异：只作用于第一个字符，其余部分保持原样。
 */
export function capitalize<T>(str: T): T {
  if (typeof str !== 'string') {
    return str;
  }
  return (str.charAt(0).toUpperCase() + str.slice(1)) as unknown as T;
}
