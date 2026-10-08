---
title: Table
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

> ⚠️ 该组件的 API 文档（`index.zh-CN.md`）尚未补齐，以下为可运行的实时演示。

## 代码演示

::: v-pre

**basic**：基本使用：`columns` 定义列、`data-source` 提供数据；`bodyCell` 插槽自定义单元格渲染。

:::

<DemoPreview component="table" demo="basic" />

::: v-pre

**bordered**：`bordered` 展示表格内外边框。

:::

<DemoPreview component="table" demo="bordered" />

::: v-pre

**expand**：`expandable.expandedRowRender` 自定义展开内容；`defaultExpandAllRows` 默认全部展开。

:::

<DemoPreview component="table" demo="expand" />

::: v-pre

**filter**：列上声明 `filters` + `onFilter` 开启筛选下拉；`filterMultiple` 控制多选/单选；
`filteredValue` 受控。

:::

<DemoPreview component="table" demo="filter" />

::: v-pre

**fixed-columns**：列声明 `fixed: 'left' | 'right'` 固定列；横向内容超出时（`scroll.x`）固定列吸边并带阴影。

:::

<DemoPreview component="table" demo="fixed-columns" />

::: v-pre

**nest**：数据带 `children` 字段即自动成为树形表格（`childrenColumnName` 可换字段名）。

:::

<DemoPreview component="table" demo="nest" />

::: v-pre

**radio-selection**：`row-selection.type="radio"` 单选列。

:::

<DemoPreview component="table" demo="radio-selection" />

::: v-pre

**selection**：`row-selection` 开启勾选列；`v-model` 形态用 `selectedRowKeys` 受控。

:::

<DemoPreview component="table" demo="selection" />

::: v-pre

**size**：`size="middle" | "small"` 两种紧凑形态。

:::

<DemoPreview component="table" demo="size" />

::: v-pre

**sorter**：列上声明 `sorter` 即开启排序（三态循环）；`defaultSortOrder` 指定默认排序。
多重排序用 `sorter: { compare, multiple: n }`。

:::

<DemoPreview component="table" demo="sorter" />

::: v-pre

**summary**：`summary` 函数 + `Table.Summary` 组件渲染表尾汇总（`Summary.Cell` 的 `colSpan` 聚合列）。

:::

<DemoPreview component="table" demo="summary" />

::: v-pre

**virtual-list**：`virtual` 开启虚拟滚动（大表格场景）：表体交给 `@apollo-design/virtual-list`，只渲染视口内的行。
`scroll.y` 给视口高度、`scroll.x` 给内容宽度 —— **virtual 下二者必须是数值**（否则按 1 / 500 兜底并告警）。

:::

<DemoPreview component="table" demo="virtual-list" />
