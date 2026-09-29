/**
 * TreeSelect 类型定义（从 antd `index.d.ts` + rc `interface.d.ts` 重新定义，不复制）。
 */

import type { SafeKey, TreeExpandAction, TreeIconType } from '../tree/interface';
import type { ShowCheckedStrategy } from './utils/strategy-util';
import type { RawValue, TreeSelectFieldNames } from './utils/value-util';

export type { RawValue, ShowCheckedStrategy, TreeSelectFieldNames };

/** 树数据节点：`value` 字段同时充当树的 key（fillFieldNames 的 key === value 判据）。 */
export interface TreeSelectDataNode extends Record<string, unknown> {
  key?: SafeKey;
  value?: SafeKey;
  title?: unknown;
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  isLeaf?: boolean;
  icon?: TreeIconType;
  children?: TreeSelectDataNode[];
}

/** labelInValue / treeCheckStrictly 的值形态。 */
export interface LabeledValueType {
  key?: SafeKey;
  value?: SafeKey;
  label?: unknown;
  /** 仅 treeCheckStrictly 下有意义。 */
  halfChecked?: boolean;
}

export type TreeSelectValue = RawValue | LabeledValueType | (RawValue | LabeledValueType)[];

/** simpleMode 平铺数据建树配置。 */
export interface SimpleModeConfig {
  id?: SafeKey;
  pId?: SafeKey;
  rootPId?: SafeKey | null;
}

/** change 事件附加信息（rc `ChangeEventExtra`；legacy 字段见 COMPATIBILITY）。 */
export interface ChangeEventExtra {
  /** 上一批值（labelInValue 形态）。 */
  preValue: LabeledValueType[];
  triggerValue?: SafeKey;
  /** checkable 时的勾选方向。 */
  checked?: boolean;
  /** 非 checkable 时的选中方向。 */
  selected?: boolean;
  /** 触发变更的节点（数据形态，非 VNode —— INTENDED #3）。 */
  triggerNode?: TreeSelectDataNode | null;
  /** 全部勾选节点（数据形态）。 */
  allCheckedNodes?: TreeSelectDataNode[];
}

/** 搜索配置（`showSearch` 对象形态展开）。 */
export interface SearchConfig {
  searchValue?: string;
  onSearch?: (text: string) => void;
  autoClearSearchValue?: boolean;
  filterTreeNode?: boolean | ((inputValue: string, treeNode: TreeSelectDataNode) => boolean);
  treeNodeFilterProp?: string;
}

export type TreeSelectExpandAction = TreeExpandAction;

/** 内部标注形态（rc `LabeledValueType` + halfChecked 分流后的内部值）。 */
export interface InternalLabeledValue {
  value: SafeKey;
  label?: unknown;
  halfChecked?: boolean;
  disabled?: boolean;
}
