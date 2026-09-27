---
category: Data Entry
title: Rate
subtitle: Rate
---

Rate component.

## When To Use

- Quick rating operation on content.
- Show rating result (with the read-only `disabled` state).

## Examples

See [`demo/`](./demo) (9 demos, one-to-one with antd's user-visible demos).

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| value | Current value (controlled, `v-model:value`) | `number` | — |
| defaultValue | Default value | `number` | `0` |
| count | Star count | `number` | `5` |
| allowHalf | Allow half star | `boolean` | `false` |
| allowClear | Clear on clicking the same value again | `boolean` | `true` |
| keyboard | Keyboard arrow control | `boolean` | `true` |
| disabled | Read only (merged with DisabledContext) | `boolean` | `false` |
| size | Size | `'large' \| 'middle' \| 'small'` | `'middle'` |
| tooltips | Hint per star (string or TooltipProps object) | `(TooltipProps \| string)[]` | — |
| direction | Text direction (rtl flips half-star/arrow logic) | `'ltr' \| 'rtl'` | `'ltr'` |
| autoFocus | Auto focus after mount | `boolean` | `false` |
| tabIndex | tabIndex of the root ul | `number` | `0` |
| onChange / onHoverChange / onFocus / onBlur / onKeyDown | Callbacks (prop-form) | — | — |

### Slots

| Slot | Description | Props |
|---|---|---|
| #character | Custom star character (default StarFilled) | `{ index, value, allowHalf, disabled, count, focused }` |
| #characterRender | Wrap the whole star node (tooltips wrapping composes inside) | `{ node, index }` |

> ⚠️ C8-R2: antd's `character` (ReactNode) and `characterRender` (fn) are **slots only**
> in this library. `tooltips` is a data prop (string / TooltipProps object) and stays.

### Expose

| Method | Description |
|---|---|
| focus() | Focus (no-op when disabled) |
| blur() | Blur (no-op when disabled) |

## Design notes

- **Vue-native rebuild of the rc-rate 1.0.1 core** (Rate + Star + util.getOffsetLeft).
- **cleanedValue**: after an allowClear reset the cleared value is remembered; the hover
  guard `nextHoverValue !== cleanedValue` prevents flicker when hovering the same value.
- **tooltips × characterRender composition**: in antd a user characterRender **overrides**
  the tooltip wrapping (JSX spread order); here slots compose (Tooltip inside, user slot
  outside) — registered as INTENDED.
