---
category: 数据展示
title: Table 表格
titleTemplate: '%s - @apollo-design/ui'
description: 数据表格，用于展示行列数据结构，支持排序、筛选、分页、行选择、固定列/表头、汇总行与虚拟滚动。
---

# Table 表格

数据表格，用于展示行列数据结构。

## 何时使用

- 当有大量结构化的数据需要展现时；
- 当需要对数据进行排序、搜索、分页、自定义操作等复杂行为时。

## 引入

```ts
import { Table } from '@apollo-design/ui';
```

## 代码演示

## API

### Table

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| bordered | 是否显示外边框和列边框 | boolean | false | |
| caption | 表格的可访问性标题（`<caption>`） | VNodeChild | - | |
| columns | 列描述数据对象，见下表 | ColumnsType | - | |
| components | 覆盖表格元素的自定义渲染 | TableComponents | - | |
| dataSource | 数据数组 | Record<string, unknown>[] | - | |
| direction | 文本方向 | `'ltr' \| 'rtl'` | - | |
| emptyText | 无数据时的占位内容 | VNodeChild \| (() => VNodeChild) | - | |
| expandable | 展开配置，见下表 | ExpandableConfig | - | |
| expandIcon | 自定义展开图标 | RenderExpandIcon | - | |
| expandIconColumnIndex | 展开按钮所在列的索引（legacy，建议用 expandable） | number | - | |
| expandedRowRender | 额外的展开行内容（legacy） | ExpandedRowRender | - | |
| footer | 表格尾部 | VNodeChild \| ((currentPageData) => VNodeChild) | - | |
| getPopupContainer | 下拉（筛选/选择器）渲染的父节点 | (triggerNode) => HTMLElement | - | |
| indentSize | 树形展示时每层的缩进宽度 | number | 16 | |
| loading | 页面是否加载中 | boolean \| SpinProps | false | |
| locale | 默认文案设置，见下表 | TableLocale | - | |
| onChange | 分页、排序、筛选变化的回调 | (pagination, filters, sorter, extra) => void | - | |
| pagination | 分页器配置；设为 false 时隐藏 | false \| TablePaginationConfig | 见下 | |
| rowClassName | 行的 className | string \| (record, index) => string | - | |
| rowKey | 行 key 的取值字段或生成函数 | string \| keyof T \| (record) => key | 'key' | |
| rowSelection | 行选择配置，见下表 | TableRowSelection | - | |
| scroll | 横向/纵向滚动配置（含固定列/表头） | TableScrollConfig | - | |
| showHeader | 是否显示表头 | boolean | true | |
| size | 表格尺寸 | `'large' \| 'middle' \| 'small'` | 'large' | |
| sortDirections | 支持的排序方式 | SortOrder[] | `['ascend', 'descend']` | |
| sticky | 设置粘性表头 | boolean \| TableSticky | - | |
| summary | 汇总行（渲染在表格内部） | (data) => VNodeChild | - | |
| tableLayout | 表格布局算法（固定列/固定表头会自动置 fixed） | `'auto' \| 'fixed'` | 'auto'（固定列/表头时 'fixed'） | |
| title | 表格标题 | VNodeChild \| ((currentPageData) => VNodeChild) | - | |
| virtual | 是否开启虚拟滚动（需配合 `scroll.x` / `scroll.y`） | boolean | false | |
| onRow | 行事件透传（click/doubleclick/mouseenter 等） | (record, index) => Record<string, unknown> | - | |
| onHeaderRow | 表头行事件透传 | (columns, index) => Record<string, unknown> | - | |

> `virtual` 与 `listItemHeight`：虚拟滚动模式下每行高度（默认按 token 计算），仅 `virtual: true` 时生效。

### ColumnsType（列描述）

`columns` 的每一项支持分组列（`children`）与普通列，`ColumnGroupType | ColumnType`。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| align | 列内容的对齐方式 | `'left' \| 'right' \| 'center'` | - |
| colSpan | 表头列合并（设 0 不渲染表头） | number | - |
| customCell | 单元格事件透传 | (record, rowIndex, column) => Record<string, unknown> | - |
| customHeaderCell | 表头单元格事件透传 | (column) => Record<string, unknown> | - |
| defaultSortOrder | 默认排序顺序 | `'ascend' \| 'descend'` | - |
| ellipsis | 超过宽度将自动省略（单行） | boolean \| { showTitle?: boolean } | false |
| filters | 表头的筛选菜单项 | ColumnFilterItem[] \| boolean | - |
| filterDropdown | 自定义筛选面板 | VNodeChild \| (props) => VNodeChild | - |
| filterIcon | 自定义 filter 图标 | VNodeChild \| (filtered) => VNodeChild | - |
| filterMode | 筛选菜单模式（树形/菜单） | `'tree' \| 'menu'` | 'menu' |
| filtered | 标识数据是否经过筛选，图标高亮 | boolean | false |
| filteredValue | 筛选的受控属性 | FilterValue \| null | - |
| filterMultiple | 是否多选 | boolean | true |
| filterSearch | 筛选菜单中是否可搜索 | boolean \| (input, record) => boolean | false |
| fixed | 列是否固定 | `'left' \| 'right'`（RTL 下 start/end） | false |
| key | React 需要的 key（Vue 侧可用 rowKey 推导） | string | - |
| responsive | 响应式断点，触达即隐藏该列 | Breakpoint[] | - |
| rowSpan | 行合并 | number | - |
| render | 生成复杂数据的渲染，**位置参数** `(value, record, index)` | (value, record, index) => VNodeChild | - |
| showSorterTooltip | 表头排序气泡提示 | boolean \| SorterTooltipProps | true |
| sortOrder | 排序的受控属性 | `'ascend' \| 'descend' \| null` | - |
| sorter | 排序函数；true 使用默认排序 | boolean \| CompareFn | false |
| sortDirections | 支持的排序方式（覆盖 Table 级） | SortOrder[] | `['ascend', 'descend']` |
| title | 列头显示文字 | VNodeChild \| ColumnTitle | - |
| width | 列宽度（固定列与 scroll.x 配合必填） | number \| string | - |
| children | 分组列的子列 | ColumnsType | - |
| onFilter | 本地过滤函数 | (value, record) => boolean | - |
| onFilterDropdownOpenChange | 筛选面板展开/收起的回调 | (open) => void | - |

