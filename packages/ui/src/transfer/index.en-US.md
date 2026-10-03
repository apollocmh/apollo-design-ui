---
title: Transfer
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
| render | Item renderer; `{ label, value }` enables search by value | `(item) => VNodeChild \| { label?, value? }` | - |
| footer | Panel footer renderer | `(props, { direction }) => VNodeChild` | - |
| filterOption | Custom filter | `(inputValue, item, direction) => boolean` | text includes |
| rowKey | Key getter | `(record) => TransferKey` | `record.key` |
| selectAllLabels | Per-direction header labels | `[SelectAllLabel?, SelectAllLabel?]` | count text |

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| change | Fires after moving | `(targetKeys, direction, moveKeys)` |
| selectChange | Checked keys change | `(sourceSelectedKeys, targetSelectedKeys)` |
| search | Search value change (including clear) | `(direction, value)` |
| scroll | List scroll | `(direction, event)` |

### Statics

`Transfer.List` / `Transfer.Search` / `Transfer.Operation` (also exported as `TransferList` / `TransferSearch` / `TransferOperation`).
