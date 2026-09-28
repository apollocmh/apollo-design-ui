/**
 * Tree 的遗留工具函数（rc `util.js` 的逐字移植，rc 原注释「Legacy code」保留）。
 *
 * 差异登记：
 *   - `convertDataToTree`（treeData → TreeNode 元素树）**不移植** —— 本仓不实现
 *     children 形态（docs/analysis/tree.md §6）。
 *   - `calcDropPosition` 依赖 `event.target.getBoundingClientRect()`（真实拖拽），
 *     L1 用伪造 DOMRect 直测（jsdom 的 getBoundingClientRect 恒 0）。
 */

import { warning } from '@apollo-design/utils';
import type { SafeKey, TreeDataEntity, TreeKey } from '../interface';
import type { BasicDataNodeLike } from './keyUtil';
import getEntity from './keyUtil';

export function arrDel(list: TreeKey[] | undefined | null, value: TreeKey): TreeKey[] {
  if (!list) return [];
  const clone = list.slice();
  const index = clone.indexOf(value);
  if (index >= 0) {
    clone.splice(index, 1);
  }
  return clone;
}

export function arrAdd(list: TreeKey[] | undefined | null, value: TreeKey): TreeKey[] {
  const clone = (list || []).slice();
  if (clone.indexOf(value) === -1) {
    clone.push(value);
  }
  return clone;
}

export function posToArr(pos: string): string[] {
  return pos.split('-');
}

/** 拖拽节点的全部后代 key（不含自身）。 */
export function getDragChildrenKeys(
  dragNodeKey: TreeKey,
  keyEntities: Record<SafeKey, TreeDataEntity>,
): SafeKey[] {
  // not contains self
  // self for left or right drag
  const dragChildrenKeys: SafeKey[] = [];
  const entity = getEntity(keyEntities, dragNodeKey);
  function dig(list: TreeDataEntity[] = []): void {
    list.forEach(({ key, children }) => {
      dragChildrenKeys.push(key);
      dig(children ?? []);
    });
  }
  dig(entity?.children ?? []);
  return dragChildrenKeys;
}

/** 是否父级的最后一个孩子（按 pos 末段序号判定）。 */
export function isLastChild(treeNodeEntity: TreeDataEntity): boolean {
  if (treeNodeEntity.parent) {
    const posArr = posToArr(treeNodeEntity.pos);
    return Number(posArr[posArr.length - 1]) === treeNodeEntity.parent.children!.length - 1;
  }
  return false;
}

/** 是否第一个孩子（pos 末段为 0）。 */
export function isFirstChild(treeNodeEntity: TreeDataEntity): boolean {
  const posArr = posToArr(treeNodeEntity.pos);
  return Number(posArr[posArr.length - 1]) === 0;
}

/** 拖拽事件的最小上下文（真实类型在 TreeNode 组件层，util 只用这些字段）。 */
export interface CalcDropTargetNodeProps {
  eventKey: TreeKey;
  /** 是否已展开（用于过滤虚拟展开 keys）。 */
  [key: string]: unknown;
}

export interface CalcDropDragNodeProps {
  data: BasicDataNodeLike;
  [key: string]: unknown;
}

export interface CalcDropResult {
  dropPosition: -1 | 0 | 1;
  dropLevelOffset: number;
  dropTargetKey: SafeKey;
  dropTargetPos: string;
  dragOverNodeKey: SafeKey;
  dropContainerKey: SafeKey | null;
  dropAllowed: boolean;
}

type AllowDropFn = (options: {
  dragNode: BasicDataNodeLike;
  dropNode: BasicDataNodeLike;
  dropPosition: -1 | 0 | 1;
}) => boolean;

/**
 * 拖拽落点计算（rc 逐字；只在拖拽期调用，不影响 SSR）。
 *
 * `dropPosition`：inside 0 / top -1 / bottom 1；
 * `dropLevelOffset`：拖拽点相对落点节点的层级偏移（横向偏移换算）。
 */
