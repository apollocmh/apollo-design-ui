---
title: Cascader
subtitle: Cascading selection
titleTemplate: '%s - @apollo-design/ui'
description: Select typed paths from hierarchical data.
---

# Cascader

Select paths from hierarchical data, with multiple selection, search and lazy loading. The floating Cascader and standalone CascaderPanel share their value and checking rules.

```ts
import { Cascader, CascaderPanel } from '@apollo-design/ui';
import type { CascaderOutputValue } from '@apollo-design/ui';
```

<code src="./demo/basic.vue"></code>
<code src="./demo/multiple.vue"></code>
<code src="./demo/search.vue"></code>
<code src="./demo/change-on-select.vue"></code>
<code src="./demo/panel.vue"></code>
<code src="./demo/custom-render.vue"></code>
<code src="./demo/render-panel.vue"></code>

## Props

`ValueCell = (string | number)[]`. Single selection emits a ValueCell; multiple selection emits ValueCell[]. Clearing emits `[]` for both the value and selected options. Numeric `0`, string `'0'`, and strings containing separators remain distinct. Missing controlled paths display their original values until matching options arrive.

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| options | Hierarchical data; values are unique among siblings | BaseOptionType[] | [] |
| value / defaultValue | Current / initial uncontrolled value; a scalar represents one path segment | CascaderValue | - |
| multiple / checkable | Enable multiple selection; checkable only enables it when true | boolean | false |
| fieldNames | Reactive label/value/children field mapping | FieldNames | Standard names |
| changeOnSelect | Allow selecting intermediate nodes in single mode | boolean | false |
| showCheckedStrategy | Deduplicate displayed tags and emitted paths without changing checked descendants | SHOW_PARENT \| SHOW_CHILD | SHOW_PARENT |
| showSearch | Enable search; configure filter, sort, limit, matchInputWidth and autoClearSearchValue | boolean \| CascaderSearchConfig | false in single mode; true in multiple mode |
| searchValue / autoClearSearchValue | Search text / clear after selection; the search config takes precedence | string / boolean | '' / true |
| loadData | Load a non-leaf path without children. Pending requests deduplicate; Promise settlement clears loading and rejection reaches Vue’s error handler | (selectedOptions) => void \| Promise&lt;void&gt; | - |
| expandTrigger | Pointer expansion; keyboard also supports arrows, Enter, Escape and multiple-mode Space | 'click' \| 'hover' | 'click' |
| open / defaultOpen | Current / initial uncontrolled popup visibility | boolean | false |
| size / disabled / loading / status | Size, disabled state, loading icon and form status | SizeType / boolean / boolean / 'error' \| 'warning' | - |
| variant / bordered | outlined, borderless, filled or underlined; bordered applies when variant is omitted | SelectVariant / boolean | outlined / true |
| placeholder / notFoundContent | Static placeholder / empty content; corresponding slots take precedence, including empty slots | VNodeChild | - / 'Not Found' |
| allowClear / clearIcon / removeIcon / suffixIcon | Clear control and static icons | boolean \| { clearIcon? } / VNodeChild | true |
| expandIcon / loadingIcon | Static row icons; corresponding scoped slots take precedence | VNodeChild | Direction / loading icon |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | Tag count, text length and static overflow content | number / number / VNodeChild | - |
| placement / direction | Popup placement and text direction; direction inherits the current ConfigProvider | SelectCommonPlacement / 'ltr' \| 'rtl' | bottomLeft / 'ltr' |
| popupClassName / dropdownClassName | Popup class; popupClassName takes precedence | string | - |
| popupStyle / popupMenuColumnStyle | Popup root / individual menu column ul styles | CSSProperties | - |
| popupMatchSelectWidth | Match the trigger width | boolean \| number | false |
| getPopupContainer | Popup container, inherited from the current ConfigProvider when omitted | (node) => HTMLElement | - |
| classNames / styles | Semantic objects or `({ props }) => object` | CascaderSemanticClassNames / CascaderSemanticStyles | - |
| id / prefixCls | Input ID / component prefix | string | Generated / apollo-cascader |

Native class/style/attrs reach the actual trigger. aria-label and aria-labelledby reach the input. Semantic targets are root, prefix, suffix, input, placeholder, content, item, itemContent, itemRemove, clear, and popup.root/list/listItem. Provider, semantic root styles and native root styles merge in that order.

## Slots

Slots preserve complete Vue content, including text, zero, multiple nodes and conditional presence.

| Slot | Scope | Purpose |
| --- | --- | --- |
| default | - | Complete custom trigger content |
| displayRender | { labels, selectedOptions } | Selected path content; defaults to slash-separated paths in single mode and the last segment in multiple mode |
| optionRender | { option, pathOptions } | Ordinary option content |
| searchRender | { inputValue, pathOptions, fieldNames } | Search result content |
| popupRender | { menu: VNode } | Wrap the bound menu using `<component :is="menu" />`, preserving its state and events |
| expandIcon / loadingIcon | { option } | Per-option icons |
| suffixIcon / searchIcon | { focused, open, searchValue, showSearch, loading } | Suffix / focused search icon |
| maxTagPlaceholder | { omittedValues: { value: ValueCell, label, disabled? }[] } | Overflow tag content |
| placeholder / notFoundContent / clearIcon / removeIcon | - | Corresponding content |

## Emits and models

| Event | Payload |
| --- | --- |
| update:value | value: CascaderOutputValue |
| change | value: CascaderOutputValue, selectedOptions: CascaderSelectedOptions |
| update:open / openChange | open: boolean |
| update:searchValue / search | text: string |
| focus / blur | FocusEvent |
| clear | None |
| popupScroll | Event |
| keydown / keyup / mousedown | Corresponding native event |

Use v-model:value, v-model:open and v-model:searchValue. Controlled updates remain proposals until accepted by the parent. Releasing control with undefined retains the last received value. Vue Emits deliver owned notifications exactly once, including listener arrays.

## Ref and Panel

The selector ref exposes `nativeElement: HTMLElement | null`, `focus(options?: FocusOptions)` and `blur()`.

CascaderPanel / Cascader.Panel contains only menu columns. It supports options, value/defaultValue, multiple, fieldNames, changeOnSelect, showCheckedStrategy, loadData, expandTrigger, expandIcon, loadingIcon, direction, disabled, notFoundContent, popupMenuColumnStyle and classNames/styles. It emits update:value/change and accepts optionRender/searchRender/expandIcon/loadingIcon/notFoundContent slots. Native attrs reach its focusable root; keyboard navigation uses the same OptionList.

Cascader.SHOW_PARENT and Cascader.SHOW_CHILD expose the strategy constants. The internal alias `_InternalPanelDoNotUseOrYouWillBeFired` still points to Panel (historical D113).

## Development migration and theme

Function props displayRender, optionRender and popupRender become their named scoped slots. showSearch.render becomes #searchRender; nested searchValue/onSearch become the top-level model and @search. Function maxTagPlaceholder and icon functions become slots. Inactive trigger/placeholder2 and duplicate popupVisibleChange/dropdownVisibleChange notifications are removed.

All eight Cascader tokens update on the trigger, teleported popup and Panel: controlWidth(184), controlItemWidth(111), dropdownHeight(180), optionSelectedBg, optionSelectedFontWeight, optionPadding, menuPadding and optionSelectedColor. Select-specific component overrides do not change Cascader ownership.
