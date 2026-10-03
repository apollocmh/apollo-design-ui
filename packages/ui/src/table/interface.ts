/**
 * Table 的公开类型（antd 6.6.4 `components/table/interface.d.ts`，203 行）—— **逐条对拍**。
 *
 * React → Vue 映射约定（全仓统一）：
 * - `React.ReactNode` → `VNodeChild`
 * - `React.Key`      → `TableKey`（string | number）
 * - 事件载荷里的 `React.MouseEvent` → `Event`（不引用 DOM 库类型，保持引擎可 SSR）
 */

import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { CheckboxProps } from '../checkbox/interface';
import type { SizeType } from '../config-provider/size-context';
import type { PaginationProps } from '../pagination/interface';
import type { TooltipProps } from '../tooltip/interface';

/** `React.Key` 的对应物（bigint 不支持，与 rc 的 `SafeKey` 同判）。 */
export type TableKey = string | number;

// ============================== Locale ==============================

export interface TableLocale {
  filterTitle?: string;
  filterConfirm?: VNodeChild;
  filterReset?: VNodeChild;
  filterEmptyText?: VNodeChild;
  /** @deprecated 用 `filterCheckAll`。 */
  filterCheckall?: VNodeChild;
  filterCheckAll?: VNodeChild;
  filterSearchPlaceholder?: string;
  emptyText?: VNodeChild | (() => VNodeChild);
  selectAll?: VNodeChild;
  selectNone?: VNodeChild;
  selectInvert?: VNodeChild;
  selectionAll?: VNodeChild;
  sortTitle?: string;
  expand?: string;
  collapse?: string;
  triggerDesc?: string;
  triggerAsc?: string;
  cancelSort?: string;
}

// ============================== Sorter ==============================

export type SortOrder = 'descend' | 'ascend' | null;
export type SorterTooltipTarget = 'full-header' | 'sorter-icon';
export type SorterTooltipProps = TooltipProps & {
  target?: SorterTooltipTarget;
};

export type TableAction = 'paginate' | 'sort' | 'filter';
export type CompareFn<T = Record<string, unknown>> = (a: T, b: T, sortOrder?: SortOrder) => number;

export interface ColumnSorter<RecordType = Record<string, unknown>> {
  /** 列的排序比较函数。 */
  compare?: CompareFn<RecordType>;
  /** 多列排序的优先级。 */
  multiple?: number | 'compare';
}

export interface ColumnFilterItem {
  text: VNodeChild;
  value: TableKey | boolean;
  children?: ColumnFilterItem[];
}

export interface ColumnTitleProps<RecordType = Record<string, unknown>> {
  /** @deprecated v7 移除，用 `sortColumns`。 */
  sortOrder?: SortOrder;
  /** @deprecated v7 移除，用 `sortColumns`。 */
  sortColumn?: ColumnType<RecordType>;
  sortColumns?: { column: ColumnType<RecordType>; order: SortOrder }[];
  filters?: Record<string, FilterValue>;
}

export type ColumnTitle<RecordType = Record<string, unknown>> =
  | VNodeChild
  | ((props: ColumnTitleProps<RecordType>) => VNodeChild);

// ============================== Filter ==============================

export type FilterValue = (TableKey | boolean)[];
export type FilterKey = (string | number)[] | null;
export type FilterSearchType<RecordType = Record<string, unknown>> =
  | boolean
  | ((input: string, record: RecordType) => boolean);

export interface FilterConfirmProps {
  closeDropdown: boolean;
}

export interface FilterResetProps {
  confirm?: boolean;
  closeDropdown?: boolean;
}

/** @deprecated 用 `FilterResetProps`。 */
export interface FilterRestProps extends FilterResetProps {}

export interface FilterDropdownProps<_RecordType = Record<string, unknown>> {
  prefixCls: string;
  setSelectedKeys: (selectedKeys: TableKey[]) => void;
  selectedKeys: TableKey[];
  /** 确认过滤值；要顺带关掉下拉就传 `{ closeDropdown: true }`。 */
  confirm: (param?: FilterConfirmProps) => void;
  clearFilters?: (param?: FilterResetProps) => void;
  filters?: ColumnFilterItem[];
  /** 只关下拉。 */
  close: () => void;
  visible: boolean;
}

// ============================== Column ==============================

