import type { PropType, VNodeChild } from 'vue';
import type { CascaderPanelProps, CascaderProps, CascaderValue } from './interface';
import type { BaseOptionType, FieldNames, ShowCheckedStrategy } from './utils';

const content = {
  type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
  default: undefined,
};
const value = { type: [String, Number, Array] as PropType<CascaderValue>, default: undefined };
export const panelProps = {
  prefixCls: { type: String, default: undefined },
  options: { type: Array as PropType<BaseOptionType[]>, default: undefined },
  value,
  defaultValue: value,
  multiple: { type: Boolean, default: false },
  fieldNames: { type: Object as PropType<FieldNames>, default: undefined },
  changeOnSelect: { type: Boolean, default: false },
  showCheckedStrategy: { type: String as PropType<ShowCheckedStrategy>, default: 'SHOW_PARENT' },
  loadData: { type: Function as PropType<CascaderPanelProps['loadData']>, default: undefined },
  expandTrigger: { type: String as PropType<'click' | 'hover'>, default: 'click' },
  expandIcon: content,
  loadingIcon: content,
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
  notFoundContent: content,
  disabled: { type: Boolean, default: undefined },
  popupMenuColumnStyle: {
    type: Object as PropType<CascaderPanelProps['popupMenuColumnStyle']>,
    default: undefined,
  },
  classNames: {
    type: [Object, Function] as PropType<CascaderPanelProps['classNames']>,
    default: undefined,
  },
  styles: {
    type: [Object, Function] as PropType<CascaderPanelProps['styles']>,
    default: undefined,
  },
};
export const cascaderProps = {
  ...panelProps,
  id: { type: String, default: undefined },
  checkable: { type: Boolean, default: undefined },
  size: { type: String as PropType<CascaderProps['size']>, default: undefined },
  loading: { type: Boolean, default: undefined },
  variant: { type: String as PropType<CascaderProps['variant']>, default: undefined },
  bordered: { type: Boolean, default: true },
  allowClear: { type: [Boolean, Object] as PropType<CascaderProps['allowClear']>, default: true },
  clearIcon: content,
  removeIcon: content,
  suffixIcon: content,
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: undefined },
  placement: { type: String as PropType<CascaderProps['placement']>, default: undefined },
  showSearch: {
    type: [Boolean, Object] as PropType<CascaderProps['showSearch']>,
    default: undefined,
  },
  searchValue: { type: String, default: undefined },
  autoClearSearchValue: { type: Boolean, default: undefined },
  placeholder: content,
  popupClassName: { type: String, default: undefined },
  dropdownClassName: { type: String, default: undefined },
  popupStyle: { type: Object as PropType<CascaderProps['popupStyle']>, default: undefined },
  popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
  getPopupContainer: {
    type: Function as PropType<CascaderProps['getPopupContainer']>,
    default: undefined,
  },
  status: { type: String as PropType<CascaderProps['status']>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<CascaderProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<CascaderProps['styles']>, default: undefined },
  maxTagCount: { type: Number, default: undefined },
  maxTagTextLength: { type: Number, default: undefined },
  maxTagPlaceholder: content,
};
