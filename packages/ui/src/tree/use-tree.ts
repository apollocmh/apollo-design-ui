/**
 * useTree —— rc `hooks/useTree.js` 的 Vue 等价物（公开 API）。
 *
 * `getPath(key)` 返回从根到该 key 的实体路径（滚动定位/展开祖先用）。
 */

import { computed } from 'vue';
import getEntity from '../_internal/tree/key-util';
import type { TreeEntity } from '../_internal/tree/tree-util';
import { convertDataToEntities, fillFieldNames } from '../_internal/tree/tree-util';
import type { DataNode, TreeFieldNames, TreeKey } from './interface';

export interface UseTreeOptions {
  fieldNames?: TreeFieldNames;
}

export function useTree(treeData: () => DataNode[], config: UseTreeOptions = {}) {
  const keyEntities = computed(() => {
    const { keyEntities: entities } = convertDataToEntities(treeData(), {
      fieldNames: config.fieldNames,
    });
    return entities;
  });
  void fillFieldNames;

  const getPath = (key: TreeKey): TreeEntity<DataNode>[] => {
    const path: TreeEntity<DataNode>[] = [];
    let entity = getEntity(keyEntities.value, key) as TreeEntity<DataNode> | undefined;
    while (entity) {
      path.unshift(entity);
      entity = entity.parent as TreeEntity<DataNode> | undefined;
    }
    return path;
  };

  return { getPath };
}
