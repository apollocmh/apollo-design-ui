---
title: Transfer
subtitle: Transfer
titleTemplate: '%s - @apollo-design/ui'
description: Double-column transfer list for moving items between two groups.
---

# Transfer

Double-column transfer list.

## When to use

- Moving items between two groups with batch operations (select all / invert / per-page);
- Filtering or paginating large candidate lists;
- One-way shipping of items to a target list.

## Import

```ts
import { Transfer } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### Search

<code src="./demo/search.vue"></code>

### One way

<code src="./demo/oneway.vue"></code>

### Advanced

<code src="./demo/advanced.vue"></code>

### Pagination

<code src="./demo/pagination.vue"></code>

### Custom item

<code src="./demo/custom-item.vue"></code>

### Status

<code src="./demo/status.vue"></code>

### Custom select all labels

<code src="./demo/custom-select-all-labels.vue"></code>
<code src="./demo/tree-transfer.vue"></code>

<code src="./demo/table-transfer.vue"></code>

## API

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| dataSource | Data source, items must contain `key` | `TransferItem[]` | `[]` |
| targetKeys (`v-model:targetKeys`) | Target keys; controlled when provided, otherwise maintained internally | `TransferKey[]` | `[]` |
| selectedKeys (`v-model:selectedKeys`) | Checked keys; controlled when provided, otherwise maintained internally | `TransferKey[]` | - |
| titles | Titles of both lists | `VNodeChild[]` | `['', '']` |
| actions | Custom action texts `[toRight, toLeft]` | `VNodeChild[]` | arrows |
| disabled | Disable the whole component | `boolean` | `false` |
| showSearch | Show the search input | `boolean \| object` | `false` |
| showSelectAll | Show the select-all area in headers | `boolean` | `true` |
| oneWay | Hide the "move to left" action; right list renders remove buttons | `boolean` | `false` |
| pagination | Paginate the list body | `boolean \| object` | - |
| status | Validation status | `'error' \| 'warning'` | - |
| filterOption | Custom filter | `(inputValue, item, direction) => boolean` | text includes |
| rowKey | Key getter | `(record) => TransferKey` | `record.key` |
| selectAllLabels | Per-direction header labels | `[VNodeChild?, VNodeChild?]` | count text |

### Slots

| Name | Scope | Default |
| --- | --- | --- |
| item | `{ item, direction, selected, disabled }` | Data `title`, falling back to `key` for non-text titles |
| footer | `{ direction, selectedKeys, totalCount }` | No footer; count includes all items on that side |
| list | `{ direction, filteredItems, selectedKeys, disabled, onItemSelect, onItemSelectAll, onItemRemove, onScroll }` | Default list; internal pagination is disabled for a custom list |
| selectAllLabel | `{ direction, selectedCount, totalCount }` | Static `selectAllLabels` or default counts, based on filtered items |

Slots are read during rendering and support conditional insertion/removal. An explicitly empty slot stays empty. `direction` always denotes the data side (`left/right`), including RTL. Rich item content does not determine search text: search, row titles and checkbox names use data `title/key`; use `filterOption` for additional fields.

`onItemSelect(key, selected)` selects one item; `onItemSelectAll(keys, selected)` accepts `true`, `false` or `'replace'`. Selection callbacks exclude disabled and unlisted keys. `onItemRemove(keys)` removes items from the one-way right panel; `onScroll(event)` forwards scrolling. Custom controls should also bind `disabled`.

The current development version removes `render`, `footer`, `renderList` / `children` props and function entries in `selectAllLabels` directly. Use slots; there is no compatibility layer or deprecation period. See `docs/migrations/transfer-slots.md` (ADR 0006).

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| update:targetKeys | Request target keys for `v-model:targetKeys` | `(targetKeys)` |
| update:selectedKeys | Request checked keys for `v-model:selectedKeys` | `(selectedKeys)` |
| change | Request a move; controlled state follows the parent acceptance | `(targetKeys, direction, moveKeys)` |
| selectChange | Checked keys change | `(sourceSelectedKeys, targetSelectedKeys)` |
| search | Search value change (including clear) | `(direction, value)` |
| scroll | List scroll | `(direction, event)` |

Notifications use Vue emits, including listener arrays, without native fallthrough. Removing a controlled prop retains the last accepted state. Shift selection uses enabled items in the current filtered view and identifies its anchor by key after reordering.

### Refs and native attributes

`TransferRef.nativeElement` is the current root `HTMLElement`, or `null` after unmounting. `focus(options?: FocusOptions)` focuses the first enabled control in this instance; `blur()` only blurs a control within this instance. Native class/style/id/data attributes belong to the root. Native style accepts Vue objects, strings and arrays; semantic node styles use `CSSProperties`. Lengths retain explicit units; unitless properties such as opacity accept numbers, following native Vue styles.

### Statics

`Transfer.List` / `Transfer.Search` / `Transfer.Operation` (also exported as `TransferList` / `TransferSearch` / `TransferOperation`).

Static members and named exports have the same types. Search supports `v-model:value`, `@change` and `@clear`; replace `handleClear` with `@clear`. Operation uses `@move-to-right` / `@move-to-left`, directly replacing the `moveToRight/moveToLeft` callback props. List uses Vue filter/clear/selection/removal events; replace `handleFilter/handleClear` with `@filter/@clear`.

Text, icons and ordinary action content stay inside an owned button. Actual custom buttons retain Vue key/ref/directives and listener arrays. Header menus use named native buttons and support Enter.

### Current component tokens

Configure `listWidth`, `listHeight`, `listWidthLG`, `headerHeight`, `itemHeight`, `itemPaddingBlock` and `transferHeaderVerticalPadding` through `ConfigProvider.theme.components.Transfer`. Numeric lengths use px; CSS strings are preserved. Replacement, nesting and removal update current derived values. Native and semantic styles retain priority; `listStyle` stays below `styles.section`.
