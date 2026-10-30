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
| strokeWidth | Line/step height; circle stroke as a percentage of its diameter | `number` | line 8 / circle max(6, 3/width×100) |
| size | Preset, number, [w,h], or object | `'medium' \| 'middle' \| 'small' \| 'default' \| number \| [number \| string, number] \| { width?: number; height?: number }` | `'medium'` |
| success | Success segment | `{ percent?, strokeColor? }` | — |
| steps | Step count | `number \| { count, gap }` | — |
| gapDegree / gapPlacement | Dashboard gap | `number` / union | 75 / `'bottom'` |
| percentPosition | Indicator position | `{ align?, type? }` | `{ align: 'end', type: 'outer' }` |
| rounding | Step rounding fn | `(step: number) => number` | `Math.round` |

> Deprecated: `width` -> `size`, `trailColor` -> `railColor`, `gapPosition` ->
> `gapPlacement`, `size="default"` -> `size="medium"` (all warn).

### Semantic (classNames / styles)

`root` / `body` / `rail` / `track` / `indicator` (object and function variants).

`rail` targets the line rail or the continuous SVG circle rail. Step items use
`track`; they have no separate rail node. Circle rail styles apply to the actual
SVG element. Semantic functions receive the current `{ props }`.

For lines, numeric widths in scalar, tuple and object size values use px, with the
corresponding rail height; nonpositive width fills the available space. Information can make the body
taller than the rail, so size height describes the rail.
Tuple widths also accept CSS lengths such as `['65%', 12]`. For line steps, the
tuple width is each segment's width. Circles/dashboard accept a number or preset;
explicit `size` takes precedence over the existing deprecated `width` prop.
`middle` remains supported alongside `medium`.

`steps.gap` controls circle/dashboard segment spacing. `rounding` controls line
step rounding. A `strokeColor` array supplies line-step colors; other forms use
its first color. Gradients accept `from`/`to` or percentage stops; `direction`
controls the line gradient. Circle percentage stops are ordered by position.

`percentPosition` updates both the indicator host and its alignment/color classes
when replaced or removed. `format` remains a value-formatting callback, receives
the clamped percentage and success percentage, and can return any Vue content.
There are no public slots, component events, models or exposed methods.

Inner line text chooses a readable black/white foreground against its current
opaque solid track, including theme/status colors. Explicit `styles.indicator.color`
still wins. Authors pair text with custom gradients, alpha colors or overridden
track backgrounds. This directly corrects the development default's insufficient
contrast on bright tracks; there is no compatibility switch or deprecation period.

Native `class`, all Vue `style` forms, DOM attributes and listeners target the
root progressbar. A native listener runs once per DOM event. Styling precedence
is theme variables, Provider `styles`, Provider `style`, local `styles`, then
native root `style`; semantic classes are combined. ConfigProvider
`components.progress` supports `className`, `style`, `classNames` and `styles`,
including reactive replacement/removal. Current prefix and direction are observed.

The six existing component tokens are read from `theme.components.Progress`:
`circleTextColor`, `defaultColor`, `remainingColor`, `lineBorderRadius`,
`circleTextFontSize`, `circleIconFontSize`. Numeric `lineBorderRadius` uses px;
the other values are CSS strings. Current theme aliases and nested overrides
apply in SSR and after updates. Default circle success segments use the theme's
success color; explicit success colors keep precedence.

The actual progressbar uses success.percent when provided, otherwise percent, for
`aria-valuenow`. Finite fractions are preserved and clamped to 0–100; non-finite
values become 0. Internal accessibility values take precedence over same-name native
attrs. Supply the accessible name through aria-label / aria-labelledby. Existing
integer-based status derivation and explicit normal status retain their behavior.

## Design notes

- **Self-built SVG circle core** (H5, no `@rc-component/progress`): dasharray/dashoffset
  math reverse-engineered from the antd real DOM.
- **Gradient circle** uses the mask + foreignObject conic approach.
- **<=20px circle**: indicator shown via Tooltip.
- **6 Component Tokens**; the `--progress-line-stroke-color` variable has no component
  prefix (verbatim from the antd output).
