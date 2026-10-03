/**
 * Table 的公开出口（antd `es/table/index.d.ts`）。
 *
 * ⚠️ 顶层刻意不导出短名 `Column` / `ColumnGroup`（撞名风险，与 `Color` 同判）：
 *    语法糖走 `TableColumn` / `TableColumnGroup` 别名。
 */

import { EXPAND_COLUMN } from './engine/constant';
import { Summary } from './engine/Footer';
import {
  SELECTION_ALL,
  SELECTION_COLUMN,
  SELECTION_INVERT,
  SELECTION_NONE,
} from './hooks/use-selection';
import { default as Table } from './Table';
import { getColumnKey, renderColumnTitle, safeColumnTitle } from './util';

const InternalTable = Table;

export default Table;
export { InternalTable, Table };

/** `Table.SELECTION_COLUMN`：选择列的位置哨兵（放进 columns 指定选择列位置）。 */
const TableSELECTION_COLUMN = SELECTION_COLUMN;

export type {
  ColumnFilterItem,
  ColumnGroupType,
  ColumnSorter,
  ColumnsType,
  ColumnTitle,
  ColumnTitleProps,
  ColumnType,
  CompareFn,
  ExpandableConfig,
  ExpandType,
  FilterConfirmProps,
  FilterDropdownProps,
  FilterResetProps,
  FilterSearchType,
  FilterValue,
  GetPopupContainer,
  GetRowKey,
  RenderExpandIcon,
  RowClassName,
  RowSelectionType,
  RowSelectMethod,
  SelectionItem,
  SelectionItemSelectFn,
  SelectionSelectFn,
  SorterResult,
  SorterTooltipProps,
  SorterTooltipTarget,
  SortOrder,
  TableAction,
  TableComponents,
  TableCurrentDataSource,
  TableKey,
  TableLocale,
  TablePaginationConfig,
  TablePaginationPlacement,
  TablePaginationPosition,
  TableProps,
  TableRowSelection,
  TableScrollConfig,
  TableSemanticClassNames,
  TableSemanticStyles,
  TableSticky,
} from './interface';
/** antd 的静态挂载（`Table.SELECTION_COLUMN` 等）—— Vue 侧以命名导出提供。 */
export {
  EXPAND_COLUMN,
  getColumnKey,
  renderColumnTitle,
  SELECTION_ALL,
  SELECTION_COLUMN,
  SELECTION_INVERT,
  SELECTION_NONE,
  Summary,
  safeColumnTitle,
  TableSELECTION_COLUMN,
};
