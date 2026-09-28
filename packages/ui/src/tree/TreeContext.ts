/**
 * Tree 的运行时上下文（rc `contextTypes.js` 的 provide/inject 等价物）。
 *
 * rc 在 Tree（class）render 里构造 `contextValue` 传给 `TreeContext.Provider`；
 * Vue 侧用 `provide()` + `reactive()`：字段是 computed/函数，`reactive` 会自动解包
 * ref —— TreeNode / NodeList 侧读到的是值（响应式追踪保留）。
 *
 * 状态字段语义见 docs/analysis/tree.md §2.2（23 槽）。
 */

import type { InjectionKey } from 'vue';
import type { DropIndicatorProps } from './DropIndicator';
import type {
  DataNode,
  EventDataNode,
  SafeKey,
  TreeKey,
  TreeSemanticClassNames,
  TreeSemanticStyles,
} from './interface';

/** rc `DropIndicatorProps`：dropIndicatorRender 的入参。 */
export interface TreeDropIndicatorRenderProps {
  dropPosition: -1 | 0 | 1;
  dropLevelOffset: number;
  indent: number;
  prefixCls: string;
  direction?: 'ltr' | 'rtl';
}

/** 拖拽中的节点投影（rc `dragNodeProps`：TreeNode 的 props 子集）。 */
export interface DragNodeSnapshot {
  eventKey: TreeKey;
  /** TreeNode 组件实例的 selector 引用（rc 用于 dragover 判定，Vue 侧暂未消费）。 */
  selectHandle?: unknown;
}

/** rc `TreeNodeRequiredProps`：getTreeNodeRequiredProps() 的产物（定义在 treeUtil）。 */
export type { TreeNodeRequiredProps } from './utils/treeUtil';

export interface TreeContextValue {
  prefixCls: string;
  selectable: boolean;
  showIcon: boolean;
  icon?: unknown;
  switcherIcon?: unknown;
  /** antd 壳注入的渲染函数（iconUtil），VNode 形态。 */
  draggable: { nodeDraggable?: (node: DataNode) => boolean; icon?: unknown } | false;
  draggingNodeKey: TreeKey | null;
  checkable: boolean | unknown;
  checkStrictly: boolean;
  disabled: boolean;
  keyEntities: Record<SafeKey, unknown>;
  dropLevelOffset: number | null;
  dropContainerKey: TreeKey | null;
  dropTargetKey: TreeKey | null;
  dropPosition: -1 | 0 | 1 | null;
  dragOverNodeKey: TreeKey | null;
  indent: number | null;
  direction?: 'ltr' | 'rtl';
  dropIndicatorRender: (props: TreeDropIndicatorRenderProps) => VNodeLike;
  loadData?: (node: EventDataNode) => Promise<unknown>;
  filterTreeNode?: (node: EventDataNode) => boolean;
  titleRender?: (node: DataNode) => VNodeLike;
  classNames?: Partial<TreeSemanticClassNames>;
  styles?: Partial<TreeSemanticStyles>;

  // ---- 事件（Tree 侧实现，TreeNode 侧调用）----
  onNodeClick: (e: MouseEvent, node: EventDataNode) => void;
  onNodeDoubleClick: (e: MouseEvent, node: EventDataNode) => void;
  onNodeExpand: (e: MouseEvent | undefined, node: EventDataNode) => void;
  onNodeSelect: (e: MouseEvent | undefined, node: EventDataNode) => void;
  onNodeCheck: (e: MouseEvent | undefined, node: EventDataNode, checked: boolean) => void;
  onNodeLoad: (node: EventDataNode) => Promise<unknown>;
  onNodeMouseEnter: (e: MouseEvent, node: EventDataNode) => void;
  onNodeMouseLeave: (e: MouseEvent, node: EventDataNode) => void;
  /** rc NodeList 传给 TreeNode 的 onMouseMove（鼠标移动 ⇒ active 复位）。 */
  onNodeMouseMove?: (node: EventDataNode) => void;
  onNodeContextMenu: (e: MouseEvent, node: EventDataNode) => void;
  onNodeDragStart: (e: DragEvent, nodeProps: DragNodeSnapshot & Record<string, unknown>) => void;
  onNodeDragEnter: (e: DragEvent, nodeProps: DragNodeSnapshot & Record<string, unknown>) => void;
  onNodeDragOver: (e: DragEvent, nodeProps: DragNodeSnapshot & Record<string, unknown>) => void;
  onNodeDragLeave: (e: DragEvent, nodeProps: DragNodeSnapshot & Record<string, unknown>) => void;
  onNodeDragEnd: (
    e: DragEvent,
    nodeProps: (DragNodeSnapshot & Record<string, unknown>) | null,
  ) => void;
  onNodeDrop: (
    e: DragEvent,
    nodeProps: (DragNodeSnapshot & Record<string, unknown>) | null,
    outsideTree?: boolean,
  ) => void;
}

export type VNodeLike = unknown;

export const treeContextKey: InjectionKey<TreeContextValue> = Symbol('treeContext');

export type { DropIndicatorProps };
