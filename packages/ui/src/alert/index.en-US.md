---
category: Feedback
title: Alert
subtitle: 警告提示
---

Alert component for feedback.

## When To Use

- When you need to show alert messages to users.
- Static non-floating contents that can be closed by users.

## Examples

See [`demo/`](./demo) (13, one-to-one with antd non-debug demos).

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| type | Type of Alert | `'success' \| 'info' \| 'warning' \| 'error'` | `banner ? 'warning' : 'info'` |
| variant | Variant (6.4.0+) | `'outlined' \| 'filled'` | `'outlined'` |
| title | Content (prop or `#title` slot, prop first) | `string` | — |
| message | **@deprecated** Use `title` | `string` | — |
| description | Additional content (prop or `#description` slot, prop first) | `string` | — |
| showIcon | Whether to show icon (banner defaults to true) | `boolean` | — |
| banner | Display as banner | `boolean` | `false` |
| closable | Closable (object form is always closable; carries closeIcon/onClose/afterClose and any aria-*/data-*) | `boolean \| AlertClosable` | ConfigProvider |
| closeIcon | **@deprecated** Use `closable.closeIcon` (`null/false` disables closing) | `string \| boolean \| null` | — |
| closeText | **@deprecated** Use `closable.closeIcon` | `string` | — |
| onClose | **@deprecated** Use `closable.onClose` | `(e: MouseEvent) => void` | — |
| afterClose | **@deprecated** Use `closable.afterClose` | `() => void` | — |
| id / role | Root element attributes (role defaults to `'alert'`) | `string` | — |
| classNames / styles | Semantic slots (root / icon / section / title / description / actions / close), object or function | — | — |
| onMouseenter / onMouseleave / onClick | Root element events | `(e: MouseEvent) => void` | — |

### Slots

| Slot | Description |
|---|---|
| `#title` | Rich title content (prop first). |
| `#description` | Rich description content (prop first). |
| `#icon` | Custom icon, **overrides** the default type icon (replaces the removed `icon` prop). |
| `#action` | Action area content (replaces the removed `action` prop). |

### Alert.ErrorBoundary

Error boundary wrapper (implemented via Vue `onErrorCaptured`): renders an
`type="error"` Alert when descendants throw (title falls back to
`error.toString()`, description falls back to the component stack in a `<pre>`).

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme (Component Token)

| Token | Description | Default |
|---|---|---|
| borderRadius | Border radius | `borderRadiusLG` (8) |
| withDescriptionIconSize | Icon size with description | `fontSizeHeading3` (30) |
| defaultPadding | Padding without description | `8px 12px` |
| withDescriptionPadding | Padding with description | `20px 24px` |
