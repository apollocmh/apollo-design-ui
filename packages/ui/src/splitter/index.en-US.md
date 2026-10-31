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
| lazy | Drag shows a preview line only; commit on release | `boolean` | — |
| destroyOnHidden | Destroy collapsed panel content | `boolean` | — |
| classNames / styles | Current objects or `({ props: SplitterProps }) => object`, with `{ root, panel, dragger }`; dragger supports default/active styles | — | — |

### Events

`resizeStart` / `resize` / `resizeEnd` (sizes: number[]), `collapse`
(collapsed: boolean[], sizes: number[]), `draggerDoubleClick` (index: number).

These are owned Vue emits. Templates naturally use `@resize-start`, `@resize-end` and `@dragger-double-click`; `h()` uses `onResizeStart`, `onResizeEnd` and `onDraggerDoubleClick`. Notifications are no longer runtime callback props and are delivered once. Lazy drag submits one `resize` and one `resizeEnd` on release; cancellation discards its preview.

### Slots

| Name | Description |
|---|---|
| default | Panel content (`<Splitter.Panel>` list) |
| draggerIcon | Custom dragger icon (was the `draggerIcon` prop) |

### Splitter.Panel

`size` / `defaultSize` / `min` / `max` (number px or `'50%'`), `collapsible`
(boolean or `{ start?, end?, showCollapsibleIcon? }`), `resizable`,
`destroyOnHidden`.

### State, native attrs and refs

`size` is controlled: the parent accepts a `resize` proposal by assigning the new values. Rejection preserves the current layout; removing all `size` props continues from the last accepted sizes. Partially controlled layouts allocate the other panels through the existing size algorithm. `defaultSize` only initializes a newly mounted panel. Give dynamic panels stable business keys: size, collapse memory and editor identity follow those keys, and removal releases their state.

Splitter and Panel each forward native `class`, `style`, data/ARIA attrs and DOM listeners to their own actual root. Styles accept Vue strings and arrays; the existing Panel `className` alias and semantic fields remain. Panel default slots render complete text, zero, arrays and conditional content. Collapse retains content unless `destroyOnHidden` is set; Panel can override the container setting.

Both Splitter and actual Panel refs expose `{ nativeElement: HTMLDivElement | null }`, cleared on unmount. The named `SplitterPanel` and compound `Splitter.Panel` belong inside Splitter.

### Keyboard and resources

Resizable separators are Tab stops. Arrow keys along the current axis resize by 10px, or 50px with Shift; Home / End reach the actual min / max bounds. Horizontal RTL mirrors direction. Disabled separators leave the Tab order. Collapse buttons support Enter / Space. Changing the axis, lazy mode, disabled state or panel key order during a drag cancels its pending preview and releases window listeners; unmount also releases ResizeObserver. CSS transitions respect reduced motion.

## Theme (Component Token)

4 tokens: `splitBarSize`(2px), `splitTriggerSize`(6px), `resizeSpinnerSize`(20px),
`splitBarDraggableSize`(20px) — CSS variables `--apollo-splitter-*`.

Set current overrides through `ConfigProvider` theme components: `{ Splitter: { splitBarSize: 4, splitTriggerSize: 12, resizeSpinnerSize: 28 } }`. Replacement, removal and nested themes update actual consumers. `splitBarDraggableSize` inherits `resizeSpinnerSize` unless explicitly set. Native inline CSS variables apply last. Dynamic prefixes update DOM names; custom-prefix styles still need their preloaded static CSS.
