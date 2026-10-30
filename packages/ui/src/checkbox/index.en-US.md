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

See [`demo/`](./demo) (8, covering the main antd scenarios.

Current native contract (2026-10-30): `change(event: Event, checked: boolean)` emits the actual event and requested checked snapshot; `update:checked` emits a boolean. Group change/update:value emit scalar value arrays. Rejected controlled proposals restore actual checked/indeterminate DOM properties and never become accepted values on release. DOM handles are nullable. Current Provider semantics, native style strings/arrays, dynamic skipGroup registration and native form values are supported. The old target/nativeEvent wrapper is removed.

## API

### Checkbox

| Prop | Description | Type | Default |
|---|---|---|---|
| checked | Controlled checked state | `boolean` | — |
| defaultChecked | Initial checked state | `boolean` | `false` |
| indeterminate | Indeterminate state (affects style and `input.indeterminate`) | `boolean` | `false` |
| disabled | Disabled (`props ?? group.disabled ?? DisabledContext`) | `boolean` | — |
| value | ⚠️ Not a valid prop outside a Group (usage warning); option value inside | `string \| number \| boolean` | — |
| skipGroup | Detach from Group management | `boolean` | `false` |
| name / id / tabIndex / required / autoFocus / title | Native attributes | — | — |
| @change | Native event and requested checked snapshot | `(event: Event, checked: boolean)` | — |
| @click / @mouseenter / @mouseleave / @focus / @blur / @keydown / @keypress | Passthrough (onClick is bubble-locked) | — | — |
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
| class / style | Root attributes | — | — |

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
