/**
 * AutoComplete 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/auto-complete/AutoComplete.d.ts`（H2 重新定义，不复制搬运）。
 *
 * C8-R2：popupRender / dropdownRender（fn）→ `#popupRender` 作用域插槽；
 * suffixIcon={null} → `#suffixIcon` 空 slot（用户插槽优先）。dataSource 是数据 prop。
 */

import type { CSSProperties, VNode, VNodeChild } from 'vue';
import type { SizeType } from '../config-provider/size-context';
import type {
  DefaultOptionType,
  RawValueType,
  ScrollToArg,
  SelectEmits,
  SelectProps,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectSlots,
  SelectValue,
  SelectVariant,
} from '../select/interface';

/** antd 的 `DataSourceItemObject`。 */
export interface DataSourceItemObject {
  value: RawValueType;
  text?: VNodeChild;
}

/** antd 的 `DataSourceItemType`（deprecated `dataSource` 的元素形态）。 */
export type DataSourceItemType = string | DataSourceItemObject | VNode;

/**
 * AutoComplete 的语义面（antd 的 `AutoCompleteSemanticType`）。
 * 比 Select 少 item / itemContent / itemRemove 三类（AutoComplete 无多选 tag）。
 */
export interface AutoCompleteSemanticClassNames {
  root?: string;
  prefix?: string;
  input?: string;
  placeholder?: string;
  content?: string;
  clear?: string;
  popup?: SelectSemanticClassNames['popup'];
}

export interface AutoCompleteSemanticStyles {
  root?: CSSProperties;
  prefix?: CSSProperties;
  input?: CSSProperties;
  placeholder?: CSSProperties;
  content?: CSSProperties;
  clear?: CSSProperties;
  popup?: SelectSemanticStyles['popup'];
}

/** antd 的 InputStatus（复用 form 的状态面）。 */
export type InputStatus = 'error' | 'warning';

export interface AutoCompleteProps {
  // ---- 值 ----
  /** 当前值（受控；`v-model:value` 走 `update:value` 事件）。 */
  value?: SelectValue;
  defaultValue?: SelectValue;

  // ---- 选项 ----
  options?: DefaultOptionType[];
  /** @deprecated 用 `options`。 */
  dataSource?: DataSourceItemType[];

  // ---- 展示 ----
  placeholder?: string;
  disabled?: boolean;
  /**
   * 尺寸。**必须用共享 `SizeType`**（`'small' | 'medium' | 'middle' | 'large'`）：
   * 上游 `AutoCompleteProps` 继承 `InternalSelectProps`，其 `size` 就是 `SizeType`
   * （运行时转发给 Select 的 `useSize`）⇒ 手写 `'large' | 'middle' | 'small'`
   * 会漏掉 `medium`（类型比运行时窄，Issue #14.2）。
   */
  size?: SizeType;
  variant?: SelectVariant;
  status?: InputStatus;
  allowClear?: SelectProps['allowClear'];
  autoFocus?: boolean;
  defaultActiveFirstOption?: boolean;
  backfill?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  id?: string;
  tabIndex?: number;
  listHeight?: number;
  listItemHeight?: number;
  virtual?: boolean;
  placement?: SelectProps['placement'];
  getPopupContainer?: SelectProps['getPopupContainer'];
  /** 浮层宽度对齐（deprecated `dropdownMatchSelectWidth`）。 */
  popupMatchSelectWidth?: boolean | number;
  /** @deprecated 用 `popupMatchSelectWidth`。 */
  dropdownMatchSelectWidth?: boolean | number;
  /** @deprecated 用 `classNames.popup.root`。 */
  popupClassName?: string;
  /** @deprecated 用 `classNames.popup.root`。 */
  dropdownClassName?: string;
  /** @deprecated 用 `styles.popup.root`。 */
  dropdownStyle?: CSSProperties;
  maxLength?: number;

  // ---- 样式 ----
  prefixCls?: string;
  classNames?:
    | AutoCompleteSemanticClassNames
    | ((info: { props: AutoCompleteProps }) => AutoCompleteSemanticClassNames);
  styles?:
    | AutoCompleteSemanticStyles
    | ((info: { props: AutoCompleteProps }) => AutoCompleteSemanticStyles);

  // ---- 搜索 ----
  showSearch?: SelectProps['showSearch'];
  searchValue?: string;
  filterOption?: SelectProps['filterOption'];
}

/** Owned Vue notifications; algorithm callbacks remain props. */
export interface AutoCompleteEmits extends Omit<SelectEmits, 'select' | 'deselect'> {
  select: [value: RawValueType, option: DefaultOptionType];
  deselect: [value: RawValueType, option: DefaultOptionType];
}

export type AutoCompleteSlots = Omit<SelectSlots, 'tagRender' | 'removeIcon' | 'maxTagPlaceholder'>;

export type AutoCompleteScrollToArg = ScrollToArg | { top: number };

export interface AutoCompleteRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  scrollTo: (arg?: AutoCompleteScrollToArg) => void;
  nativeElement: HTMLElement | null;
}
