/**
 * TreeSelect 类型定义（从 antd `index.d.ts` + rc `interface.d.ts` 重新定义，不复制）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { SemanticInput } from '../_internal/use-merge-semantic';
import type { SizeType } from '../config-provider/size-context';
import type {
  CustomTagProps,
  DisplayValueType,
  SelectProps,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectSlots,
} from '../select/interface';
import type {
  SafeKey,
  TreeExpandAction,
  TreeIconType,
  TreeProps,
  TreeScrollConfig,
  TreeSlotScope,
} from '../tree/interface';
import type { ShowCheckedStrategy } from './utils/strategy-util';
import type { RawValue, TreeSelectFieldNames } from './utils/value-util';

export type { RawValue, ShowCheckedStrategy, TreeSelectFieldNames };

/** 树数据节点：`value` 字段同时充当树的 key（fillFieldNames 的 key === value 判据）。 */
export interface TreeSelectDataNode extends Record<string, unknown> {
  key?: SafeKey;
  value?: SafeKey;
  title?: VNodeChild | ((node: TreeSelectDataNode) => VNodeChild);
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
  label?: VNodeChild;
  /** 仅 treeCheckStrictly 下有意义。 */
  halfChecked?: boolean;
}

export type TreeSelectValue =
  | RawValue
  | LabeledValueType
  | (RawValue | LabeledValueType)[]
  | null
  | undefined;

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
  autoClearSearchValue?: boolean;
  filterTreeNode?: boolean | ((inputValue: string, treeNode: TreeSelectDataNode) => boolean);
  treeNodeFilterProp?: string;
}

export type TreeSelectExpandAction = TreeExpandAction;

/** 内部标注形态（rc `LabeledValueType` + halfChecked 分流后的内部值）。 */
export interface InternalLabeledValue {
  value: SafeKey;
  label?: VNodeChild;
  halfChecked?: boolean;
  disabled?: boolean;
}

export type TreeSelectSemanticClassNames = Omit<SelectSemanticClassNames, 'popup'> & {
  popup?: { root?: string };
};
export type TreeSelectSemanticStyles = Omit<SelectSemanticStyles, 'popup'> & {
  popup?: { root?: CSSProperties };
};

export interface TreeSelectProps {
  prefixCls?: string;
  id?: string;
  classNames?: SemanticInput<TreeSelectSemanticClassNames, Readonly<TreeSelectProps>>;
  styles?: SemanticInput<TreeSelectSemanticStyles, Readonly<TreeSelectProps>>;
  size?: SizeType;
  disabled?: boolean;
  status?: SelectProps['status'];
  variant?: SelectProps['variant'];
  bordered?: boolean;
  value?: TreeSelectValue;
  defaultValue?: TreeSelectValue;
  labelInValue?: boolean;
  maxCount?: number;
  treeData?: TreeSelectDataNode[];
  treeDataSimpleMode?: boolean | SimpleModeConfig;
  fieldNames?: TreeSelectFieldNames;
  loadData?: (node: TreeSelectDataNode) => Promise<unknown>;
  treeLoadedKeys?: SafeKey[];
  treeCheckable?: boolean;
  treeCheckStrictly?: boolean;
  treeDefaultExpandAll?: boolean;
  treeExpandedKeys?: SafeKey[];
  treeDefaultExpandedKeys?: SafeKey[];
  treeLine?: TreeProps['showLine'];
  treeIcon?: boolean;
  showTreeIcon?: boolean;
  switcherIcon?: VNodeChild;
  treeExpandAction?: TreeSelectExpandAction;
  treeNodeFilterProp?: string;
  filterTreeNode?: SearchConfig['filterTreeNode'];
  treeNodeLabelProp?: string;
  showCheckedStrategy?: ShowCheckedStrategy;
  multiple?: boolean;
  showSearch?: boolean | SearchConfig;
  searchValue?: string;
  autoClearSearchValue?: boolean;
  placeholder?: VNodeChild;
  maxTagCount?: number;
  maxTagTextLength?: number;
  maxTagPlaceholder?: VNodeChild;
  listHeight?: number;
  listItemHeight?: number;
  virtual?: boolean;
  popupMatchSelectWidth?: boolean | number;
  dropdownMatchSelectWidth?: boolean | number;
  placement?: SelectProps['placement'];
  direction?: SelectProps['direction'];
  open?: boolean;
  defaultOpen?: boolean;
  getPopupContainer?: SelectProps['getPopupContainer'];
  allowClear?: SelectProps['allowClear'];
  clearIcon?: VNodeChild;
  suffixIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  notFoundContent?: VNodeChild;
  popupClassName?: string;
  dropdownClassName?: string;
  popupStyle?: CSSProperties;
  loading?: boolean;
  tabIndex?: number;
  autoFocus?: boolean;
  maxLength?: number;
}

export interface TreeSelectEmits {
  'update:value': [value: TreeSelectValue];
  change: [value: TreeSelectValue, labels: VNodeChild[] | null, extra: ChangeEventExtra];
  select: [value: RawValue, node: TreeSelectDataNode | null | undefined];
  deselect: [value: RawValue, node: TreeSelectDataNode | null | undefined];
  'update:open': [open: boolean];
  openChange: [open: boolean];
  'update:searchValue': [value: string];
  search: [value: string];
  'update:treeExpandedKeys': [keys: SafeKey[]];
  treeExpand: [keys: SafeKey[]];
  'update:treeLoadedKeys': [keys: SafeKey[]];
  treeLoad: [keys: SafeKey[]];
  clear: [];
  popupScroll: [event: Event];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  inputKeyDown: [event: KeyboardEvent];
}

export interface TreeSelectSlots {
  /** One native element or Vue component used as the raw trigger. */
  default?: () => VNodeChild;
  prefix?: () => VNodeChild;
  placeholder?: () => VNodeChild;
  notFoundContent?: () => VNodeChild;
  suffixIcon?: SelectSlots['suffixIcon'];
  clearIcon?: () => VNodeChild;
  removeIcon?: () => VNodeChild;
  loadingIcon?: () => VNodeChild;
  treeTitleRender?: (props: { node: TreeSelectDataNode }) => VNodeChild;
  treeIcon?: (props: TreeSlotScope<TreeSelectDataNode>) => VNodeChild;
  switcherIcon?: (props: TreeSlotScope<TreeSelectDataNode>) => VNodeChild;
  switcherLoadingIcon?: (props: TreeSlotScope<TreeSelectDataNode>) => VNodeChild;
  tagRender?: (props: CustomTagProps) => VNodeChild;
  popupRender?: (props: { menu: VNodeChild }) => VNodeChild;
  maxTagPlaceholder?: (props: { omittedValues: DisplayValueType[] }) => VNodeChild;
}

export interface TreeSelectRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  scrollTo: (arg?: number | TreeScrollConfig | null) => void;
  nativeElement: HTMLElement | null;
}
