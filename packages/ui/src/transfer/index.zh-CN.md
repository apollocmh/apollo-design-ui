---
category: 数据录入
title: Transfer
subtitle: 穿梭框
titleTemplate: '%s - @apollo-design/ui'
description: 双栏穿梭选择框，用于在两组数据之间移动条目。
---

# Transfer 穿梭框

双栏穿梭选择框。

## 何时使用

- 需要在两组数据之间进行选择和移动时；
- 需要对选项进行批量移动（全选 / 反选 / 按页选择）时；
- 需要搜索过滤、分页浏览大量候选项时。

## 引入

```ts
import { Transfer } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 搜索

<code src="./demo/search.vue"></code>

### 单向

<code src="./demo/oneway.vue"></code>

### 高级用法

<code src="./demo/advanced.vue"></code>

### 分页

<code src="./demo/pagination.vue"></code>

### 自定义渲染条目

<code src="./demo/custom-item.vue"></code>

### 校验状态

<code src="./demo/status.vue"></code>

### 自定义选择全部文案

<code src="./demo/custom-select-all-labels.vue"></code>
<code src="./demo/tree-transfer.vue"></code>

<code src="./demo/table-transfer.vue"></code>

## API

### Transfer

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| dataSource | 数据源，条目需含 `key` | `TransferItem[]` | `[]` |
| targetKeys | 右列（目标列）的 key 集合 | `TransferKey[]` | `[]` |
| selectedKeys | 勾选的 key 集合（受控） | `TransferKey[]` | - |
| titles | 左右列标题 | `VNodeChild[]` | `['', '']` |
| actions | 自定义操作按钮文案 `[向右, 向左]` | `VNodeChild[]` | 箭头图标 |
| operations | 同 `actions`（deprecated） | `VNodeChild[]` | - |
| locale | 文案 | `TransferLocale` | en_US |
| disabled | 整体禁用 | `boolean` | `false` |
| showSearch | 显示搜索框（对象形态可给 `defaultValue` / `placeholder`） | `boolean \| { defaultValue?: string; placeholder?: string }` | `false` |
| showSelectAll | 显示头部全选区 | `boolean` | `true` |
| oneWay | 单向模式（隐藏向左按钮、右列渲染删除按钮） | `boolean` | `false` |
| pagination | 列表分页 | `boolean \| { pageSize?: number; simple?: boolean; showSizeChanger?: boolean; showLessItems?: boolean }` | - |
| status | 校验状态 | `'error' \| 'warning'` | - |
| selectionsIcon | 头部下拉的图标 | `VNodeChild` | `DownOutlined` |
| filterOption | 自定义搜索匹配 | `(inputValue, item, direction) => boolean` | 文本包含 |
| rowKey | 条目 key 取值器 | `(record) => TransferKey` | `record.key` |
| selectAllLabels | 逐列头部文案 | `[VNodeChild?, VNodeChild?]` | 计数文案 |
| listStyle | 面板外联样式（deprecated → `styles.section`） | `object \| ({ direction }) => object` | - |
| operationStyle | 操作区样式（deprecated → `styles.actions`） | `object` | - |
| classNames / styles | 语义化类名 / 样式（含 `source` / `target` 方向子结构） | `object` | - |

### 插槽

| 名称 | 作用域 | 默认行为 |
| --- | --- | --- |
| item | `{ item, direction, selected, disabled }` | 数据 `title`，非文本时回退 `key` |
| footer | `{ direction, selectedKeys, totalCount }` | 无底栏；`totalCount` 是该侧全部条目数 |
| list | `{ direction, filteredItems, selectedKeys, disabled, onItemSelect, onItemSelectAll, onItemRemove, onScroll }` | 默认列表；自定义列表不启用内嵌分页 |
| selectAllLabel | `{ direction, selectedCount, totalCount }` | `selectAllLabels` 静态数据或默认计数；计数基于筛选后的列表 |

插槽在渲染期读取，支持条件增删和动态内容；明确提供空 slot 不会回退。`direction` 是数据方向 `left/right`，RTL 不改变其含义。`#item` 的富内容不参与搜索解析；默认搜索、行 title 和 checkbox 名称取数据 `title/key`，其他搜索字段使用 `filterOption`。

`onItemSelect(key, selected)` 选择单项；`onItemSelectAll(keys, selected)` 的第二参支持 `true`、`false` 和 `'replace'`。选择函数过滤禁用或不属于当前筛选列表的键。`onItemRemove(keys)` 用于右侧单向移除，`onScroll(event)` 转发滚动事件。自定义控件仍需绑定 `disabled`。

当前开发版直接移除 `render`、`footer`、`renderList` / `children` 函数 props 及 `selectAllLabels` 函数项；使用以上插槽，没有旧函数兼容层或弃用期。完整变化见 `docs/migrations/transfer-slots.md`（ADR 0006）。

### 事件

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 移动完成后触发 | `(targetKeys, direction, moveKeys)` |
| selectChange | 勾选变化 | `(sourceSelectedKeys, targetSelectedKeys)` |
| search | 搜索值变化（含清空） | `(direction, value)` |
| scroll | 列表滚动 | `(direction, event)` |

### 静态属性

- `Transfer.List` / `TransferList`：列表面板（自定义列表面板 / 单面板使用）；
- `Transfer.Search` / `TransferSearch`：搜索框；
- `Transfer.Operation` / `TransferOperation`：操作按钮列。

## 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| `transferListWidth` | 面板宽度 | `180px` |
| `transferListHeight` | 面板高度 | `200px` |
| `transferListWidthLG` | 分页下面板宽度 | `250px` |
| `transferHeaderHeight` | 面板头高度 | `40px` |
| `transferItemHeight` | 条目最小高度 | `32px` |
| `transferItemPaddingBlock` | 条目纵向内边距 | `5px` |
| `transferHeaderVerticalPadding` | 面板头纵向内边距 | `9px` |
