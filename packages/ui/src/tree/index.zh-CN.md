---
category: 数据展示
title: Tree
subtitle: 树形控件
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
| treeData | 树数据；字段可用 fieldNames 映射，默认 key/title/children | object[]（可用 `TreeProps<T>` 声明数据类型） | - |
| fieldNames | 字段名映射 | { key?, title?, children? } | - |
| expandedKeys | 展开节点（受控，`v-model:expandedKeys`） | TreeKey[] | - |
| defaultExpandedKeys | 默认展开 | TreeKey[] | [] |
| defaultExpandAll | 默认展开全部（**只展开有 children 的节点**） | boolean | false |
| defaultExpandParent | 默认展开父节点（首挂 conductExpandParent 补祖先） | boolean | true |
| autoExpandParent | 展开受控时自动补全祖先 | boolean | false |
| checkable | 勾选（自定义勾选框） | boolean \| VNodeChild | false |
| checkStrictly | 父子独立勾选；事件返回 `{ checked, halfChecked }`，不决定是否受控 | boolean | false |
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
| icon | 节点图标内容；动态内容用 `#icon` | VNodeChild | - |
| switcherIcon | 展开按钮图标内容；动态内容用 `#switcherIcon` | VNodeChild | - |
| switcherLoadingIcon | 加载中图标 | VNodeChild | - |
| blockNode | 节点占满一行 | boolean | false |
| expandAction | 点击/双击节点时触发展开 | false \| 'click' \| 'doubleClick' | false |
| disabled | 整棵树禁用 | boolean | - |
| draggable | 可拖拽 | boolean \| fn \| { nodeDraggable?, icon? } | false |
| allowDrop | 是否允许拖入 | (options) => boolean | () => true |
| height | 虚拟滚动容器高度 | number | - |
| itemHeight | 虚拟列表估算行高，默认 paddingXS/2 + titleHeight | number | - |
| scrollWidth | 横向滚动宽度 | number | - |
| virtual | 虚拟滚动（默认读 ConfigProvider） | boolean | - |
| itemScrollOffset | activeKey 滚动跟随附加偏移 | number | 0 |
| focusable | 可聚焦 | boolean | true |
| activeKey | 键盘活动节点（`v-model:activeKey`，null 清空） | TreeKey \| null | - |
| filterTreeNode | 过滤命中节点（`-filter-node` 类） | (node) => boolean | - |
| tabIndex | 树焦点宿主的 tabindex | number | 0 |
| prefixCls | DOM 类前缀（需配套静态 CSS） | string | apollo-tree |
| classNames / styles | root、item、itemIcon、itemTitle、itemSwitcher 语义区域；支持 `{ props }` 函数 | object \| function | - |
| rootStyle | 根样式（建议使用原生 style） | CSSProperties | - |

### 事件（Emits）

`expandedKeys`、`checkedKeys`、`selectedKeys`、`loadedKeys` 的更新分别同时发送 `update:*` 和 `expand`、`check`、`select`、`load`。`activeKey` 同时发送 `update:activeKey` 和 `activeChange`。

| 事件 | 参数 |
| --- | --- |
| expand | (keys, { node, expanded, nativeEvent: MouseEvent \| KeyboardEvent }) |
| check | (keysOrObject, { event: 'check', node, checked, checkedNodes, checkedNodesPositions?, halfCheckedKeys?, nativeEvent }) |
| select | (keys, { event: 'select', node, selected, selectedNodes, nativeEvent }) |
| load | (keys, { event: 'load', node }) |
| activeChange | (key: TreeKey \| null) |
| click / doubleClick / contextmenu / mouseEnter / mouseLeave | (event: MouseEvent, node) |
| dragStart / dragOver / dragLeave | (event: DragEvent, { node }) |
| dragEnter | (event: DragEvent, { node, expandedKeys }) |
| dragEnd | (event: DragEvent, { node: EventDataNode \| null })；在树外结束时 node 为 null |
| drop | (event: DragEvent, { node, dragNode, dragNodesKeys, dropPosition, dropToGap }) |

受控 prop 的每次更新都是请求；父级拒绝时，当前展示与撤控后的本地状态保留最后接受值。`multiple`、`checkStrictly`、能力与数据变化会重新投影当前键，纯派生不发送用户事件。`defaultExpandParent` 只影响初始化；`autoExpandParent` 是持续生效的祖先补全。

异步加载针对同一节点合并进行中的请求。完成但父级拒绝 `loadedKeys` 时不会自动再次请求；失败会报告警告，可通过下一次展开重试。替换或移除节点、卸载后的旧结果不更新状态。

### Slots

所有作用域均为 `{ node, data }`：node 含规范 key、展开/选择/勾选/加载/拖放状态，data 是原始数据对象（保留 fieldNames 对应字段）。插槽存在即优先，包括空内容。

| 插槽 | 说明 |
| --- | --- |
| title | 节点标题，优先于数据项 title（包括数据标题函数） |
| icon | showIcon 开启时的节点图标，优先于内容 prop 和数据图标 |
| switcherIcon | 可展开节点的展开图标 |
| switcherLoadingIcon | 加载状态的展开图标 |

顶层 `titleRender` 和 icon/switcherIcon 函数已迁移到对应插槽；VNode 内容 prop、数据项 title/icon/switcherIcon 函数及算法/异步回调仍保留。

```vue
<Tree :tree-data="nodes" show-icon>
  <template #title="{ node, data }">{{ data.name }}（{{ node.key }}）</template>
  <template #switcherIcon="{ node }">{{ node.expanded ? '−' : '+' }}</template>
</Tree>
```

### TreeRef（expose）

| 方法 | 说明 |
| --- | --- |
| scrollTo(number \| { key, autoExpand?, offset?, align? } \| null) | 按像素或 key 定位；align 为 top/bottom，省略时只在目标越界时滚动；autoExpand 先请求展开全部祖先 |
| focus() | 聚焦实际树容器 |
| keyEntities | 当前只读实体表，含父子关系；数字 0 与字符串 '0' 使用同一键表示，不能同时使用 |

原生 class/style 落在组件根，语义样式按区域合并；每棵树的节点 id/checkbox 标签关系由组件维护。

### DirectoryTree

`Tree.DirectoryTree` 的对应物：目录树变体（`showIcon=true` / `expandAction='click'` / `blockNode` / File-Folder 图标）；`multiple` 下支持 `shift` / `ctrl`（meta）范围多选，`select` 事件带 `selectedNodes`；完整转发 Tree 的模型、业务及原生事件，显式 false 与自定义图标有效。默认 `defaultExpandAll` 展开全部实体 key（与 Tree 的「只展开有 children」不同）。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| titleHeight | 节点标题高度（number，单位 px） | controlHeightSM（24px） |
| switcherSize | 展开按钮尺寸 | 24px |
| indentSize | 缩进宽度 | 24px |
| nodeHoverBg / nodeHoverColor | 节点悬浮态 | controlItemBgHover / colorText |
| nodeSelectedBg / nodeSelectedColor | 节点选中态 | controlItemBgActive / colorText |
| directoryNodeSelectedColor / directoryNodeSelectedBg | 目录树选中态 | colorTextLightSolid / colorPrimary |