/** rc `ColumnType` 的本仓对应（只列用到的字段）。 */
export interface RcColumnType<RecordType = Record<string, unknown>> {
  align?: 'left' | 'center' | 'right';
  className?: string;
  colSpan?: number;
  dataIndex?: string | number | readonly (string | number)[];
  ellipsis?: boolean | { showTitle?: boolean };
  fixed?: boolean | 'left' | 'right' | 'start' | 'end';
  key?: TableKey;
  minWidth?: number | string;
  onCell?: (
    record: RecordType,
    rowIndex: number,
  ) => Record<string, unknown> & { colSpan?: number; rowSpan?: number };
  onHeaderCell?: (column: ColumnType<RecordType>) => Record<string, unknown> & {
    colSpan?: number;
    rowSpan?: number;
  };
  rowScope?: 'row' | 'rowgroup' | 'col' | 'colgroup';
  shouldCellUpdate?: (record: RecordType, prevRecord: RecordType) => boolean;
  title?: VNodeChild;
  width?: number | string;
  hidden?: boolean;
}

export interface ColumnType<RecordType = Record<string, unknown>>
  extends Omit<RcColumnType<RecordType>, 'title'> {
  title?: ColumnTitle<RecordType>;
  sorter?: boolean | CompareFn<RecordType> | ColumnSorter<RecordType>;
  sortOrder?: SortOrder;
  defaultSortOrder?: SortOrder;
  sortDirections?: SortOrder[];
  sortIcon?: (props: { sortOrder: SortOrder }) => VNodeChild;
  showSorterTooltip?: boolean | SorterTooltipProps;
  filtered?: boolean;
  filters?: ColumnFilterItem[];
  filterDropdown?: VNodeChild | ((props: FilterDropdownProps<RecordType>) => VNodeChild);
  filterOnClose?: boolean;
  filterMultiple?: boolean;
  filteredValue?: FilterValue | null;
  defaultFilteredValue?: FilterValue | null;
  filterIcon?: VNodeChild | ((filtered: boolean) => VNodeChild);
  filterMode?: 'menu' | 'tree';
  filterSearch?: FilterSearchType<ColumnFilterItem>;
  onFilter?: (value: TableKey | boolean, record: RecordType) => boolean;
  /** 覆盖 Dropdown props（5.22.0+）。 */
  filterDropdownProps?: Record<string, unknown>;
  filterResetToDefaultFilteredValue?: boolean;
  responsive?: Breakpoint[];
  /** @deprecated 用 `filterDropdownProps.open`。 */
  filterDropdownOpen?: boolean;
  /** @deprecated 用 `filterDropdownProps.onOpenChange`。 */
  onFilterDropdownOpenChange?: (open: boolean) => void;
  // ---- rc 层为展开/选择列注入的内部字段（公开类型保留，antd 同名） ----
  [key: string]: unknown;
}

export interface ColumnGroupType<RecordType = Record<string, unknown>>
  extends Omit<ColumnType<RecordType>, 'dataIndex'> {
  children: ColumnsType<RecordType>;
}

export type ColumnsType<RecordType = Record<string, unknown>> = (
  | ColumnGroupType<RecordType>
  | ColumnType<RecordType>
)[];

// ============================== Selection ==============================

export type RowSelectionType = 'checkbox' | 'radio';
export type SelectionItemSelectFn = (currentRowKeys: TableKey[]) => void;
export type RowSelectMethod = 'all' | 'none' | 'invert' | 'single' | 'multiple';

export interface SelectionItem {
  key: string;
  text: VNodeChild;
  onSelect?: SelectionItemSelectFn;
}

export type SelectionSelectFn<T = Record<string, unknown>> = (
  record: T,
  selected: boolean,
  selectedRows: T[],
  nativeEvent: Event,
) => void;

