---
category: Components
group: 数据录入
title: InputNumber
subtitle: Input number
---

# InputNumber

Enter a number within certain range with the mouse or keyboard.

## Examples

<code src="./demo/basic.vue">Basic</code>
<code src="./demo/size.vue">Sizes</code>
<code src="./demo/disabled.vue">Disabled</code>
<code src="./demo/digit.vue">High precision</code>
<code src="./demo/formatter.vue">Format</code>
<code src="./demo/keyboard.vue">Keyboard</code>
<code src="./demo/variant.vue">Variants</code>
<code src="./demo/spinner.vue">Spinner</code>
<code src="./demo/out-of-range.vue">Out of range</code>
<code src="./demo/presuffix.vue">Prefix & suffix</code>
<code src="./demo/status.vue">Status</code>
<code src="./demo/style-class.vue">Semantic styles</code>

## API

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| value | Current value (`v-model:value`); `null` means empty | number \| string \| null | - |
| defaultValue | Initial value | number \| string | - |
| min | Min value | number \| string | - |
| max | Max value | number \| string | - |
| step | Step; decimals supported | number \| string | `1` |
| precision | Precision; `formatter` wins when both set | number | - |
| formatter | Display formatter | (value, info: { userTyping, input }) => string | - |
| parser | Parse back from `formatter` | `(displayValue: string \| undefined) => string \| number` | - |
| disabled | Disabled | boolean | `false` |
| readOnly | Read-only | boolean | `false` |
| keyboard | Enable keyboard behavior | boolean | `true` |
| controls | Show step buttons / custom icons | boolean \| { upIcon, downIcon } | `true` |
| mode | Input or spinner | `'input'` \| `'spinner'` | `'input'` |
| stringMode | String value mode for high precision | boolean | `false` |
| changeOnBlur | Trigger `change` on blur to clamp value | boolean | `true` |
| changeOnWheel | Step with mouse wheel when focused | boolean | `false` |
| decimalSeparator | Decimal separator | string | - |
| placeholder | Placeholder | string | - |
| prefix | Prefix node | VNodeChild | - |
| suffix | Suffix node | VNodeChild | - |
| size | Size | `large` \| `medium` \| `small` | - |
| status | Validation status | `'error'` \| `'warning'` | - |
| variant | Variant | `outlined` \| `borderless` \| `filled` \| `underlined` | `outlined` |
| autoFocus | Auto focus | boolean | `false` |
| classNames / styles | Semantic customization (root/prefix/suffix/input/actions) | - | - |
| ~~bordered~~ | **Deprecated** use `variant` | boolean | `true` |
| ~~addonBefore / addonAfter~~ | **Deprecated** use `Space.Compact` | VNodeChild | - |

### Slots

| Name | Description | Scope |
| --- | --- | --- |
| prefix | Rich prefix content; takes precedence over the `prefix` prop | None |
| suffix | Rich suffix content; takes precedence over `suffix`, retaining form feedback | None |

Slots are read during rendering and support conditional insertion/removal and reactive content. An explicitly empty slot suppresses the prop. Without a slot, content props still apply. The native input, number formatting, stepping and v-model behavior stay intact.

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| change | Value change (emitted together with `update:value`) | (value: number \| string \| null) |
| press-enter | Enter key pressed | (e: KeyboardEvent) |
| step | Step via button / keyboard / wheel | (value: number \| string, info: { offset, type, emitter }) |

`change`, `step` and `pressEnter` are declared Vue events, supporting template listeners and `.once`. `@change` and `onChange` register the same listener, receiving a number, a string in stringMode, or `null`. The wrapper forwards each event once; native DOM `change` does not reach the semantic listener. Enter during IME composition does not flush or emit `press-enter`. Native `@keydown.prevent` cancels that internal keyboard action.

### Controlled values and native attributes

When `value !== undefined`, user changes propose updates. Rejected proposals do not become local state when control is released. Setting `value` to `undefined` retains the last value received from the parent. `defaultValue` only initializes the value; explicit `null` stays empty.

Native `class`, `style` and mouse listeners target the container. `id`, `name`, `tabindex`, label/ARIA attributes, focus/blur and keyboard listeners target the input. The component owns its numeric state, spinbutton role and numeric ARIA attributes. `input` collects display text internally; use `change` / `update:value` to observe value changes.

ConfigProvider `components.inputNumber` accepts `InputNumberConfig`: `className`, flat `style`, `classNames`, `styles` and `variant`. Root styles merge in this order: Provider semantic styles, Provider flat style, component semantic styles, native `style`. Later values take precedence. Semantic callbacks receive the current resolved `size`, `disabled`, `controls` and `variant`.

### Component tokens

Configure `theme.components.InputNumber`. Dimensions accept nonnegative numbers (converted to px) or CSS lengths. Current and nested themes update reactively; removing overrides restores the current defaults. Native CSS variables in `style` take precedence.

| Token | Description |
| --- | --- |
| controlWidth | Input width; default `90px` |
| handleWidth / handleFontSize | Step area width and icon size |
| handleVisible | In input mode: `'auto'` shows on hover/focus; `true` always shows; `false` hides |
| handleBg / handleActiveBg / filledHandleBg | Step, pressed and filled backgrounds |
| handleHoverColor / handleBorderColor | Step hover and border colors |
| paddingBlock / paddingBlockSM / paddingBlockLG | Vertical padding for each size |
| paddingInline / paddingInlineSM / paddingInlineLG | Horizontal padding for each size |
| inputFontSize / inputFontSizeSM / inputFontSizeLG | Input font size for each size |
| inputAffixPadding | Prefix/suffix spacing |
| handleOpacity / handleVisibleWidth | Idle opacity and visible width, derived from `handleVisible` by default |

### Ref

| Name | Description |
| --- | --- |
| focus(option) | Focus; `option.cursor` is `'start'` \| `'end'` \| `'all'` |
| blur() | Blur |
| nativeElement | Root DOM element |
