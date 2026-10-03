---
category: Data Entry
title: Mentions
subtitle: Mention
---

Used to mention someone or something in an input, commonly seen in publishing, chat, or comment boxes.

## When To Use

- You need to "@ someone" or "# a tag" inside a text input and pop up candidates.
- Candidates may come from an **async** source (use `loading` + `onSearch`).

## Examples

See [`demo/`](./demo) (16 demos, one-to-one with antd's user-facing demos).

| demo | Content |
|---|---|
| `basic` | Basic (`options` driven) |
| `prefix` | Multiple trigger tokens (`['@', '#']`) + `onSearch` switching data |
| `autoSize` | Height auto size |
| `autosize-textarea-debug` | The two `style.resize` values |
| `allowClear` | Clear button (default / custom icon / multiline) |
| `async` | Async candidates (`loading` + `onSearch`) |
| `placement` | Open upwards |
| `readonly` | `disabled` and `readOnly` |
| `size` | `large` / default / `small` |
| `status` | `error` / `warning` |
| `variant` | `outlined` / `filled` / `borderless` / `underlined` |
| `form` | Work with `Form` (controlled + validation) |
| `popupRender` | Customize the dropdown |
| `style-class` | `classNames` / `styles` as object or function |
| `component-token` | Component token debug (`dropdownHeight`, …) |
| `render-panel` | Static panel (debug only, do not use in production) |

## API

### Props

| Property | Description | Type | Default | Config Provider |
|---|---|---|---|---|
| value | Controlled value (with `v-model:value`) | `string` | — | × |
| defaultValue | Initial value of an uncontrolled component | `string` | — | × |
| options | Candidates (data driven) | `MentionsOptionProps[]` | — | × |
| prefix | Trigger token, array supported | `string \| string[]` | `'@'` | × |
| split | Token separator (also the default "valid search" criterion) | `string` | `' '` | × |
| filterOption | Filter candidates. `false` disables filtering | `false \| ((input, option) => boolean)` | `option.value` contains the input (case-insensitive) | × |
| validateSearch | Whether the search text is valid | `(text, split) => boolean` | Does not contain `split` | × |
| notFoundContent | Content shown when there is no candidate | `VNodeChild` | `renderEmpty('Select')` | ✅ (`mentions.notFoundContent`) |
| loading | Candidates are loading (shows a Spin and **Enter does not select**) | `boolean` | `false` | × |
| silent | Silent (forced true while `loading`) — Enter does not select | `boolean` | `false` | × |
| placement | Popup placement | `'top' \| 'bottom'` | `'bottom'` | × |
| getPopupContainer | Popup mount point | `() => HTMLElement` | — | ✅ |
| popupClassName | Extra class name for the popup | `string` | — | × |
| popupRender | Customize the popup (receives the default menu) | `(menu) => VNodeChild` | — | × |
| size | Size | `'large' \| 'middle' \| 'small'` | From ConfigProvider | ✅ |
| disabled | Disabled | `boolean` | From `DisabledContext` | ✅ |
| readOnly | Read only (**no class name**, only `readonly` on the textarea) | `boolean` | `false` | × |
| status | Validation status | `'error' \| 'warning'` | From `Form.Item` | ✅ |
| variant | Variant | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | ✅ |
| allowClear | Clear button | `boolean \| { clearIcon?, disabled? }` | `false` | ✅ (`mentions.allowClear`) |
| rows | Rows of the textarea | `number` | `1` | × |
| autoSize | Height auto size | `boolean \| { minRows?, maxRows? }` | — | × |
| maxLength | Max length | `number` | — | × |
| placeholder | Placeholder (**also the accessible name**) | `string` | — | × |
| classNames | Semantic class names (`root` / `textarea` / `popup` / `suffix`), function supported | `MentionsSemanticClassNames \| ((info) => …)` | — | ✅ (`mentions.classNames`) |
| styles | Semantic styles (same 4 keys), function supported | `MentionsSemanticStyles \| ((info) => …)` | — | ✅ (`mentions.styles`) |
| prefixCls | Class name prefix | `string` | From ConfigProvider, fallback `apollo-mentions` | × |
| rootClassName | Also applied to the root element (after `className`) | `string` | — | × |
| className | Class name of the root element | `string` | — | × |
| style | Inline style of the root element | `CSSProperties` | — | × |

#### MentionsOptionProps

| Property | Description | Type | Default |
|---|---|---|---|
| value | Value filled back when selected | `string` | — |
| label | Display content | `VNodeChild` | — |
| disabled | Not selectable (↑/↓ skip it) | `boolean` | `false` |
| className | Class name of the option | `string` | — |
| style | Inline style of the option | `CSSProperties` | — |
| key | Only used for `data-menu-id` | `string \| number` | `value` |

### Events

| Name | Description | Arguments |
|---|---|---|
| update:value | Value changed (with `v-model:value`) | `(value: string)` |
| change | Value changed (**receives a string, not an event**) | `(value: string)` |
| select | A candidate is selected | `(option: MentionsOptionProps, prefix: string)` |
| search | Search text changed (entry point for async loading) | `(text: string, prefix: string)` |
| popupScroll | Popup scrolled | `(event: Event)` |
| pressEnter | Enter pressed while **not** measuring | `(e: KeyboardEvent)` |
| resize | Size changed (with `autoSize`) | `({ width, height })` |

### Slots

| Name | Description | Arguments |
|---|---|---|
| default | Candidates in `Mentions.Option` form (**deprecated**, use `options`) | — |

### Expose (template ref)

| Name | Description | Type |
|---|---|---|
| focus | Focus | `() => void` |
| blur | Blur | `() => void` |
| textarea | Native `<textarea>` (**upstream marks it as "may not work as expected"**) | `HTMLTextAreaElement \| null` |
| nativeElement | Root element | `HTMLElement \| null` |

### Static members

| Name | Description |
|---|---|
| `Mentions.Option` | @deprecated, use `options` (also available as the named export `MentionsOption`) |
| `Mentions.getMentions(value, config?)` | **Pure function**: parse mention entities from text |
| `Mentions._InternalPanelDoNotUseOrYouWillBeFired` | Static panel (debug / docs only) |

## Keyboard & Accessibility

Focus **always stays in the textarea** (the candidate list is display-only,
`role="menu"` + `role="menuitem"`):

| Key | Behavior |
|---|---|
| ↑ / ↓ | Move the highlight (**skips `disabled` items**, wraps around) |
| Enter | Select the highlighted item and fill it back (no-op when `silent`) |
| Esc | Close the candidate panel |

⚠️ The accessible name of the textarea is the **consumer's** responsibility
(`placeholder` / `aria-label` / `Form.Item` label), matching antd — the component
cannot guess what the text is about.

## Design guidance

- When there are more than ~10 candidates, use `onSearch` for async filtering (see the `async` demo).
- `split` marks the end of a mention: the default space means `afc163` is one complete mention in `@afc163 hello`.
- When filling back, a `split` is inserted before the token if the preceding text lacks one, and the
  duplicated head shared with the candidate is removed.
