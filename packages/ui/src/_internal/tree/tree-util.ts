// biome-ignore-all lint/style/noNonNullAssertion: traverseDataNodes 的算法不变式 —— node 非空时 parent 必由调用方给出（pos/level 都从它派生）
/**
 * Tree 的数据结构工具（rc `utils/treeUtil.js` 的逐字移植，H5：不依赖 @rc-component/*）。
 *
 * 差异登记（UPSTREAM）：
 *   - `convertTreeToData`（`<TreeNode>` children → treeData）**不移植** —— v6 已
 *     deprecated（rc gDSFP 里传 children 时告警），本仓 Tree 不实现 children 形态
 *     （docs/analysis/tree.md §6）。
 */

import { warning } from '@apollo-design/utils';
import type { BasicDataNodeLike } from './key-util';
import getEntity from './key-util';
import type { SafeKey, TreeFieldNames, TreeKey } from './types';

export function getPosition(level: string, index: number): string {
  return `${level}-${index}`;
}

export function getKey(key: TreeKey | null | undefined, pos: string): TreeKey {
  if (key !== null && key !== undefined) {
    return key;
  }
  return pos;
}

/** rc `fillFieldNames`：`_title` 是数组形态（tree-select 的内部约定），保留字段。 */
export function fillFieldNames(
  fieldNames?: TreeFieldNames & { _title?: string[] },
): Required<TreeFieldNames> & {
  _title: string[];
} {
  const { title, _title, key, children } = fieldNames || {};
  const mergedTitle = title || 'title';
  return {
    title: mergedTitle,
    _title: _title || [mergedTitle],
    key: key || 'key',
    children: children || 'children',
  };
}

/** TreeNode 不提供 key / 重复 key 的 dev 告警（rc 逐字）。 */
export function warningWithoutKey(
  treeData: BasicDataNodeLike[] | undefined,
  fieldNames: Required<TreeFieldNames> & { _title: string[] },
): void {
  const keys = new Map<string, boolean>();
  function dig(list: BasicDataNodeLike[] | undefined, path = ''): void {
    (list || []).forEach((treeNode) => {
      const record = treeNode as Record<string, unknown>;
      const key = record[fieldNames.key] as TreeKey | undefined;
      const children = record[fieldNames.children] as BasicDataNodeLike[] | undefined;
      warning(
        key !== null && key !== undefined,
        `Tree node must have a certain key: [${path}${key}]`,
      );
      const recordKey = String(key);
      warning(
        !keys.has(recordKey) || key === null || key === undefined,
        `Same 'key' exist in the Tree: ${recordKey}`,
      );
      keys.set(recordKey, true);
      dig(children, `${path}${recordKey} > `);
    });
  }
  dig(treeData);
}

/** rc `FlattenNode`：虚拟列表的行结构。 */
export interface FlattenNode<TreeDataType extends BasicDataNodeLike = BasicDataNodeLike> {
  parent: FlattenNode<TreeDataType> | null;
  children: FlattenNode<TreeDataType>[] | null;
  pos: string;
  data: TreeDataType;
  title: unknown;
  key: TreeKey;
  isStart: boolean[];
  isEnd: boolean[];
  /** 展开态下挂子层（未展开为空数组）。 */
  [key: string]: unknown;
}

/**
 * 平铺嵌套树数据（虚拟列表渲染用）。`expandedKeys === true` 表示全展开
 * （rc-tree-select 内部用法，本仓保留判据）。
 */
