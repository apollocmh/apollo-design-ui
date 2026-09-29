/**
 * Tree 的公共导出。
 *
 * 与 antd 的 es/tree/index.js 对齐的对外面：
 * `Tree` / 类型面 / token / utils（tree-select 等下游消费）。
 * `Tree.TreeNode`（children 形态）v6 已 deprecated —— 本仓不实现（G1 §6）。
 */

import { withInstall } from '../_internal/with-install';
import DirectoryTreeComponent from './DirectoryTree';
import TreeComponent from './Tree';

/** Tree 组件。注册名 `ATree`（COMPONENT-RULES.md 规则 R2）。 */
export const Tree = withInstall(TreeComponent);

/** DirectoryTree —— 目录树变体（`Tree.DirectoryTree` 的对应物）。 */
export const DirectoryTree = withInstall(DirectoryTreeComponent);

export default Tree;

Tree.DirectoryTree = DirectoryTree;

export type { DropIndicatorProps } from './DropIndicator';
export type {
  BasicDataNode,
  DataNode,
  DirectoryTreeProps,
  EventDataNode,
  SafeKey,
  TreeAllowDrop,
  TreeAllowDropOptions,
  TreeCheckedKeys,
  TreeCheckInfo,
  TreeDataEntity,
  TreeDragEnterEventInfo,
  TreeDragEventInfo,
  TreeDraggable,
  TreeDraggableConfig,
  TreeDropEventInfo,
  TreeEmits,
  TreeExpandAction,
  TreeExpandEventInfo,
  TreeFieldNames,
  TreeIconType,
  TreeKey,
  TreeLoadEventInfo,
  TreeNodeRenderInfo,
  TreeProps,
  TreeRef,
  TreeScrollConfig,
  TreeSelectEventInfo,
  TreeSemanticClassNames,
  TreeSemanticStyles,
  TreeSemanticValue,
  TreeSlots,
} from './interface';
export { genTreeStyle, genTreeTokenDecls } from './style';
export type { ComponentToken as TreeComponentToken } from './style/token';
export { prepareComponentToken as prepareTreeComponentToken } from './style/token';
export * from './utils';
