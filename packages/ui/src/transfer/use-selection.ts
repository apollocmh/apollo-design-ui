/**
 * useSelection —— 左右两列的勾选键状态（`selectedKeys` 受控 + 内部维护）。
 *
 * 契约来源：antd 6.6.4 `es/transfer/hooks/useSelection.js`（**机械移植**）。
 *
 * 上游存的是**一份合并数组**（source + target 拼接），左右各自的键按数据源 key 集合
 * 过滤出来；数据源变化时把不存在的键清掉（flattenKeys 序列化做依赖去重）。
 *
 * ⚠️ `setSourceSelectedKeys` / `setTargetSelectedKeys` 上游用 `useEvent` 包裹
 *    （恒定引用 + 恒读到最新值）。Vue 里 setter 直接闭包读 computed，天然等效。
 */

import { useControlledValue } from '@apollo-design/utils';
import type { Ref } from 'vue';
import { computed, watch } from 'vue';
import type { TransferItem, TransferKey } from './interface';

const EMPTY_KEYS: TransferKey[] = [];

const groupKeysSet = (keys: TransferKey[]) => new Set(keys);

function filterKeys(keys: TransferKey[], dataKeys: Set<TransferKey>): TransferKey[] {
  const filteredKeys = keys.filter((key) => dataKeys.has(key));
  return keys.length === filteredKeys.length ? keys : filteredKeys;
}

function flattenKeys(keys: Set<TransferKey>): string {
  return JSON.stringify(Array.from(keys, (key) => [typeof key, String(key)]));
}

export function useSelection(
  leftDataSource: Ref<TransferItem[]>,
  rightDataSource: Ref<TransferItem[]>,
  selectedKeys: Ref<TransferKey[] | undefined>,
): [
  Ref<TransferKey[]>,
  Ref<TransferKey[]>,
  (nextSrcKeys: TransferKey[]) => void,
  (nextTargetKeys: TransferKey[]) => void,
] {
  // Prepare `dataSource` keys
  const leftKeys = computed(() => groupKeysSet(leftDataSource.value.map((src) => src?.key)));
  const rightKeys = computed(() => groupKeysSet(rightDataSource.value.map((src) => src?.key)));

  // Selected Keys
  const [mergedSelectedKeys, setMergedSelectedKeys] = useControlledValue<TransferKey[]>({
    defaultValue: EMPTY_KEYS,
    getValue: () => selectedKeys.value,
  });

  const sourceSelectedKeys = computed(() => filterKeys(mergedSelectedKeys.value, leftKeys.value));
  const targetSelectedKeys = computed(() => filterKeys(mergedSelectedKeys.value, rightKeys.value));

  // Reset when data changed（⚠️ 依赖是「键集合的序列化」，不是数组引用）
  const leftKeySig = computed(() => flattenKeys(leftKeys.value));
  const rightKeySig = computed(() => flattenKeys(rightKeys.value));
  watch([leftKeySig, rightKeySig], () => {
    setMergedSelectedKeys([
      ...filterKeys(mergedSelectedKeys.value, leftKeys.value),
      ...filterKeys(mergedSelectedKeys.value, rightKeys.value),
    ]);
  });

  // Update keys
  const setSourceSelectedKeys = (nextSrcKeys: TransferKey[]) => {
    setMergedSelectedKeys([...nextSrcKeys, ...targetSelectedKeys.value]);
  };
  const setTargetSelectedKeys = (nextTargetKeys: TransferKey[]) => {
    setMergedSelectedKeys([...sourceSelectedKeys.value, ...nextTargetKeys]);
  };

  return [sourceSelectedKeys, targetSelectedKeys, setSourceSelectedKeys, setTargetSelectedKeys];
}