export function flattenTreeData<TreeDataType extends BasicDataNodeLike>(
  treeNodeList: TreeDataType[],
  expandedKeys: TreeKey[] | true | undefined,
  fieldNames?: TreeFieldNames,
): FlattenNode<TreeDataType>[] {
  const mergedFieldNames = fillFieldNames(fieldNames);
  const fieldTitles = mergedFieldNames._title;
  const fieldKey = mergedFieldNames.key;
  const fieldChildren = mergedFieldNames.children;

  const expandedKeySet = new Set(expandedKeys === true ? [] : (expandedKeys ?? []));
  const flattenList: FlattenNode<TreeDataType>[] = [];

  function dig(
    list: TreeDataType[],
    parent: FlattenNode<TreeDataType> | null = null,
  ): FlattenNode<TreeDataType>[] {
    return list.map((treeNode, index) => {
      const record = treeNode as Record<string, unknown>;
      const pos = getPosition(parent ? parent.pos : '0', index);
      const mergedKey = getKey(record[fieldKey] as TreeKey | undefined, pos);

      // 按 fieldTitles 顺序取第一个有值的 title
      let mergedTitle: unknown;
      for (let i = 0; i < fieldTitles.length; i += 1) {
        const fieldTitle = fieldTitles[i] ?? '';
        if (record[fieldTitle] !== undefined) {
          mergedTitle = record[fieldTitle];
          break;
        }
      }

      const flattenNode: FlattenNode<TreeDataType> = {
        ...(treeNode as Record<string, unknown>),
        title: mergedTitle,
        key: mergedKey,
        parent,
        pos,
        children: null,
        data: treeNode,
        isStart: [...(parent ? parent.isStart : []), index === 0],
        isEnd: [...(parent ? parent.isEnd : []), index === list.length - 1],
      } as FlattenNode<TreeDataType>;
      flattenList.push(flattenNode);

      if (expandedKeys === true || expandedKeySet.has(mergedKey)) {
        flattenNode.children = dig(
          (record[fieldChildren] as TreeDataType[] | undefined) || [],
          flattenNode,
        );
      } else {
        flattenNode.children = [];
      }
      return flattenNode;
    });
  }
  dig(treeNodeList);
  return flattenList;
}

/** traverseDataNodes 的回调入参（rc `traverseDataNodes`）。 */
export interface TraverseDataNodeInfo<TreeDataType extends BasicDataNodeLike> {
  node: TreeDataType;
  index: number;
  pos: string;
  key: TreeKey;
  parentPos: string | null;
  level: number;
  nodes: TreeDataType[];
}

export interface TraverseDataNodesConfig {
  childrenPropName?: string;
  externalGetKey?: string | ((node: BasicDataNodeLike) => TreeKey);
  fieldNames?: TreeFieldNames;
}

/** 深度遍历树数据（convertDataToEntities 的驱动；勿在 rc 移植范围外使用）。 */
export function traverseDataNodes<TreeDataType extends BasicDataNodeLike>(
  dataNodes: TreeDataType[] | undefined,
  callback: (data: TraverseDataNodeInfo<TreeDataType>) => void,
  config?: TraverseDataNodesConfig | string,
): void {
  const mergedConfig: TraverseDataNodesConfig =
    typeof config === 'object' ? (config ?? {}) : { externalGetKey: config as string };

  const { childrenPropName, externalGetKey, fieldNames } = mergedConfig;
  const { key: fieldKey, children: fieldChildren } = fillFieldNames(fieldNames);
  const mergeChildrenPropName = childrenPropName || fieldChildren;

  let syntheticGetKey: (node: TreeDataType, pos: string) => TreeKey;
  if (externalGetKey) {
    if (typeof externalGetKey === 'string') {
      syntheticGetKey = (node) => node[externalGetKey as keyof TreeDataType] as TreeKey;
    } else {
      syntheticGetKey = (node) => externalGetKey(node as BasicDataNodeLike);
    }
  } else {
    syntheticGetKey = (node, pos) =>
      getKey(node[fieldKey as keyof TreeDataType] as TreeKey | undefined, pos);
  }

  function processNode(
    node: TreeDataType | null,
    index: number,
    parent: { node: TreeDataType | null; pos: string; level: number } | undefined,
    pathNodes: TreeDataType[],
  ): void {
    const children = node
      ? ((node as Record<string, unknown>)[mergeChildrenPropName] as TreeDataType[] | undefined)
      : dataNodes;
    const pos = node ? getPosition(parent!.pos, index) : '0';
    const connectNodes = node ? [...pathNodes, node] : [];

    if (node) {
      const key = syntheticGetKey(node, pos);
      const data: TraverseDataNodeInfo<TreeDataType> = {
        node,
        index,
        pos,
        key,
        parentPos: parent!.node ? parent!.pos : null,
        level: parent!.level + 1,
        nodes: connectNodes,
      };
      callback(data);
    }

    if (children) {
      children.forEach((subNode, subIndex) => {
        processNode(
          subNode,
          subIndex,
          { node, pos, level: parent ? parent.level + 1 : -1 },
          connectNodes,
        );
      });
    }
  }
  // ⚠️ rc 的初始调用**不传 parent** —— 顶层的 level 由 `parent ? parent.level + 1 : -1`
  //    算出 -1，再 +1 得 0。若在这里塞一个 level:-1 的种子对象，顶层会变成 1（实测踩过）。
  processNode(null as unknown as TreeDataType | null, 0, undefined, []);
}

