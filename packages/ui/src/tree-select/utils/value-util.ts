/**
 * TreeSelect 的值/字段工具（rc `utils/valueUtil.js` 的 Vue 等价物）。
 *
 * ⚠️ 关键判据：TreeSelect 的 fieldNames 默认 **key === value**（`fillFieldNames`
 * 返回 `key: value || 'value'`），与 Tree 的 fieldNames 语义不同——树数据里
 * `value` 字段同时充当树的 key。
 */

import type { BasicDataNode, TreeKey } from '../../tree/interface';

export type RawValue = string | number;

export interface TreeSelectFieldNames {
  value?: string;
  label?: string;
  children?: string;
}

export interface FilledFieldNames {
  _title: string[];
  value: string;
  key: string;
  children: string;
}

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function fillFieldNames(fieldNames?: TreeSelectFieldNames | null): FilledFieldNames {
  const { label, value, children } = fieldNames || {};
  return {
    _title: label ? [label] : ['title', 'label'],
    value: value || 'value',
    key: value || 'value',
    children: children || 'children',
  };
}

/** rc `isCheckDisabled`：disabled / disableCheckbox / checkable === false 都算。 */
export function isCheckDisabled(node: BasicDataNode | null | undefined): boolean {
  if (!node) return false;
  const n = node as BasicDataNode & {
    disabled?: boolean;
    disableCheckbox?: boolean;
    checkable?: boolean | unknown;
  };
  return !!(n.disabled || n.disableCheckbox || n.checkable === false);
}

export function isNil(val: unknown): val is null | undefined {
  return val === null || val === undefined;
}

/** 收集全部父节点 key（搜索时展开用）。 */
export function getAllKeys(treeData: BasicDataNode[], fieldNames: FilledFieldNames): TreeKey[] {
  const keys: TreeKey[] = [];
  const dig = (list: BasicDataNode[]): void => {
    list.forEach((item) => {
      const record = item as unknown as Record<string, unknown>;
      const children = record[fieldNames.children] as BasicDataNode[] | undefined;
      if (children) {
        keys.push(record[fieldNames.value] as TreeKey);
        dig(children);
      }
    });
  };
  dig(treeData);
  return keys;
}
