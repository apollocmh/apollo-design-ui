---
category: Data Entry
title: Checkbox
subtitle: Checkbox
---

Select one or more from a set of options.

## When To Use

- Used to select multiple options from a set.
- A single checkbox alone expresses two states (use `indeterminate` for half-checked).

## Examples

See [`demo/`](./demo) (8, one-to-one with antd non-debug demos).

## API

### Checkbox

| Prop | Description | Type | Default |
|---|---|---|---|
| checked | Controlled checked state | `boolean` | — |
| defaultChecked | Initial checked state | `boolean` | `false` |
| indeterminate | Indeterminate state (affects style and `input.indeterminate`) | `boolean` | `false` |
| disabled | Disabled (`props ?? group.disabled ?? DisabledContext`) | `boolean` | — |
| value | ⚠️ Not a valid prop outside a Group (usage warning); option value inside | `unknown` | — |
| skipGroup | Detach from Group management | `boolean` | `false` |
| name / id / tabIndex / required / autoFocus / title | Native attributes | — | — |
| onChange | Change callback | `(e: CheckboxChangeEvent) => void` | — |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur / onKeyDown / onKeyPress | Passthrough (onClick is bubble-locked) | — | — |
| classNames / styles | Semantic slots `{ root, icon, label }` (object or function) | — | — |

### Checkbox.Group

| Prop | Description | Type | Default |
|---|---|---|---|
| options | Options (string/number ⇒ `{label, value}`; nullish values filtered) | `(string \| number \| CheckboxOptionType)[]` | `[]` |
| value / defaultValue | Controlled / uncontrolled selected values | `T[]` | `[]` |
| onChange | Callback (sorted by options/registration order, removed values filtered) | `(checkedValue: T[]) => void` | — |
| disabled | Disable the whole group (option-level `disabled` wins) | `boolean` | — |
| name | `name` of all inputs (also lands on the root div) | `string` | — |
| role | Root role | `string` | `'group'` |
| className / rootClassName / style | Root attributes | — | — |

### Slots

| Name | Description |
|---|---|
| default | Checkbox text (isRenderable: `0` renders, `false`/`''` don't) |
| Group default | Custom child Checkboxes (mutually exclusive with options) |

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLElement \| null` |
| input | `HTMLInputElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

Group's ref is `HTMLDivElement`.

## Theme (Component Token)

None — Checkbox has no Component Token (same as antd); styles consume alias tokens
(size = `controlInteractiveSize`). Use semantic `classNames` / `styles` instead.
