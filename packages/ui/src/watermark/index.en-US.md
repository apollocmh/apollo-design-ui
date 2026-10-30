---
category: Data Display
title: Watermark
---

Add a decorative watermark without blocking content or interaction. See [`demo/`](./demo) for text, multiple lines, images, reactive configuration and inheritance into Modal.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| content | Text; an array draws multiple lines, each with optional font overrides | `WatermarkContent \| WatermarkContent[]` | — |
| font | Font settings below | `WatermarkFont` | `colorFill`, `fontSizeLG`, normal sans-serif |
| image | Image URL, preferred over text; load failure draws `content` | `string` | — |
| width / height | Size of one watermark unit | `number` | measured text / 120×64 image |
| rotate | Rotation in degrees | `number` | `-22` |
| gap | Spacing `[x, y]` | `[number, number]` | `[100, 100]` |
| offset | Offset `[left, top]`; drawing anchor is `offset - gap / 2` | `[number, number]` | `gap / 2` |
| zIndex | Decoration layer, including `0` | `number` | `zIndexPopupBase - 1` |
| inherit | Registered descendant overlays use this watermark; when false, registration passes to the ancestor, or remains uncovered without one | `boolean` | `true` |

Native `class`, `style`, `id`, `aria-*` and events land on the root `div`. Style precedence is default `position: relative; overflow: hidden` → Provider style → native `style`. Vue style objects, arrays and strings work. Tamper recovery respects the current legitimate overrides.

### Font

| Field | Type | Default |
|---|---|---|
| color | `string \| CanvasGradient \| CanvasPattern` | `colorFill` |
| fontSize | `number \| string` | `fontSizeLG` |
| fontWeight | `'normal' \| 'lighter' \| 'bold' \| 'bolder' \| number` | `'normal'` |
| fontStyle | `'normal' \| 'italic' \| 'oblique'` | `'normal'` |
| fontFamily | `string` | `'sans-serif'` |
| textAlign | `CanvasTextAlign` | `'center'` |

Numbers and numeric strings use pixels. Valid sizes such as `16px`, `2rem`, `12pt` and `calc(...)` are parsed by native canvas; its normalized pixel size drives measurement and scaling. Relative units are evaluated on redraw; external font loading and page font-size changes are not separately observed. A font rejected by the browser throws `TypeError` during drawing instead of silently reusing the previous font. Undefined per-line fields inherit the current effective font.

### Slots and events

| Slot | Description |
|---|---|
| default | Native covered content, without scoped arguments; ordinary configuration updates retain its subtree |

| Event | Description | Arguments |
|---|---|---|
| remove | Notifies once when a managed watermark node is restored after removal or reparenting. Initial drawing, deliberate inheritance changes and normal unmount do not notify | None |

Use `<Watermark @remove="notify">`. In programmatic calls, `onRemove` is a Vue listener with replacement and `.once` support, rather than a callback prop.

### Ref

`WatermarkRef.nativeElement: HTMLDivElement | null` returns the current root. SSR renders only the root and default slot. Canvas, images and observers start after mounting. Unmount cancels pending frames, releases image callbacks and observers, and removes managed overlay watermarks.

### Theme

There is no stylesheet or Component Token. Drawing consumes current `zIndexPopupBase`, `colorFill` and `fontSizeLG` alias values, including Provider replacement and removal.

### Migration

Tamper notification is the native Vue `remove` event. Replace invalid `fontStyle: 'none'` with `'normal'`. Changing an image URL now invalidates a same-size cache entry without also changing width or height.
