---
title: Transfer 穿梭框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

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

:::

## 代码演示

::: v-pre

**advanced**：受控 `selectedKeys` + `render` 自定义条目渲染的完整交互。

:::

<DemoPreview component="transfer" demo="advanced" />

::: v-pre

**basic**：最简单的用法：勾选左列条目 → 点击「向右」按钮移动到目标列。

:::

<DemoPreview component="transfer" demo="basic" />

::: v-pre

**custom-item**：`render` 返回 `{ label, value }`：label 渲染条目，value 参与搜索匹配。

:::

<DemoPreview component="transfer" demo="custom-item" />

::: v-pre

**custom-select-all-labels**：`selectAllLabels` 逐列定制头部文案：支持字符串或 `({ selectedCount, totalCount }) => 节点`。

:::

<DemoPreview component="transfer" demo="custom-select-all-labels" />

::: v-pre

**oneway**：`oneWay` 单向模式：隐藏「向左」按钮，右列改为删除按钮。

:::

<DemoPreview component="transfer" demo="oneway" />

::: v-pre

**pagination**：`pagination` 开启列表面板内嵌分页（面板自动加宽，头部下拉多出「选择当前页」）。

:::

<DemoPreview component="transfer" demo="pagination" />

::: v-pre

**search**：`showSearch` 开启搜索框，按条目文本过滤两个列表。

:::

<DemoPreview component="transfer" demo="search" />

::: v-pre

**status**：`status` 为面板边框增加 error / warning 校验态。

:::

<DemoPreview component="transfer" demo="status" />

<DemoPreview component="transfer" demo="table-transfer" />

<DemoPreview component="transfer" demo="tree-transfer" />

::: v-pre

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
| render | 条目渲染（返回 `{ label, value }` 时 value 参与搜索匹配） | `(item) => VNodeChild \| { label?: VNodeChild; value?: string }` | - |
| footer | 面板底部渲染 | `(props, { direction }) => VNodeChild` | - |
| filterOption | 自定义搜索匹配 | `(inputValue, item, direction) => boolean` | 文本包含 |
| rowKey | 条目 key 取值器 | `(record) => TransferKey` | `record.key` |
| selectAllLabels | 逐列头部文案 | `[SelectAllLabel?, SelectAllLabel?]` | 计数文案 |
| listStyle | 面板外联样式（deprecated → `styles.section`） | `object \| ({ direction }) => object` | - |
| operationStyle | 操作区样式（deprecated → `styles.actions`） | `object` | - |
| classNames / styles | 语义化类名 / 样式（含 `source` / `target` 方向子结构） | `object` | - |

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

:::
