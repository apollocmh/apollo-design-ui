---
category: Components
group: 数据录入
title: InputNumber
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
| value | Current value (`v-model:value`) | number \| string | - |
| defaultValue | Initial value | number \| string | - |
| min | Min value | number \| string | - |
| max | Max value | number \| string | - |
| step | Step; decimals supported | number \| string | `1` |
| precision | Precision; `formatter` wins when both set | number | - |
| formatter | Display formatter | (value, info: { userTyping, input }) => string | - |
| parser | Parse back from `formatter` | (string) => string | - |
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

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| change | Value change (emitted together with `update:value`) | (value: number \| string \| null) |
| press-enter | Enter key pressed | (e: KeyboardEvent) |
| step | Step via button / keyboard / wheel | (value: number, info: { offset, type, emitter }) |

### Ref

| Name | Description |
| --- | --- |
| focus(option) | Focus; `option.cursor` is `'start'` \| `'end'` \| `'all'` |
| blur() | Blur |
| nativeElement | Root DOM element |
