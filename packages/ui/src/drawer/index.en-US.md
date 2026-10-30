---
category: Feedback
title: Drawer
subtitle: Drawer
---

A panel that slides in from the edge of the screen.

## When to use

- When a large amount of content (or a form) should slide in from an edge.
- When it must render **inside the current node** (`:get-container="false"`) instead of body.
- When a resizable (`resizable`) or nested (child pushes parent) drawer is needed.

## Demos

See [`demo/`](./demo) for the 18 existing scenarios.

## API

| Property | Description | Type | Default |
|---|---|---|---|
| open | Whether visible | `boolean` | `false` |
| placement | Placement | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` |
| size | Preset or explicit size | `'default' \| 'large' \| number \| string` | `'default'` (378) |
| defaultSize | Default size (**the source of the vertical default**) | `number` | `378` |
| maxSize | Maximum size while resizing | `number` | — |
| title | Title (text; rich title via `#title` slot, slot first) | `string` | — |
| footer | Footer (⚠️ moved to `#footer` slot; empty slot = hidden) | `slot` | — |
| extra | Header-right area (⚠️ moved to `#extra` slot) | `slot` | — |
| closable | Close button; `false` removes it; object supports `placement: 'start' \| 'end'` | `boolean \| null \| {...}` | `true` |
| closeIcon | Custom close icon (⚠️ moved to `#closeIcon` slot) | `slot` | — |
| loading | Skeleton in the body | `boolean` | `false` |
| mask | Mask; `false` adds `no-mask` to the root | `boolean \| { enabled?, blur?, closable? }` | `true` |
| maskClosable | Close on mask click (⚠️ deprecated ⇒ `mask.closable`) | `boolean` | `true` |
| push | Push: `true` / `{ distance }` (**only a child drawer actually pushes**) | `boolean \| PushState` | `{ distance: 180 }` |
| resizable | Drag to resize; notifications use Vue events below | `boolean` | `false` |
| getContainer | Container; false renders inline, other values follow Portal | `GetContainer` | Default container under body |
| destroyOnHidden | Unmount when closed | `boolean` | `false` |
| forceRender | Mount hidden content without joining the active Escape stack | `boolean` | `false` |
| focusable | Focus return and trap; explicit trap wins, otherwise enabled for masked non-inline drawers | `{ focusTriggerAfterClose?, trap? }` | — |
| focusTriggerAfterClose | Override the focus-return setting in focusable | `boolean` | `true` |
| keyboard | Close on ESC | `boolean` | `true` |
| autoFocus | Focus the panel on open | `boolean` | `true` |
| rootStyle | Root styles; native style has higher priority | `CSSProperties` | — |
| zIndex | Explicit root stacking level; otherwise follows current theme and nesting | `number` | — |
| classNames / styles | 12 semantic slots | — | — |

`open` is controlled. Buttons, mask clicks and Escape emit requests; the parent updates `open` when it accepts the request. `destroyOnHidden` waits for the leave motion to finish. Conditional unmounts also release focus locks, drag listeners and push registrations.

Explicit size (including the width/height alias for the current axis) stays controlled: dragging emits a size request. Without it, resizing updates the local default size. Removing controlled size preserves the last accepted value and discards refused requests.

### Events

| Event | Description | Payload |
|---|---|---|
| close | Close button, mask click or active-layer Escape request | Original `Event` (MouseEvent / KeyboardEvent) |
| afterOpenChange | Enter or leave motion completed | `open: boolean` |
| resizeStart | Drag started | `size: number`, pixels |
| resize | Current resized dimension | `size: number`, pixels |
| resizeEnd | Measured dimension after a normal drag end | `size: number`, pixels |

Events support Vue `.once` and listener arrays. Closing, disabling resizing, changing placement or unmounting releases drag listeners without reporting a normal drag end.

**Deprecated (9, dev warnings)**: `headerStyle` / `bodyStyle` / `footerStyle` → `styles.*`;
`contentWrapperStyle` → `styles.wrapper`; `maskStyle` → `styles.mask`; `drawerStyle` →
`styles.section`; `destroyOnClose` → `destroyOnHidden`; `width` / `height` → `size`.

Content slots are typed through `DrawerSlots` and take precedence when present, including empty content. Each Drawer render evaluates the title once; panel content and automatic `aria-labelledby` share that snapshot. An explicit external `aria-labelledby` is preserved. Header/footer visibility changes preserve the body DOM and input state.

`getContainer` uses Portal’s full `GetContainer` contract, including `false`, selectors, elements and container functions. Vue templates can use `:get-container="false"` directly. Drawer routes native class/style (including arrays, objects and strings), data attributes and ordinary DOM events to its outer root. The actual dialog owns id, role and ARIA. Customize the panel with `classNames.section` / `styles.section`. PurePanel owns all of its native root attrs.

### Template refs and development migration

`DrawerRef` exposes `nativeElement: HTMLElement | null` and `focus(options?: FocusOptions)` for the current outer root. The element can be null before mounting or after destruction. Use a real Vue template ref:

```vue
<script setup lang="ts">
import { Drawer, type DrawerRef } from '@apollo-design/ui';
import { ref, useTemplateRef } from 'vue';
const drawer = useTemplateRef<DrawerRef>('drawer');
const open = ref(false);
const completed = (open: boolean) => console.log(open);
</script>
<template>
  <button @click="open = true">Open drawer</button>
  <Drawer ref="drawer" :open="open" resizable @close="open = false" @after-open-change="completed" @resize="size => console.log(size)">
    <button @click="drawer?.focus()">Focus drawer root</button>
  </Drawer>
</template>
```

In this unpublished development version, replace `:after-open-change="fn"` with `@after-open-change="fn"` (`onAfterOpenChange` in `h()`), and replace `:resizable="{ onResize, onResizeStart, onResizeEnd }"` with `resizable` and the three corresponding events. The unused `DrawerResizableConfig`, `panelRef` and `destroyInactivePanel` are removed: use `DrawerRef` for DOM access and `destroyOnHidden` for destruction. PurePanel types no longer claim to consume internal `ariaId`, `size` or `contentWrapperStyle`. Native class/style now target the root; move panel customization to the section semantic fields. There is no compatibility layer or deprecation period for these corrections. Existing documented style and destruction aliases remain supported.

## Theme (Component Token)

4 tokens (CSS variables `--apollo-drawer-*`): `zIndexPopup` (= `zIndexPopupBase` = **1000, no
offset**) / `footerPaddingBlock` (8) / `footerPaddingInline` (16) / `draggerSize` (4).

Drawer and PurePanel read current `ConfigProvider.components.drawer` className/style, classNames/styles and applicable closable/mask/focusable settings. Instance semantic styles override Provider styles; native root style wins last. Configure the four tokens with `theme.components.Drawer`. Consumed aliases, nesting, replacement and removal update the current root CSS variables; explicit zIndex still wins. The component-token and config-provider demos include live switches.

## Design notes

### The size axis follows the placement

`left`/`right` use **width**; `top`/`bottom` use **height**. Presets: `'large'` = 736,
`'default'` = 378. ⚠️ rc's 378 fallback only applies to horizontal placements — the vertical
default comes from `defaultSize`.

### The push chain of nested drawers

Each open child owns a push registration. The parent returns only after all children close or unmount, and translates by `push.distance` (180 by default, CSS length strings supported). A top-level drawer stays in place until a child opens.
