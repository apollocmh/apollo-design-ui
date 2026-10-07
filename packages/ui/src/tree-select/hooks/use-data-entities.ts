/**
 * 树数据 → 实体表（rc `hooks/useDataEntities.js`）。
 *
 * 用 tree 的 `convertDataToEntities` 建 keyEntities，再二次映射 valueEntities
 * （value → entity）。开发期校验：value 缺失 / 重复 value / key≠value。
 */

import { useDevWarning } from '@apollo-design/utils';
import { type ComputedRef, computed } from 'vue';
import { convertDataToEntities, type TreeEntity } from '../../_internal/tree/tree-util';
import type { TreeSelectDataNode } from '../interface';
import type { FilledFieldNames } from '../utils/value-util';
import { isNil } from '../utils/value-util';

export interface DataEntities {
  keyEntities: Record<string, TreeEntity<TreeSelectDataNode>>;
  valueEntities: Map<unknown, TreeEntity<TreeSelectDataNode>>;
}

export function useDataEntities(
  treeData: ComputedRef<TreeSelectDataNode[]>,
  fieldNames: ComputedRef<FilledFieldNames>,
): ComputedRef<DataEntities> {
  return computed(() => {
    const devWarning = useDevWarning('TreeSelect');
    const collection = convertDataToEntities(treeData.value, {
      fieldNames: {
        key: fieldNames.value.key,
        title: fieldNames.value._title[0],
        children: fieldNames.value.children,
      },
      initWrapper: (wrapper) => ({ ...wrapper, valueEntities: new Map() }) as never,
      processEntity: (entity, wrapper) => {
        const val = (entity.node as Record<string, unknown>)[fieldNames.value.value];
        if (import.meta.env?.DEV) {
          const key = (entity.node as Record<string, unknown>).key;
          devWarning(!isNil(val), 'TreeNode `value` is invalidate: undefined');
          const map = (wrapper as unknown as { valueEntities: Map<unknown, unknown> })
            .valueEntities;
          devWarning(!map.has(val), `Same \`value\` exist in the tree: ${String(val)}`);
          devWarning(
            !key || String(key) === String(val),
            `\`key\` or \`value\` with TreeNode must be the same or you can remove one of them. key: ${String(key)}, value: ${String(val)}.`,
          );
        }
        (
          wrapper as unknown as { valueEntities: Map<unknown, TreeEntity<TreeSelectDataNode>> }
        ).valueEntities.set(val, entity);
      },
    });
    return {
      keyEntities: collection.keyEntities as Record<string, TreeEntity<TreeSelectDataNode>>,
      valueEntities: (
        collection as unknown as { valueEntities: Map<unknown, TreeEntity<TreeSelectDataNode>> }
      ).valueEntities,
    };
  });
}
