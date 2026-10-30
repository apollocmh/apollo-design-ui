---
title: TreeSelect
subtitle: Tree select
titleTemplate: '%s - @apollo-design/ui'
description: Hierarchical selection with native Vue models, events and slots.
---

# TreeSelect

Select hierarchical data with single or multiple values, check conduction, filtering, async loading and virtual scrolling. Each node value also serves as its tree key.

## Props

| Prop | Contract | Default |
| --- | --- | --- |
| value / defaultValue | TreeSelectValue; a scalar for single selection, an array for multiple selection, labeled objects with labelInValue | - |
| treeData / fieldNames | TreeSelectDataNode[] and optional value/label/children field mapping | [] |
| multiple / treeCheckable / treeCheckStrictly | Multiple selection, cascading checks, or independent checks; strict checks retain halfChecked metadata and enable labelInValue | false |
| showCheckedStrategy / maxCount | SHOW_ALL, SHOW_PARENT or SHOW_CHILD; maxCount is ignored for SHOW_PARENT and non-strict SHOW_ALL | SHOW_CHILD for checks, otherwise SHOW_ALL |
| treeDataSimpleMode | Build a tree from flat data; optional id/pId/rootPId mapping | false |
| loadData | (node) => Promise<unknown>; a business service, disabled during search | - |
| treeExpandedKeys / treeDefaultExpandedKeys / treeDefaultExpandAll | Controlled/default expansion and initial expand-all | - / - / false |
| treeLoadedKeys | Controlled loaded keys | - |
| treeExpandAction / treeLine | Content-click expansion and connector lines | false |
| treeIcon / showTreeIcon / switcherIcon | Node-data icons, visibility and a static switcher icon; use slots for stateful rendering | - |
| showSearch / searchValue | boolean or SearchConfig; search state belongs to the top-level model | false / '' |
| filterTreeNode / treeNodeFilterProp / autoClearSearchValue | Filtering and clearing algorithms; values in the showSearch object take precedence | Match value / true |
| treeNodeLabelProp / labelInValue | Selected-label field and labeled value shape | title or label / false |
| placeholder / notFoundContent / suffixIcon / clearIcon / removeIcon | Static VNodeChild content; the corresponding slot takes priority | - |
| allowClear | boolean or { clearIcon, label } | false |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | Tag limits and static overflow content | - |
| disabled / loading / size / status / variant | Current disabled, loading, size, validation and appearance settings | Inherited where applicable |
| open / defaultOpen / placement / direction | Controlled/default popup state, placement and direction | false / bottomLeft / ltr |
| getPopupContainer / popupMatchSelectWidth | Container and width; false also disables virtualization | Inherited / true |
| listHeight / listItemHeight / virtual | List height, row height and virtualization; default row height follows the current Tree tokens | 256 / 28 / true |
| classNames / styles | Semantic objects or ({ props }) => objects, receiving current TreeSelectProps | - |
| id / tabIndex / autoFocus / maxLength | Native input identity, focus and input limit | - |

The five states support `v-model:value`, `v-model:open`, `v-model:searchValue`, `v-model:treeExpandedKeys` and `v-model:treeLoadedKeys`. A rejected controlled request preserves accepted state; releasing control keeps the last accepted value.

Native class/style reach the trigger once and remain current, including removal. aria-label/aria-labelledby target the real combobox input. Other native attrs/listeners follow BaseSelect's root contract. The default slot accepts one native button or a component that forwards native attrs as a custom trigger.

Existing aliases bordered, dropdownMatchSelectWidth, popupClassName and dropdownClassName remain available. Prefer variant, popupMatchSelectWidth and semantic popup.root styles. popupStyle remains an explicit popup style input.

## Events

| Event | Payload |
| --- | --- |
| change / update:value | change(value, labels, extra); update:value(value). labels is null with labelInValue. extra includes preValue, triggerValue and checked/selected |
| select / deselect | (rawValue, dataNode) |
| openChange / update:open | (open: boolean) |
| search / update:searchValue | (text: string); search reports input actions, automatic clearing updates only the model |
| treeExpand / update:treeExpandedKeys | (keys) |
| treeLoad / update:treeLoadedKeys | (keys) |
| clear | No payload |
| popupScroll / focus / blur / inputKeyDown | Native Event / FocusEvent / FocusEvent / KeyboardEvent |

Listening to change never changes the model shape. Historical triggerNode/allCheckedNodes data getters retain their deprecation warnings. Use openChange instead of the removed popup/dropdown visibility notification aliases.

## Slots

| Slot | Scope |
| --- | --- |
| default | One custom trigger |
| treeTitleRender | { node: TreeSelectDataNode }, for tree titles and selected labels |
| treeIcon / switcherIcon / switcherLoadingIcon | { node, data }, with current runtime state and original data |
| tagRender | { label, value, disabled, closable, onClose, isMaxTag } |
| popupRender | { menu } |
| maxTagPlaceholder | { omittedValues } |
| suffixIcon | { searchValue, open, focused, showSearch, loading } |
| prefix / placeholder / notFoundContent / clearIcon / removeIcon / loadingIcon | No scope |

Slots are read during render; their presence takes priority, including an empty result or numeric 0. Migrate top-level treeTitleRender, tagRender and popupRender/dropdownRender function props to slots; migrate switcherIcon functions to its slot. This development migration has no compatibility channel or deprecation period. Node-data title/icon functions, filter algorithms and async loadData services retain their business roles.

## Ref

TreeSelectRef exposes focus(options?: FocusOptions), blur(), scrollTo(number | { key, align?, offset?, autoExpand? } | null) and the current nativeElement: HTMLElement | null property. The property replaces the old nativeElement() method.

## Configuration and theme

Current components.treeSelect presentation settings provide className/style, semantic classNames/styles, showSearch/allowClear and static icons. Replacement and removal remain reactive. Global direction, container, size, disabled, variant and virtual settings retain their separate responsibilities.

There is no independent TreeSelect token entry. Tree nodes share the current nine components.Tree tokens; the selector shares current components.Select tokens. Variables accompany both the trigger and teleported popup. Explicit listItemHeight wins; otherwise rows follow Tree titleHeight and padding. Popup layering retains parent-context rules, and explicit popupStyle or semantic popup.root zIndex preserves 0.

SHOW_ALL, SHOW_PARENT and SHOW_CHILD are available as named exports and TreeSelect static properties. The deprecated TreeSelect.TreeNode children-data form is not supported.
