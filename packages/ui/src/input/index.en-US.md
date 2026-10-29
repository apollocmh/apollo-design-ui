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
| prefix / suffix | Affix content; present prefix/suffix slots win, including empty slots | VNodeChild / Component | - |
| allowClear | Clear button | boolean \| `{ clearIcon, disabled }` | false |
| showCount | Show character count | boolean \| `{ formatter }` | false |
| count | Counting strategy / exceed formatter | object | - |
| maxLength | Native maxLength | number | - |
| htmlSize | Native size | number | - |
| type | Native input type | string | text |
| placeholder / autoComplete | Native placeholder / autocomplete | string | - |
| autoFocus / hidden | Autofocus / hide the logical root | boolean | false |
| prefixCls | Input class prefix | string | Provider input prefix |
| ~~clearIcon~~ | **Deprecated** use allowClear.clearIcon; absent object icons still fall back to this field and Provider | VNodeChild / Component | - |
| classNames / styles | Semantic customization | object \| function | - |
| ~~bordered~~ | **Deprecated** use `variant` | boolean | true |
| ~~addonBefore / addonAfter~~ | **Deprecated** use `Space.Compact` | VNodeChild | - |

### Events

`update:value(value: string)` and `change(event: Event)` commit ordinary edits. The event targets the actual editor and its value includes count normalization. IME retains the native draft, commits model/change once on compositionend, and deduplicates the following input. Native `input` also reports composition input.

`press-enter(event: KeyboardEvent)` is suppressed during composition. Clear writes the empty editor/model, emits `clear(event: MouseEvent)`, then dispatches a native input on the actual editor whose processing emits change. Listen to clear instead of testing change.type for click.

Native focus, blur, keydown, keyup, mousedown, compositionstart/compositionend listeners reach the editor. Existing composition-start/composition-end listener names remain available. Semantic and native events support listener arrays and Vue .once.

### Ref

`focus(option)` (with `cursor: 'start' \| 'end' \| 'all'`), `blur()`,
`setSelectionRange()`, `select()`, `input`, `nativeElement`. input is the actual editor. nativeElement is the logical group/affix/input root that owns root class/style. Dynamic affixes, clear and count retain the editor, focus and selection.

## API · TextArea

Shares value/defaultValue, size, disabled/readOnly, variant/status, allowClear/clearIcon, count/showCount, maxLength, placeholder, autoComplete, hidden and semantic events with Input. TextArea has no prefix/suffix/addon, htmlSize or type API. Native textarea attrs, including name, id, aria-* and autofocus, reach the editor.

Adds autoSize (`true` or `{ minRows, maxRows }`), rows and resize({width,height}). Resize reports the editor border box for autoSize, native dragging and caller size changes, deduplicates equal sizes and cleans up observers/document listeners on unmount.

Class regions are root, textarea, clear, count, affixWrapper and variant; style regions are root, textarea, clear and count. Ref: focus, blur, resizableTextArea.textArea and the logical nativeElement.

## API · Input.Password

action is click (default) or hover. Hover toggles on entering the button boundary; descendant mouseover does not toggle again. The native button also supports keyboard activation.

visibilityToggle defaults to true, or accepts false / {visible,onVisibleChange,tabIndex,action}. visible controls visibility; top-level action wins. Use `#icon="{ visible }"` for icon content and classNames.icon for the button. Prefix/suffix slots match Input; the suffix slot replaces user suffix content while visibilityToggle owns the toggle button.

Password inherits effective Input fields and adds inputPrefixCls; prefixCls belongs to Password. Visibility owns password/text, so the ineffective type field is removed. iconRender migrates directly to the icon scoped slot. See docs/migrations/input-contracts.md in the repository.

## API · Input.Search

Adds to Input:

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| enterButton | `false` icon / `true` primary / text / custom node | boolean \| string \| VNodeChild \| Component | false |
| searchIcon | Custom search icon | VNodeChild \| Component | `<SearchOutlined />` |
| loading | Blocks Enter and button search, including custom buttons | boolean | false |
| onSearch | `(value, event, { source })`; `source='clear'` when cleared | function | - |
| inputPrefixCls | Prefix for the inner Input | string | - |
| addonAfter | Node appended after the button | VNodeChild \| Component | - |

Semantic regions: `{ root, input, prefix, suffix, clear, count, button }`. Native custom buttons retain disabled; custom components must forward attrs/state. Content VNodes and arrays are rendered inside the owned button.

