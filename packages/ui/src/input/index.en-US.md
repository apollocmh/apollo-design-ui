---
category: Components
group: 数据录入
title: Input
---

# Input

A basic widget for getting user input. Current scope: `Input`, `TextArea`,
`Input.Password`, `Input.Group`. `Input.Search` and `Input.OTP` are deferred.

## Examples

<code src="./demo/basic.vue">Basic</code>
<code src="./demo/size.vue">Sizes</code>
<code src="./demo/presuffix.vue">Prefix & suffix</code>
<code src="./demo/allow-clear.vue">allowClear</code>
<code src="./demo/show-count.vue">showCount</code>
<code src="./demo/textarea.vue">TextArea</code>
<code src="./demo/password.vue">Password</code>
<code src="./demo/variant-status.vue">Variants & status</code>

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

`visibilityToggle` (`false` or `{ visible, onVisibleChange, tabIndex, action }`),
`iconRender(visible)`; everything else is forwarded to Input.

## Notes

- No trimming happens during IME composition; one `change` is emitted on `compositionend`.
- The clear button emits a `change` whose `target.value` is always an empty string.
- `Input.Group` is deprecated — use `Space.Compact`.
