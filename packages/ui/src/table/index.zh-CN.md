---
category: 数据展示
title: Table
subtitle: 表格
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

`drag-reorder` 使用现有 onRow/onHeaderCell 钩子组合原生行/列拖放，受控更新数据和列顺序，并提供键盘可用的移动/重置按钮；不增加 Table 内建拖拽 API。

## API

### Table

| 参数 | 说明 | 类型 | 默认值 | 版本 |
| --- | --- | --- | --- | --- |
| bordered | 是否显示外边框和列边框 | boolean | false | |
| caption | 表格的可访问性标题（`<caption>`） | VNodeChild | - | |
| columns | 列描述数据对象，见下表 | ColumnsType | - | |
| components | 覆盖表格元素的自定义渲染 | TableComponents | - | |
| dataSource | 数据数组 | T[] | - | |
| direction | 文本方向 | `'ltr' \| 'rtl'` | - | |
| expandable | 展开配置，见下表 | ExpandableConfig | - | |
| expandIconColumnIndex | 展开按钮所在列的索引（建议将 Table.EXPAND_COLUMN 放入 columns） | number | - | |
| getPopupContainer | 下拉（筛选/选择器）渲染的父节点 | (triggerNode) => HTMLElement \| ShadowRoot | - | |
| indentSize | 树形展示时每层的缩进宽度 | number | 15 | |
| loading | 页面是否加载中 | boolean \| SpinProps | false | |
| locale | 默认文案设置，见下表 | TableLocale | - | |
| pagination | 分页器配置；设为 false 时隐藏 | false \| TablePaginationConfig | 见下 | |
| rowClassName | 行的 className | string \| (record, index) => string | - | |
| rowKey | 行 key 的取值字段或生成函数 | string \| keyof T \| (record) => key | 'key' | |
| rowSelection | 行选择配置，见下表 | TableRowSelection | - | |
| scroll | 横向/纵向滚动配置（含固定列/表头） | TableScrollConfig | - | |
| showHeader | 是否显示表头 | boolean | true | |
| size | 表格尺寸 | `'large' \| 'middle' \| 'small'` | 'large' | |
| sortDirections | 支持的排序方式 | SortOrder[] | `['ascend', 'descend']` | |
| sticky | 设置粘性表头 | boolean \| TableSticky | - | |
| tableLayout | 表格布局算法（固定列/固定表头会自动置 fixed） | `'auto' \| 'fixed'` | 'auto'（固定列/表头时 'fixed'） | |
| virtual | 是否开启虚拟滚动（需配合 `scroll.x` / `scroll.y`） | boolean | false | |
| onRow | 行事件透传（click/doubleclick/mouseenter 等） | (record, index) => Record<string, unknown> | - | |
| onHeaderRow | 表头行事件透传 | (columns, index) => Record<string, unknown> | - | |

> `virtual` 需要数值型 `scroll.x`、`scroll.y`；估算行高由当前 Token 和 size 推导。


### Slots

| 名称 | 作用域 | 内容 |
| --- | --- | --- |
| title / footer / summary / caption | `{ data: T[] }` | 当前页标题、底部、汇总与可访问性标题 |
| emptyText | `{ data: T[], locale }` | 空内容；存在时优先于 locale.emptyText，包括空槽 |
| expandedRow | `{ record: T, index, indent, expanded }` | 展开行内容 |
| expandIcon | `{ prefixCls, record: T, expanded, expandable, onExpand }` | 展开图标；调用 `onExpand(record, event)` 提议切换 |
| headerCell | `{ column, title }` | 现有排序/筛选外壳内的表头内容 |
| bodyCell | `{ text, record: T, index, column, originNode }` | 单元格内容，originNode 是数据 renderer 的当前结果 |
| paginationItemRender | `{ page, type, element }` | 分页项 |
| paginationTotal | `{ total, range }` | 分页总数 |
| paginationSizeChanger | PaginationSizeChangerInfo | 分页尺寸切换器 |

`columns.render/title/filterDropdown/filterIcon/sortIcon` 和选择列的 `renderCell/columnTitle` 属于每列/每项数据服务，继续保留。`shouldCellUpdate(record, previousRecord)` 控制数据 renderer 缓存；原生槽仍跟踪自己的 Vue 响应式依赖，替换列 renderer 或改变行索引会更新缓存。

### Emits 与控制状态

| 事件 | 参数 |
| --- | --- |
| change | `(pagination, filters, sorter, { currentDataSource: T[], action })` |
| scroll | `(event: Event)`，来自当前真实表体；虚拟表体也保留原生 target |

