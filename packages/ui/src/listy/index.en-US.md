---
category: Data Display
title: Listy
subtitle: Lightweight list
---

A data-driven list with grouping, native sticky headers and optional virtualization. Item content can contain native interactive controls.

## API

`T` is the actual item type, including plain interfaces and primitive values. `K extends string | number` is the group key type.

| Prop | Description | Type | Default |
|---|---|---|---|
| items | Data; omitted means an empty list | `T[]` | `[]` |
| rowKey | Stable key algorithm or a field whose complete value is string/number; numeric and Symbol field names work | `ListyRowKey<T>` | required |
| group | Aggregate by key, ordered by first occurrence; matching items need not be contiguous | `{ key: (item: T) => K }` | — |
| sticky | Native unique Raw headers or fixed Virtual headers | `boolean` | — |
| virtual | Inherits the current ConfigProvider.virtual when omitted | `boolean` | `false` |
| height | Raw maxHeight or Virtual viewport height | `number` | — |
| prefixCls | Component class prefix | `string` | current ConfigProvider prefix |
| classNames | Semantic classes for root, item and groupHeader | `ListyClassNames` | — |
| styles | Semantic Vue CSSProperties | `ListyStyles` | — |

Direction follows the current ConfigProvider.direction. Native class/style/data attributes belong to the outer root; style accepts Vue strings, objects and arrays. The id, tabindex, role, aria-* attributes, keyboard and focus listeners belong to the actual scrolling widget: the root in Raw mode and the holder in Virtual mode. Widget identity and ARIA share one target without duplication on the outer container. The height prop controls the viewport.

### Slots

| Name | Object scope | Purpose |
|---|---|---|
| default | `{ item: T, index: number }` | Item content; index always refers to the original items array |
| groupHeader | `{ groupKey: K, items: T[], sticky: boolean, fixed: boolean }` | Shared group template; omitted means the group key itself, including 0 or an empty string |

Zero, empty content, arrays and conditional slots are supported. An enabled Raw sticky header has sticky=true/fixed=false; ordinary Virtual headers have false/false and fixed copies have false/true. Raw rows preserve their actual node, editor state and focus across replacement, reorder and regrouping with the same key. Virtual rows preserve identity while they remain in the mounted window; offscreen rows unmount normally.

### Events

| Name | Arguments | Description |
|---|---|---|
| scroll | `(event: Event)` | One owned notification with the actual native holder event |

No synthetic event is created. Native scrolling keys, IME, user preventDefault and controls inside slots retain browser behavior.

### Ref

`ListyRef<K>` exposes only `scrollTo(config?: ListyScrollToConfig<K>): void`:

- A number sets this list's scrollTop.
- `{ key, align?, offset? }` targets an item. Align is top/bottom/auto and defaults to auto. Top alignment accounts for the sticky group header.
- `{ groupKey: K, align?, offset? }` targets a group.
- `{ left?, top? }` sets this list's scroll coordinates.
- Null/undefined specifies no new target.

Raw scrolling changes only its own holder, without scrollIntoView moving ancestor containers or the page. Virtual scrolling reuses VirtualList measurement and iteration. Numeric/string keys and group/item keys have distinct internal tags; do not parse data-key values.

## Theme

Current Provider Listy configuration and both Component Tokens react to updates and withdrawal: itemPaddingBlock (paddingSM) and itemPaddingInline (padding). Both accept numbers or CSS length strings.

Virtual's initial estimate uses the current fontHeight plus twice itemPaddingBlock. Numeric and px values are used directly; other CSS units initially use current paddingSM and are corrected by existing VirtualList DOM measurement. No additional virtualization or measurement layer is introduced.

## Migration

Replace itemRender(item,index) with `#default="{ item, index }"`, and group.title(groupKey,items) with `#groupHeader="{ groupKey, items }"`. Keep group.key as the data grouping algorithm. The old template callback props have been removed.
