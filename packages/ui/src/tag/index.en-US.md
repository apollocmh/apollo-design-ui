---
category: Data Display
title: Tag
subtitle: Tag
---

Tag for marking and categorizing.

## API

### Tag

| Prop | Description | Type | Default |
|---|---|---|---|
| color | Preset key or any color string (`-inverse` suffix → solid) | `string` | — |
| variant | Variant | `'filled' \| 'solid' \| 'outlined'` | `'filled'` |
| closable | Closable (boolean or config object) | `boolean \| {closeIcon, disabled}` | — |
| closeIcon | Custom close icon | `VNodeChild` | CloseOutlined |
| onClose | Close callback (`preventDefault` to cancel) | `(e: MouseEvent) => void` | — |
| icon | Icon | `VNodeChild` | — |
| href / target | Link mode (renders `<a>`) | `string` | — |
| disabled | Disabled | `boolean` | `false` |

### CheckableTag

| Prop | Description | Type | Default |
|---|---|---|---|
| checked | Checked state | `boolean` | `false` |
| onChange | Change callback (click or Space key) | `(checked: boolean) => void` | — |

### CheckableTagGroup

| Prop | Description | Type | Default |
|---|---|---|---|
| options | Options (raw values or objects) | `(string \| number \| Option)[]` | — |
| value / defaultValue | Selected value(s) | — | — |
| multiple | Multiple selection | `boolean` | `false` |

## Design Notes

- After close, the DOM is **kept** (hidden via `-hidden` class) — upstream semantics.
- Preset colors use class names + variant rules; arbitrary colors use dynamic inline
  styles (light background computed at `hsl.l=0.95`).
