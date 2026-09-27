---
category: Data Display
title: Descriptions
subtitle: 描述列表
---

Display multiple read-only fields in groups.

## When To Use

- Detail pages with paired label/content fields.
- Need bordered / vertical / responsive column layouts.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| bordered | Bordered mode (th/td split cells) | `boolean` | `false` |
| size | ⚠️ `'default'` deprecated (use `'large'`) | `'large' \| 'medium' \| 'small' \| 'default' \| 'middle'` | `'large'` |
| column | Column count (number or responsive map) | `number \| Partial<Record<Breakpoint, number>>` | `{xs:1, sm:2, md+ :3}` |
| layout | `'horizontal' \| 'vertical'` | — | `'horizontal'` |
| colon | Label colon (CSS ::after) | `boolean` | `true` |
| title | Title (text; rich title via `#title` slot, slot first) | `string` | — |
| extra | Extra content (⚠️ moved to `#extra` slot; empty slot = hidden) | `slot` | — |
| items | Item list (preferred) | `DescriptionsItemType[]` | — |
| classNames / styles | Semantic slots `{ root, header, title, extra, label, content }` (object or function) | — | — |

### Slots (C8-R2)

| Slot | Description | Arguments |
|---|---|---|
| title | Rich title (equivalent to the `title` text prop, slot first) | — |
| extra | Extra content (empty slot = hidden) | — |

### Ref

`{ nativeElement: HTMLDivElement \| null }`

### Compound

`Descriptions.Item` / named `DescriptionsItem` (children form, ⚠️ deprecated in antd but supported).

## Theme (Component Token)

10 tokens aligned with antd: `labelBg`, `labelColor`, `titleColor`, `titleMarginBottom`,
`itemPaddingBottom`, `itemPaddingEnd`, `colonMarginRight`, `colonMarginLeft`,
`contentColor`, `extraColor` (CSS variables `--apollo-descriptions-*`).

## FAQ

**What is the label colSpan in bordered mode?**
Label is always 1; content is `span*2-1`. In plain/vertical mode both use the item span
(with row-end fill expanding the last one).
