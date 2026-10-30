/**
 * useTree —— rc `hooks/useTree.js` 的 Vue 等价物（公开 API）。
 *
 * `getPath(key)` 返回从根到该 key 的实体路径（滚动定位/展开祖先用）。
 */

import { computed } from 'vue';
import getEntity from '../_internal/tree/key-util';
import type { TreeEntity } from '../_internal/tree/tree-util';
import { convertDataToEntities } from '../_internal/tree/tree-util';
import type { TreeFieldNames, TreeKey } from './interface';

export interface UseTreeOptions {
  fieldNames?: TreeFieldNames;
}

export function useTree<TreeDataType extends object>(
  treeData: () => TreeDataType[],
  config: UseTreeOptions = {},
) {
  const keyEntities = computed(() => {
    const { keyEntities: entities } = convertDataToEntities(treeData(), {
      fieldNames: config.fieldNames,
    });
    return entities;
  });

  const getPath = (key: TreeKey): TreeEntity<TreeDataType>[] => {
    const path: TreeEntity<TreeDataType>[] = [];
    let entity = getEntity(keyEntities.value, key);
    while (entity) {
      path.unshift(entity);
      entity = entity.parent;
    }
    return path;
  };

  return { getPath };
}
