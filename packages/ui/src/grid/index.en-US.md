---
category: Layout
title: Grid
subtitle: Grid System
---

24-column grid system.

## When To Use

- For information arrangement in the design area, based on 24 equal columns.
- `Col` must be a direct child of `Row`.

## Examples

See [`demo/`](./demo) (13 demos, one-to-one with antd).

## API

### Row

| Prop | Description | Type | Default |
|---|---|---|---|
| gutter | Grid spacing (number / string / responsive object / `[horizontal, vertical]`) | `number \| string \| object \| array` | `0` |
| justify | Horizontal alignment (responsive object supported) | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` | — |
| align | Vertical alignment (responsive object supported) | `'top' \| 'middle' \| 'bottom' \| 'stretch'` | — |
| wrap | Auto wrap | `boolean` | `true` |
| prefixCls | Class name prefix | `string` | fallback `apollo-row` |

### Col

| Prop | Description | Type | Default |
|---|---|---|---|
| span | Raster number of columns (0 equals `display: none`) | `number` | — |
| order / offset / push / pull | Order and offsets | `number` | — |
| flex | Flex layout property | `string \| number` | — |
| xs … xxxl | Responsive columns | `number \| object` | — |

### Hook

`useBreakpoint(refreshOnChange?, defaultScreens?)` — subscribes to breakpoints, returns hit state per breakpoint.

## Theme

### Component Token

Neither Row nor Col has Component Tokens (identical to antd).

## Design Notes

- Gutter halves: Row gets `margin-inline: -g/2`, Col gets `padding-inline: +g/2`; vertical goes to `row-gap`.
- Responsive size classes are rendered **all at once** and resolved by CSS media queries — SSR-consistent by construction.
- Responsive flex uses a CSS custom property: inline `--apollo-col-{size}-flex` consumed by `flex: var(...)`.
