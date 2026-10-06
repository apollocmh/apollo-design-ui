---
category: Data Display
title: Timeline
subtitle: Timeline
---

Vertical display timeline.

## When To Use

- When a series of information needs to be ordered by time;
- When you need to attach states and descriptions to a time series.

> ⚠️ **This component has no DOM of its own** (antd 6.6.4): it is a thin shell over
> [`Steps`](./steps) — it renders **`<ol>` + `<li>`** (list semantics come from the native
> elements) and its look comes from "Steps' DOM + Timeline's own style overrides".
> That is also why it accepts Steps props such as `variant`.

## Examples

See [`demo/`](./demo) (**13**, mirroring antd's user-visible demos).

| demo | Description |
|---|---|
| `basic` | `content` only (no `title` ⇒ vertical, **not** alternate) |
| `variant` | `variant="filled"` vs the default `"outlined"` |
| `end` | `mode="end"` with a custom `icon` / `color` node |
| `title-span` | `titleSpan` as a number (24-grid) vs a string (CSS length) |
| `horizontal` | `orientation="horizontal"` (a separate absolute-positioning layout) |
| `alternate` | `mode="alternate"` — content alternates left/right |
| `pending` | `reverse` + a `loading: true` "in progress" item |
| `pending-legacy` | ⚠️ **deprecated** `pending` / `pendingDot` |
| `custom` | custom `icon` node (set your own background when customizing `fontSize`) |
| `horizontal-debug` | horizontal + long text + a `styles.item` debug outline |
| `title` | items with `title` ⇒ vertical **auto-alternates** |
| `style-class` | the **function form** of `styles` + `classNames.root` |
| `semantic` | **item-level** semantic slots (`items[i].styles`) |

⚠️ **1 antd demo is not ported** (see `README.md` §5): `component-token`
(zero-runtime: tokens are build-time artifacts).

## API

### Timeline

| Property | Description | Type | Default |
|---|---|---|---|
| items | Item list (**the only content entry**) | `TimelineItemType[]` | — |
| mode | Mode. `'left'` / `'right'` are **deprecated** ⇒ normalized to `'start'` / `'end'` | `'left' \| 'right' \| 'start' \| 'end' \| 'alternate'` | `'start'` |
| orientation | Direction. `'horizontal'` adds `-horizontal` | `'horizontal' \| 'vertical'` | `'vertical'` |
| titleSpan | Title column ratio: a **number** is in 24-grid units, a **string** is a CSS length | `number \| string` | — |
| variant | Variant (forwarded to the inner `Steps`) | `'filled' \| 'outlined'` | `'outlined'` |
| reverse | Reverses the item order (⚠️ the rail status follows the current item too) | `boolean` | `false` |
| pending | ⚠️ **deprecated** — add an item in `items` instead | `VNodeChild` | — |
| pendingDot | ⚠️ **deprecated** — add an item in `items` instead | `VNodeChild` | — |
| classNames / styles | Semantic slots (**the ten `Steps` slots minus `itemSubtitle`**; the **function form** is supported) | | — |
| prefixCls | Class name prefix | | — |
| class / style | **Native root attrs** (not Props); `style` goes through the `styles.root` semantic slot | | — |

> 🚨 **`layoutAlternate` rule**: `mode === 'alternate'` **or** (vertical **and** any item
> has a `title`). ⇒ With a vertical timeline, a single item with `title` puts the whole
> timeline into the **alternating** layout.
> ⚠️ `titleSpan` has **no effect** when `mode === 'alternate'` (same as upstream).

### items[i] (`TimelineItemType`)

| Field | Description | Type |
|---|---|---|
| content | Content | `VNodeChild` |
| title | Title (having one ⇒ vertical alternates) | `VNodeChild` |
| icon | Custom node icon | `VNodeChild` |
| color | A preset (`blue` / `red` / `green` / `gray`) adds a class; **any other color** goes into an inline CSS variable | `'blue' \| 'red' \| 'green' \| 'gray' \| string` |
| loading | Loading ⇒ `status: 'process'` + the default loading icon | `boolean` |
| placement | Placement side. Derived from `mode` when omitted (alternating by **parity** for `alternate`) | `'start' \| 'end'` |
| key | Row key | `string \| number` |
| className / style / classNames / styles | Item-level targets (`styles` supports item-level slots like `root` / `rail` / `content`) | |
| label / children / dot / position | ⚠️ **all deprecated** ⇒ use `title` / `content` / `icon` / `placement` | |

### Instance (ref)

Exposes `{ nativeElement }` — ⚠️ it is the **inner `Steps` root element**
(`HTMLDivElement` or `HTMLOListElement`), because `Timeline` has no root DOM of its own.

## Theme

### Component Token (6)

| Token | Description | Default |
|---|---|---|
| `tailColor` | Line color | `colorSplit` |
| `tailWidth` | Line width | `lineWidthBold` |
| `dotBorderWidth` | Border width of node | `lineWidthBold` |
| `itemPaddingBottom` | Bottom padding of item | `padding * 1.25` |
| `dotSize` | Node size | ⚠️ **`undefined`** (intentionally undeclared, see below) |
| `dotBg` | Node background | ⚠️ **`undefined`** (same) |

🚨 **`dotSize` / `dotBg` default to `undefined` and are intentionally left undeclared** in
the artifact — they rely on a **two-hop `var(custom, origin)` fallback chain**: when unset
they fall back to `Steps`' own size/background, and only take effect once set.
**This is a rule, not an omission** (declaring them would break the fallback chain).

Tune at runtime via CSS variables: `--apollo-timeline-tail-color`, `--apollo-timeline-dot-size`, …