Search keeps Input type, defaults to search, and forwards prefix/suffix slots. search(value,event,{source}) supports .once; source is input or clear. nativeElement is the outer Compact root, while input is the editor. Native class/style/hidden and data attrs target the outer root; other native fields target the editor.

## API · Input.OTP

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| length | Positive integer cell count, at least 1; nonfinite values fall back to 6 | number | 6 |
| value / defaultValue | Controlled / initial value (`v-model:value`) | string | - |
| onChange | Fires when all cells are filled and the value changed | `(value: string) => void` | - |
| onInput | Fires on every cell change (array) | `(value: string[]) => void` | - |
| formatter | Format the value (e.g. uppercase) | `(value: string) => string` | - |
| separator | Static content including zero; use `#separator="{ index }"` for dynamic content | VNodeChild | - |
| mask | Mask (`true` = •, or a single character) | boolean \| string | false |
| type / inputMode / autoComplete | Passed to each native input | string | - |
| autoFocus | Focus the first cell | boolean | false |
| classNames / styles | Semantic slots `{ root, input, separator }` | object \| function | - |

Every settled edit updates v-model:value, including partial values. input emits cells; change emits only a changed complete value. Rejected controlled proposals retain the owner value. Formatting happens before the Unicode code-point clamp. Paste focuses the resulting cell; horizontal arrows follow RTL direction.

Ref: focus, blur, nativeElement (the OTP container).

## API · Input.Group

Group retains prefixCls, size, compact and the default slot. compact changes group layout; size supplies a child default. It has no value model, semantic events or editor Ref. Group is deprecated; use Space.Compact.

## Theme, sizing and styles

Default fonts, nonnegative padding and focus shadows consume the current theme. `theme.components.Input` supports the existing 19 fields: `lineWidthFocus`, `paddingBlock/SM/LG`, `paddingInline/SM/LG`, `addonBg`, `activeBorderColor`, `hoverBorderColor`, `activeShadow`, `errorActiveShadow`, `warningActiveShadow`, `hoverBg`, `activeBg`, `inputFontSize/SM/LG`, and `inputAffixPadding`. Lengths accept numbers (px) or CSS length strings, including zero. Removing an override restores the current theme default. `inputAffixPadding` controls affix spacing. The public `prepareInputComponentToken` still prepares the supplied numeric snapshot.

Size priority is explicit component `size` → nearest `Space.Compact` / `Input.Group` → `ConfigProvider.componentSize`. Group supplies a default; an explicit child size wins. Input keeps its natural line box and preserves explicit fonts, line heights and padding. Default small/middle/large heights are 24/32/40px; compact heights are 22/28/35px. A natural small line box can exceed `controlHeightSM`. Different control types do not promise identical outer heights. Search's default button stretches naturally without a Search-owned minimum height; caller `height` / `min-height` follows their CSS. TextArea retains rows, its existing minimum height and autoSize constraints. autoSize compares actual sizing inputs after theme, size, control/ancestor class or style, width and completed layout transitions change. Unrelated styles skip measurement; disabling or unmounting cleans up observation and events.

Semantic classNames/styles callbacks see current complete props and effective size, disabled, variant and status. Component theme data is merged before explicit semantic styles and native `style`. Provider `components.input/textArea/inputPassword.style` targets the logical component root; `styles.input` / `styles.textarea` targets the native control. Search and OTP root styles target their container; use `styles.input` for their actual input nodes. Existing stylesheet `--apollo-input-*` overrides remain effective. Explicit component theme fields are supplied as inline variables on the logical root.

An explicit empty `ThemeProvider :theme="{}"` (or `createThemeContext({})`) remains a default theme source and resets defaults within an outer CSS theme scope. Without an active source, Input preserves CSS-only variable inheritance. A ConfigProvider without a theme continues to consume the nearest active source and does not overwrite a CSS-only scope with default data.

## Notes

- No trimming happens during IME composition; one `change` is emitted on `compositionend`.
- Clear and visibility toggles use keyboard accessible native buttons with current locale names. Explicit null/false/zero icons stop fallback; undefined continues fallback. Empty/disabled/read-only clear buttons cannot activate.
- The clear button emits a `change` whose `target.value` is always an empty string.
- `Input.Group` is deprecated — use `Space.Compact`.
