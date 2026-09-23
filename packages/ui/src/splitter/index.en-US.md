---
category: Layout
title: Splitter
subtitle: 分割面板
---

A splitter container with draggable panels.

## When To Use

- Adjustable multi-pane layouts (IDE panels, detail page columns).
- Panel collapse/expand with size constraints (min/max).

## API

### Splitter

| Prop | Description | Type | Default |
|---|---|---|---|
| orientation | `'horizontal' \| 'vertical'` | — | `'horizontal'` |
| vertical | Same as `orientation="vertical"` | `boolean` | — |
| layout | ⚠️ Deprecated: use `orientation` | — | — |
| collapsible | `{ motion?: boolean; icon?: { start?, end? } }` | — | — |
| draggerIcon | Custom dragger icon | `VNodeChild` | — |
| lazy | Drag shows a preview line only; commit on release | `boolean` | — |
| destroyOnHidden | Destroy collapsed panel content | `boolean` | — |
| classNames / styles | Semantic slots `{ root, panel, dragger }` | — | — |

### Events

`resize-start` / `resize` / `resize-end` (sizes: number[]), `collapse`
(collapsed: boolean[], sizes: number[]), `dragger-double-click` (index: number).

### Splitter.Panel

`size` / `defaultSize` / `min` / `max` (number px or `'50%'`), `collapsible`
(boolean or `{ start?, end?, showCollapsibleIcon? }`), `resizable`,
`destroyOnHidden`.

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme (Component Token)

4 tokens: `splitBarSize`(2px), `splitTriggerSize`(6px), `resizeSpinnerSize`(20px),
`splitBarDraggableSize`(20px) — CSS variables `--apollo-splitter-*`.
