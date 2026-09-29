/**
 * `useShowSizeChanger` —— rc `useShowSizeChanger.js`（12 行）的 Vue 等价物。
 *
 * 判据（antd `Pagination.js` 用它做**双源合并**）：
 * ```
 * typeof showSizeChanger === 'boolean'  ⇒ [该布尔, {}]
 * isPlainObject(showSizeChanger)        ⇒ [true, 该对象]     // 对象 ⇒ 视为启用 + 透传 Select props
 * 其它（未传）                          ⇒ [undefined, undefined]
 * ```
 * 合并：`merged = props 的结果 ?? ConfigProvider 的结果`（**`??` 而不是布尔或**），
 * 最后 rc 兜底 `total > totalBoundaryShowSizeChanger`。
 */

import type { SelectProps } from '../select';

/** 判断「普通的对象字面量」（rc 的 `isPlainObject`）。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export type ShowSizeChangerInput = boolean | SelectProps | undefined;

/** 返回 `[是否启用, Select props]`（未传时为 `[undefined, undefined]`）。 */
export function useShowSizeChanger(
  showSizeChanger: ShowSizeChangerInput,
): [boolean | undefined, SelectProps | undefined] {
  if (typeof showSizeChanger === 'boolean') {
    return [showSizeChanger, {} as SelectProps];
  }
  if (isPlainObject(showSizeChanger)) {
    return [true, showSizeChanger as SelectProps];
  }
  return [undefined, undefined];
}
