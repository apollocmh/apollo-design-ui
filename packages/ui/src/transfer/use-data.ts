/**
 * useData —— 数据源按 `targetKeys` 拆分左右两列。
 *
 * 契约来源：antd 6.6.4 `es/transfer/hooks/useData.js`（**机械移植**）。
 *
 * ⚠️ 右列顺序按 `targetKeys` 排（不是 dataSource 顺序），左列按 dataSource 顺序；
 *    `targetKeys` 里存在但 dataSource 缺失的 key 会产生空洞，最终 `filter(Boolean)` 兜底
 *    （上游注释：rightData should be ordered by targetKeys）。
 */

import { computed, type Ref } from 'vue';
import type { TransferItem, TransferKey } from './interface';

const groupKeysMap = (keys: TransferKey[]) => {
  const map = new Map<TransferKey, number>();
  keys.forEach((key, index) => {
    map.set(key, index);
  });
  return map;
};

export function useData(
  dataSource: Ref<TransferItem[] | undefined>,
  rowKey: Ref<((record: TransferItem) => TransferKey) | undefined>,
  targetKeys: Ref<TransferKey[] | undefined>,
): [Ref<TransferItem[]>, Ref<TransferItem[]>, Ref<TransferItem[]>] {
  const mergedDataSource = computed<TransferItem[]>(() =>
    (dataSource.value ?? []).map((record) => {
      const rk = rowKey.value;
      if (rk) {
        return { ...record, key: rk(record) };
      }
      return record;
    }),
  );

  const split = computed<[TransferItem[], (TransferItem | undefined)[]]>(() => {
    const leftData: TransferItem[] = [];
    const tks = targetKeys.value ?? [];
    const rightData: (TransferItem | undefined)[] = Array.from({ length: tks.length });
    const targetKeysMap = groupKeysMap(tks);
    mergedDataSource.value.forEach((record) => {
      const idx = targetKeysMap.get(record.key);
      if (idx !== undefined) {
        rightData[idx] = record;
      } else {
        leftData.push(record);
      }
    });
    return [leftData, rightData];
  });

  const leftDataSource = computed(() => split.value[0].filter((r): r is TransferItem => !!r));
  const rightDataSource = computed(() => split.value[1].filter((r): r is TransferItem => !!r));

  return [mergedDataSource, leftDataSource, rightDataSource];
}