/** 实体（rc `DataEntity`：node 保持传入的数据类型本体）。 */
export interface TreeEntity<TreeDataType extends BasicDataNodeLike> {
  node: TreeDataType;
  nodes: TreeDataType[];
  index: number;
  key: SafeKey;
  pos: string;
  level: number;
  parent?: TreeEntity<TreeDataType>;
  children?: TreeEntity<TreeDataType>[];
}

export interface ConvertDataToEntitiesWrapper<TreeDataType extends BasicDataNodeLike> {
  posEntities: Record<string, TreeEntity<TreeDataType>>;
  keyEntities: Record<SafeKey, TreeEntity<TreeDataType>>;
}

/** rc `convertDataToEntities`：treeData → 键/路径实体表。 */
export function convertDataToEntities<TreeDataType extends BasicDataNodeLike>(
  dataNodes: TreeDataType[] | undefined,
  options?: {
    initWrapper?: (
      wrapper: ConvertDataToEntitiesWrapper<TreeDataType>,
    ) => ConvertDataToEntitiesWrapper<TreeDataType> | undefined;
    processEntity?: (
      entity: TreeEntity<TreeDataType>,
      wrapper: ConvertDataToEntitiesWrapper<TreeDataType>,
    ) => void;
    onProcessFinished?: (wrapper: ConvertDataToEntitiesWrapper<TreeDataType>) => void;
    externalGetKey?: string | ((node: BasicDataNodeLike) => TreeKey);
    childrenPropName?: string;
    fieldNames?: TreeFieldNames;
  },
  legacyExternalGetKey?: string | ((node: BasicDataNodeLike) => TreeKey),
): ConvertDataToEntitiesWrapper<TreeDataType> {
  const mergedExternalGetKey = options?.externalGetKey ?? legacyExternalGetKey;
  const posEntities: Record<string, TreeEntity<TreeDataType>> = {};
  const keyEntities: Record<SafeKey, TreeEntity<TreeDataType>> = {};
  let wrapper: ConvertDataToEntitiesWrapper<TreeDataType> = { posEntities, keyEntities };
  if (options?.initWrapper) {
    wrapper = options.initWrapper(wrapper) ?? wrapper;
  }

  traverseDataNodes<TreeDataType>(
    dataNodes,
    (item) => {
      const { node, index, pos, key, parentPos, level, nodes } = item;
      const entity: TreeEntity<TreeDataType> = {
        node,
        nodes,
        index,
        key: key as SafeKey,
        pos,
        level,
      };
      const mergedKey = getKey(key, pos);
      posEntities[pos] = entity;
      keyEntities[mergedKey as SafeKey] = entity;

      // 挂到父实体的 children（parentPos 为 null 时是根）
      entity.parent = posEntities[parentPos as string];
      if (entity.parent) {
        entity.parent.children = entity.parent.children || [];
        entity.parent.children.push(entity);
      }

      options?.processEntity?.(entity, wrapper);
    },
    {
      externalGetKey: mergedExternalGetKey,
      childrenPropName: options?.childrenPropName,
      fieldNames: options?.fieldNames,
    },
  );

  options?.onProcessFinished?.(wrapper);
  return wrapper;
}

