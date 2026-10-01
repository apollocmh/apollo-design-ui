---
category: Data Display
title: Masonry
subtitle: Masonry
---

A masonry (waterfall) layout: each item is placed into the currently shortest column.
Item heights are **measured**, never preset.

## When To Use

- Content heights vary, but the container should look visually "filled"
  (image walls, card feeds, product lists).
- Columns and gaps need to be controlled per breakpoint.

## Examples

See [`demo/`](./demo) (6 demos, mirroring antd one by one).

| demo | Description |
|---|---|
| `basic` | Basic (4 columns, `gutter` 16) |
| `responsive` | Columns and gaps configured per breakpoint |
| `dynamic` | Add / remove items; `onLayoutChange` writes the column back into `items` |
| `fresh` | Use `fresh` when item content resizes (a `ResizeObserver` per item) |
| `image` | Items are images (heights are known only after loading) |
| `style-class` | `classNames` / `styles` in both object and function form |

## API

### Props

| Property | Description | Type | Default | Global Config |
|---|---|---|---|---|
| items | Data source. Each entry is `{ key, data, column?, height?, children? }` | `MasonryItemType<T>[]` | — | × |
| itemRender | Renders a single item. **Lower priority than** `item.children` | `(info: MasonryItemRenderInfo<T>) => VNodeChild` | — | × |
| columns | Column count. The object form resolves per breakpoint (first configured one, from largest to smallest; if none matches ⇒ `columns.xs ?? 1`) | `number \| Partial<Record<Breakpoint, number>>` | `3` | × |
| gutter | Spacing. Reuses Grid's `Gutter` (number / string / breakpoint object / `[horizontal, vertical]`) | `Gutter` | `0` | × |
| fresh | Attaches a `ResizeObserver` to **each item** (for content that resizes). ⚠️ Does **not** change the DOM structure | `boolean` | `false` | × |
| onLayoutChange | Fires when the layout order changes. The payload is **`{...item, column}`** (the item itself is spread) | `(sortInfo: MasonryLayoutItem<T>[]) => void` | — | × |
| classNames | Semantic class names (`root` / `item`); the function form is supported | `MasonrySemanticClassNames \| ((info) => …)` | — | ✅ (`masonry.classNames`) |
| styles | Semantic styles (`root` / `item`); the function form is supported | `MasonrySemanticStyles \| ((info) => …)` | — | ✅ (`masonry.styles`) |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-masonry` | × |
| rootClassName | Also applied to the root element (after `className`) | `string` | — | × |
| className | Root element class name | `string` | — | × |
| style | Root element inline style. **Overrides the computed container height** | `CSSProperties` | — | × |

#### MasonryItemType

| Field | Description | Type | Default |
|---|---|---|---|
| key | Unique identifier (numbers are stringified internally) | `string \| number` | — |
| data | Business data, passed through to `itemRender` | `T` | — |
| column | Pins the item to a column (0-based). Out-of-range values are clamped to the last column | `number` | the shortest column |
| height | ⚠️ **Declared upstream but never read** — heights are always measured | `number` | — |
| children | Content. **Takes priority over** `itemRender` | `VNodeChild` | — |

### Events

| Name | Description | Parameters |
|---|---|---|
| layoutChange | Layout order changed (= `onLayoutChange`; **both** are emitted) | `(sortInfo: MasonryLayoutItem<T>[])` |

### Ref

| Name | Type | Description |
|---|---|---|
| nativeElement | `() => HTMLDivElement \| null` | Root element (mirrors antd's forwardRef ref) |

### Slots

**None** — upstream never reads `children`; content always goes through
`items` + `itemRender` / `item.children`.

## Theme

### Component Token

Masonry has **no Component Token** (identical to antd: `ComponentToken` is an empty interface).
It only consumes global aliases:

| token | Used for |
|---|---|
| `motionDurationSlow` | Item fade-in (`-fade-appear`) and position transitions |
| `motionDurationFast` | Item fade-out (`-fade-leave`) |
| `motionEaseOut` | Easing of the three above |

## Design Notes

- **Layout algorithm**: items are placed in order into the column with the **smallest
  accumulated height** (ties go to the **leftmost**); the container height is the tallest
  column minus one vertical gutter. See the header of `hooks/positions.ts` for the three
  easy-to-get-wrong points.
- **Heights are measured**: `item.height` is never read; the first measurement happens
  after commit (mirroring upstream's `useEffect` timing).
- **`onLoad` / `onError` are dead listeners**: upstream attaches them to the root `div`,
  but React treats `load` as a non-delegated event bound to that element in the **bubble**
  phase, and `load` does not bubble ⇒ a child `<img>`'s event never reaches the root.
  We **replicate the same binding** (so behaviour matches antd). Use `fresh` when you need
  re-layout on content resize.
- **Zero ARIA**: both the container and the items are plain `div`s (no `role`, no
  `tabindex`) — semantics are entirely up to `itemRender`. This is intentional upstream
  and is pinned by L5.
- **Attrs are not forwarded**: upstream does not spread `...restProps` ⇒ we set
  `inheritAttrs: false`.
