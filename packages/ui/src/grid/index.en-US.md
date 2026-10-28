---
category: Layout
title: Grid
subtitle: Grid System
---

A 24-column layout. Row creates a flex row; Col controls width, order, logical offsets and flex sizing. Nested rows own their gutters. Wrapper components may forward slots and injection normally.

## Examples

The 13 actual demos in [`demo/`](./demo) cover columns, independent two-axis gutters, offsets/order, six main-axis alignments, four cross-axis alignments, flex, responsive layouts and native range controls. Demo colors follow the current theme.

## API

### Row

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| gutter | Nonnegative spacing: numbers in px or valid CSS length strings. Both tuple axes accept breakpoint maps | `ResponsiveValue<number \| string> \| readonly [ResponsiveValue<number \| string>, ResponsiveValue<number \| string>]` | `0` |
| justify | Main-axis alignment, optionally responsive | `ResponsiveValue<'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'>` | — |
| align | Cross-axis alignment; stretch explicitly stretches column boxes | `ResponsiveValue<'top' \| 'middle' \| 'bottom' \| 'stretch'>` | — |
| wrap | Wrap unless explicitly false | `boolean` | `true` |
| prefixCls | Root class prefix; custom prefixes require corresponding static CSS | `string` | Provider prefix + `-row`, normally `apollo-row` |

`ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>`.

### Col

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| span | Integer from 0 to 24; 0 hides the column | `number` | — |
| order | Visual order, integer 0–24 | `number` | — |
| offset | Margin at inline start, in integer columns 0–24 | `number` | — |
| push / pull | Logical inline-start/end positional shifts, in integer columns 0–24 | `number` | — |
| flex | auto→`1 1 auto`; number n→`n n auto`, including 0/fractions; px/em/rem/% length→`0 0 length`; other valid flex strings pass through | `string \| number` | — |
| xs / sm / md / lg / xl / xxl / xxxl | Numeric span shorthand, or ColSize with optional span/order/offset/push/pull/flex | `number \| ColSize` | — |
| prefixCls | Root class prefix; custom prefixes require corresponding static CSS | `string` | Provider prefix + `-col`, normally `apollo-col` |

### Default slot, native attributes and refs

Both default slots have no scoped arguments and accept complete Vue content: text, 0, multiple nodes, Fragments and components. There are no business emits or v-model bindings. Each root is a stable div. Native id/class/style/ARIA/tabindex and DOM listeners belong to that root. Listeners fire once. Vue string/object/array styles update and clear normally.

- Row style precedence: gutter geometry → Provider row.style → native style.
- Col style precedence: gutter/flex geometry → Provider col.style → native style → responsive flex variables. Native style may override geometry; span/flex still determine used width through CSS layout.
- `ref<GridRef>` exposes `nativeElement: HTMLElement | null`, pointing to the actual div and clearing on unmount. Layout updates preserve native child state. Row/Col add no keyboard behavior or focus stops. Hiding focused content with span=0 follows normal browser focus behavior.

### Provider

`ConfigProvider :components="{ row: rowConfig, col: colConfig }"` accepts RowConfig/ColConfig with `className?: string` and `style?: CSSProperties`. Configuration, direction and prefix remain current across replacement/removal. Provider direction supplies the default native dir; explicit root dir or CSS direction may override it. Nested Providers and independent instances keep their own configuration.

### Breakpoints and hook

| Breakpoint | Col static CSS | useBreakpoint / Row responsive values |
| --- | --- | --- |
| xs | Base rules until overridden at a larger breakpoint | ≤575px |
| sm | ≥576px | ≥576px |
| md | ≥768px | ≥768px |
| lg | ≥992px | ≥992px |
| xl | ≥1200px | ≥1200px |
| xxl | ≥1600px | ≥1600px |
| xxxl | ≥1920px | ≥1920px |

All Col classes are present together; CSS applies from smaller to larger breakpoints. Explicit zero values reset smaller-breakpoint offsets/order. Removing a breakpoint restores underlying active rules. Row justify/align/gutter select the largest currently matching configured breakpoint. No match leaves the value unset: gutter `{ xs: 8, md: 24 }` has no active entry at 576–767px.

`useBreakpoint(refreshOnChange?, defaultScreens?)` returns `Ref<Screens | null>`. A false boolean/getter pauses publication while caching media changes. When a getter becomes true, the current viewport is published immediately. Use `() => enabled.value` for a dynamic switch. Equal query sets share listeners; different configurations observe independently. Query changes reconnect subscribers, and the last owner releases the listeners.

SSR keeps defaultScreens without browser access. Row responsive justify/align have no first-frame match; responsive gutter uses the largest configured breakpoint without viewport information, then corrects after mount. Server and hydration first frames are deterministic; the mounted correction can change layout.

## Theme and static CSS boundaries

Row/Col have no component Tokens. The 24-column count is geometric. Fonts consume current global fontFamily/fontSize variables. Horizontal gutter combines Row negative-half margin and Col positive-half padding; vertical gutter uses row-gap. Base and responsive flex may shrink in nowrap rows through min-width: 0, overridable by native styles.

Col CSS media queries use the fixed default thresholds above. Runtime screen Token overrides affect the JavaScript observer and Row, and do not rewrite Col media queries. Keep default thresholds or provide application static CSS when consistency is required. See [Grid migration notes](../../../../docs/migrations/grid-contracts.md) for changes and verification boundaries.