export interface TableRowSelection<T = Record<string, unknown>> {
  /** dataSource 里已消失的 key 是否保留在选中集里。 */
  preserveSelectedRowKeys?: boolean;
  type?: RowSelectionType;
  selectedRowKeys?: TableKey[];
  defaultSelectedRowKeys?: TableKey[];
  onChange?: (
    selectedRowKeys: TableKey[],
    selectedRows: T[],
    info: { type: RowSelectMethod },
  ) => void;
  getCheckboxProps?: (record: T) => Partial<CheckboxProps> & Record<string, unknown>;
  onSelect?: SelectionSelectFn<T>;
  /** @deprecated v7 移除，用 `onChange`。 */
  onSelectMultiple?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** @deprecated v7 移除，用 `onChange`。 */
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  /** @deprecated v7 移除，用 `onChange`。 */
  onSelectInvert?: (selectedRowKeys: TableKey[]) => void;
  /** @deprecated v7 移除，用 `onChange`。 */
  onSelectNone?: () => void;
  selections?: SelectionItem[] | boolean;
  hideSelectAll?: boolean;
  fixed?: boolean | 'left' | 'right';
  columnWidth?: string | number;
  columnTitle?: VNodeChild | ((checkboxNode: VNodeChild) => VNodeChild);
  checkStrictly?: boolean;
  /** 选择列的对齐。 */
  align?: 'left' | 'center' | 'right';
  renderCell?: (
    value: boolean,
    record: T,
    index: number,
    originNode: VNodeChild,
  ) => VNodeChild | (Record<string, unknown> & { children?: VNodeChild });
  onCell?: (record: T, rowIndex: number) => Record<string, unknown>;
  getTitleCheckboxProps?: () => Partial<CheckboxProps> & Record<string, unknown>;
}

// ============================== Expandable ==============================

export type GetRowKey<RecordType = Record<string, unknown>> = (
  record: RecordType,
  index?: number,
) => TableKey;

export type ExpandedRowRender<RecordType = Record<string, unknown>> = (
  record: RecordType,
  index: number,
  indent: number,
  expanded: boolean,
) => VNodeChild;

export type RenderExpandIcon<RecordType = Record<string, unknown>> = (props: {
  prefixCls: string;
  expanded: boolean;
  expandable: boolean;
  record: RecordType;
  onExpand: (record: RecordType, event?: Event) => void;
}) => VNodeChild;

export type RowClassName<RecordType = Record<string, unknown>> = (
  record: RecordType,
  index: number,
  indent: number,
) => string;

export type FixedType = 'left' | 'right' | 'start' | 'end';

export interface ExpandableConfig<RecordType = Record<string, unknown>> {
  expandedRowKeys?: TableKey[];
  defaultExpandedRowKeys?: TableKey[];
  expandedRowRender?: ExpandedRowRender<RecordType>;
  forceRender?: boolean;
  columnTitle?: VNodeChild;
  expandRowByClick?: boolean;
  expandIcon?: RenderExpandIcon<RecordType>;
  onExpand?: (expanded: boolean, record: RecordType) => void;
  onExpandedRowsChange?: (expandedKeys: TableKey[]) => void;
  defaultExpandAllRows?: boolean;
  indentSize?: number;
  /** @deprecated 直接在 `columns` 里放 `Table.EXPAND_COLUMN`。 */
  expandIconColumnIndex?: number;
  showExpandColumn?: boolean;
  expandedRowClassName?: string | RowClassName<RecordType>;
  childrenColumnName?: string;
  rowExpandable?: (record: RecordType) => boolean;
  columnWidth?: number | string;
  fixed?: FixedType;
  expandedRowOffset?: number;
}

// ============================== Sorter result ==============================

export interface SorterResult<RecordType = Record<string, unknown>> {
  column?: ColumnType<RecordType>;
  order?: SortOrder;
  field?: TableKey | readonly TableKey[];
  columnKey?: TableKey;
}

export interface TableCurrentDataSource<RecordType = Record<string, unknown>> {
  currentDataSource: RecordType[];
  action: TableAction;
}

// ============================== Pagination ==============================

export type TablePaginationPlacement =
  | 'topStart'
  | 'topCenter'
  | 'topEnd'
  | 'bottomStart'
  | 'bottomCenter'
  | 'bottomEnd'
  | 'none';
export type TablePaginationPosition =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'
  | 'none';

export interface TablePaginationConfig extends PaginationProps {
  placement?: TablePaginationPlacement[];
  /** @deprecated 用 `placement`。 */
  position?: TablePaginationPosition[];
}

// ============================== Table props ==============================

export type TableLayout = 'auto' | 'fixed';
/** 展开类型（`row` = expandedRowRender；`nest` = 树形 children）。 */
export type ExpandType = null | 'row' | 'nest';

export interface TableSticky {
  offsetHeader?: number;
  offsetSummary?: number;
  offsetScroll?: number;
  getContainer?: () => Window | HTMLElement;
}

export type GetPopupContainer = (triggerNode: HTMLElement) => HTMLElement;

export interface TableScrollConfig {
  x?: number | true | string;
  y?: number | string;
  scrollToFirstRowOnChange?: boolean;
}

