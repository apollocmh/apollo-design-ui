/**
 * Tree 数据模型的**共享类型**。
 *
 * ── 为什么这份类型不在 `packages/ui/src/tree/interface.ts` 里 ──────────────────
 *
 * 裁决 `early-extract-table-core-tree-core` = **C**（2026-10-07 用户裁决）：
 * `tree` 的纯逻辑（键实体表 / 勾选传导 / 数组增删）有 **≥2 个消费者**
 * （`tree-select` 与 `table`），按本仓「共享工具必须放 `src/_internal/`」的准则
 * 该搬出组件目录。
 *
 * 但那些逻辑**依赖这份数据模型** —— 只搬函数、把类型留在 `tree/interface.ts`，
 * 就会造出 `_internal/ → tree/` 的**反向依赖**，比原来的「组件间互 import」更糟。
 * ⇒ 所以**类型跟着逻辑一起搬**。
 *
 * `tree/interface.ts` 会把它们原样再导出
 * （`export type { … } from '../_internal/tree/types'`）
 * ⇒ 公开 API 面与所有既有的 `tree/interface` 导入站点**都不受影响**。
 *
 * 契约来源：antd 6.6.4 `es/tree/Tree.d.ts` + `@rc-component/tree` 1.4.0 的
 * `Tree.d.ts` / `interface.d.ts`。分析见 `docs/analysis/tree.md`。
 *
 * ⚠️ 禁止 any / as any / @ts-expect-error（H10）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** `React.Key` 的 Vue 对应物；`SafeKey` 排除 bigint（rc :88-95 的既有约束）。 */
export type TreeKey = string | number;
export type SafeKey = Exclude<TreeKey, bigint>;

/** rc `FieldDataNode`：用户数据节点 + 递归 children（字段名可由 fieldNames 改写）。 */
export interface BasicDataNode {
  checkable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  icon?: TreeIconType;
  isLeaf?: boolean;
  selectable?: boolean;
  switcherIcon?: TreeIconType;
  className?: string;
  style?: CSSProperties;
}

export type FieldDataNode<T, ChildFieldName extends string = 'children'> = BasicDataNode &
  T &
  Partial<Record<ChildFieldName, FieldDataNode<T, ChildFieldName>[]>>;

/** rc `DataNode`（默认字段名形态）。 */
export type DataNode = FieldDataNode<{
  key: TreeKey;
  title?: VNodeChild | ((data: DataNode) => VNodeChild);
}>;

/** rc `EventDataNode`：事件回调里的节点（数据 + 运行时态）。 */
export type EventDataNode<TreeDataType extends BasicDataNode = DataNode> = {
  key: TreeKey;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  loaded: boolean;
  loading: boolean;
  halfChecked: boolean;
  dragOver: boolean;
  dragOverGapTop: boolean;
  dragOverGapBottom: boolean;
  pos: string;
  active: boolean;
} & TreeDataType &
  BasicDataNode;

/** rc `FieldNames`（`_title` 仅 tree-select 内部使用，保留字段不公开）。 */
export interface TreeFieldNames {
  title?: string;
  key?: string;
  children?: string;
}

/** rc `DataEntity`（键实体表值；keyEntities 的公开形态）。 */
export interface TreeDataEntity<TreeDataType extends BasicDataNode = DataNode> {
  index: number;
  key: SafeKey;
  pos: string;
  level: number;
  node: TreeDataType;
  nodes: TreeDataType[];
  children?: TreeDataEntity<TreeDataType>[];
  parent?: TreeDataEntity<TreeDataType>;
}

/** 节点态传给 icon/switcherIcon fn 的参数（rc `TreeNodeProps` 的只读子集）。 */
export interface TreeNodeRenderInfo<TreeDataType extends BasicDataNode = DataNode> {
  eventKey?: TreeKey;
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
  data?: TreeDataType;
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  disableCheckbox?: boolean;
  /** 展开函数等注入位与 rc 的 treeNodeProps 同构。 */
  [key: string]: unknown;
}

/** rc `IconType`：VNode 或按节点态求值的 fn。 */
export type TreeIconType = VNodeChild | ((props: TreeNodeRenderInfo) => VNodeChild);

/** rc `ExpandAction`。 */
export type TreeExpandAction = false | 'click' | 'doubleClick';

/** rc `DraggableFn` / `DraggableConfig`。 */
export type TreeNodeDraggableFn = (node: DataNode) => boolean;
export interface TreeDraggableConfig {
  /** `false` 显式关闭拖拽把手（默认渲染 HolderOutlined）。 */
  icon?: VNodeChild | false;
  nodeDraggable?: TreeNodeDraggableFn;
}
export type TreeDraggable = TreeNodeDraggableFn | boolean | TreeDraggableConfig;
