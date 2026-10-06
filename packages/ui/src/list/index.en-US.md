---
category: Data Display
title: List
subtitle: List
---

General list.

> 🚨 **`List` is deprecated by antd**: since `antd` 6.6.4, use [`Listy`](./listy) instead
> (`List` will be removed in the next major version). This library still implements it and
> keeps the same `console.error` warning (precedent: `Dropdown.Button`) so existing code
> can migrate smoothly.

## When To Use

- To display a group of homogeneous data (news, users, search results);
- When you need pagination, grid layout, or vertical media-style items.

## Examples

See [`demo/`](./demo) (**8**, mirroring antd's user-visible demos).

| demo | Description |
|---|---|
| `basic` | Basic list (`Item.Meta` with avatar / title / description) |
| `simple` | Three sizes with header / footer / border |
| `vertical` | `itemLayout="vertical"` two-段 layout + `actions` + pagination |
| `grid` | Grid layout via `grid.column` |
| `responsive` | Responsive columns via `grid` breakpoints |
| `loadmore` | `loadMore` replaces the bottom pagination |
| `pagination` | `position: 'both'` (top + bottom) |
| `spin-debug` | The two `loading` shapes |

⚠️ **8 antd demos are not ported** (see `README.md` §5): `component-token`
(zero-runtime: tokens are build-time artifacts), `drag-sorting` / `drag-sorting-handler` /
`grid-drag-sorting` / `grid-drag-sorting-handler` (require `dnd-kit`), `infinite-load`,
`virtual-list` (covered by `Listy`), `grid-test` (internal debug demo).

## API

### List

| Property | Description | Type | Default |
|---|---|---|---|
| bordered | Toggles rendering of the border around the list | `boolean` | `false` |
| dataSource | Data source | `T[]` | — |
| extra | Content on the far right of the list | `VNodeChild` | — |
| grid | Grid config (`gutter` / `column` / `xs`…`xxxl`) | `ListGridType` | — |
| id | Root element id | `string` | — |
| itemLayout | Item layout | `'horizontal' \| 'vertical'` | `'horizontal'` |
| loading | Loading state. ⚠️ **with a non-empty `dataSource` the list itself renders** (the 53px placeholder only shows when the data is empty) | `boolean \| SpinProps` | `false` |
| loadMore | Load-more content (**replaces** the bottom pagination) | `VNodeChild` | — |
| pagination | Pagination config; `false` renders nothing | `PaginationConfig \| false` | `false` |
| rowKey | Row key (function or field name) | `((item: T) => string \| number) \| keyof T` | — |
| renderItem | Per-item renderer. ⚠️ **when omitted the item renders as `null`** | `(item: T, index: number) => VNodeChild` | — |
| size | Size. `'large'` / `'small'` add `-lg` / `-sm`; `'default'` adds nothing | `'small' \| 'default' \| 'large'` | — |
| split | Toggles rendering of the split under each item | `boolean` | `true` |
| header | List header | `VNodeChild` | — |
| footer | List footer | `VNodeChild` | — |
| locale | Empty text override (**plain prop**) | `{ emptyText: VNodeChild }` | — |
| prefixCls | Class name prefix | | — |
| class / style | **Native root attrs** (not Props) | | — |

### List.Item

| Property | Description | Type |
|---|---|---|
| actions | Action area. One `<li>` each, with separators between. ⚠️ **an empty array renders nothing** | `VNodeChild[]` |
| extra | Extra content. With `itemLayout="vertical"` it takes the whole `-item-extra` slot | `VNodeChild` |
| classNames | Semantic class names (`actions` / `extra`) | `{ actions?: string; extra?: string }` |
| styles | Semantic styles (same slots) | `{ actions?: CSSProperties; extra?: CSSProperties }` |
| colStyle | Inline style of the grid `Col` (passed by `List`) | `CSSProperties` |

### List.Item.Meta

| Property | Description | Type |
|---|---|---|
| avatar | Avatar | `VNodeChild` |
| title | Title (rendered as `<h4>`) | `VNodeChild` |
| description | Description | `VNodeChild` |

### Instance (ref)

All three components expose `{ nativeElement }` (`HTMLDivElement`, nullable).

## Theme

### Component Token (11)

| Token | Description | Default |
|---|---|---|
| `contentWidth` | Width of content | `220` |
| `itemPadding` / `itemPaddingSM` / `itemPaddingLG` | Item padding (three sizes) | `${paddingContentVertical} 0` / `${paddingContentVerticalSM} ${paddingContentHorizontal}` / `${paddingContentVerticalLG} ${paddingContentHorizontalLG}` |
| `headerBg` / `footerBg` | Header / footer background | `transparent` |
| `emptyTextPadding` | Padding of the empty text | `padding` |
| `metaMarginBottom` | Margin bottom of meta | `padding` |
| `avatarMarginRight` | Right margin of avatar | `padding` |
| `titleMarginBottom` | Margin bottom of title | `paddingSM` |
| `descriptionFontSize` | Font size of description | `fontSize` |

Tune at runtime via CSS variables: `--apollo-list-item-padding`, `--apollo-list-content-width`, …
(11 of them, named after antd's `--ant-list-*`).
