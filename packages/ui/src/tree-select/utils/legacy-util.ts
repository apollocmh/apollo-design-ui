/**
 * rc `utils/legacyUtil.js` 的 Vue 等价物。
 *
 * `fillLegacyProps`：rc 给事件 info 的 node 补一个 legacy `props` getter（访问即
 * warning）。Vue 侧保持同构——返回克隆节点并挂同名 getter（INTENDED #3：rc 的
 * getter 返回 React 元素本身，这里返回数据节点）。
 *
 * `fillAdditionalInfo`：为 change 事件补 `triggerNode` / `allCheckedNodes` legacy
 * getter。React 版在访问时才建 map（React 元素树）；Vue 版返回**数据节点**树。
 */

import { warning } from '@apollo-design/utils';
import type { TreeSelectDataNode } from '../interface';
import type { FilledFieldNames } from './value-util';

type NodeLike = TreeSelectDataNode & { props?: unknown };

export function fillLegacyProps(
  dataNode: TreeSelectDataNode | null | undefined,
): TreeSelectDataNode | null | undefined {
  if (!dataNode) return dataNode;
  const cloneNode: NodeLike = { ...dataNode };
  if (!('props' in cloneNode)) {
    Object.defineProperty(cloneNode, 'props', {
      get() {
        warning(
          false,
          '[apollo: TreeSelect] `node.props` 已不支持（返回节点实例是 rc 旧版行为）。请直接解构数据字段。',
        );
        return cloneNode;
      },
      configurable: true,
    });
  }
  return cloneNode;
}

export function fillAdditionalInfo(
  extra: Record<string, unknown>,
  triggerValue: string | number | undefined,
  checkedValues: (string | number)[],
  treeData: TreeSelectDataNode[],
  fieldNames: FilledFieldNames,
): void {
  let triggerNode: TreeSelectDataNode | null = null;
  let nodeList: TreeSelectDataNode[] | null = null;

  const generateMap = (): void => {
    const dig = (list: TreeSelectDataNode[], level = '0'): TreeSelectDataNode[] => {
      const result: TreeSelectDataNode[] = [];
      list.forEach((option, index) => {
        const pos = `${level}-${index}`;
        const value = option[fieldNames.value] as string | number;
        const included = checkedValues.includes(value);
        const children = dig(
          (option[fieldNames.children] as TreeSelectDataNode[] | undefined) || [],
          pos,
        );
        const node = { ...option, children };
        if (triggerValue === value) triggerNode = node;
        if (included) {
          const checkedNode = { ...node, pos, children } as TreeSelectDataNode;
          result.push(checkedNode);
        }
      });
      return result;
    };
    if (!nodeList) {
      nodeList = dig(treeData);
    }
  };

  Object.defineProperty(extra, 'triggerNode', {
    get() {
      warning(
        false,
        '[apollo: TreeSelect] `triggerNode` 已废弃（不再返回节点实例）。请改用 `triggerValue` 关联数据。',
      );
      generateMap();
      return triggerNode;
    },
    configurable: true,
  });
  Object.defineProperty(extra, 'allCheckedNodes', {
    get() {
      warning(
        false,
        '[apollo: TreeSelect] `allCheckedNodes` 已废弃（不再返回节点实例）。请自行按 `value` 映射数据。',
      );
      generateMap();
      return nodeList;
    },
    configurable: true,
  });
}
