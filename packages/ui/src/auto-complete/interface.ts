/**
 * AutoComplete 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/auto-complete/AutoComplete.d.ts`（H2 重新定义，不复制搬运）。
 *
 * C8-R2：popupRender / dropdownRender（fn）→ `#popupRender` 作用域插槽；
 * suffixIcon={null} → `#suffixIcon` 空 slot（用户插槽优先）。dataSource 是数据 prop。
 */

import type { CSSProperties } from 'vue';
import type {
  DefaultOptionType,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectValue,
  SelectVariant,
} from '../select/interface';

/** antd 的 `DataSourceItemObject`。 */
export interface DataSourceItemObject {
  value: string;
  text: string;
}

/** antd 的 `DataSourceItemType`（deprecated `dataSource` 的元素形态）。 */
export type DataSourceItemType = DataSourceItemObject | unknown;

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
  size?: 'large' | 'middle' | 'small';
  variant?: SelectVariant;
  status?: InputStatus;
  allowClear?: boolean | Record<string, unknown>;
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
  placement?: string;
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
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  classNames?:
    | AutoCompleteSemanticClassNames
    | ((info: { props: AutoCompleteProps }) => AutoCompleteSemanticClassNames);
  styles?:
    | AutoCompleteSemanticStyles
    | ((info: { props: AutoCompleteProps }) => AutoCompleteSemanticStyles);

  // ---- 搜索 ----
  showSearch?: boolean | Record<string, unknown>;
  searchValue?: string;
  filterOption?: boolean | ((inputValue: string, option: DefaultOptionType) => boolean);

  // ---- 回调（props 形态，与本仓 Select 同判；emits 同名同发）----
  onChange?: (value: SelectValue, option: unknown) => void;
  onSelect?: (value: string | number, option: DefaultOptionType) => void;
  onDeselect?: (value: string | number, option: DefaultOptionType) => void;
  onSearch?: (value: string) => void;
  /** 浮层开合（deprecated `onDropdownVisibleChange`）。 */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated 用 `onOpenChange`。 */
  onDropdownVisibleChange?: (open: boolean) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onClear?: () => void;
  onPopupScroll?: (event: Event) => void;
  onInputKeyDown?: (event: KeyboardEvent) => void;
}

/** `ref` 的 expose 面（与 Select 的 RefSelectProps 一致）。 */
export interface AutoCompleteRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  scrollTo: (arg?: number | { top: number }) => void;
}
