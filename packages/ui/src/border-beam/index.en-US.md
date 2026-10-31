---
category: Feedback
title: BorderBeam
subtitle: Border Beam
---

A decorative light beam flowing along an HTML container's border.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | Full effect class and runtime CSS variable prefix | `string` | Provider prefix + `-border-beam` |
| color | Solid color or gradient stops (0–100 mapped to 0–70%) | `string \| { color: string; percent: number }[]` | Theme primary gradient |
| count | Finite values ≥1 are rounded down; other values use 1 | `number` | `1` |
| duration | Finite, positive seconds per revolution; other values use 6 | `number` | `6` |
| lineWidth | Beam thickness; numbers use px | `number \| string` | Theme `lineWidth` |
| outset | Uniform inset offset; otherwise follows each host border width | `number \| string` | — |
| size | Beam head length; numbers use px | `number \| string` | `100px` |
| classNames.effect | Class on each decorative effect div | `{ effect?: string }` | — |
| styles.effect | Inline style on each decorative effect div | `{ effect?: CSSProperties }` | — |

## Slots and native attrs

The default slot accepts `VNodeChild`. One HTML root is decorated, including a component's conditional or asynchronously resolved single root. Comments, whitespace and single-root Fragments preserve the host. Text, SVG and multiple meaningful roots remain complete and receive no effect. There is no extra layout container.

Native `class`, `style`, `data-*`, `aria-*` and listeners merge into the selected host VNode using Vue semantics. The host's own styles take precedence for overlapping properties; component hosts follow their normal attrs forwarding rules. Original keys, template refs, ref arrays, named slots and lifecycle hooks remain owned by their caller. Take a template ref on the child to access its element or component; BorderBeam has no public methods, events or model.

The host supplies its positioning context, usually `position: relative`. Effects inherit its border radius, ignore pointer events and are `aria-hidden`. Runtime effect variables merge before Provider `style`, Provider `styles.effect`, then component `styles.effect`; the latter wins. Provider `className` and `classNames.effect` remain effect configuration.

A visible host's border widths are sampled on one shared 500ms clock, using that host's document. Hidden documents skip style reads and refresh when visible. No HTML hosts means no sampler subscription; host replacement, document adoption and unmount release their resources. SSR preserves content and creates no effects or timers. Reduced motion hides the beam.

## Migration

Component `className` and effect-targeting `style` Props have been removed. Use native `class`/`style` for the host and `classNames.effect`/`styles.effect` for the decorative layer. If Vue replaces the host's text content, its removed decoration is recreated while the host's identity and focus remain intact.
