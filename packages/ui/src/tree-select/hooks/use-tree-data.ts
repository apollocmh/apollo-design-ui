/**
 * 树数据归一（rc `hooks/useTreeData.js`）。
 *
 * - `treeData` 直通（simpleMode 时先平铺建树）；
 * - children 形态（`<TreeSelectTreeNode>`）不实现（v6 deprecated，同 Tree —— UPSTREAM）。
 */

import { type ComputedRef, computed } from 'vue';
import type { SimpleModeConfig, TreeSelectDataNode } from '../interface';

function buildTreeStructure(
  nodes: Record<string, unknown>[],
  config: { id: string; pId: string; rootPId: string | number | null },
): TreeSelectDataNode[] {
  const { id, pId, rootPId } = config;
  const nodeMap = new Map<unknown, Record<string, unknown>>();
  const rootNodes: TreeSelectDataNode[] = [];
  nodes.forEach((node) => {
    const nodeKey = node[id];
    nodeMap.set(nodeKey, { ...node, key: node.key || nodeKey });
  });
  nodeMap.forEach((node) => {
    const parentKey = node[pId];
    const parent = nodeMap.get(parentKey);
    if (parent) {
      if (!parent.children) parent.children = [];
      (parent.children as unknown[]).push(node);
    } else if (parentKey === rootPId || rootPId === null) {
      rootNodes.push(node as TreeSelectDataNode);
    }
  });
  return rootNodes;
}

export function useTreeData(
  treeData: ComputedRef<TreeSelectDataNode[] | undefined>,
  simpleMode: ComputedRef<boolean | SimpleModeConfig | undefined>,
): ComputedRef<TreeSelectDataNode[]> {
  return computed(() => {
    const data = treeData.value;
    if (data) {
      const mode = simpleMode.value;
      if (mode) {
        const config = {
          id: 'id',
          pId: 'pId',
          rootPId: null as string | number | null,
          ...(typeof mode === 'object' ? (mode as Record<string, never>) : {}),
        } as { id: string; pId: string; rootPId: string | number | null };
        return buildTreeStructure(data as Record<string, unknown>[], config);
      }
      return data;
    }
    return [];
  });
}
