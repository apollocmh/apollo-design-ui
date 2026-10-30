---
category: 数据录入
title: TreeSelect
subtitle: 树选择
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

### Props 与模型

`value`、`open`、`searchValue`、`treeExpandedKeys`、`treeLoadedKeys` 分别支持对应的 `v-model:<name>`。受控请求由父级接受后生效；拒绝请求保持已接受值，撤除控制沿用最后接受值。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value / defaultValue | 单选值；多选为数组。labelInValue 时为带 value/label 的对象 | TreeSelectValue | - |
| treeData | 节点数据，value 同时充当树 key；支持响应式替换与自定义字段 | TreeSelectDataNode[] | [] |
| multiple / treeCheckable | 多选 / 级联勾选；treeCheckable 自动多选 | boolean | false |
| treeCheckStrictly | 父子独立勾选，启用 labelInValue，保留 halfChecked 元数据 | boolean | false |
| labelInValue | 返回 value/label 对象 | boolean | false |
| showCheckedStrategy | 展示及通知值裁剪策略 | SHOW_ALL / SHOW_PARENT / SHOW_CHILD | 勾选时 SHOW_CHILD，否则 SHOW_ALL |
| maxCount | 最多选中数；SHOW_PARENT 或非严格 SHOW_ALL 时忽略 | number | - |
| fieldNames | value / label / children 字段映射 | TreeSelectFieldNames | - |
| treeDataSimpleMode | 按 id/pId 将平铺数据转为树；可配置 id/pId/rootPId | boolean / SimpleModeConfig | false |
| loadData | 展开时加载节点的业务服务；搜索期间不调用 | (node: TreeSelectDataNode) => Promise<unknown> | - |
| treeExpandedKeys / treeDefaultExpandedKeys | 受控 / 默认展开键 | (string / number)[] | - |
| treeLoadedKeys | 已加载键 | (string / number)[] | - |
| treeDefaultExpandAll | 默认展开全部 | boolean | false |
| treeExpandAction | 点击内容触发展开 | false / 'click' / 'doubleClick' | false |
| treeLine | 连接线，可设置 showLeafIcon | boolean / object | false |
| treeIcon / showTreeIcon | 显示节点数据中的 icon；showTreeIcon 优先 | boolean | false |
| switcherIcon | 静态展开图标；需要节点状态时使用插槽 | VNodeChild | - |
| showSearch | 是否可搜索；对象仅包含过滤及自动清空配置 | boolean / SearchConfig | false |
| searchValue | 搜索词 | string | '' |
| autoClearSearchValue | 选中后清空搜索；showSearch 对象中的同名配置优先 | boolean | true |
| filterTreeNode / treeNodeFilterProp | 过滤算法 / 匹配字段；showSearch 对象中的同名配置优先 | boolean / (input, node) => boolean；string | 默认匹配 value |
| treeNodeLabelProp | 选中标签读取字段 | string | title / label |
| placeholder / notFoundContent | 占位 / 空态内容；对应插槽优先，包括空内容及 0 | VNodeChild | - |
| allowClear | 清除按钮，可配置 clearIcon/label | boolean / object | false |
| suffixIcon / clearIcon / removeIcon | 静态图标；对应插槽优先 | VNodeChild | - |
| maxTagCount / maxTagTextLength | 标签数量 / 文字长度限制 | number | - |
| maxTagPlaceholder | 静态溢出标签；需要省略项数据时使用插槽 | VNodeChild | - |
| disabled / loading / size / status / variant | 禁用、加载、尺寸、校验状态与外观；继承当前 Provider/Form/Compact 配置 | boolean / boolean / SizeType / SelectStatus / SelectVariant | - |
| bordered | 旧边框开关，优先使用 variant | boolean | - |
| open / defaultOpen | 受控 / 默认打开 | boolean | false |
| placement / direction | 浮层位置 / 方向，局部优先，继承当前 Provider | SelectCommonPlacement / 'ltr' / 'rtl' | bottomLeft / ltr |
| getPopupContainer | 挂载容器，局部优先，继承当前 Provider | (trigger) => HTMLElement / ShadowRoot | document.body |
| popupMatchSelectWidth | 浮层宽度跟随；false 同时关闭虚拟滚动 | boolean / number | true |
| dropdownMatchSelectWidth | popupMatchSelectWidth 的旧别名 | boolean / number | - |
| popupClassName / dropdownClassName / popupStyle | 浮层旧样式通道；优先使用语义 popup.root | string / string / CSSProperties | - |
| listHeight / listItemHeight / virtual | 列表高度 / 虚拟行高 / 虚拟滚动；行高默认随当前 Tree Token 派生 | number / number / boolean | 256 / 28 / true |
| classNames / styles | 语义 class/style；可用 ({ props }) => 对象，读取当前 TreeSelectProps | TreeSelectSemanticClassNames / TreeSelectSemanticStyles 或函数 | - |
| id / tabIndex / autoFocus / maxLength | 原生输入身份、焦点与输入限制 | string / number / boolean / number | - |

