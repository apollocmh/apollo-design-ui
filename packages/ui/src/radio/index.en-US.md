---
category: Data Entry
title: Radio
subtitle: Radio
---

Select one scalar option with RadioGroup / Radio.Group. Use RadioButton / Radio.Button or Group optionType="button" for button presentation.

## API

### Radio / RadioButton

| Property | Description | Type | Default |
|---|---|---|---|
| checked / defaultChecked | Controlled value / local initial value; supports v-model:checked | boolean | — / false |
| value | Scalar identity within Group; native input value outside Group | string / number / boolean | — |
| disabled | Local value takes precedence over Group and ConfigProvider; explicit false is respected | boolean | — |
| title | Native label title | string | — |
| id / name / tabIndex / required / autoFocus | Input attributes; Group owns name, autoFocus focuses on mount | Native attributes | — |
| prefixCls | DOM prefix; custom prefixes require matching static CSS | string | apollo-radio |
| classNames / styles | root (label), icon and label regions; object or ({ props }) => object | Semantic object/function | — |

The input type is fixed to radio. The unused skipGroup, type and standalone optionType declarations have been removed; Group optionType remains.

### RadioGroup

| Property | Description | Type | Default |
|---|---|---|---|
| value / defaultValue | Controlled value / local initial scalar; supports v-model:value | RadioValue (string / number / boolean) | — |
| options | Nonempty options take priority over the default slot | (string / number / RadioOptionItem)[] | [] |
| disabled | Group disabled state; an explicit option disabled value takes precedence | boolean | — |
| name | Native name shared by all child inputs; omitted names are unique per Group | string | Generated |
| optionType | Dot / button presentation; explicit RadioButton retains its presentation | default / button | default |
| buttonStyle | Button fill | outline / solid | outline |
| size | Shared SizeType; medium and middle are the default size | small / medium / middle / large | Current Provider size |
| orientation / vertical | Layout direction; orientation takes precedence | horizontal / vertical; boolean | Horizontal |
| block | Fill the container | boolean | false |
| id / role / prefixCls | Root attributes and prefix | string | — / radiogroup / apollo-radio |

RadioOptionItem retains label, scalar value, style, className, disabled, title, id and required. Its onChange(event, checked) receives the native Radio notification. Numbers, strings and booleans retain their distinct identities.

### Emits

| Component | Event | Payload |
|---|---|---|
| Radio / Button | update:checked | checked: boolean |
| Radio / Button | change | event: Event, checked: boolean (requested snapshot) |
| Radio / Button | click / mouseenter / mouseleave | Native MouseEvent; hover targets label, click fires once |
| Radio / Button | focus / blur | Native input FocusEvent |
| Radio / Button | keydown / keypress | Native input KeyboardEvent |
| Group | update:value | value: RadioValue |
| Group | change | value: RadioValue, event: Event; only when the value changes |
| Group | mouseenter / mouseleave | Native root MouseEvent |
| Group | focus / blur | Native FocusEvent from the root or descendants |

Notifications use Vue emits. RadioChangeEvent is an Event alias with no synthetic target or nativeEvent wrapper. Radio supports @change.stop. Group change has a business value first; use its second event argument to stop native propagation. In h(), use onKeydown / onMouseenter; templates use @keydown / @mouseenter.

Controlled updates are proposals. Rejection restores the accepted DOM state, including siblings automatically unchecked by native Group activation. Releasing control retains the last accepted value. Input, wrapper and semantic props.checked share that state.

### Slots, attrs and references

Radio / Button default slots accept text, 0, arrays, Fragments and Vue nodes. Empty values, booleans and comments do not create an empty label region. Group default slots contain custom Radio / Button controls; nonempty options take priority.

Radio / Button class and native StyleValue target the outer label; other native attrs target input, while title targets label. Group attrs, class, style and native listeners target its div. Business props stay off the DOM. Native capture listeners coexist with owned focus notifications.

| Reference | Exposed members |
|---|---|
| Radio / Button | focus(options?), blur(), input: HTMLInputElement or null; nativeElement: HTMLElement or null (icon span) |
| Group | nativeElement: HTMLDivElement or null |

These are actual Vue template references; handles are null before mount and after teardown. Button forwards the actual Radio handle and notifications.

Native Tab, Space and arrow keys handle navigation/selection and skip disabled options. Native keydown cancellation remains effective. Surviving keyed options retain focus through reorder; removed controls do not reclaim focus. Use separate Groups for independent choices; generated names do not interfere.

## Provider and tokens

Current ConfigProvider.components.radio className/style/classNames/styles merge with local semantic styles and native root style. Direction, disabled state, size and configuration replacement/withdrawal remain reactive.

Current theme tokens, algorithms and theme.components.Radio project to variables on actual Group and Radio/Button roots. All sixteen tokens are consumed by static CSS. radioSize / dotSize remain unitless; numeric spacing becomes px. Current wireframe derives dotSize, radioColor and radioBgColor. Withdrawal restores current defaults.

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


Static CSS retains fallback values. Native root --apollo-radio-* overrides have final priority. Custom prefixCls changes DOM and component variable names; it does not generate CSS selectors at runtime.
