/**
 * Table 的纯函数工具（antd 6.6.4 `components/table/util.ts`，72 行）—— **逐字移植**。
 *
 * 6 个函数全部是纯函数 ⇒ L1 直测（`__tests__/util.test.ts`）。
 */

import { isFunction, isNonNullable, isPlainObject } from '@apollo-design/utils';
import type { SizeType } from '../config-provider/size-context';

/** 分页的方位（`top`/`bottom` 与 `start`/`end` 两套写法并存）。 */
export type TablePaginationPlacement =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight';
export type TablePaginationPosition = 'top' | 'bottom';

/** 归一化后的方位（三值）。 */
export type NormalizedPlacement = 'start' | 'center' | 'end';

/** 列 key 的三种来源（只列用到的字段）。 */
export interface KeyableColumn {
  key?: unknown;
  dataIndex?: unknown;
}

/**
 * 取列 key：`key` → `dataIndex`（数组用 `.` 连接）→ `defaultKey`。
 *
 * ⚠️ 判据是 **`'key' in column && isNonNullable(column.key)`** ——
 *    `key: 0` / `key: ''` 都算「给了」（`0` 是合法的 `Key`）。
 */
export function getColumnKey<RecordType>(
  column: KeyableColumn & Partial<RecordType>,
  defaultKey: string,
): string | number {
  if ('key' in column && isNonNullable(column.key)) {
    return column.key as string | number;
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex)
      ? (column.dataIndex as unknown[]).join('.')
      : (column.dataIndex as string | number);
  }
  return defaultKey;
}

/** 列位字符串：`pos` 存在时是 `pos-index`，否则是 `index`。 */
export function getColumnPos(index: number, pos?: string): string {
  return pos ? `${pos}-${index}` : `${index}`;
}

/** 渲染列标题：函数则调用，否则原样返回。 */
export function renderColumnTitle(title: unknown, props: unknown): unknown {
  if (isFunction(title)) {
    return (title as (p: unknown) => unknown)(props);
  }
  return title;
}

/**
 * 「安全」的列标题 —— 渲染结果若是**对象或数组**则返回 `''`。
 *
 * 用途：`aria-label` 这类**必须是字符串**的位置。直接把 vnode/对象塞进去会渲染成
 * `[object Object]`。
 */
export function safeColumnTitle(title: unknown, props: unknown): unknown {
  const result = renderColumnTitle(title, props);
  if (isPlainObject(result) || Array.isArray(result)) {
    return '';
  }
  return result;
}

/**
 * 把 6 种方位归一成 3 种。
 *
 * 判据（顺序即语义）：**先判 `center`**，再看有没有 `left`/`start`，否则 `end`。
 * ⚠️ `toLowerCase()` 之后判断 ⇒ 大小写不敏感。
 */
export function normalizePlacement(
  pos: TablePaginationPlacement | TablePaginationPosition,
): NormalizedPlacement {
  const lowerPos = pos.toLowerCase();
  if (lowerPos.includes('center')) {
    return 'center';
  }
  return lowerPos.includes('left') || lowerPos.includes('start') ? 'start' : 'end';
}

/**
 * 分页的尺寸：显式优先；`small` / `medium` 表 ⇒ `small`；其余 `undefined`（用 Pagination 默认）。
 *
 * ⚠️ `middle` **不在**判据里（antd 的 `mergedSize` 已被归一成 `medium`）。
 */
export function getPaginationSize(
  paginationSize: SizeType | undefined,
  mergedSize: SizeType | undefined,
): SizeType | undefined {
  if (paginationSize) {
    return paginationSize;
  }
  if (mergedSize === 'small' || mergedSize === 'medium') {
    return 'small';
  }
  return undefined;
}
