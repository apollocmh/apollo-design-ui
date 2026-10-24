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
| targetKeys | Keys shown in the right (target) list | `TransferKey[]` | `[]` |
| selectedKeys | Controlled checked keys | `TransferKey[]` | - |
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
| change | Fires after moving | `(targetKeys, direction, moveKeys)` |
| selectChange | Checked keys change | `(sourceSelectedKeys, targetSelectedKeys)` |
| search | Search value change (including clear) | `(direction, value)` |
| scroll | List scroll | `(direction, event)` |

### Statics

`Transfer.List` / `Transfer.Search` / `Transfer.Operation` (also exported as `TransferList` / `TransferSearch` / `TransferOperation`).
