---
category: Data Entry
title: Radio
subtitle: Radio
---

Select a single option from a set.

## When To Use

- When you need to pick **exactly one** item out of several options.
- With `Radio.Group`, the selected value is managed through `value` / `defaultValue`.
- Use `optionType="button"` (or `Radio.Button`) for a button-like appearance.

## Examples

See [`demo/`](./demo) (14 demos, one-to-one with antd's non-debug demos).

## API

### Radio

| Property | Description | Type | Default |
|---|---|---|---|
| checked | Whether the radio is selected (controlled) | `boolean` | — |
| defaultChecked | Initial selected state | `boolean` | `false` |
| value | Compared with `Radio.Group`'s `value` by **equality** inside a group; outside a group it is just the native input value | `string \| number \| boolean` | — |
| disabled | Disabled state (`props ?? group.disabled ?? DisabledContext`) | `boolean` | — |
| skipGroup | Skip the management of `Radio.Group` | `boolean` | `false` |
| title | Tooltip text (rendered on the **label**) | `string` | — |
| name / id / tabIndex / required / autoFocus | Native attributes (rendered on the `<input>`) | — | — |
| optionType | ⚠️ Only valid inside `Radio.Group`; passing it to `Radio` triggers a usage warning | `'default' \| 'button'` | — |
| onChange | Callback when the value changes | `(e: RadioChangeEvent) => void` | — |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur / onKeyDown / onKeyPress | Pass-through (`onClick` is bubble-locked) | — | — |
| classNames / styles | Semantic slots `{ root, icon, label }` (object or function) | — | — |

### RadioChangeEvent

`{ target: { ...props, type: 'radio', checked }, stopPropagation, preventDefault, nativeEvent }`

### Radio.Group

| Property | Description | Type | Default |
|---|---|---|---|
| options | Options (string/number ⇒ `{label, value}`) | `(string \| number \| RadioOptionItem)[]` | `[]` |
| value / defaultValue | Selected value (controlled / uncontrolled, a **scalar**) | `string \| number \| boolean` | — |
| onChange | Callback fired only when the value **actually changes** (clicking the selected item does not fire) | `(e: RadioChangeEvent) => void` | — |
| disabled | Disable the whole group (per-option `disabled` wins) | `boolean` | — |
| name | `name` for all inputs; a single generated value is used when omitted | `string` | auto |
| optionType | Appearance of children: `default` dot / `button` | `'default' \| 'button'` | `'default'` |
| buttonStyle | Fill style for the button appearance | `'outline' \| 'solid'` | `'outline'` |
| size | Size for the button appearance | `'large' \| 'middle' \| 'small'` | — |
| vertical | Stack vertically (`orientation` wins) | `boolean` | `false` |
| orientation | Layout direction (wins over `vertical`) | `'horizontal' \| 'vertical'` | — |
| block | Fit to the parent width | `boolean` | `false` |
| role | Root role | `string` | `'radiogroup'` |
| className / rootClassName / style / id | Root attributes | — | — |
| onMouseEnter / onMouseLeave / onFocus / onBlur | Root events | — | — |

### Radio.Button

`Radio.Button` = `RadioButton`: it only provides the `optionType='button'` context and renders
**no DOM of its own**. Its props are identical to `Radio`.

### Slots

| Name | Description |
|---|---|
| default | Radio content (`isRenderable` semantics: `0` renders, `false`/`''` does not) |
| Group default | Custom child radios (mutually exclusive with `options`; `options` wins when non-empty) |

### Events

| Event | Description | Payload |
|---|---|---|
| update:checked | `v-model:checked` channel (emitted together with `onChange`) | `boolean` |
| update:value | `v-model:value` channel of Group (emitted together with `onChange`) | `string \| number \| boolean` |

## Ref

| Name | Type |
|---|---|
| nativeElement | `HTMLElement \| null` |
| input | `HTMLInputElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

The Group ref is an `HTMLDivElement`. `Radio.Button`'s ref is forwarded to the inner `Radio`.

## Theme (Component Token)

16 tokens, one-to-one with antd's `ComponentToken` interface (exposed as `--apollo-radio-*`).

| Token | Description | Default |
|---|---|---|
| radioSize | Radio size | `16` (unitless) |
| dotSize | Dot size | `6` (unitless) |
| dotColorDisabled | Disabled dot color | `colorTextDisabled` |
| buttonSolidCheckedColor | Text color of checked solid button | `colorTextLightSolid` |
| buttonSolidCheckedBg | Background of checked solid button | `colorPrimary` |
| buttonSolidCheckedHoverBg | Hover background of checked solid button | `colorPrimaryHover` |
| buttonSolidCheckedActiveBg | Active background of checked solid button | `colorPrimaryActive` |
| buttonBg | Button background | `colorBgContainer` |
| buttonCheckedBg | Checked button background | `colorBgContainer` |
| buttonColor | Button text color | `colorText` |
| buttonCheckedBgDisabled | Checked + disabled button background | `controlItemBgActiveDisabled` |
| buttonCheckedColorDisabled | Checked + disabled button text color | `colorTextDisabled` |
| buttonPaddingInline | Horizontal padding of button | `padding - lineWidth` |
| wrapperMarginInlineEnd | Margin right of Radio button | `marginXS` |
| radioColor | Dot color (wireframe branch) | `colorWhite` |
| radioBgColor | Checked background (wireframe branch) | `colorPrimary` |

> ⚠️ `radioSize` / `dotSize` are **unitless** constants and do not scale with the theme; the
> other 14 are alias-derived `var(--apollo-*)` values. With the zero-runtime architecture,
> override the CSS variables to customize:

```css
.my-scope .apollo-radio-group,
.my-scope .apollo-radio-wrapper {
  --apollo-radio-radio-size: 20;
  --apollo-radio-button-bg: #f6ffed;
}
```

## FAQ

**Why is the outer `-wrapper-checked` class missing with `defaultChecked`?**
That is upstream behaviour (the wrapper class is driven by the `checked` prop / group value,
not by the uncontrolled internal state) and we mirror it verbatim — see `README.md` §5 and
`COMPATIBILITY.md` §9.2.1.