/** rc 的 `components` 自定义（antd 公开类型同样保留）。 */
export interface TableComponents<RecordType = Record<string, unknown>> {
  table?: unknown;
  header?: {
    wrapper?: unknown;
    row?: unknown;
    cell?: unknown;
    table?: unknown;
  };
  body?:
    | ((
        data: RecordType[],
        info: {
          scrollbarSize: number;
          ref: (el: unknown) => void;
          onScroll: (e: { currentTarget?: HTMLElement; scrollLeft: number }) => void;
        },
      ) => VNodeChild)
    | {
        wrapper?: unknown;
        row?: unknown;
        cell?: unknown;
      };
}

/** 语义槽（antd 的 `TableSemanticType` 是嵌套的：body/header/pagination 各有子组）。 */
export interface TableSemanticClassNames {
  root?: string;
  section?: string;
  content?: string;
  title?: string;
  footer?: string;
  header?: {
    wrapper?: string;
    row?: string;
    cell?: string;
  };
  body?: {
    wrapper?: string;
    row?: string;
    cell?: string;
  };
  pagination?: string | { root?: string; item?: string };
}

export interface TableSemanticStyles {
  root?: Record<string, string>;
  section?: Record<string, string>;
  content?: Record<string, string>;
  title?: Record<string, string>;
  footer?: Record<string, string>;
  header?: {
    wrapper?: Record<string, string>;
    row?: Record<string, string>;
    cell?: Record<string, string>;
  };
  body?: {
    wrapper?: Record<string, string>;
    row?: Record<string, string>;
    cell?: Record<string, string>;
  };
  pagination?: Record<string, string> | { root?: Record<string, string> };
}

/** Table 公开 props（antd `TableProps` 的 Vue 对应，`data`→`dataSource`）。 */
export interface TableProps<RecordType = Record<string, unknown>> {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: Record<string, string>;
  classNames?: TableSemanticClassNames;
  styles?: TableSemanticStyles;
  size?: SizeType;
  bordered?: boolean;
  dropdownPrefixCls?: string;
  dataSource?: RecordType[];
  column?: Partial<ColumnType<RecordType>>;
  columns?: ColumnsType<RecordType>;
  pagination?: false | TablePaginationConfig;
  rowSelection?: TableRowSelection<RecordType>;
  rowKey?: string | keyof RecordType | GetRowKey<RecordType>;
  rowClassName?: string | RowClassName<RecordType>;
  childrenColumnName?: string;
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
    extra: TableCurrentDataSource<RecordType>,
  ) => void;
  getPopupContainer?: GetPopupContainer;
  loading?: boolean | Record<string, unknown>;
  expandIcon?: RenderExpandIcon<RecordType>;
  expandable?: ExpandableConfig<RecordType>;
  expandedRowRender?: ExpandedRowRender<RecordType>;
  expandIconColumnIndex?: number;
  indentSize?: number;
  scroll?: TableScrollConfig;
  sortDirections?: SortOrder[];
  locale?: TableLocale;
  showSorterTooltip?: boolean | SorterTooltipProps;
  virtual?: boolean;
  title?: ((data: RecordType[]) => VNodeChild) | VNodeChild;
  footer?: ((data: RecordType[]) => VNodeChild) | VNodeChild;
  summary?: (data: RecordType[]) => VNodeChild;
  caption?: VNodeChild;
  id?: string;
  showHeader?: boolean;
  components?: TableComponents<RecordType>;
  onRow?: (record: RecordType, index?: number) => Record<string, unknown>;
  onHeaderRow?: (columns: ColumnType<RecordType>[], index?: number) => Record<string, unknown>;
  emptyText?: VNodeChild | (() => VNodeChild);
  direction?: 'ltr' | 'rtl';
  sticky?: boolean | TableSticky;
  rowHoverable?: boolean;
  tableLayout?: TableLayout;
  onScroll?: (e: Event) => void;
  /** @private 透传给引擎（antd 层专用）。 */
  internalHooks?: string;
  /** @private 透传给引擎（antd 层专用）。 */
  transformColumns?: (columns: ColumnsType<RecordType>) => ColumnsType<RecordType>;
  /** @private 透传给引擎（antd 层专用）。 */
  tailor?: boolean;
  /** @private 透传给引擎（antd 层专用）。 */
  getContainerWidth?: (element: HTMLElement, width: number) => number;
}
