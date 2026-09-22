---
category: Navigation
title: BackTop
subtitle: Back Top
---

A button to scroll back to top.

> ⚠️ Deprecated since antd 6.x. Use `FloatButton.BackTop` instead.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| visibilityHeight | Show after scrolling past this value (px) | `number` | `400` |
| duration | Scroll-to-top duration (ms; <=0 jumps directly) | `number` | `450` |
| target | Scrolling container | `() => HTMLElement \| Window \| Document` | `ownerDocument \| window` |
| onClick | Click callback (after scroll starts) | `(e: MouseEvent) => void` | — |

## Design Notes

- `visibilityHeight={0}` keeps it always visible.
- The responsive inset narrows at viewports <= 768px / <= 480px.
