---
category: Components
group: 数据录入
title: Input
subtitle: Input
---

# Input

A basic widget for getting user input. Includes `Input`, `TextArea`,
`Input.Password`, `Input.Group`, `Input.Search`, and `Input.OTP`.

## Examples

<code src="./demo/basic.vue">Basic</code>
<code src="./demo/size.vue">Sizes</code>
<code src="./demo/presuffix.vue">Prefix & suffix</code>
<code src="./demo/allow-clear.vue">allowClear</code>
<code src="./demo/show-count.vue">showCount</code>
<code src="./demo/textarea.vue">TextArea</code>
<code src="./demo/password.vue">Password</code>
<code src="./demo/variant-status.vue">Variants & status</code>
<code src="./demo/search.vue">Search</code>
<code src="./demo/otp.vue">OTP</code>

## API · Input

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| value | Controlled value (`v-model:value`) | string | - |
| defaultValue | Initial value | string | - |
| size | Size | `large` \| `middle` \| `small` | - |
| disabled / readOnly | Disabled / read-only | boolean | false |
| variant | Variant | `outlined` \| `filled` \| `borderless` \| `underlined` | `outlined` |
| status | Validation status | `error` \| `warning` | - |
| prefix / suffix | Affix nodes | VNodeChild | - |
| allowClear | Clear button | boolean \| `{ clearIcon, disabled }` | false |
| showCount | Show character count | boolean \| `{ formatter }` | false |
| count | Counting strategy / exceed formatter | object | - |
| maxLength | Native maxLength | number | - |
| htmlSize | Native size | number | - |
| classNames / styles | Semantic customization | object \| function | - |
| ~~bordered~~ | **Deprecated** use `variant` | boolean | true |
| ~~addonBefore / addonAfter~~ | **Deprecated** use `Space.Compact` | VNodeChild | - |

### Events

`change` (`e.target.value` is the **trimmed** value), `press-enter`, `clear`,
`focus`, `blur`, `composition-start` / `composition-end`.

### Ref

`focus(option)` (with `cursor: 'start' \| 'end' \| 'all'`), `blur()`,
`setSelectionRange()`, `select()`, `input`, `nativeElement`.

## API · TextArea

No prefix/addon; adds `autoSize` (`true` or `{ minRows, maxRows }`), `rows`,
`onResize`; semantic slots `{root, textarea, clear, count}`.

## API · Input.Password

`action` (`'click' | 'hover'`, default `'click'` — the **antd 6.6.4 top-level API**),
`visibilityToggle` (`false` or `{ visible, onVisibleChange, tabIndex, action }`; its
`action` is a local extension and the top-level `action` wins when both are given),
`iconRender(visible)`.

`InputPasswordProps extends InputProps` (with `classNames` / `styles` omitted and
re-declared for Password's own slots) ⇒ `allowClear` / `readOnly` / `maxLength` /
`showCount` / `status` / `prefix` and the rest of Input's public props are typed too.

## API · Input.Search

Adds to Input:

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| enterButton | `false` icon / `true` primary / text / custom node | boolean \| string \| VNodeChild \| Component | false |
| searchIcon | Custom search icon | VNodeChild \| Component | `<SearchOutlined />` |
| loading | Button loading; also blocks Enter search | boolean | false |
| onSearch | `(value, event, { source })`; `source='clear'` when cleared | function | - |
| inputPrefixCls | Prefix for the inner Input | string | - |
| addonAfter | Node appended after the button | VNodeChild \| Component | - |

Semantic slots: `{ root, input, prefix, suffix, clear, count, button }`.

## API · Input.OTP

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| length | Number of cells | number | 6 |
| value / defaultValue | Controlled / initial value (`v-model:value`) | string | - |
| onChange | Fires when all cells are filled and the value changed | `(value: string) => void` | - |
| onInput | Fires on every cell change (array) | `(value: string[]) => void` | - |
| formatter | Format the value (e.g. uppercase) | `(value: string) => string` | - |
| separator | Separator between cells (or `(index) => VNode`) | VNodeChild \| function | - |
| mask | Mask (`true` = •, or a single character) | boolean \| string | false |
| type / inputMode / autoComplete | Passed to each native input | string | - |
| autoFocus | Focus the first cell | boolean | false |
| classNames / styles | Semantic slots `{ root, input, separator }` | object \| function | - |

Ref: `focus()`, `blur()`, `nativeElement`.

## Notes

- No trimming happens during IME composition; one `change` is emitted on `compositionend`.
- The clear button emits a `change` whose `target.value` is always an empty string.
- `Input.Group` is deprecated — use `Space.Compact`.