### TableRowSelection（行选择）

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| checkStrictly | checkable 状态下父子节点是否关联 | boolean | true |
| columnTitle | 自定义选择列标题 | VNodeChild | - |
| columnWidth | 自定义选择列宽度 | number \| string | - |
| fixed | 选择列是否固定 | boolean \| `'left' \| 'right'` | - |
| getCheckboxProps | 默认的复选框属性 | (record) => Record<string, unknown> | - |
| hideDefaultSelections | 隐藏「全选所有数据」「清除」两个默认项 | boolean | false |
| preserveSelectedRowKeys | 数据源变更后保留上一页选中项 | boolean | - |
| renderCell | 渲染选择单元格 | (checked, record, index, originNode) => VNodeChild | - |
| selectedRowKeys | 指定选中项的 key 数组（受控） | TableKey[] | - |
| selections | 自定义选择项（`SELECTION_ALL` / `SELECTION_INVERT` / `SELECTION_NONE` 等） | SelectionItem[] \| true | - |
| type | 多选或单选 | `'checkbox' \| 'radio'` | 'checkbox' |
| onChange | 选中项发生变化时的回调 | (selectedRowKeys, selectedRows, info) => void | - |
| onSelect | 用户手动选择/取消某行的回调（含 shift 联动 info） | (record, selected, selectedRows, nativeEvent) => void | - |
| onSelectAll | 全选/取消全选的回调 | (selected, selectedRows, changeRows) => void | - |
| onSelectInvert | 反选的回调 | (selectedRowKeys) => void | - |
| onSelectNone | 清空选择的回调 | () => void | - |

### ExpandableConfig（展开）

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| childrenColumnName | 树形数据的子节点字段 | string | 'children' |
| columnTitle | 自定义展开列标题 | VNodeChild | - |
| columnWidth | 自定义展开列宽度 | number \| string | - |
| defaultExpandAllRows | 初始时展开所有行 | boolean | false |
| defaultExpandedRowKeys | 默认展开的行 | TableKey[] | - |
| expandedRowClassName | 展开行的 className | string \| (record, index, indent) => string | - |
| expandedRowRender | 额外的展开内容 | (record, index, indent, expanded) => VNodeChild | - |
| expandedRowKeys | 展开的行（受控） | TableKey[] | - |
| expandFixed | 展开列是否固定 | boolean \| `'left' \| 'right'` | - |
| expandIcon | 自定义展开图标 | RenderExpandIcon | - |
| expandIconColumnIndex | 展开按钮所在列的索引 | number | - |
| fixed | ⚠️ legacy，用 expandFixed | boolean | - |
| indentSize | 树形缩进宽度 | number | 16 |
| rowExpandable | 行是否可展开 | (record) => boolean | - |
| showExpandColumn | 是否展示展开列 | boolean | true |
| onExpand | 展开行的回调 | (expanded, record) => void | - |
| onExpandedRowsChange | 展开的行变化时的回调 | (expandedRows) => void | - |

### pagination（分页配置）

继承 `Pagination` 的全部 props，额外支持：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| position | 指定分页显示的位置 | `['topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight']` | `['bottomRight']` |
| hideOnSinglePage | 只有一页时是否隐藏分页器 | boolean | false |

> `pagination: false` 时隐藏分页器；默认每页 10 条（可传 `pageSize` 覆盖）。

### TableLocale（默认文案）

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| emptyText | 无数据时的文案 | string \| (() => VNodeChild) |
| filterConfirm | 筛选「确定」按钮文案 | string |
| filterReset | 筛选「重置」按钮文案 | string |
| filterEmptyText | 筛选菜单为空的文案 | string |
| selectAll | 全选行文案 | string |
| selectInvert | 反选文案 | string |
| selectNone | 清空选择文案 | string |
| selectionAll | 全部行选择文案 | string |
| sortTitle | 排序按钮的可访问名 | string |
| expand | 展开行的可访问名 | string |
| collapse | 折叠行的可访问名 | string |
| triggerDesc | 点击降序文案 | string |
| triggerAsc | 点击升序文案 | string |
| cancelSort | 取消排序文案 | string |

## 语义化与可访问性

- 支持通过 `classNames` / `styles` 对 `root` / `section` 等语义槽位进行定制；
- 排序按钮带 `aria-sort`，展开按钮带 `aria-expanded` / `aria-label`（走 locale）；
- `caption` 提供表格的可访问名。
