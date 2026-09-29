/**
 * DirectoryTree 的范围选择工具（antd `utils/dictUtil.js` 的逐字移植）。
 *
 * rc 判据：
 *   - calcRangeKeys：沿树先序遍历，在 start/end 两个 key 之间收 keys；
 *     只「进入」expandedKeys 里的子树（性能判据）；record 状态机 NONE→START→END。
 *   - convertDirectoryKeysToNodes：先序遍历反查 keys 对应的原始数据节点。
 */

import type { TreeFieldNames } from '../interface';
import type { BasicDataNodeLike } from './keyUtil';
import { fillFieldNames } from './treeUtil';

const RECORD_NONE = 0;
const RECORD_START = 1;
const RECORD_END = 2;

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function traverseNodesKey<T extends BasicDataNodeLike>(
  treeData: T[] | undefined,
  callback: (key: T[keyof T] | undefined, node: T) => boolean | undefined,
  fieldNames: Required<TreeFieldNames> & { _title: string[] },
): void {
  const { key: fieldKey, children: fieldChildren } = fieldNames;
  function processNode(dataNode: T): void {
    const record = dataNode as unknown as Record<string, unknown>;
    const key = record[fieldKey];
    const children = record[fieldChildren] as T[] | undefined;
    if (callback(key as never, dataNode) !== false) {
      traverseNodesKey(children ?? [], callback, fieldNames);
    }
  }
  (treeData ?? []).forEach(processNode);
}

/** 计算选中范围，只考虑 expanded 情况以优化性能（rc 判据）。 */
export function calcRangeKeys({
  treeData,
  expandedKeys,
  startKey,
  endKey,
  fieldNames,
}: {
  treeData: BasicDataNodeLike[];
  expandedKeys: (string | number)[];
  startKey?: string | number | null;
  endKey?: string | number | null;
  fieldNames?: TreeFieldNames;
}): (string | number)[] {
  const keys: (string | number)[] = [];
  let record = RECORD_NONE;
  if (!isNonNullable(startKey) || !isNonNullable(endKey)) {
    return [];
  }
  if (startKey === endKey) {
    return [startKey];
  }

  function matchKey(key: string | number): boolean {
    return key === startKey || key === endKey;
  }
  traverseNodesKey(
    treeData,
    (key) => {
      if (record === RECORD_END) {
        return false;
      }
      if (matchKey(key as string | number)) {
        // Match test
        keys.push(key as string | number);
        if (record === RECORD_NONE) {
          record = RECORD_START;
        } else if (record === RECORD_START) {
          record = RECORD_END;
          return false;
        }
      } else if (record === RECORD_START) {
        // Append selection
        keys.push(key as string | number);
      }
      return expandedKeys.includes(key as string | number);
    },
    fillFieldNames(fieldNames),
  );
  return keys;
}

/** keys → 原始数据节点（DirectoryTree select 事件的 [Legacy] selectedNodes）。 */
export function convertDirectoryKeysToNodes<T extends BasicDataNodeLike>(
  treeData: T[],
  keys: (string | number)[],
  fieldNames?: TreeFieldNames,
): T[] {
  const restKeys = [...keys];
  const nodes: T[] = [];
  traverseNodesKey(
    treeData,
    (key, node) => {
      const index = restKeys.indexOf(key as string | number);
      if (index !== -1) {
        nodes.push(node);
        restKeys.splice(index, 1);
      }
      return !!restKeys.length;
    },
    fillFieldNames(fieldNames),
  );
  return nodes;
}
