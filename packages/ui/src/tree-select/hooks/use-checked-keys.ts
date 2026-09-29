/**
 * 勾选键补全（rc `hooks/useCheckedKeys.js` 逐字语义）。
 *
 * treeConduction（checkable && !checkStrictly）时用 tree 的 conductCheck
 * 补全父子；**缺失值**（value 不在树中）透传保留。
 */

import { type ComputedRef, computed } from 'vue';
import type { SafeKey } from '../../tree/interface';
import { conductCheck } from '../../tree/utils/conductUtil';
import type { TreeEntity } from '../../tree/utils/treeUtil';
import type { InternalLabeledValue, TreeSelectDataNode } from '../interface';

type EntityMap = Record<string, TreeEntity<TreeSelectDataNode>>;

export function useCheckedKeys(
  rawLabeledValues: ComputedRef<InternalLabeledValue[]>,
  rawHalfLabeledValues: ComputedRef<InternalLabeledValue[]>,
  treeConduction: ComputedRef<boolean>,
  keyEntities: ComputedRef<EntityMap>,
): ComputedRef<[SafeKey[], SafeKey[]]> {
  return computed(() => {
    const checkedKeys = rawLabeledValues.value.map(({ value }) => value);
    const halfCheckedKeys = rawHalfLabeledValues.value.map(({ value }) => value);
    const missingValues = checkedKeys.filter((key) => !keyEntities.value[key]);
    let finalCheckedKeys = checkedKeys;
    let finalHalfCheckedKeys = halfCheckedKeys;
    if (treeConduction.value) {
      const conductResult = conductCheck(checkedKeys, true, keyEntities.value);
      finalCheckedKeys = conductResult.checkedKeys;
      finalHalfCheckedKeys = conductResult.halfCheckedKeys;
    }
    return [Array.from(new Set([...missingValues, ...finalCheckedKeys])), finalHalfCheckedKeys];
  });
}
