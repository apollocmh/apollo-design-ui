---
category: Feedback
title: Watermark
subtitle: Watermark
---

Add a watermark to a region of the page.

## When To Use

- To mark copyright / ownership without disturbing reading or interaction.
- To trace screenshots of sensitive content (combine with `onRemove` for tamper alerts).

## Examples

See [`demo/`](./demo) (4: basic / multi-line / image / custom; `portal` is missing
because Modal + Drawer are not landed yet).

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| content | Watermark text (an array renders multiple lines, each with its own `font`) | `string \| WatermarkText \| (string \| WatermarkText)[]` | — |
| font | Text font (`color` / `fontSize` / `fontWeight` / `fontStyle` / `fontFamily` / `textAlign`) | `WatermarkFont` | `{ color: colorFill, fontSize: fontSizeLG }` |
| image | Image watermark url (takes precedence over `content`) | `string` | — |
| width / height | Size of a single watermark unit | `number` | measured / 120×64 for image |
| rotate | Rotation in degrees | `number` | `-22` |
| gap | Spacing `[x, y]` | `[number, number]` | `[100, 100]` |
| offset | Offset `[left, top]` (actual `position = offset - gap / 2`) | `[number, number]` | `gap / 2` |
| zIndex | Stacking level | `number` | `zIndexPopupBase - 1` (999) |
| inherit | Whether descendant overlays inherit the watermark | `boolean` | `true` |
| onRemove | Fired when the watermark element is removed / reparented | `() => void` | — |
| className / rootClassName / style | Root element attributes (**style overrides** `position`/`overflow`) | — | — |

### Slots

| Name | Description |
|---|---|
| default | Content covered by the watermark |

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme (Component Token)

None — this component has no stylesheet (inline styles + canvas only). It consumes
the **concrete values** of three alias tokens: `zIndexPopupBase` / `colorFill` / `fontSizeLG`.
