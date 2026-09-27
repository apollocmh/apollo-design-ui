/**
 * Select 的两级 context（rc 的 `SelectContext` / `BaseSelectContext`）。
 *
 * ⚠️ **注入的是 `ComputedRef` 而不是裸对象**（D27 / D37 同源）：Vue 的 `inject`
 * 在 setup 期解析一次，裸对象会是快照 ⇒ 子项的判据停在旧值。
 */

import type { ComputedRef, InjectionKey } from 'vue';
import type {
  DefaultOptionType,
  DisplayValueType,
  OptionRenderFn,
  RawValueType,
  SelectDirection,
  SelectSemanticClassNames,
  SelectSemanticStyles,
} from '../interface';
import type { FlattenItem, ResolvedFieldNames } from './valueUtil';

// ---------------------------------------------------------------------------
// SelectContext（值语义层 → 列表层）
// ---------------------------------------------------------------------------

export interface ActiveValueInfo {
  source?: 'keyboard' | 'mouse';
}

export interface SelectContextValue {
  /** 摊平后的选项（含分组行）。 */
  flattenOptions: FlattenItem[];
  onActiveValue: (active: RawValueType | null, index: number, info?: ActiveValueInfo) => void;
  defaultActiveFirstOption: boolean;
  /** `(value, { selected })`。 */
  onSelect: (value: RawValueType, info: { selected: boolean }) => void;
  menuItemSelectedIcon?: unknown;
  rawValues: Set<RawValueType>;
  fieldNames: ResolvedFieldNames;
  virtual: boolean;
  direction: SelectDirection;
  listHeight: number;
  listItemHeight: number;
  childrenAsData: boolean;
  maxCount?: number;
  optionRender?: OptionRenderFn;
  classNames?: SelectSemanticClassNames;
  styles?: SelectSemanticStyles;
}

export const selectContextKey: InjectionKey<ComputedRef<SelectContextValue>> =
  Symbol('apolloSelectContext');

// ---------------------------------------------------------------------------
// BaseSelectContext（交互外壳层 → 选择器 DOM 层）
// ---------------------------------------------------------------------------

export interface BaseSelectContextValue {
  prefixCls: string;
  id: string;
  /** 实际生效的 open。 */
  open: boolean;
  /** rc 的 `triggerOpen`（= mergedOpen，供子层判断是否已开）。 */
  triggerOpen: boolean;
  /** 用户意图上的 open（未经 postOpen 压缩）。 */
  rawOpen: boolean;
  showSearch: boolean;
  multiple: boolean;
  mode?: string;
  disabled?: boolean;
  loading?: boolean;
  searchValue: string;
  activeValue?: string | null;
  activeDescendantId?: string;
  showScrollBar: boolean | 'optional';
  /** 关闭动画期间锁住列表（rc 的 `lockOptions`）。 */
  lockOptions: boolean;
  notFoundContent?: unknown;
  placeholder?: unknown;
  maxLength?: number;
  tabIndex?: number;
  title?: string;
  role?: string;
  removeIcon?: unknown;
  autoClearSearchValue?: boolean;
  maxTagTextLength?: number;
  maxTagCount?: number;
  maxTagPlaceholder?: unknown | ((omitted: DisplayValueType[]) => unknown);
  tagRender?: (props: {
    label?: unknown;
    value?: RawValueType;
    index?: number;
    disabled: boolean;
    closable: boolean;
    onClose: (event?: MouseEvent) => void;
    isMaxTag: boolean;
  }) => unknown;
  displayValues: DisplayValueType[];
  classNames?: SelectSemanticClassNames;
  styles?: SelectSemanticStyles;
  toggleOpen: (next?: boolean) => void;
  onSearch: (text: string, fromTyping: boolean, isCompositing: boolean) => boolean | undefined;
  onSearchSubmit: (text: string) => void;
  onSelectorRemove: (value: DisplayValueType) => void;
  onInputBlur: () => void;
  onClear: () => void;
  tokenWithEnter: boolean;
}

export const baseSelectContextKey: InjectionKey<ComputedRef<BaseSelectContextValue>> =
  Symbol('apolloBaseSelectContext');

/** 默认 option 类型（供无 context 的纯渲染场景兜底）。 */
export const EMPTY_OPTION: DefaultOptionType = {};
