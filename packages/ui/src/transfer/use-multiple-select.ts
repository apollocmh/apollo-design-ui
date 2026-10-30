/**
 * useMultipleSelect —— 按住 shift 键的区间多选。
 *
 * 契约来源：antd 6.6.4 `es/_util/hooks/useMultipleSelect.js`（**机械移植**）。
 * Section owns the filtered view and its selection anchor.
 */

import { ref } from 'vue';
import type { TransferItem, TransferKey } from './interface';

type Item = TransferItem;

export function useMultipleSelect(getKey: (item: Item) => TransferKey) {
  const anchorKey = ref<TransferKey | null>(null);

  const multipleSelect = (
    currentSelectedIndex: number,
    data: Item[],
    selectedKeys: Set<TransferKey>,
  ): TransferKey[] => {
    const previousIndex = data.findIndex((item) => getKey(item) === anchorKey.value);
    const configPrevSelectedIndex = previousIndex < 0 ? currentSelectedIndex : previousIndex;
    // add/delete the selected range
    const startIndex = Math.min(configPrevSelectedIndex, currentSelectedIndex);
    const endIndex = Math.max(configPrevSelectedIndex, currentSelectedIndex);
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
    const lastItem = data[endIndex];
    anchorKey.value = shouldSelected && lastItem ? getKey(lastItem) : null;
    return changedKeys;
  };

  const setAnchor = (value: TransferKey | null) => {
    anchorKey.value = value;
  };

  return [multipleSelect, setAnchor] as const;
}
