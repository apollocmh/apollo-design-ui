---
title: TreeSelect 树选择
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# TreeSelect 树选择

含多层级结构的数据（部门、地区、分类）以下拉树的形式选择，支持单选、多选、勾选级联、搜索过滤、异步加载与虚拟滚动。

## 何时使用

- 需要在**有限空间**内展示树形选择（区别于整页铺开的 `Tree`）；
- 分层级的单选 / 多选（`multiple`）或勾选（`treeCheckable`）场景；
- 大数据量时开启虚拟滚动。

## 引入

```ts
import { TreeSelect, SHOW_ALL, SHOW_PARENT, SHOW_CHILD } from '@apollo-design/ui';
```

:::

## 代码演示

::: v-pre

**async**：异步加载（`loadData`），展开时加载子节点。\n

:::

<DemoPreview component="tree-select" demo="async" />

::: v-pre

**basic**：最简单的用法（`v-model:value` 绑定）。\n

:::

<DemoPreview component="tree-select" demo="basic" />

::: v-pre

**check-strictly**：勾选完全受控（`treeCheckStrictly`）：父子不关联，`value` 为 LabeledValue（含 halfChecked）。\n

:::

<DemoPreview component="tree-select" demo="check-strictly" />

::: v-pre

**disabled**：禁用：整树（`disabled`）或节点级（data 的 `disabled`）。\n

:::

<DemoPreview component="tree-select" demo="disabled" />

::: v-pre

**field-names**：自定义字段名（`fieldNames`）：`value` 字段同时充当树的 key。\n

:::

<DemoPreview component="tree-select" demo="field-names" />

::: v-pre

**max-count**：限制最大选中数量（`maxCount`，多选 / SHOW_CHILD 下生效）。\n

:::

<DemoPreview component="tree-select" demo="max-count" />

::: v-pre

**multiple**：多选与标签（`multiple`），`allowClear` 一键清空。\n

:::

<DemoPreview component="tree-select" demo="multiple" />

::: v-pre

**placeholder-slot**：placeholder 插槽自定义。\n

:::

<DemoPreview component="tree-select" demo="placeholder-slot" />

::: v-pre

**show-checked-strategy**：展示策略（`showCheckedStrategy`）：`SHOW_PARENT` 回显父节点 / `SHOW_ALL` 全量回显。\n

:::

<DemoPreview component="tree-select" demo="show-checked-strategy" />

::: v-pre

**simple-mode**：平铺数据建树（`treeDataSimpleMode`，id/pId 结构）。\n

:::

<DemoPreview component="tree-select" demo="simple-mode" />

::: v-pre

**size**：三种尺寸（`size`）。\n

:::

<DemoPreview component="tree-select" demo="size" />

::: v-pre

**status**：校验状态（`status`）：error / warning。\n

:::

<DemoPreview component="tree-select" demo="status" />

::: v-pre

**tree-checkable**：勾选模式（`treeCheckable`），父子级联勾选，默认 `SHOW_CHILD` 策略展示。\n

:::

<DemoPreview component="tree-select" demo="tree-checkable" />

::: v-pre

**tree-line**：下拉树带连接线（`treeLine`）。\n

:::

<DemoPreview component="tree-select" demo="tree-line" />

::: v-pre

**virtual-scroll**：大量节点下虚拟滚动（`listHeight` 控制浮层高度）。\n

:::

<DemoPreview component="tree-select" demo="virtual-scroll" />

::: v-pre

## API

### TreeSelectProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| treeData | 树数据（**value 字段同时充当树的 key**） | TreeSelectDataNode[] | - |
| value / v-model:value | 选中值（多选数组 / 单选单值；labelInValue 时为 LabeledValueType） | TreeSelectValue | - |
| defaultValue | 默认值 | TreeSelectValue | - |
| multiple | 多选 | boolean | false |
| treeCheckable | 勾选模式（自动多选；级联勾选） | boolean | - |
| treeCheckStrictly | 勾选完全受控（父子不关联；value 需为 LabeledValueType） | boolean | false |
| showCheckedStrategy | 展示策略 | SHOW_ALL \| SHOW_PARENT \| SHOW_CHILD | checkable ? SHOW_CHILD : SHOW_ALL |
| maxCount | 最大选中数（SHOW_ALL(非 strictly) / SHOW_PARENT 下无效） | number | - |
| labelInValue | value 为 LabeledValueType | boolean | false |
| fieldNames | 字段映射 { value?, label?, children? } | object | - |
| treeDataSimpleMode | 平铺数据建树（id/pId） | boolean \| SimpleModeConfig | - |
| loadData | 异步加载 | (node) => Promise | - |
| treeDefaultExpandAll | 默认展开全部 | boolean | false |
| treeExpandedKeys / v-model:treeExpandedKeys | 受控展开 | TreeKey[] | - |
| treeDefaultExpandedKeys | 默认展开 | TreeKey[] | - |
| treeLoadedKeys / v-model:treeLoadedKeys | 已加载节点 | TreeKey[] | - |
| treeLine | 连接线 | boolean \| object | - |
| treeIcon | 节点图标数据通道 | boolean | - |
| showTreeIcon | 展示节点图标 | boolean | - |
| switcherIcon | 展开按钮图标 | TreeIconType | - |
| treeTitleRender | 节点标题渲染函数 | (node) => VNodeChild | - |
| treeExpandAction | 点击节点触发展开 | false \| 'click' \| 'doubleClick' | - |
| treeNodeFilterProp | 搜索匹配字段 | string | 'value' |
| filterTreeNode | 自定义过滤 | boolean \| fn | - |
| treeNodeLabelProp | tag 展示字段 | string | - |
| showSearch | 搜索（对象形态可配 searchValue/onSearch 等） | boolean \| SearchConfig | false |
| searchValue / v-model:searchValue | 搜索词（受控） | string | - |
| autoClearSearchValue | 选中后自动清空搜索 | boolean | true |
| listHeight | 浮层最大高度 | number | 256 |
| listItemHeight | 行高（虚拟滚动用） | number | 28（controlHeightSM+paddingXXS） |
| virtual | 虚拟滚动 | boolean | - |
| popupMatchSelectWidth | 浮层宽度跟随 | boolean \| number | true |
| placeholder | 占位（也可用插槽） | VNodeChild | - |
| allowClear | 清除按钮 | boolean \| object | - |
| suffixIcon / removeIcon / clearIcon | 图标定制 | VNodeChild | - |
| tagRender | 自定义 tag 渲染 | fn | - |
| notFoundContent | 空态内容 | VNodeChild | - |
| disabled / size / status / variant | 表单态 | - | - |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | 多选 tag 裁剪 | - | - |
| placement / direction / getPopupContainer / popupRender / open / defaultOpen | 浮层 | - | - |
| classNames / styles | 语义槽（root/prefix/input/suffix/content/placeholder/item/itemContent/itemRemove/popup） | object | - |

### 事件（Emits）

- `update:value` + `change`（C11 同发；additionalInfo 含 preValue / triggerValue / checked|selected / triggerNode / allCheckedNodes，后两者为**数据节点**并带废弃告警）；
- `update:open` + `openChange`；
- `update:searchValue` + `search`；
- `update:treeExpandedKeys` + `treeExpand`；
- `update:treeLoadedKeys` + `treeLoad`；
- `select` / `deselect` / `clear` / `popupScroll`。

### Slots

| 插槽 | 说明 |
| --- | --- |
| placeholder | 占位内容 |
| notFoundContent | 空态 |
| default | raw trigger（同 Cascader） |

### 静态属性

`TreeSelect.SHOW_ALL` / `SHOW_PARENT` / `SHOW_CHILD`（与具名导出等价）。

### 主题变量

无自有 Component Token —— 复用 Tree 的 9 个（titleHeight / switcherSize / indentSize / nodeHoverBg / nodeHoverColor / nodeSelectedBg / nodeSelectedColor / directoryNodeSelectedColor / directoryNodeSelectedBg）。

:::
