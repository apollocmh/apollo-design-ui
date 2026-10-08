---
category: Data Display
title: Table
titleTemplate: '%s - @apollo-design/ui'
description: A table displays rows of data, with sorting, filtering, pagination, row selection, fixed columns/header, summary row and virtual scrolling.
---

# Table

A table displays rows of data.

## When To Use

- Use to display a collection of structured data in rows;
- Use when users need to sort, search, paginate or perform custom operations on the data.

## Import

```ts
import { Table } from '@apollo-design/ui';
```

## API

### Table

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| bordered | Whether to show all cell borders | boolean | false |
| caption | Accessible caption of the table (`<caption>`) | VNodeChild | - |
| columns | Columns description, see below | ColumnsType | - |
| components | Override default table elements | TableComponents | - |
| dataSource | Data record array | Record<string, unknown>[] | - |
| direction | Text direction | `'ltr' \| 'rtl'` | - |
| emptyText | Placeholder when there is no data | VNodeChild \| (() => VNodeChild) | - |
| expandable | Expandable configuration | ExpandableConfig | - |
| expandIcon | Custom expand icon | RenderExpandIcon | - |
| footer | Table footer | VNodeChild \| ((currentPageData) => VNodeChild) | - |
| getPopupContainer | Parent node of dropdowns (filter/select) | (triggerNode) => HTMLElement | - |
| indentSize | Indent width in pixels of tree data | number | 16 |
| loading | Whether the table is loading | boolean \| SpinProps | false |
| locale | Default messages, see below | TableLocale | - |
| onChange | Callback for pagination, sorter and filter changes | (pagination, filters, sorter, extra) => void | - |
| pagination | Pagination config; set to false to hide | false \| TablePaginationConfig | - |
| rowClassName | Row className | string \| (record, index) => string | - |
| rowKey | Row key field or function | string \| keyof T \| (record) => key | 'key' |
| rowSelection | Row selection configuration | TableRowSelection | - |
| scroll | Horizontal / vertical scroll config | TableScrollConfig | - |
| showHeader | Whether to show table header | boolean | true |
| size | Size of the table | `'large' \| 'middle' \| 'small'` | 'large' |
| sortDirections | Supported sort orders | SortOrder[] | `['ascend', 'descend']` |
| sticky | Sticky header | boolean \| TableSticky | - |
| summary | Summary row rendered inside the table | (data) => VNodeChild | - |
| tableLayout | Table layout algorithm | `'auto' \| 'fixed'` | 'auto' |
| title | Table title | VNodeChild \| ((currentPageData) => VNodeChild) | - |
| virtual | Enable virtual scrolling (requires `scroll.x` / `scroll.y`) | boolean | false |
| onRow | Row event passthrough (click, mouseenter, ...) | (record, index) => Record<string, unknown> | - |
| onHeaderRow | Header row event passthrough | (columns, index) => Record<string, unknown> | - |

### ColumnsType

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| align | Alignment of the column content | `'left' \| 'right' \| 'center'` | - |
| colSpan | Span of the header column (0 hides the header) | number | - |
| customCell | Cell event passthrough | (record, rowIndex, column) => Record<string, unknown> | - |
| customHeaderCell | Header cell event passthrough | (column) => Record<string, unknown> | - |
| defaultSortOrder | Default sort order | `'ascend' \| 'descend'` | - |
| ellipsis | Ellipsize long content to a single line | boolean \| { showTitle?: boolean } | false |
| filters | Filter menu items of the header | ColumnFilterItem[] \| boolean | - |
| filterDropdown | Custom filter panel | VNodeChild \| (props) => VNodeChild | - |
| filterIcon | Custom filter icon | VNodeChild \| (filtered) => VNodeChild | - |
| filterMode | Filter menu mode | `'tree' \| 'menu'` | 'menu' |
| filtered | Whether the data is filtered (highlights the icon) | boolean | false |
| filteredValue | Controlled filtered value | FilterValue \| null | - |
| filterMultiple | Whether multiple filters are allowed | boolean | true |
| filterSearch | Whether the filter menu is searchable | boolean \| (input, record) => boolean | false |
| fixed | Fixed column | `'left' \| 'right'` | false |
| responsive | Breakpoints at which the column is hidden | Breakpoint[] | - |
| rowSpan | Row span | number | - |
| render | Renderer of the cell, **positional args** `(value, record, index)` | (value, record, index) => VNodeChild | - |
| showSorterTooltip | Sorter tooltip of the header | boolean \| SorterTooltipProps | true |
| sortOrder | Controlled sort order | `'ascend' \| 'descend' \| null` | - |
| sorter | Sort function; true uses the default sorter | boolean \| CompareFn | false |
| title | Title of the column | VNodeChild \| ColumnTitle | - |
| width | Column width (required for fixed columns with scroll.x) | number \| string | - |
| children | Children of a grouped column | ColumnsType | - |
| onFilter | Local filter function | (value, record) => boolean | - |
| onFilterDropdownOpenChange | Callback when the filter panel opens/closes | (open) => void | - |