export function calcDropPosition(
  event: { clientX: number; clientY: number; target: { getBoundingClientRect: () => { top: number; height: number } } },
  dragNodeProps: CalcDropDragNodeProps,
  targetNodeProps: CalcDropTargetNodeProps,
  indent: number,
  startMousePosition: { x?: number } | null,
  allowDrop: AllowDropFn,
  flattenedNodes: { key: TreeKey }[],
  keyEntities: Record<SafeKey, TreeDataEntity>,
  expandKeys: TreeKey[],
  direction?: 'ltr' | 'rtl' | undefined,
): CalcDropResult {
  const { clientX, clientY } = event;
  const { top, height } = event.target.getBoundingClientRect();
  // optional chain for testing
  const horizontalMouseOffset =
    (direction === 'rtl' ? -1 : 1) * ((startMousePosition?.x || 0) - clientX);
  const rawDropLevelOffset = (horizontalMouseOffset - 12) / indent;

  // 过滤掉「当前没有 children 的节点」（异步加载节点不参与虚拟展开判定）
  const filteredExpandKeys = expandKeys.filter(
    (key) => keyEntities[key as SafeKey]?.children?.length,
  );

  // find abstract drop node by horizontal offset
  let abstractDropNodeEntity = getEntity(keyEntities, targetNodeProps.eventKey)!;
  if (clientY < top + height / 2) {
    // first half, set abstract drop node to previous node
    const nodeIndex = flattenedNodes.findIndex(
      (flattenedNode) => flattenedNode.key === abstractDropNodeEntity.key,
    );
    const prevNodeIndex = nodeIndex <= 0 ? 0 : nodeIndex - 1;
    const prevNodeKey = flattenedNodes[prevNodeIndex]!.key;
    abstractDropNodeEntity = getEntity(keyEntities, prevNodeKey)!;
  }
  const initialAbstractDropNodeKey = abstractDropNodeEntity.key;
  const abstractDragOverEntity = abstractDropNodeEntity;
  const dragOverNodeKey = abstractDropNodeEntity.key;
  let dropPosition: -1 | 0 | 1 = 0;
  let dropLevelOffset = 0;

  // Only allow cross level drop when dragging on a non-expanded node
  if (!filteredExpandKeys.includes(initialAbstractDropNodeKey)) {
    for (let i = 0; i < rawDropLevelOffset; i += 1) {
      if (isLastChild(abstractDropNodeEntity)) {
        abstractDropNodeEntity = abstractDropNodeEntity.parent!;
        dropLevelOffset += 1;
      } else {
        break;
      }
    }
  }
  const abstractDragDataNode = dragNodeProps.data;
  const abstractDropDataNode = abstractDropNodeEntity.node;
  let dropAllowed = true;
  if (
    isFirstChild(abstractDropNodeEntity) &&
    abstractDropNodeEntity.level === 0 &&
    clientY < top + height / 2 &&
    allowDrop({
      dragNode: abstractDragDataNode,
      dropNode: abstractDropDataNode,
      dropPosition: -1,
    }) &&
    abstractDropNodeEntity.key === targetNodeProps.eventKey
  ) {
    // first half of first node in first level
    dropPosition = -1;
  } else if (
    (abstractDragOverEntity.children || []).length &&
    filteredExpandKeys.includes(dragOverNodeKey)
  ) {
    // drop on expanded node
    // only allow drop inside
    if (
      allowDrop({ dragNode: abstractDragDataNode, dropNode: abstractDropDataNode, dropPosition: 0 })
    ) {
      dropPosition = 0;
    } else {
      dropAllowed = false;
    }
  } else if (dropLevelOffset === 0) {
    if (rawDropLevelOffset > -1.5) {
      // | Node     | <- abstractDropNode
      // | -^-===== | <- mousePosition
      // 1. try drop after
      // 2. do not allow drop
      if (
        allowDrop({
          dragNode: abstractDragDataNode,
          dropNode: abstractDropDataNode,
          dropPosition: 1,
        })
      ) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    } else {
      // | Node     | <- abstractDropNode
      // | ---==^== | <- mousePosition
      // whether it has children or doesn't has children
      // always
      // 1. try drop inside
      // 2. try drop after
      // 3. do not allow drop
      if (
        allowDrop({
          dragNode: abstractDragDataNode,
          dropNode: abstractDropDataNode,
          dropPosition: 0,
        })
      ) {
        dropPosition = 0;
      } else if (
        allowDrop({
          dragNode: abstractDragDataNode,
          dropNode: abstractDropDataNode,
          dropPosition: 1,
        })
      ) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    }
  } else {
    // | Node1 | <- abstractDropNode
    //      |  Node2  |
    // --^--|----=====| <- mousePosition
    // 1. try insert after Node1
    // 2. do not allow drop
    if (
      allowDrop({ dragNode: abstractDragDataNode, dropNode: abstractDropDataNode, dropPosition: 1 })
    ) {
      dropPosition = 1;
    } else {
      dropAllowed = false;
    }
  }
  return {
    dropPosition,
    dropLevelOffset,
    dropTargetKey: abstractDropNodeEntity.key,
    dropTargetPos: abstractDropNodeEntity.pos,
    dragOverNodeKey,
    dropContainerKey: dropPosition === 0 ? null : abstractDropNodeEntity.parent?.key || null,
    dropAllowed,
  };
}