原生 `class`/`style` 在渲染时落到触发器一次，支持字符串、数组、对象及撤除；`aria-label`/`aria-labelledby` 落到实际 combobox 输入。其它原生属性与监听器按 BaseSelect 的实际根契约转发。默认插槽使用一个按钮或可转发原生属性的组件作为自定义触发器。

### Emits

| 事件 | 载荷 |
| --- | --- |
| change / update:value | change(value, labels, extra)；update:value(value)。labels 在 labelInValue 下为 null。extra 包含 preValue / triggerValue / checked 或 selected |
| select / deselect | (value, node)：原始值与数据节点 |
| openChange / update:open | (open: boolean) |
| search / update:searchValue | (text: string)；search 通知输入操作，自动清空仅更新模型 |
| treeExpand / update:treeExpandedKeys | (keys) |
| treeLoad / update:treeLoadedKeys | (keys) |
| clear | 无载荷 |
| popupScroll / focus / blur / inputKeyDown | 原生 Event / FocusEvent / FocusEvent / KeyboardEvent |

`extra.triggerNode`/`allCheckedNodes` 保留历史数据节点 getter 及废弃告警。监听 change 与否不会改变模型值形状。旧 open 通知别名不再提供，统一使用 `@open-change`。

### Slots

| 插槽 | 作用域 |
| --- | --- |
| default | 单一自定义触发器 |
| treeTitleRender | { node: TreeSelectDataNode }；同时用于树标题和已选标签 |
| treeIcon / switcherIcon / switcherLoadingIcon | { node, data }；node 带当前展开/勾选/加载态，data 为原始数据 |
| tagRender | { label, value, disabled, closable, onClose, isMaxTag } |
| popupRender | { menu } |
| maxTagPlaceholder | { omittedValues } |
| suffixIcon | { searchValue, open, focused, showSearch, loading } |
| prefix / placeholder / notFoundContent / clearIcon / removeIcon / loadingIcon | 无作用域 |

插槽在渲染时读取，存在即优先，可返回空内容或 0。开发期直接迁移 `treeTitleRender`、`tagRender`、`popupRender`/`dropdownRender` 函数 prop 到同职责插槽；`switcherIcon` 函数改用 `#switcherIcon`。无函数兼容层与弃用期。节点数据中的 title/icon 函数、过滤函数及异步 loadData 保留其业务职责。

### Expose

`TreeSelectRef` 提供 `focus(options?: FocusOptions)`、`blur()`、`scrollTo(number | { key, align?, offset?, autoExpand? } | null)` 及只读的当前 `nativeElement: HTMLElement | null`。`nativeElement` 是元素属性，替代旧的方法形态。

### Provider 与主题

展示配置读取当前 `components.treeSelect`，支持 className/style、classNames/styles、showSearch/allowClear 及静态图标；替换和撤除均生效。全局方向、容器、尺寸、禁用、variant 和虚拟设置按各自职责继承。

无独立 TreeSelect Component Token 入口。树节点沿用当前 `components.Tree` 的九个 Token；外壳沿用当前 `components.Select` Token，变量同步到触发器和真实浮层。`listItemHeight` 显式值优先，否则随 Tree 的 titleHeight 及 padding 派生。浮层层级保留父 context 规则，显式 popup.root/popupStyle zIndex 优先并保留 0。

### 静态属性

`TreeSelect.SHOW_ALL` / `SHOW_PARENT` / `SHOW_CHILD` 与具名导出等价。`TreeSelect.TreeNode` children 数据形式不提供。