分页 current/pageSize、列 sortOrder/filteredValue、rowSelection.selectedRowKeys 和 expandable.expandedRowKeys 各有一个接受态来源。通知携带本次提议；父组件拒绝受控提议时，界面与缓存保持接受态，撤除控制后延续最近的接受值。选择和展开配置内的业务通知保留原有职责，不另加 Table v-model。

### 泛型与 Ref

原生模板从 `dataSource: User[]` 和 `ColumnsType<User>` 推导行类型，`interface User` 无需索引签名。程序化调用使用 `h(Table<User>, props, slots)`；插槽可声明为 `TableSlots<User>`，引用使用 `TableRef`。

`nativeElement()` 返回内部表格根 HTMLElement；`scrollTo({ top })` 或 `scrollTo({ key, index, align, offset })` 操作当前表体。align 支持 start/center/end/nearest。自定义 `components.body(data, { scrollbarSize, ref, onScroll })` 应把 ref 接到真实 HTMLElement，并把原生滚动事件传给 onScroll；该显式服务优先于内置虚拟表体。

自定义元素组件应转发原生 attrs 和 default 槽。虚拟 wrapper 需要单个 HTMLElement 根；多根/纯文本组件没有可测量的滚动容器，nativeElement 为 null。更换组件或其根节点后会重新绑定真实元素与观察资源。

### 迁移

顶层 title/footer/summary/expandedRowRender/expandIcon/emptyText，以及 expandable 内 expandedRowRender/expandIcon，改为上述具名槽；位置参数改为具名作用域。`locale.emptyText` 保留静态 VNodeChild，动态内容用 #emptyText。`filterDropdownProps.dropdownRender` 改用列的 filterDropdown 数据 renderer。onRow/onCell/onHeaderCell 返回 Vue 原生 attrs，例如 onKeydown；onChange/onScroll 通过 @change/@scroll 订阅。

选择配置的 getCheckboxProps 按 type 对应真实输入：checkbox change 是 `(event: Event, checked: boolean)`；radio 继续使用 RadioChangeEvent。原生 class/style 落外层根；语义 styles 使用 Vue CSSProperties（含 undefined 与 --custom）。

### ColumnsType（列描述）

`columns` 的每一项支持分组列（`children`）与普通列，`ColumnGroupType | ColumnType`。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| align | 列内容的对齐方式 | `'left' \| 'right' \| 'center'` | - |
| colSpan | 表头列合并（设 0 不渲染表头） | number | - |
| onCell | 单元格事件透传 | (record: T, rowIndex) => Record<string, unknown> | - |
| onHeaderCell | 表头单元格事件透传 | (column) => Record<string, unknown> | - |
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
| key | 列的稳定标识，用于排序、筛选与列复用 | string | - |
| responsive | 命中任一断点时显示该列 | Breakpoint[] | - |
| rowSpan | 行合并 | number | - |
| render | 生成复杂数据的渲染，**位置参数** `(value, record, index)` | (value, record, index) => VNodeChild | - |
| showSorterTooltip | 表头排序气泡提示 | boolean \| SorterTooltipProps | true |
| sortOrder | 排序的受控属性 | `'ascend' \| 'descend' \| null` | - |
| sorter | 排序函数；true 由消费方处理排序 | boolean \| CompareFn<T> | false |
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
| expandedRowKeys | 展开的行（受控） | TableKey[] | - |
| expandIconColumnIndex | 展开按钮所在列的索引 | number | - |
| fixed | 展开列的固定位置 | `'left' \| 'right' \| 'start' \| 'end'` | - |
| indentSize | 树形缩进宽度 | number | 15 |
| rowExpandable | 行是否可展开 | (record) => boolean | - |
| showExpandColumn | 是否展示展开列 | boolean | true |
| onExpand | 展开行的回调 | (expanded, record) => void | - |
| onExpandedRowsChange | 展开的行变化时的回调 | (expandedRows) => void | - |


分页根节点的 class/style 放在 pagination.class / pagination.style；原 className 配置改用 class。

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
| emptyText | 无数据时的文案 | VNodeChild |
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

分页内容使用 `#paginationItemRender="{ page, type, element }"`、`#paginationTotal="{ total, range }"` 和 `#paginationSizeChanger="info"`。每个分页器接收当前作用域，支持顶部/底部及动态插槽；配置对象只放数据和业务事件，旧 itemRender/showTotal/sizeChangerRender 函数入口已移除。

## 当前主题变量

表头、排序、悬浮及筛选浮层的派生颜色跟随当前 ConfigProvider 主题，既有 Table 组件 Token 支持替换和移除，尺寸覆盖支持 0。原生根 CSS 变量优先于主题默认值；筛选 Portal 使用同一主题源。默认浅色的 40 条 CSS 变量声明保持不变。
