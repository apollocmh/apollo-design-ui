---
title: Tree 树形控件
titleTemplate: '%s - @apollo-design/ui'
description: 文件夹、组织架构、生物分类、国家地区等，万物皆为树。
---

# Tree 树形控件

多层结构的数据（文件夹、组织架构等）以树形展开，支持选择、勾选、异步加载、拖拽与虚拟滚动。

## 何时使用

- 树形层级数据展示与导航；
- 需要对层级数据进行选择 / 勾选（级联或严格模式）；
- 大数据量时开启虚拟滚动；目录结构场景直接使用 `DirectoryTree`。

## 引入

```ts
import { Tree, DirectoryTree } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 受控操作示例

<code src="./demo/basic-controlled.vue"></code>

### 目录树

<code src="./demo/directory.vue"></code>

### 节点图标

<code src="./demo/customized-icon.vue"></code>

### 可拖拽

<code src="./demo/draggable.vue"></code>

### 异步数据

<code src="./demo/dynamic.vue"></code>

### 搜索

<code src="./demo/search.vue"></code>

### 连接线

<code src="./demo/line.vue"></code>

### 大数据量

<code src="./demo/big-data.vue"></code>

### 虚拟滚动

<code src="./demo/virtual-scroll.vue"></code>

### 滚动定位

<code src="./demo/scroll-to.vue"></code>

### 多行标题

<code src="./demo/multiple-line.vue"></code>

### 自定义展开图标

<code src="./demo/switcher-icon.vue"></code>

### 自定义样式类

<code src="./demo/style-class.vue"></code>

### 主题 Token

<code src="./demo/component-token.vue"></code>

## API

### TreeProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| treeData | 树数据（v6 主通道；`<TreeNode>` children 形态已 deprecated 不实现） | DataNode[] | - |
| fieldNames | 字段名映射 | { key?, title?, children? } | - |
| expandedKeys | 展开节点（受控，`v-model:expandedKeys`） | TreeKey[] | - |
| defaultExpandedKeys | 默认展开 | TreeKey[] | [] |
| defaultExpandAll | 默认展开全部（**只展开有 children 的节点**） | boolean | false |
| defaultExpandParent | 默认展开父节点（首挂 conductExpandParent 补祖先） | boolean | true |
| autoExpandParent | 展开受控时自动补全祖先 | boolean | false |
| checkable | 勾选（自定义勾选框） | boolean \| VNodeChild | false |
| checkStrictly | 勾选完全受控（父子不关联；`checkedKeys` 为对象形态） | boolean | false |
| checkedKeys | 勾选节点（受控，`v-model:checkedKeys`） | SafeKey[] \| { checked, halfChecked } | - |
| defaultCheckedKeys | 默认勾选 | SafeKey[] | [] |
| selectable | 可选中 | boolean | true |
| multiple | 支持多选 | boolean | false |
| selectedKeys | 选中节点（受控，`v-model:selectedKeys`） | TreeKey[] | - |
| defaultSelectedKeys | 默认选中 | TreeKey[] | - |
| loadData | 异步加载 | (node) => Promise | - |
| loadedKeys | 已加载节点（受控，`v-model:loadedKeys`） | SafeKey[] | - |
| showIcon | 显示节点图标 | boolean | false |
| showLine | 连接线 | boolean \| { showLeafIcon } | false |
| icon | 节点图标（fn 或 VNode） | TreeIconType | - |
| switcherIcon | 展开按钮图标 | TreeIconType | - |
| switcherLoadingIcon | 加载中图标 | VNodeChild | - |
| blockNode | 节点占满一行 | boolean | false |
| expandAction | 点击/双击节点时触发展开 | false \| 'click' \| 'doubleClick' | false |
| titleRender | 标题渲染函数（`#title` 插槽优先） | (node) => VNodeChild | - |
| disabled | 整棵树禁用 | boolean | - |
| draggable | 可拖拽 | boolean \| fn \| { nodeDraggable?, icon? } | false |
| allowDrop | 是否允许拖入 | (options) => boolean | () => true |
| height | 虚拟滚动容器高度 | number | - |
| itemHeight | 行高（antd 按 paddingXS/2 + titleHeight 计算，勿手传） | number | - |
| scrollWidth | 横向滚动宽度 | number | - |
| virtual | 虚拟滚动（默认读 ConfigProvider） | boolean | - |
| itemScrollOffset | activeKey 滚动跟随附加偏移 | number | 0 |
| focusable | 可聚焦 | boolean | true |
| activeKey | 键盘活动节点 | TreeKey \| null | - |
| filterTreeNode | 过滤命中节点（`-filter-node` 类） | (node) => boolean | - |

### 事件（Emits）

四键 `v-model` 与语义事件**同发**（C11）：`update:expandedKeys` + `expand`、`update:checkedKeys` + `check`（checkStrictly 时为对象形态）、`update:selectedKeys` + `select`、`update:loadedKeys` + `load`；另有 `click` / `doubleClick` / `contextmenu` / `mouseEnter` / `mouseLeave` / 拖拽 7 事件（dragStart/dragEnter/dragOver/dragLeave/dragEnd/drop）/ `activeChange`。

### Slots

| 插槽 | 说明 |
| --- | --- |
| title | 节点标题（优先于同名 prop / titleRender） |

### TreeRef（expose）

| 方法 | 说明 |
| --- | --- |
| scrollTo({ key, autoExpand?, offset?, align? }) | 滚动定位到节点 |
| keyEntities | 键实体表（只读快照） |

### DirectoryTree

`Tree.DirectoryTree` 的对应物：目录树变体（`showIcon=true` / `expandAction='click'` / `blockNode` / File-Folder 图标）；`multiple` 下支持 `shift` / `ctrl`（meta）范围多选，`select` 事件额外带 `selectedNodes`。默认 `defaultExpandAll` 展开全部实体 key（与 Tree 的「只展开有 children」不同）。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| titleHeight | 节点标题高度 | controlHeightSM（24px） |
| switcherSize | 展开按钮尺寸 | 24px |
| indentSize | 缩进宽度 | 24px |
| nodeHoverBg / nodeHoverColor | 节点悬浮态 | controlItemBgHover / colorText |
| nodeSelectedBg / nodeSelectedColor | 节点选中态 | controlItemBgActive / colorText |
| directoryNodeSelectedColor / directoryNodeSelectedBg | 目录树选中态 | colorTextLightSolid / colorPrimary |
