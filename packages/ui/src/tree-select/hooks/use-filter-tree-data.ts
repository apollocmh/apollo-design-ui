/**
 * 搜索过滤（rc `hooks/useFilterTreeData.js` 逐字语义）。
 *
 * 命中节点的**祖先全部保留**（keepAll 传导）；过滤后节点 `isLeaf: undefined`
 * 重置（子树可能还能展开）。
 */

import { type ComputedRef, computed } from 'vue';
import type { TreeSelectDataNode } from '../interface';
import { fillLegacyProps } from '../utils/legacy-util';
import type { FilledFieldNames } from '../utils/value-util';

export function useFilterTreeData(
  treeData: ComputedRef<TreeSelectDataNode[]>,
  searchValue: ComputedRef<string>,
  options: {
    fieldNames: ComputedRef<FilledFieldNames>;
    treeNodeFilterProp: ComputedRef<string>;
    filterTreeNode: ComputedRef<
      boolean | ((inputValue: string, treeNode: TreeSelectDataNode) => boolean) | undefined
    >;
  },
): ComputedRef<TreeSelectDataNode[]> {
  return computed(() => {
    const data = treeData.value;
    const search = searchValue.value;
    const { fieldNames, treeNodeFilterProp, filterTreeNode } = options;
    const fieldChildren = fieldNames.value.children;
    if (!search || filterTreeNode.value === false) {
      return data;
    }
    const filterOptionFunc =
      typeof filterTreeNode.value === 'function'
        ? filterTreeNode.value
        : (_: string, dataNode: TreeSelectDataNode) =>
            String((dataNode as Record<string, unknown>)[treeNodeFilterProp.value] ?? '')
              .toUpperCase()
              .includes(search.toUpperCase());

    const filterTreeNodes = (nodes: TreeSelectDataNode[], keepAll = false): TreeSelectDataNode[] =>
      nodes.reduce<TreeSelectDataNode[]>((filtered, node) => {
        const children = node[fieldChildren] as TreeSelectDataNode[] | undefined;
        const isMatch =
          keepAll || !!filterOptionFunc(search, fillLegacyProps(node) as TreeSelectDataNode);
        const filteredChildren = filterTreeNodes(children || [], isMatch);
        if (isMatch || filteredChildren.length) {
          filtered.push({
            ...node,
            isLeaf: undefined,
            [fieldChildren]: filteredChildren,
          });
        }
        return filtered;
      }, []);

    return filterTreeNodes(data);
  });
}