### TableRowSelection

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| checkStrictly | Whether parent/child nodes are related under checkable mode | boolean | true |
| columnTitle | Custom title of the selection column | VNodeChild | - |
| columnWidth | Custom width of the selection column | number \| string | - |
| fixed | Whether the selection column is fixed | boolean \| `'left' \| 'right'` | - |
| getCheckboxProps | Default props of the checkbox | (record) => Record<string, unknown> | - |
| preserveSelectedRowKeys | Keep keys of removed rows in the selection | boolean | - |
| renderCell | Renderer of the selection cell | (checked, record, index, originNode) => VNodeChild | - |
| selectedRowKeys | Controlled selected row keys | TableKey[] | - |
| selections | Custom selections (`SELECTION_ALL` / `SELECTION_INVERT` / `SELECTION_NONE` ...) | SelectionItem[] \| true | - |
| type | Checkbox or radio | `'checkbox' \| 'radio'` | 'checkbox' |
| onChange | Callback when the selection changes | (selectedRowKeys, selectedRows, info) => void | - |
| onSelect | Callback when a row is selected manually | (record, selected, selectedRows, nativeEvent) => void | - |
| onSelectAll | Callback when select-all / deselect-all | (selected, selectedRows, changeRows) => void | - |
| onSelectInvert | Callback when inverting the selection | (selectedRowKeys) => void | - |
| onSelectNone | Callback when clearing the selection | () => void | - |

### ExpandableConfig

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| childrenColumnName | Field name of tree children | string | 'children' |
| columnTitle | Custom title of the expand column | VNodeChild | - |
| columnWidth | Custom width of the expand column | number \| string | - |
| defaultExpandAllRows | Expand all rows initially | boolean | false |
| defaultExpandedRowKeys | Initially expanded rows | TableKey[] | - |
| expandedRowClassName | className of the expanded row | string \| (record, index, indent) => string | - |
| expandedRowRender | Extra content of the expanded row | (record, index, indent, expanded) => VNodeChild | - |
| expandedRowKeys | Controlled expanded rows | TableKey[] | - |
| expandFixed | Whether the expand column is fixed | boolean \| `'left' \| 'right'` | - |
| expandIcon | Custom expand icon | RenderExpandIcon | - |
| expandIconColumnIndex | Column index of the expand button | number | - |
| indentSize | Indent width of tree data | number | 16 |
| rowExpandable | Whether the row is expandable | (record) => boolean | - |
| showExpandColumn | Whether to show the expand column | boolean | true |
| onExpand | Callback when a row is expanded | (expanded, record) => void | - |
| onExpandedRowsChange | Callback when expanded rows change | (expandedRows) => void | - |

### pagination

Extends all `Pagination` props, plus:

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| position | Position of the pagination | `['topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight']` | `['bottomRight']` |
| hideOnSinglePage | Hide the pagination when there is a single page | boolean | false |

> Set `pagination: false` to hide the pagination. Default page size is 10.
