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
| targetKeys (`v-model:targetKeys`) | 右列 key；传入时受控，未绑定时内部维护 | `TransferKey[]` | `[]` |
| selectedKeys (`v-model:selectedKeys`) | 勾选 key；传入时受控，未绑定时内部维护 | `TransferKey[]` | - |
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
| update:targetKeys | 请求更新目标 key，供 `v-model:targetKeys` 使用 | `(targetKeys)` |
| update:selectedKeys | 请求更新勾选 key，供 `v-model:selectedKeys` 使用 | `(selectedKeys)` |
| change | 请求移动时触发；受控数据以父组件接受结果为准 | `(targetKeys, direction, moveKeys)` |
| selectChange | 勾选变化 | `(sourceSelectedKeys, targetSelectedKeys)` |
| search | 搜索值变化（含清空） | `(direction, value)` |
| scroll | 列表滚动 | `(direction, event)` |

事件使用 Vue emits；模板监听与 `h()` 的监听器数组只通知一次，不会落到原生根上。撤除受控 prop 后保留最后接受的状态。Shift 范围只使用当前筛选列表的可用项，数据重排时按 key 定位选择锚点。

### 引用与原生属性

`TransferRef.nativeElement` 是当前根 `HTMLElement`，卸载后为 `null`；`focus(options?: FocusOptions)` 聚焦本实例第一个可用控件，`blur()` 只移除本实例内的焦点。原生 `class/style/id/data-*` 等落根，style 支持 Vue 的对象、字符串和数组；`styles` 的节点值为 `CSSProperties`。长度显式写单位；opacity 等无单位属性可用数值，遵循 Vue 原生样式语义。

### 静态属性

- `Transfer.List` / `TransferList`：列表面板（自定义列表面板 / 单面板使用）；
- `Transfer.Search` / `TransferSearch`：搜索框；
- `Transfer.Operation` / `TransferOperation`：操作按钮列。

静态成员与命名导出具有同一类型。`Transfer.Search` 的值支持 `v-model:value`，使用 `@change` / `@clear`；原 `handleClear` 改为 `@clear`。`Transfer.Operation` 使用 `@move-to-right` / `@move-to-left`，直接替代 `moveToRight/moveToLeft` 回调 props。`Transfer.List` 的过滤、清空、选择和移除使用对应 Vue 事件；原 `handleFilter/handleClear` 改为 `@filter/@clear`。

操作内容中的图标、文本和普通节点由所属按钮承载；实际自定义按钮保留 Vue 的 key、ref、指令和监听器数组，禁用时不触发移动。头部菜单由具名原生按钮打开，支持键盘 Enter。

## 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| `listWidth` | 面板宽度 | `180px` |
| `listHeight` | 面板高度 | `200px` |
| `listWidthLG` | 分页下面板宽度 | `250px` |
| `headerHeight` | 面板头高度 | `40px` |
| `itemHeight` | 条目最小高度 | `32px` |
| `itemPaddingBlock` | 条目纵向内边距 | `5px` |
| `transferHeaderVerticalPadding` | 面板头纵向内边距 | `9px` |

通过 `ConfigProvider.theme.components.Transfer` 配置以上七项，数值长度转为 px，字符串保留 CSS 长度；当前主题替换、嵌套和撤除会更新派生值。原生和语义样式仍可覆盖这些变量；`listStyle` 的优先级低于 `styles.section`。
