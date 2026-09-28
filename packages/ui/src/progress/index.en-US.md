---
category: Feedback
title: Progress
subtitle: Progress
---

Display the current progress of an operation.

## When To Use

- Show the current progress (uploading, loading, step completion).
- Line / circle / dashboard types, plus step segments.

## Examples

See [`demo/`](./demo) (17 demos, one-to-one with the antd user-visible demos).

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| type | Type | `'line' \| 'circle' \| 'dashboard'` | `'line'` |
| percent | Percentage | `number` | `0` |
| format | Content formatter (fn prop) | `(percent?, successPercent?) => VNodeChild` | `${n}%` |
| status | Status | `'normal' \| 'exception' \| 'active' \| 'success'` | auto success at 100 |
| showInfo | Show indicator text | `boolean` | `true` |
| strokeColor | Stroke color (gradient object supported) | `string \| string[] \| ProgressGradient` | — |
| railColor | Rail color | `string` | — |
| strokeLinecap | Line cap | `'round' \| 'butt' \| 'square'` | `'round'` |
| size | Size (preset / number / [w,h] / object) | — | `'medium'` |
| success | Success segment | `{ percent?, strokeColor? }` | — |
| steps | Step count | `number \| { count, gap }` | — |
| gapDegree / gapPlacement | Dashboard gap | `number` / union | 75 / `'bottom'` |
| percentPosition | Indicator position | `{ align?, type? }` | `{ align: 'end', type: 'outer' }` |
| rounding | Step rounding fn | `(step: number) => number` | `Math.round` |

> Deprecated: `width` -> `size`, `trailColor` -> `railColor`, `gapPosition` ->
> `gapPlacement`, `size="default"` -> `size="medium"` (all warn).

### Semantic (classNames / styles)

`root` / `body` / `rail` / `track` / `indicator` (object and function variants).

## Design notes

- **Self-built SVG circle core** (H5, no `@rc-component/progress`): dasharray/dashoffset
  math reverse-engineered from the antd real DOM.
- **Gradient circle** uses the mask + foreignObject conic approach.
- **<=20px circle**: indicator shown via Tooltip.
- **6 Component Tokens**; the `--progress-line-stroke-color` variable has no component
  prefix (verbatim from the antd output).
