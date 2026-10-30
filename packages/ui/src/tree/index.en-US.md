---
title: Tree
subtitle: Tree
titleTemplate: '%s - @apollo-design/ui'
description: Hierarchical data display with selection, check, async loading, dragging and virtual scrolling.
---

# Tree

Display hierarchical data with expansion, selection, checking, asynchronous loading, dragging and virtual scrolling. Use `DirectoryTree` for folders.

```ts
import { Tree, DirectoryTree, type TreeProps, type TreeRef } from '@apollo-design/ui';
```

## Props

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| treeData | Data objects; use fieldNames for custom schemas and TreeProps<T> for typed data | object[] | - |
| fieldNames | Key, title and child field names | { key?, title?, children? } | key/title/children |
| expandedKeys | Controlled expansion (`v-model:expandedKeys`) | TreeKey[] | - |
| defaultExpandedKeys | Initial expansion | TreeKey[] | [] |
| defaultExpandAll | Initially expand nodes with children | boolean | false |
| defaultExpandParent | Initially include ancestors | boolean | true |
| autoExpandParent | Reactively include ancestors | boolean | false |
| checkable | Enable checkboxes or provide their content | boolean \| VNodeChild | false |
| checkStrictly | Independent checks; check emits { checked, halfChecked }. This does not determine whether state is controlled | boolean | false |
| checkedKeys | Controlled checks (`v-model:checkedKeys`) | SafeKey[] \| { checked, halfChecked } | - |
| defaultCheckedKeys | Initial checks | SafeKey[] | [] |
| selectable | Enable selection | boolean | true |
| multiple | Allow multiple selections | boolean | false |
| selectedKeys | Controlled selection (`v-model:selectedKeys`) | TreeKey[] | - |
| defaultSelectedKeys | Initial selection | TreeKey[] | [] |
| loadData | Load a node's children | (node) => Promise | - |
| loadedKeys | Controlled loaded state (`v-model:loadedKeys`) | SafeKey[] | - |
| showIcon | Show node icons | boolean | false |
| showLine | Show connecting lines and optional leaf content | boolean \| { showLeafIcon } | false |
| icon | Node icon content; use #icon for dynamic content | VNodeChild | - |
| switcherIcon | Expansion icon content; use #switcherIcon for dynamic content | VNodeChild | - |
| switcherLoadingIcon | Loading icon content | VNodeChild | - |
| blockNode | Fill each row | boolean | false |
| expandAction | Expand when clicking or double clicking a title | false \| 'click' \| 'doubleClick' | false |
| disabled | Disable the tree | boolean | inherited |
| draggable | Enable dragging, optionally per node | boolean \| predicate \| { nodeDraggable?, icon? } | false |
| allowDrop | Decide whether a computed position is allowed | ({ dragNode, dropNode, dropPosition }) => boolean | () => true |
| height | Virtual viewport height | number | - |
| itemHeight | Estimated row height; defaults to paddingXS/2 + titleHeight | number | derived |
| scrollWidth | Horizontal content width | number | - |
| virtual | Enable virtualization; inherits ConfigProvider | boolean | true |
| itemScrollOffset | Offset when following the active node | number | 0 |
| focusable | Allow tree focus | boolean | true |
| activeKey | Active node (`v-model:activeKey`); null clears | TreeKey \| null | - |
| tabIndex | Tree focus host tabindex | number | 0 |
| filterTreeNode | Mark matching nodes with the filter-node class | (node) => boolean | - |
| prefixCls | DOM class prefix; requires matching static CSS | string | apollo-tree |
| classNames / styles | root, item, itemIcon, itemTitle, itemSwitcher; object or { props } callback | object \| function | - |
| rootStyle | Root styles; native style is preferred | CSSProperties | - |

Controlled updates are proposals. Rejected proposals affect neither the current view nor the last accepted state retained when control is removed. Changes to data, multiple, checkStrictly and node capabilities reproject accepted keys without emitting user changes. `defaultExpandParent` applies once; `autoExpandParent` remains reactive.

