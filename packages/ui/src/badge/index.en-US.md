---
category: Data Display
title: Badge
subtitle: Badge
---

A small status descriptor for UI elements.

## When To Use

- Displayed at the top-right of icons or avatars to indicate messages or items needing attention.
- The count can be a number, text, or a red dot.

## Examples

See [`demo/`](./demo) (12 demos, one-to-one with antd non-debug demos).

## API

### Badge

| Prop | Description | Type | Default |
|---|---|---|---|
| count | Number to display (`null` hides; overflow shows `+`) | `VNodeChild` | `null` |
| overflowCount | Max count | `number` | `99` |
| dot | Show red dot only (overrides count) | `boolean` | `false` |
| showZero | Show when value is 0 | `boolean` | `false` |
| size | Size (`default` deprecated, equals `medium`) | `'medium' \| 'small'` | `'medium'` |
| status | Status dot | `'success' \| 'processing' \| 'error' \| 'default' \| 'warning'` | — |
| color | Custom color | `string` | — |
| text | Status text | `VNodeChild` | — |
| title | Native title (`null`/`false` disables; falls back to count) | `string \| null \| false` | — |
| offset | Offset `[x, y]` | `[number \| string, number \| string]` | — |

### Badge.Ribbon

| Prop | Description | Type | Default |
|---|---|---|---|
| text | Ribbon text | `VNodeChild` | — |
| color | Color | `string` | — |
| placement | Placement corner | `'start' \| 'end'` | `'end'` |

## Theme

### Component Token

9 tokens: `indicatorZIndex`, `indicatorHeight`, `indicatorHeightSM`, `dotSize`,
`textFontSize`, `textFontSizeSM`, `textFontWeight`, `statusSize`, `paddingInline`.

## Design Notes

- Count digits are split into per-digit scrolling units only for positive integers
  (upstream truthiness: count=0 renders as plain text).
- Illustration-free component; status `processing` triggers a ripple animation via CSS.