/** 按 `multiple` 收敛选中 keys（单选只留第一个）。 */
export function calcSelectedKeys(
  selectedKeys: TreeKey[] | undefined,
  props: { multiple?: boolean },
): TreeKey[] | undefined {
  if (!selectedKeys) return undefined;
  const { multiple } = props;
  if (multiple) {
    return selectedKeys.slice();
  }
  if (selectedKeys.length) {
    return [selectedKeys[0]!];
  }
  return selectedKeys;
}

/** 解析 `checkedKeys`（数组 / 对象 / 非法值告警）。 */
export function parseCheckedKeys(
  keys: TreeKey[] | { checked?: TreeKey[]; halfChecked?: SafeKey[] } | undefined | null,
): { checkedKeys: TreeKey[]; halfCheckedKeys: SafeKey[] | undefined } | null {
  if (!keys) {
    return null;
  }

  let keyProps: { checkedKeys: TreeKey[]; halfCheckedKeys: SafeKey[] | undefined };
  if (Array.isArray(keys)) {
    // [Legacy] Follow the api doc
    keyProps = {
      checkedKeys: keys,
      halfCheckedKeys: undefined,
    };
  } else if (typeof keys === 'object') {
    keyProps = {
      checkedKeys: (keys as { checked?: TreeKey[] }).checked ?? [],
      halfCheckedKeys: (keys as { halfChecked?: SafeKey[] }).halfChecked,
    };
  } else {
    warning(false, '`checkedKeys` is not an array or an object');
    return null;
  }
  return keyProps;
}

/**
 * `autoExpandParent` / `defaultExpandParent`：把 keys 的祖先全部补进展开集。
 * 节点 disabled 时不再向上传导（rc 逐字）。
 */
export function conductExpandParent(
  keyList: TreeKey[] | undefined,
  keyEntities: Record<SafeKey, TreeDataEntity>,
): SafeKey[] {
  const expandedKeys = new Set<TreeKey>();
  function conductUp(key: TreeKey): void {
    if (expandedKeys.has(key)) return;
    const entity = getEntity(keyEntities, key);
    if (!entity) return;
    expandedKeys.add(key);
    const { parent, node } = entity;
    if ((node as BasicDataNodeLike).disabled) return;
    if (parent) {
      conductUp(parent.key as TreeKey);
    }
  }
  (keyList || []).forEach((key) => {
    conductUp(key);
  });
  return [...expandedKeys] as SafeKey[];
}
