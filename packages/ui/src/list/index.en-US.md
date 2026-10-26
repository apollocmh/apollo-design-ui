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
| extra | Content beside the list; moves below it on narrow screens. Also available as a slot | `VNodeChild` | — |
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
| extra | — | Content beside the list; below it on narrow screens |
| header | — | List header |
| footer | — | List footer |
| loadMore | — | Replaces bottom pagination; top pagination remains |

The presence of `header` / `footer` / `loadMore` / `extra` slots overrides their matching content props, even when the slot is empty. Empty header/footer slots create no wrapper. Use the exact `loadMore` casing. Simple content props remain available.
`renderItem` has been removed directly; see the [List slot migration](../../../../docs/migrations/list-slots.md).

```vue
<List :data-source="users" row-key="id">
  <template #item="{ item, index }">
    <ListItem>{{ index + 1 }}. {{ item.name }}</ListItem>
  </template>
  <template #footer>{{ users.length }} users</template>
</List>
```


`pagination.current` and `pagination.pageSize` independently select controlled state. Uncontrolled defaults initialize when pagination is first enabled. External updates do not emit callbacks; removing control continues the last received value, without adopting rejected page requests. Shrinking data clamps uncontrolled state without reviving the old page on regrowth. Explicit `total` supports server pagination and preserves the current server result page. `align` reaches Pagination unchanged (default `end`); `position` only controls List placement.

Grid columns use the largest active configured breakpoint, falling back to `column`. The nearest List/Item context supplies child prefixes; explicit child prefixes override it, following the library's static CSS generation policy. Nested List sizes, split lines, layouts and borders remain independent. Native `dir` overrides Provider direction.

### List.Item

| Property | Description | Type |
|---|---|---|
| actions | Action area. One `<li>` each, with separators between. ⚠️ **an empty array renders nothing** | `VNodeChild[]` |
| extra | Extra content in a stable `-item-extra` wrapper in both layouts | `VNodeChild` |
| classNames | Semantic class names (`actions` / `extra`) | `{ actions?: string; extra?: string }` |
| styles | Semantic styles (same slots) | `{ actions?: CSSProperties; extra?: CSSProperties }` |
| colStyle | User-supplied inline style on the grid Col root; does not set List column counts | `CSSProperties` |

### List.Item slots

| Slot | Description |
|---|---|
| default | Item body |
| extra | Extra content in a stable semantic wrapper in both layouts |
| actions | Arrays and fragments are flattened; each nonempty top-level node becomes one action, with separators between actions |

Named slots take precedence over matching props, including empty slots. Actions skip comments and whitespace; use stable keys with `v-for`. Multiple buttons inside one wrapping element count as one action. The actions data array prop uses the same empty-content filtering and preserves VNode keys. Numeric zero remains visible.

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

Configure all 11 tokens through `ConfigProvider` `theme.components.List`, including updates, removal and restoration. Native root CSS variables can override them: `--apollo-list-item-padding`, `--apollo-list-content-width`, …
(11 variables). Data containers inherit root values; native root styles take precedence over Provider configuration.

An explicit `itemPadding` also controls both axes of bordered default rows; without an override, their standard theme indentation remains. `loading.fullscreen` covers the viewport while content, native input state and refs stay in document flow. Use `loading.classNames.mask` / `loading.styles.mask` for the actual overlay.

Pagination content uses #paginationItemRender="{ page, type, element }", #paginationTotal="{ total, range }" and #paginationSizeChanger="info". Each pager receives its current scope, including top/bottom pagers and dynamic slots. Configuration holds data and business events; itemRender/showTotal/sizeChangerRender function entries are removed.
