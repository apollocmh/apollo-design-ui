/** Public Vue contracts for Select and its option data. */

import type { CSSProperties, VNodeChild } from 'vue';
import type { SizeType } from '../config-provider/size-context';

// ---------------------------------------------------------------------------
// 基础值类型
// ---------------------------------------------------------------------------

export type RawValueType = string | number;

/** antd 的 `SelectValue`。 */
export type SelectValue =
  | RawValueType
  | RawValueType[]
  | LabeledValue
  | LabeledValue[]
  | null
  | undefined;

/** antd 的 `LabeledValue`（labelInValue 的输出形态）。 */
export interface LabeledValue {
  key?: RawValueType;
  value: RawValueType;
  label?: unknown;
}

/** rc 的内部形态（`labelInValue` 的中间表示）。 */
export interface LabelInValueType {
  label?: unknown;
  value: RawValueType;
  key?: RawValueType;
  disabled?: boolean;
  title?: string;
}

export interface BaseOptionType {
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  [name: string]: unknown;
}

export interface DefaultOptionType extends BaseOptionType {
  label?: unknown;
  value?: RawValueType | null;
  children?: Omit<DefaultOptionType, 'children'>[];
  options?: DefaultOptionType[];
}

export type SelectOptionType = BaseOptionType | DefaultOptionType;

/** antd `OptionProps`（`Select.Option` / `Select.OptGroup`，deprecated 但保留）。 */
export interface OptionProps extends BaseOptionType {
  value?: RawValueType | null;
  children?: unknown;
}

export interface OptGroupProps extends BaseOptionType {
  label?: unknown;
  children?: unknown;
}

// ---------------------------------------------------------------------------
// 模式 / 尺寸 / 状态
// ---------------------------------------------------------------------------

/**
 * 公开模式只有 `multiple` / `tags` —— antd 把 `mode="combobox"` 吞成单选
 * （`index.tsx` 的 `mode` memo），只有 `SECRET_COMBOBOX_MODE_DO_NOT_USE` 才真走
 * combobox（AutoComplete 用）。内核实现 combobox 分支，公开类型不声明。
 */
export type SelectMode = 'multiple' | 'tags';

/** 内核模式（engine 内部用）。 */
export type InternalSelectMode = SelectMode | 'combobox';

/**
 * 尺寸。**直接别名到 `config-provider` 的 `SizeType`**（`'small' | 'medium' | 'middle' | 'large'`）。
 *
 * 上游 `SelectProps.size` 就是 `SizeType`；此前手抄成 `'small' | 'middle' | 'large'`
 * 漏了 `medium`（运行时 `useSize` 是吃 `SizeType` 的 ⇒ 类型比运行时窄，Issue #4.3）。
 */
export type SelectSize = SizeType;

export type SelectVariant = 'outlined' | 'borderless' | 'filled' | 'underlined';

export type SelectStatus = 'error' | 'warning' | 'success' | 'validating';

/** antd `SelectCommonPlacement`（`_util/motion.ts` 的 4 值）。 */
export type SelectCommonPlacement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

export type SelectDirection = 'ltr' | 'rtl';

// ---------------------------------------------------------------------------
// 搜索配置
// ---------------------------------------------------------------------------

export type FilterFunc<OptionType> = (inputValue: string, option?: OptionType) => boolean;

export interface SearchConfig<OptionType = DefaultOptionType> {
  autoClearSearchValue?: boolean;
  filterOption?: boolean | FilterFunc<OptionType>;
  filterSort?: (optionA: OptionType, optionB: OptionType, info: { searchValue: string }) => number;
  optionFilterProp?: string | string[];
}

export type SelectSearchConfig = SearchConfig<DefaultOptionType>;

// ---------------------------------------------------------------------------
// 语义槽（classNames / styles）
// ---------------------------------------------------------------------------

export interface SelectSemanticClassNames {
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
  popup?: {
    root?: string;
    listItem?: string;
    list?: string;
  };
}

export interface SelectSemanticStyles {
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
  popup?: {
    root?: CSSProperties;
    listItem?: CSSProperties;
    list?: CSSProperties;
  };
}

export interface FieldNames {
  value?: string;
  label?: string;
  groupLabel?: string;
  options?: string;
}

// ---------------------------------------------------------------------------
// Engine content function types; public component content uses slots.
// ---------------------------------------------------------------------------

/** `FlattenOptionData`（rc `interface.d.ts`）。 */
export interface FlattenOptionData<OptionType = DefaultOptionType> {
  label?: unknown;
  data: OptionType;
  key: string | number;
  value?: RawValueType;
  groupOption?: boolean;
  group?: boolean;
}

/** 选择器里一个已选值的展示形态（rc `DisplayValueType`）。 */
export interface DisplayValueType {
  key?: string | number;
  value?: RawValueType;
  label?: unknown;
  title?: unknown;
  disabled?: boolean;
  index?: number;
}

/** `tagRender` 的入参（rc `CustomTagProps`）。 */
export interface CustomTagProps {
  label?: unknown;
  value?: RawValueType;
  disabled: boolean;
  onClose: (event?: MouseEvent) => void;
  closable: boolean;
  isMaxTag: boolean;
  index?: number;
}

export type OptionRenderFn = (
  option: FlattenOptionData<DefaultOptionType>,
  info: { index: number },
) => VNodeChild;

export type LabelRenderFn = (props: LabelInValueType) => VNodeChild;

export type TagRenderFn = (props: CustomTagProps) => VNodeChild;

export type PopupRenderFn = (menu: unknown) => VNodeChild;

export type ScrollToArg =
  | number
  | {
      index?: number;
      align?: 'top' | 'bottom' | 'auto';
      key?: string | number;
    };

