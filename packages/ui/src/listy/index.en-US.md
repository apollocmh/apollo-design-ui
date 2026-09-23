---
category: Data Display
title: Listy
subtitle: 轻量列表
---

Lightweight list: data-driven rendering, optional grouping (sticky headers) and
optional virtual scrolling. New in antd v6.

## When To Use

- Large lightweight read-only lists (enable `virtual` for long data).
- Group items by `group.key` with sticky group headers.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| items | Data array | `T[]` | `[]` |
| rowKey | Row key (field name or function) | `keyof T \| ((item) => Key)` | required |
| group | `{ key: (item)=>K; title: (groupKey, items)=>VNodeChild }` | — | — |
| sticky | Sticky group headers | `boolean` | — |
| virtual | Virtual scrolling (⚠️ antd default `false`) | `boolean` | `false` |
| height | Container height | `number` | — |
| classNames / styles | Semantic slots `{ root, item, groupHeader }` (object or function) | — | — |

> ⚠️ `direction` is **not** a public prop (omitted in antd) — use ConfigProvider.
>
> Item content: default slot (`{ item, index }`) or `itemRender` prop.

### Ref

`{ scrollTo(config?: ListyScrollToConfig) }` — number / `{ key, align, offset }` /
`{ groupKey, ... }` / `{ left, top }` / `null`.

## Theme (Component Token)

2 tokens aligned with antd: `itemPaddingBlock` (= `paddingSM`), `itemPaddingInline`
(= `padding`), exposed as CSS variables `--apollo-listy-*`.
