---
title: TreeSelect 树选择
titleTemplate: '%s - @apollo-design/ui'
description: 弹层内的树形结构，用于多层数据的选择。
---

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

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 多选

<code src="./demo/multiple.vue"></code>

### 勾选模式

<code src="./demo/tree-checkable.vue"></code>

### 勾选完全受控

<code src="./demo/check-strictly.vue"></code>

### 展示策略

<code src="./demo/show-checked-strategy.vue"></code>

### 异步加载

<code src="./demo/async.vue"></code>

### 校验状态

<code src="./demo/status.vue"></code>

### 最大数量

<code src="./demo/max-count.vue"></code>

### 自定义字段名

<code src="./demo/field-names.vue"></code>

### 平铺数据

<code src="./demo/simple-mode.vue"></code>

### 尺寸

<code src="./demo/size.vue"></code>

### 禁用

<code src="./demo/disabled.vue"></code>

### 连接线

<code src="./demo/tree-line.vue"></code>

### 虚拟滚动

<code src="./demo/virtual-scroll.vue"></code>

### Placeholder 插槽

<code src="./demo/placeholder-slot.vue"></code>

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
