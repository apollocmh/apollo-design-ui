/**
 * TreeSelect 的公共导出。静态属性：`SHOW_ALL` / `SHOW_PARENT` / `SHOW_CHILD`。
 *
 * INTENDED 差异（COMPATIBILITY 登记）：
 * - `TreeSelect.TreeNode` children 形态不实现（v6 deprecated，同 Tree）；
 * - `SHOW_*` 同时以具名常量导出（Vue 惯例）；
 * - `TreeSelect.DirectoryTree` 不存在（antd 也没有）。
 */

import { withInstall } from '../_internal/with-install';
import TreeSelectComponent from './TreeSelect';
import { SHOW_ALL, SHOW_CHILD, SHOW_PARENT } from './utils/strategy-util';

/** TreeSelect 组件。注册名 `ATreeSelect`。 */
export const TreeSelect = withInstall(
  Object.assign(TreeSelectComponent, {
    SHOW_ALL,
    SHOW_PARENT,
    SHOW_CHILD,
  }),
);

export default TreeSelect;

export type {
  ChangeEventExtra,
  LabeledValueType,
  SimpleModeConfig,
  TreeSelectDataNode,
  TreeSelectValue,
} from './interface';
export { genTreeSelectStyle } from './style';
export type { ShowCheckedStrategy } from './utils/strategy-util';
export { SHOW_ALL, SHOW_CHILD, SHOW_PARENT } from './utils/strategy-util';
