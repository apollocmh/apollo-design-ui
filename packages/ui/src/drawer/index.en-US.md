---
category: Feedback
title: Drawer
subtitle: Drawer
---

A panel that slides in from the edge of the screen.

## When to use

- When a large amount of content (or a form) should slide in from an edge.
- When it must render **inside the current node** (`getContainer={false}`) instead of body.
- When a resizable (`resizable`) or nested (child pushes parent) drawer is needed.

## Demos

See [`demo/`](./demo) (18 demos, one-to-one with antd).

## API

| Property | Description | Type | Default |
|---|---|---|---|
| open | Whether visible | `boolean` | `false` |
| placement | Placement | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` |
| size | Preset or explicit size | `'default' \| 'large' \| number \| string` | `'default'` (378) |
| defaultSize | Default size (**the source of the vertical default**) | `number` | `378` |
| title | Title (text; rich title via `#title` slot, slot first) | `string` | — |
| footer | Footer (⚠️ moved to `#footer` slot; empty slot = hidden) | `slot` | — |
| extra | Header-right area (⚠️ moved to `#extra` slot) | `slot` | — |
| closable | Close button; `false` removes it; object supports `placement: 'start' \| 'end'` | `boolean \| null \| {...}` | `true` |
| closeIcon | Custom close icon (⚠️ moved to `#closeIcon` slot) | `slot` | — |
| loading | Skeleton in the body | `boolean` | `false` |
| mask | Mask; `false` adds `no-mask` to the root | `boolean \| { enabled?, blur?, closable? }` | `true` |
| maskClosable | Close on mask click (⚠️ deprecated ⇒ `mask.closable`) | `boolean` | `true` |
| push | Push: `true` / `{ distance }` (**only a child drawer actually pushes**) | `boolean \| PushState` | `{ distance: 180 }` |
| resizable | Drag to resize | `boolean \| {...}` | — |
| getContainer | Container; `false` ⇒ **inline render** (no portal) | `false \| string \| () => HTMLElement` | `document.body` |
| destroyOnHidden | Unmount when closed | `boolean` | `false` |
| focusable | Focus behavior | `{ focusTriggerAfterClose?, trap? }` | — |
| keyboard | Close on ESC | `boolean` | `true` |
| autoFocus | Focus the panel on open | `boolean` | `true` |
| afterOpenChange | Motion end callback | `(open: boolean) => void` | — |
| onClose | Close callback (mask / ESC / button) | `(e: Event) => void` | — |
| classNames / styles | 12 semantic slots | — | — |

**Deprecated (9, dev warnings)**: `headerStyle` / `bodyStyle` / `footerStyle` → `styles.*`;
`contentWrapperStyle` → `styles.wrapper`; `maskStyle` → `styles.mask`; `drawerStyle` →
`styles.section`; `destroyOnClose` → `destroyOnHidden`; `width` / `height` → `size`.

## Theme (Component Token)

4 tokens (CSS variables `--apollo-drawer-*`): `zIndexPopup` (= `zIndexPopupBase` = **1000, no
offset**) / `footerPaddingBlock` (8) / `footerPaddingInline` (16) / `draggerSize` (4).

## Design notes

### The size axis follows the placement

`left`/`right` use **width**; `top`/`bottom` use **height**. Presets: `'large'` = 736,
`'default'` = 378. ⚠️ rc's 378 fallback only applies to horizontal placements — the vertical
default comes from `defaultSize`.

### The push chain of nested drawers

A child drawer calls its parent's `push()`, and the parent translates accordingly
(`push.distance`, 180 by default). **A top-level drawer never moves itself** — `push` only
sets the distance.
