import type { CSSProperties, VNode, VNodeChild } from 'vue';
import type { SemanticInput } from '../_internal/use-merge-semantic';
import type { SizeType } from '../config-provider/size-context';
import type { SelectCommonPlacement, SelectSlots, SelectVariant } from '../select/interface';
import type { SearchConfig } from './hooks/search';
import type { BaseOptionType, FieldNames, RawValue, ShowCheckedStrategy, ValueCell } from './utils';

export type CascaderValue = RawValue | ValueCell[];
export type CascaderOutputValue = ValueCell | ValueCell[];
export type CascaderSelectedOptions = (BaseOptionType | null)[] | (BaseOptionType | null)[][];
export type CascaderSearchConfig = Omit<SearchConfig, 'render' | 'searchValue' | 'onSearch'>;
export interface CascaderSemanticClassNames {
  root?: string;
  prefix?: string;
  suffix?: string;
  input?: string;
  placeholder?: string;
  content?: string;
  item?: string;
  itemContent?: string;
  itemRemove?: string;
  clear?: string;
  popup?: { root?: string; list?: string; listItem?: string };
}
export interface CascaderSemanticStyles {
  root?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
  input?: CSSProperties;
  placeholder?: CSSProperties;
  content?: CSSProperties;
  item?: CSSProperties;
  itemContent?: CSSProperties;
  itemRemove?: CSSProperties;
  clear?: CSSProperties;
  popup?: { root?: CSSProperties; list?: CSSProperties; listItem?: CSSProperties };
}
export interface CascaderPanelProps {
  prefixCls?: string;
  options?: BaseOptionType[];
  value?: CascaderValue;
  defaultValue?: CascaderValue;
  multiple?: boolean;
  fieldNames?: FieldNames;
  changeOnSelect?: boolean;
  showCheckedStrategy?: ShowCheckedStrategy;
  loadData?: (selectedOptions: BaseOptionType[]) => void | Promise<void>;
  expandTrigger?: 'click' | 'hover';
  expandIcon?: VNodeChild;
  loadingIcon?: VNodeChild;
  direction?: 'ltr' | 'rtl';
  notFoundContent?: VNodeChild;
  disabled?: boolean;
  popupMenuColumnStyle?: CSSProperties;
  classNames?: SemanticInput<CascaderSemanticClassNames, CascaderPanelProps>;
  styles?: SemanticInput<CascaderSemanticStyles, CascaderPanelProps>;
  'onUpdate:value'?: (value: CascaderOutputValue) => void;
  onChange?: (value: CascaderOutputValue, selectedOptions: CascaderSelectedOptions) => void;
}
export interface CascaderProps extends Omit<CascaderPanelProps, 'classNames' | 'styles'> {
  id?: string;
  checkable?: boolean;
  size?: SizeType;
  loading?: boolean;
  variant?: SelectVariant;
  bordered?: boolean;
  allowClear?: boolean | { clearIcon?: VNodeChild };
  clearIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  suffixIcon?: VNodeChild;
  open?: boolean;
  defaultOpen?: boolean;
  placement?: SelectCommonPlacement;
  showSearch?: boolean | CascaderSearchConfig;
  searchValue?: string;
  autoClearSearchValue?: boolean;
  placeholder?: VNodeChild;
  popupClassName?: string;
  dropdownClassName?: string;
  popupStyle?: CSSProperties;
  popupMatchSelectWidth?: boolean | number;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  status?: 'error' | 'warning';
  maxTagCount?: number;
  maxTagTextLength?: number;
  maxTagPlaceholder?: VNodeChild;
  classNames?: SemanticInput<CascaderSemanticClassNames, CascaderProps>;
  styles?: SemanticInput<CascaderSemanticStyles, CascaderProps>;
  'onUpdate:open'?: (open: boolean) => void;
  'onUpdate:searchValue'?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onSearch?: (value: string) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onClear?: () => void;
  onPopupScroll?: (event: Event) => void;
  onKeydown?: (event: KeyboardEvent) => void;
  onKeyup?: (event: KeyboardEvent) => void;
  onMousedown?: (event: MouseEvent) => void;
}
export interface CascaderEmits {
  'update:value': (value: CascaderOutputValue) => void;
  change: (value: CascaderOutputValue, selectedOptions: CascaderSelectedOptions) => void;
  'update:open': (open: boolean) => void;
  openChange: (open: boolean) => void;
  'update:searchValue': (value: string) => void;
  search: (value: string) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
  clear: () => void;
  popupScroll: (event: Event) => void;
  keydown: (event: KeyboardEvent) => void;
  keyup: (event: KeyboardEvent) => void;
  mousedown: (event: MouseEvent) => void;
}
export interface CascaderOptionSlots {
  optionRender?: (scope: { option: BaseOptionType; pathOptions: BaseOptionType[] }) => VNodeChild;
  searchRender?: (scope: {
    inputValue: string;
    pathOptions: BaseOptionType[];
    fieldNames: FieldNames;
  }) => VNodeChild;
  expandIcon?: (scope: { option: BaseOptionType }) => VNodeChild;
  loadingIcon?: (scope: { option: BaseOptionType }) => VNodeChild;
}
export interface CascaderPanelSlots extends CascaderOptionSlots {
  notFoundContent?: () => VNodeChild;
}
export interface CascaderSlots extends CascaderPanelSlots {
  default?: () => VNodeChild;
  placeholder?: () => VNodeChild;
  displayRender?: (scope: {
    labels: VNodeChild[];
    selectedOptions: (BaseOptionType | null)[];
  }) => VNodeChild;
  suffixIcon?: SelectSlots['suffixIcon'];
  searchIcon?: SelectSlots['suffixIcon'];
  clearIcon?: () => VNodeChild;
  removeIcon?: () => VNodeChild;
  maxTagPlaceholder?: (scope: {
    omittedValues: { value: ValueCell; label: VNodeChild; disabled?: boolean }[];
  }) => VNodeChild;
  popupRender?: (scope: { menu: VNode }) => VNodeChild;
}
export interface CascaderRef {
  readonly nativeElement: HTMLElement | null;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
}
