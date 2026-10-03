/**
 * useMultipleSelect —— 按住 shift 键的区间多选。
 *
 * 契约来源：antd 6.6.4 `es/_util/hooks/useMultipleSelect.js`（**机械移植**）。
 * 唯一消费者：Transfer 的 `onItemSelect`（shift 点击时对区间做勾选/取消）。
 */

import { ref } from 'vue';
import type { TransferItem, TransferKey } from './interface';

type Item = TransferItem;

export function useMultipleSelect(getKey: (item: Item) => TransferKey) {
  const prevSelectedIndex = ref<number | null>(null);

  const multipleSelect = (
    currentSelectedIndex: number,
    data: Item[],
    selectedKeys: Set<TransferKey>,
  ): TransferKey[] => {
    const configPrevSelectedIndex = prevSelectedIndex.value ?? currentSelectedIndex;
    // add/delete the selected range
    const startIndex = Math.min(configPrevSelectedIndex ?? 0, currentSelectedIndex);
    const endIndex = Math.max(configPrevSelectedIndex ?? 0, currentSelectedIndex);
    const rangeKeys = data.slice(startIndex, endIndex + 1).map(getKey);
    const shouldSelected = rangeKeys.some((rangeKey) => !selectedKeys.has(rangeKey));
    const changedKeys: TransferKey[] = [];
    rangeKeys.forEach((item) => {
      if (shouldSelected) {
        if (!selectedKeys.has(item)) {
          changedKeys.push(item);
        }
        selectedKeys.add(item);
      } else {
        selectedKeys.delete(item);
        changedKeys.push(item);
      }
    });
    prevSelectedIndex.value = shouldSelected ? endIndex : null;
    return changedKeys;
  };

  const setPrevSelectedIndex = (value: number | null) => {
    prevSelectedIndex.value = value;
  };

  return [multipleSelect, setPrevSelectedIndex] as const;
}