Loads are deduplicated while pending. Refusing a successful loadedKeys proposal does not automatically repeat the request. Failure reports a warning; a subsequent expansion can retry. Results from replaced or removed nodes and unmounted trees are ignored.

## Events

`expandedKeys`, `checkedKeys`, `selectedKeys` and `loadedKeys` emit both `update:*` and their semantic event. `activeKey` emits `update:activeKey` and `activeChange`.

| Event | Arguments |
| --- | --- |
| expand | (keys, { node, expanded, nativeEvent: MouseEvent \| KeyboardEvent }) |
| check | (keysOrObject, { event: 'check', node, checked, checkedNodes, checkedNodesPositions?, halfCheckedKeys?, nativeEvent }) |
| select | (keys, { event: 'select', node, selected, selectedNodes, nativeEvent }) |
| load | (keys, { event: 'load', node }) |
| activeChange | (key: TreeKey \| null) |
| click / doubleClick / contextmenu / mouseEnter / mouseLeave | (event: MouseEvent, node) |
| dragStart / dragOver / dragLeave | (event: DragEvent, { node }) |
| dragEnter | (event: DragEvent, { node, expandedKeys }) |
| dragEnd | (event: DragEvent, { node: EventDataNode \| null }); null when ended outside the tree |
| drop | (event: DragEvent, { node, dragNode, dragNodesKeys, dropPosition, dropToGap }) |

## Slots

Each slot receives `{ node, data }`: node contains the normalized key and current state; data is the original object, retaining mapped fields. A present slot takes priority even when it returns empty content.

| Slot | Description |
| --- | --- |
| title | Title, ahead of data title and data title functions |
| icon | Icon when showIcon is enabled, ahead of content props and data icons |
| switcherIcon | Expansion icon for expandable nodes |
| switcherLoadingIcon | Expansion icon while loading |

Top-level titleRender and icon/switcherIcon functions have moved to these slots. VNode content props, data-item title/icon/switcherIcon functions and algorithm/asynchronous callbacks remain supported. `<TreeNode>` children are unsupported; use treeData.

## TreeRef

| Member | Description |
| --- | --- |
| scrollTo(number \| { key, autoExpand?, offset?, align? } \| null) | Scroll by pixels or key; align is top/bottom. Without align, scroll only if needed. autoExpand requests all ancestors before scrolling. |
| focus() | Focus the actual tree container |
| keyEntities | Current read-only entity table. Numeric 0 and string '0' share one key representation and must not coexist. |

Native class/style land on the root. Semantic styles merge at their named region. The component owns node ids and checkbox labels for each tree instance.

## DirectoryTree

Also available as `Tree.DirectoryTree`. Defaults to showIcon=true, expandAction='click' and blockNode=true, with file/folder icons. Explicit false values and custom icons are honored. Multiple selection supports Shift ranges and Ctrl/Meta toggling. All Tree model, semantic and native events are forwarded, with the same controlled boundaries. defaultExpandAll includes every entity key. DirectoryTree does not declare a separate ref API.

## Component tokens

All values follow the current theme and can be overridden through `components.Tree`. Dimensions accept numbers in pixels.

| Token | Default |
| --- | --- |
| titleHeight | controlHeightSM (24px) |
| switcherSize | controlHeightSM |
| indentSize | controlHeightSM |
| nodeHoverBg | controlItemBgHover |
| nodeHoverColor | colorText |
| nodeSelectedBg | controlItemBgActive |
| nodeSelectedColor | colorText |
| directoryNodeSelectedBg | colorPrimary |
| directoryNodeSelectedColor | colorTextLightSolid |

Examples for expansion, checks, folders, async loading, dragging, virtual scrolling, imperative scrolling and all nine tokens are linked in [the example catalog](./index.zh-CN.md#代码演示).
