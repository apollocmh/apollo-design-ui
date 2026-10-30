---
category: Data Display
title: Table
subtitle: Table
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

The `drag-reorder` example combines existing onRow/onHeaderCell hooks with native row/header drag events, controlled ordering, and keyboard-accessible move/reset buttons. Table gains no built-in drag API.

### Table

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| bordered | Whether to show all cell borders | boolean | false |
| caption | Accessible caption of the table (`<caption>`) | VNodeChild | - |
| columns | Columns description, see below | ColumnsType | - |
| components | Override default table elements | TableComponents | - |
| dataSource | Data record array | T[] | - |
| direction | Text direction | `'ltr' \| 'rtl'` | - |
| expandable | Expandable configuration | ExpandableConfig | - |
| getPopupContainer | Parent node of dropdowns (filter/select) | (triggerNode) => HTMLElement \| ShadowRoot | - |
| indentSize | Indent width in pixels of tree data | number | 15 |
| loading | Whether the table is loading | boolean \| SpinProps | false |
| locale | Default messages, see below | TableLocale | - |
| pagination | Pagination config; set to false to hide | false \| TablePaginationConfig | - |
| rowClassName | Row className | string \| (record, index) => string | - |
| rowKey | Row key field or function | string \| keyof T \| (record) => key | 'key' |
| rowSelection | Row selection configuration | TableRowSelection | - |
| scroll | Horizontal / vertical scroll config | TableScrollConfig | - |
| showHeader | Whether to show table header | boolean | true |
| size | Size of the table | `'large' \| 'middle' \| 'small'` | 'large' |
| sortDirections | Supported sort orders | SortOrder[] | `['ascend', 'descend']` |
| sticky | Sticky header | boolean \| TableSticky | - |
| tableLayout | Table layout algorithm | `'auto' \| 'fixed'` | 'auto' |
| virtual | Enable virtual scrolling (requires `scroll.x` / `scroll.y`) | boolean | false |
| onRow | Row event passthrough (click, mouseenter, ...) | (record, index) => Record<string, unknown> | - |
| onHeaderRow | Header row event passthrough | (columns, index) => Record<string, unknown> | - |


### Slots

| Name | Scope | Content |
| --- | --- | --- |
| title / footer / summary / caption | `{ data: T[] }` | Current page title, footer, summary and accessible caption |
| emptyText | `{ data: T[], locale }` | Empty content; a present slot, including an empty result, wins over locale.emptyText |
| expandedRow | `{ record: T, index, indent, expanded }` | Expanded content |
| expandIcon | `{ prefixCls, record: T, expanded, expandable, onExpand }` | Call `onExpand(record, event)` to propose a toggle |
| headerCell | `{ column, title }` | Header content inside the existing sorting/filtering controls |
| bodyCell | `{ text, record: T, index, column, originNode }` | Cell content; originNode is the data renderer result |
| paginationItemRender | `{ page, type, element }` | Pagination item |
| paginationTotal | `{ total, range }` | Pagination total |
| paginationSizeChanger | PaginationSizeChangerInfo | Page size control |

Per-column render/title/filterDropdown/filterIcon/sortIcon and selection renderCell/columnTitle remain data services. shouldCellUpdate controls the data renderer cache; native slots continue tracking their own Vue dependencies. Replacing the renderer or changing the row index invalidates the cache.

### Emits and accepted state

`@change` receives `(pagination, filters, sorter, { currentDataSource: T[], action })`. `@scroll` receives the real Event from the current body, including virtual bodies. Each pagination, sorting, filtering, selection and expansion state has one accepted source. Notifications describe proposals; rejected controlled proposals do not replace accepted UI state or caches. Removing control resumes the latest accepted value.

### Generics and refs

Templates infer User from `User[]` and `ColumnsType<User>` without an index signature. Programmatic calls use `h(Table<User>, props, slots)` and `TableSlots<User>`. A TableRef exposes nativeElement() and scrollTo({ top, key, index, align, offset }); align supports start/center/end/nearest.

A custom components.body service receives `(data, { scrollbarSize, ref, onScroll })`. Bind ref to an actual HTMLElement and forward native scroll events to onScroll. This explicit service takes precedence over the built-in virtual body. Element components forward native attrs and their default slot. A virtual wrapper requires one HTMLElement root; fragment/text roots have no measurable container and expose null. Root replacements rebind observation and native scroll access.

### Migration

Full-table title/footer/summary/expandedRowRender/expandIcon/emptyText callbacks, including nested expandable content callbacks, move to the named slots above with named scope fields. locale.emptyText keeps static VNodeChild content; dynamic content uses #emptyText. Replace filterDropdownProps.dropdownRender with the column's filterDropdown data renderer. Row/cell services return Vue native attrs such as onKeydown. Subscribe to owned notifications with @change/@scroll.

getCheckboxProps follows the actual selection kind: checkbox/radio change receives `(event: Event, checked: boolean)`; selection notifications retain that same native event. Native class/style target the outer root. Semantic styles use Vue CSSProperties, including undefined and --custom properties.

### ColumnsType

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| align | Alignment of the column content | `'left' \| 'right' \| 'center'` | - |
| colSpan | Span of the header column (0 hides the header) | number | - |
| onCell | Cell event passthrough | (record: T, rowIndex) => Record<string, unknown> | - |
| onHeaderCell | Header cell event passthrough | (column) => Record<string, unknown> | - |
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
| responsive | Show the column when any listed breakpoint matches | Breakpoint[] | - |
| rowSpan | Row span | number | - |
| render | Renderer of the cell, **positional args** `(value, record, index)` | (value, record, index) => VNodeChild | - |
| showSorterTooltip | Sorter tooltip of the header | boolean \| SorterTooltipProps | true |
| sortOrder | Controlled sort order | `'ascend' \| 'descend' \| null` | - |
| sorter | Sort function; true delegates ordering to the consumer | boolean \| CompareFn | false |
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
| expandedRowKeys | Controlled expanded rows | TableKey[] | - |
| expandIconColumnIndex | Column index of the expand button | number | - |
| indentSize | Indent width of tree data | number | 15 |
| rowExpandable | Whether the row is expandable | (record) => boolean | - |
| showExpandColumn | Whether to show the expand column | boolean | true |
| onExpand | Callback when a row is expanded | (expanded, record) => void | - |
| onExpandedRowsChange | Callback when expanded rows change | (expandedRows) => void | - |


| fixed | Fixed position of the expand column | `'left' \| 'right' \| 'start' \| 'end'` | - |

Put native pager root attrs in pagination.class / pagination.style; replace the old className entry with class.

### pagination

Extends all `Pagination` props, plus:

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| position | Position of the pagination | `['topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight']` | `['bottomRight']` |
| hideOnSinglePage | Hide the pagination when there is a single page | boolean | false |

> Set `pagination: false` to hide the pagination. Default page size is 10.

Pagination content uses #paginationItemRender="{ page, type, element }", #paginationTotal="{ total, range }" and #paginationSizeChanger="info". Each pager receives its current scope, including top/bottom pagers and dynamic slots. Configuration holds data and business events; itemRender/showTotal/sizeChangerRender function entries are removed.

## Current theme variables

Derived header, sorting, hover and filter-popup colours follow the current ConfigProvider theme. Existing Table component token overrides support replacement, removal and zero sizes. Native root CSS variables take precedence; filter portals use the same theme source. The forty default light CSS declarations are unchanged.