// ---------------------------------------------------------------------------
// 实例句柄（antd `RefSelectProps` = rc `BaseSelectRef`）
// ---------------------------------------------------------------------------

export interface SelectRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  scrollTo: (arg?: ScrollToArg) => void;
  nativeElement: HTMLElement | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SelectProps<ValueType = SelectValue> {
  // ---- 身份 ----
  id?: string;
  prefixCls?: string;
  /** ⚠️ Vue 原生 `class` / `style` 走 attrs（不是 prop）；这里只为类型面留位。 */
  class?: unknown;

  // ---- 值 ----
  value?: ValueType;
  defaultValue?: ValueType;
  /** 输出 `{ label, value }` 而非裸值。 */
  labelInValue?: boolean;
  /** 回填值取 option 的哪个字段（默认 `label`）。 */
  optionLabelProp?: string;
  fieldNames?: FieldNames;

  // ---- 模式 ----
  mode?: SelectMode;

  // ---- 选项 ----
  options?: DefaultOptionType[];
  /** 搜索时列表的最大高度（默认 256）。 */
  listHeight?: number;
  /** 虚拟滚动的估算行高（默认 controlHeight = 32）。 */
  listItemHeight?: number;
  virtual?: boolean;
  /** 键盘上下键是否自动激活第一项（默认 true，combobox 为 false）。 */
  defaultActiveFirstOption?: boolean;
  // ---- 搜索 ----
  showSearch?: boolean | SelectSearchConfig;
  /** Search text; supports v-model:searchValue. */
  searchValue?: string;
  /** @deprecated 用 `showSearch.autoClearSearchValue` */
  autoClearSearchValue?: boolean;
  /** @deprecated 用 `showSearch.filterOption` */
  filterOption?: boolean | FilterFunc<DefaultOptionType>;
  /** @deprecated 用 `showSearch.filterSort` */
  filterSort?: SearchConfig<DefaultOptionType>['filterSort'];
  /** @deprecated 用 `showSearch.optionFilterProp` */
  optionFilterProp?: string | string[];

  // ---- 外观 ----
  size?: SelectSize;
  variant?: SelectVariant;
  /** @deprecated 用 `variant` */
  bordered?: boolean;
  status?: SelectStatus;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  /** @deprecated 默认显示箭头，隐藏请用空的 `#suffixIcon` 插槽或 `showArrow: false` */
  showArrow?: boolean;
  allowClear?: boolean | { clearIcon?: VNodeChild; label?: string };
  maxLength?: number;

  // ---- 多选 ----
  maxCount?: number;
  maxTagCount?: number;
  maxTagTextLength?: number;
  tokenSeparators?: string[] | ((input: string) => string[]);

  // ---- 浮层 ----
  open?: boolean;
  defaultOpen?: boolean;
  placement?: SelectCommonPlacement;
  direction?: SelectDirection;
  popupMatchSelectWidth?: boolean | number;
  getPopupContainer?: (node: HTMLElement) => HTMLElement | ShadowRoot;
  transitionName?: string;
  /** @deprecated 用 `classNames.popup.root` */
  popupClassName?: string;
  /** @deprecated 用 `classNames.popup.root` */
  dropdownClassName?: string;
  /** @deprecated 用 `styles.popup.root` */
  dropdownStyle?: CSSProperties;
  popupStyle?: CSSProperties;

  // ---- 语义槽 ----
  classNames?: SelectSemanticClassNames;
  styles?: SelectSemanticStyles;

  // ---- 无障碍 ----
  tabIndex?: number;
  autoFocus?: boolean;
  title?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// 事件（Vue 侧：语义事件 + v-model 同发，见 PITFALLS 162）
// ---------------------------------------------------------------------------

export interface SelectEmits<ValueType = SelectValue> {
  change: [value: ValueType, option: DefaultOptionType | DefaultOptionType[] | undefined];
  'update:value': [value: ValueType];
  select: [value: RawValueType | LabeledValue, option: DefaultOptionType];
  deselect: [value: RawValueType | LabeledValue, option: DefaultOptionType];
  search: [value: string];
  'update:searchValue': [value: string];
  openChange: [open: boolean];
  'update:open': [open: boolean];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  clear: [];
  popupScroll: [event: Event];
  inputKeyDown: [event: KeyboardEvent];
}

// ---------------------------------------------------------------------------
// Slots（规则 C8-R2：ReactNode / render prop 一律 slot —— **不**保留同名 prop。
// 文本类 prop（placeholder）保留 string 便捷形态，slot 优先。）
// ---------------------------------------------------------------------------

export interface SelectSlots {
  default?: () => VNodeChild;
  prefix?: () => VNodeChild;
  suffixIcon?: (props: {
    searchValue: string;
    open: boolean;
    focused: boolean;
    showSearch: boolean;
    loading?: boolean;
  }) => VNodeChild;
  searchIcon?: () => VNodeChild;
  loadingIcon?: () => VNodeChild;
  clearIcon?: () => VNodeChild;
  removeIcon?: () => VNodeChild;
  menuItemSelectedIcon?: (props: {
    value?: unknown;
    disabled?: boolean;
    isSelected?: boolean;
  }) => VNodeChild;
  placeholder?: () => VNodeChild;
  notFoundContent?: () => VNodeChild;
  optionRender?: (props: {
    option: FlattenOptionData<DefaultOptionType>;
    index: number;
  }) => VNodeChild;
  tagRender?: (props: CustomTagProps) => VNodeChild;
  labelRender?: (props: LabelInValueType) => VNodeChild;
  popupRender?: (props: { menu: VNodeChild }) => VNodeChild;
  maxTagPlaceholder?: (props: { omittedValues: DisplayValueType[] }) => VNodeChild;
}