/** rc `isLeafNode`：叶子判据（isLeaf=false 恒否决；loadData 参与判定）。 */
export function isLeafNode(
  isLeaf: boolean | undefined,
  loadData: unknown,
  hasChildren: boolean,
  loaded: boolean,
): boolean {
  if (isLeaf === false) {
    return false;
  }
  return isLeaf || (!loadData && !hasChildren) || Boolean(loadData && loaded && !hasChildren);
}

/** 展开态合入的 props 桶（rc `getTreeNodeProps` 的 options）。 */
export interface TreeNodeRequiredProps {
  expandedKeys: TreeKey[];
  selectedKeys: TreeKey[];
  loadedKeys: TreeKey[];
  loadingKeys: TreeKey[];
  checkedKeys: TreeKey[];
  halfCheckedKeys: TreeKey[];
  dragOverNodeKey: TreeKey | null;
  dropPosition: -1 | 0 | 1 | null;
  keyEntities: Record<SafeKey, TreeEntity<BasicDataNodeLike>>;
}

/** rc `getTreeNodeProps`：把全局状态投影到单个节点的运行时态。 */
export function getTreeNodeProps(
  key: TreeKey,
  {
    expandedKeys,
    selectedKeys,
    loadedKeys,
    loadingKeys,
    checkedKeys,
    halfCheckedKeys,
    dragOverNodeKey,
    dropPosition,
    keyEntities,
  }: TreeNodeRequiredProps,
): {
  eventKey: TreeKey;
  expanded: boolean;
  selected: boolean;
  loaded: boolean;
  loading: boolean;
  checked: boolean;
  halfChecked: boolean;
  pos: string;
  dragOver: boolean;
  dragOverGapTop: boolean;
  dragOverGapBottom: boolean;
} {
  const entity = getEntity(keyEntities, key);
  const treeNodeProps = {
    eventKey: key,
    expanded: expandedKeys.indexOf(key) !== -1,
    selected: selectedKeys.indexOf(key) !== -1,
    loaded: loadedKeys.indexOf(key) !== -1,
    loading: loadingKeys.indexOf(key) !== -1,
    checked: checkedKeys.indexOf(key) !== -1,
    halfChecked: halfCheckedKeys.indexOf(key) !== -1,
    pos: String(entity ? entity.pos : ''),
    // [Legacy] 拖拽三态：语义随交互改造已不精确（rc 原注释保留）
    dragOver: dragOverNodeKey === key && dropPosition === 0,
    dragOverGapTop: dragOverNodeKey === key && dropPosition === -1,
    dragOverGapBottom: dragOverNodeKey === key && dropPosition === 1,
  };
  return treeNodeProps;
}

/** rc `convertNodePropsToEventData`：节点 props → 事件回调的 EventDataNode。 */
export function convertNodePropsToEventData<
  TreeDataType extends BasicDataNodeLike,
  Props extends {
    data?: TreeDataType;
    expanded?: boolean;
    selected?: boolean;
    checked?: boolean;
    loaded?: boolean;
    loading?: boolean;
    halfChecked?: boolean;
    dragOver?: boolean;
    dragOverGapTop?: boolean;
    dragOverGapBottom?: boolean;
    pos?: string;
    active?: boolean;
    eventKey?: TreeKey;
  },
>(props: Props): EventDataNodeLike<TreeDataType> {
  const {
    data,
    expanded,
    selected,
    checked,
    loaded,
    loading,
    halfChecked,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    pos,
    active,
    eventKey,
  } = props;
  const eventData = {
    ...(data as Record<string, unknown>),
    expanded,
    selected,
    checked,
    loaded,
    loading,
    halfChecked,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    pos,
    active,
    key: eventKey,
  } as EventDataNodeLike<TreeDataType>;
  return eventData;
}

/** 事件回调的节点形态（EventDataNode 的结构约束版，供 utils 内使用）。 */
export interface EventDataNodeLike<TreeDataType extends BasicDataNodeLike>
  extends BasicDataNodeLike {
  key: TreeKey | undefined;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  loaded?: boolean;
  loading?: boolean;
  halfChecked?: boolean;
  dragOver?: boolean;
  dragOverGapTop?: boolean;
  dragOverGapBottom?: boolean;
  pos?: string;
  active?: boolean;
  data?: TreeDataType;
}
