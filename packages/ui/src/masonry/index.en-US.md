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
| columns | Column count. The object form resolves per breakpoint (first configured one, from largest to smallest; if none matches ⇒ `columns.xs ?? 1`) | `number \| Partial<Record<Breakpoint, number>>` | `3` | × |
| gutter | Spacing. Reuses Grid's `Gutter` (number / string / breakpoint object / `[horizontal, vertical]`) | `Gutter` | `0` | × |
| fresh | Attaches a `ResizeObserver` to **each item** (for content that resizes). ⚠️ Does **not** change the DOM structure | `boolean` | `false` | × |
| onLayoutChange | Fires when the layout order changes. The payload is **`{...item, column}`** (the item itself is spread) | `(sortInfo: MasonryLayoutItem<T>[]) => void` | — | × |
| classNames | Semantic class names (`root` / `item`); the function form is supported | `MasonrySemanticClassNames \| ((info) => …)` | — | ✅ (`masonry.classNames`) |
| styles | Semantic styles (`root` / `item`); the function form is supported | `MasonrySemanticStyles \| ((info) => …)` | — | ✅ (`masonry.styles`) |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-masonry` | × |
| class / style | **Native root attrs** (not Props) | `string \| array \| object` / `CSSProperties` | — | × |
| style | Root element inline style. **Overrides the computed container height** | `CSSProperties` | — | × |

#### MasonryItemType

| Field | Description | Type | Default |
|---|---|---|---|
| key | Unique identifier (numbers are stringified internally) | `string \| number` | — |
| data | Business data; T is inferred from items and passed to #item | `T` | — |
| column | Pins the item to a column (0-based). Out-of-range values are clamped to the last column | `number` | the shortest column |
| height | ⚠️ **Declared upstream but never read** — heights are always measured | `number` | — |
| children | Fallback content when #item is absent | `VNodeChild` | — |

### Events

| Name | Description | Parameters |
|---|---|---|
| layoutChange | Layout order changed (= `onLayoutChange`; **both** are emitted) | `(sortInfo: MasonryLayoutItem<T>[])` |

### Ref

| Name | Type | Description |
|---|---|---|
| nativeElement | `() => HTMLDivElement \| null` | Root element (mirrors antd's forwardRef ref) |

### Slots

| Name | Parameters | Description |
|---|---|---|
| item | `MasonryItemSlotProps<T>`: `{ key, data, index, column, children?, height? }` | Current item; a present slot overrides item.children, including an empty slot |

Column is the current measured column, provisionally 0 before measurement. Conditional slots, same-key data replacements and semantic callbacks read current inputs. Component updates schedule measurement; use fresh to observe transitions and independent descendant resizes. T also flows into layoutChange. The itemRender prop has been removed; see the [migration guide](../../../../docs/migrations/masonry-slots.md).

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
- **SSR renders content immediately**: initial items and #item render on the server in a normal grid with natural height. After mounting, measured heights enable shortest-column positioning. The initial grid flows by rows; masonry positioning starts after measurement. Hydration retains item/input nodes and entered values.
- **Heights are measured**: `item.height` is never read; the first measurement happens
  after Vue has updated the DOM.
- **Image events trigger measurement**: native root capture listeners receive non-bubbling img load/error events and schedule a measured layout pass, including when fresh is false. Use fresh for general per-item ResizeObserver updates.
- **Zero ARIA**: both the container and the items are plain `div`s (no `role`, no
  `tabindex`); supply semantics through #item and native attrs.
- **Native attrs are forwarded**: root id/title/events and Vue string/object/array class/style are read during render. Caller styles override matching semantic root styles; updates retain the root DOM. No role/ARIA is added by default; callers can provide appropriate native attrs.
