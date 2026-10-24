---
category: Data Display
title: List
subtitle: List
---

General list.

List follows Apollo’s independent lifecycle and uses a typed Vue `#item` slot for item content.

## When To Use

- To display a group of homogeneous data (news, users, search results);
- When you need pagination, grid layout, or vertical media-style items.

## Examples

See [`demo/`](./demo) (**12**, mirroring antd's user-visible demos).

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

Additional examples cover `component-token`, `pagination-simple`, `empty` and `item-extra`.
See `Listy` for virtual lists. A List drag-reordering example remains under review.

## API

### List

| Property | Description | Type | Default |
|---|---|---|---|
| bordered | Toggles rendering of the border around the list | `boolean` | `false` |
| dataSource | Data source | `T[]` | — |
| extra | Historical declaration; rendering is not connected and remains under F11 review | `VNodeChild` | — |
| grid | Grid config (`gutter` / `column` / `xs`…`xxxl`) | `ListGridType` | — |
| id | Root element id | `string` | — |
| itemLayout | Item layout | `'horizontal' \| 'vertical'` | `'horizontal'` |
| loading | Loading state. ⚠️ **with a non-empty `dataSource` the list itself renders** (the 53px placeholder only shows when the data is empty) | `boolean \| SpinProps` | `false` |
| loadMore | Load-more content (**replaces** the bottom pagination) | `VNodeChild` | — |
| pagination | Pagination config; `false` renders nothing | `PaginationConfig \| false` | `false` |
| rowKey | Row key (function or field name) | `((item: T) => string \| number) \| keyof T` | — |
| size | Size. `'large'` / `'small'` add `-lg` / `-sm`; `'default'` adds nothing | `'small' \| 'default' \| 'large'` | — |
| split | Toggles rendering of the split under each item | `boolean` | `true` |
| header | List header | `VNodeChild` | — |
| footer | List footer | `VNodeChild` | — |
| locale | Empty text override (**plain prop**) | `{ emptyText: VNodeChild }` | — |
| prefixCls | Class name prefix | | — |
| class / style | **Native root attrs** (not Props) | | — |

### List slots

| Slot | Scope | Description |
|---|---|---|
| default | — | Manually composed content; suppresses the default empty state |
| item | `{ item: T, index: number }` | Items on the current page; `T` is inferred from `dataSource`, `index` starts at 0 on each page; absent slot renders no data items |
| header | — | List header |
| footer | — | List footer |
| loadMore | — | Replaces bottom pagination; top pagination remains |

The presence of `header` / `footer` / `loadMore` slots overrides their matching content props, even when the slot is empty. Empty header/footer slots create no wrapper. Use the exact `loadMore` casing. Simple content props remain available.
`renderItem` has been removed directly; see the [List slot migration](../../../../docs/migrations/list-slots.md).

```vue
<List :data-source="users" row-key="id">
  <template #item="{ item, index }">
    <ListItem>{{ index + 1 }}. {{ item.name }}</ListItem>
  </template>
  <template #footer>{{ users.length }} users</template>
</List>
```

### List.Item

| Property | Description | Type |
|---|---|---|
| actions | Action area. One `<li>` each, with separators between. ⚠️ **an empty array renders nothing** | `VNodeChild[]` |
| extra | Extra content. With `itemLayout="vertical"` it takes the whole `-item-extra` slot | `VNodeChild` |
| classNames | Semantic class names (`actions` / `extra`) | `{ actions?: string; extra?: string }` |
| styles | Semantic styles (same slots) | `{ actions?: CSSProperties; extra?: CSSProperties }` |
| colStyle | Inline style of the grid `Col` (passed by `List`) | `CSSProperties` |

### List.Item slots

| Slot | Description |
|---|---|
| default | Item body |
| extra | Extra content; wrapped in vertical layout, a sibling of the body in horizontal layout |
| actions | Arrays and fragments are flattened; each nonempty top-level node becomes one action, with separators between actions |

Named slots take precedence over matching props, including empty slots. Actions skip comments and whitespace; use stable keys with `v-for`. Multiple buttons inside one wrapping element count as one action. The existing actions data array prop remains available.

### List.Item.Meta

| Property | Description | Type |
|---|---|---|
| avatar | Avatar | `VNodeChild` |
| title | Title (rendered as `<h4>`) | `VNodeChild` |
| description | Description | `VNodeChild` |

### List.Item.Meta slots

`#avatar`, `#title` and `#description` have no scope arguments and override matching props, even when empty. Empty avatar/title slots create no avatar wrapper/heading. When both title and description are empty there is no content wrapper. Numeric zero remains visible. Dynamic content updates on render.

### Instance (ref)

All three components expose `{ nativeElement }` (nullable). List / Meta use `HTMLDivElement`; Item uses `HTMLLIElement` outside a grid and `HTMLDivElement` in a grid.

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

Pagination content uses #paginationItemRender="{ page, type, element }", #paginationTotal="{ total, range }" and #paginationSizeChanger="info". Each pager receives its current scope, including top/bottom pagers and dynamic slots. Configuration holds data and business events; itemRender/showTotal/sizeChangerRender function entries are removed.
