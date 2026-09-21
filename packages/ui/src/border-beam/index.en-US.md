---
category: Feedback
title: BorderBeam
subtitle: Border Beam
---

A light beam flowing along the host container's border.

## When To Use

- To emphasize that a container/card is "in progress" or "active".

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| color | Solid color or gradient stops (0–100 mapped to 0–70%) | `string \| {color, percent}[]` | primary |
| count | Number of beams | `number` | `1` |
| duration | Seconds per revolution | `number` | `6` |
| lineWidth | Beam thickness (defaults to host border width) | `number \| string` | — |
| outset | Override uniform inset offset | `number \| string` | — |
| size | Beam head length | `number \| string` | `100px` |

## Design Notes

- The default slot child is the host: the effect is injected inside the host DOM
  (`aria-hidden`, decorative).
- Host `border-radius` is inherited; host `border` width drives the beam offset.
- Hidden automatically under `prefers-reduced-motion: reduce`.
