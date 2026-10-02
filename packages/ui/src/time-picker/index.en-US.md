---
category: Data Entry
title: TimePicker
subtitle: Time Picker
---

To select/input a time.

## When To Use

- When the user needs to input a time, they can click the standard input box and
  select from the popup panel.
- Use `TimeRangePicker` to select a time range.

> ⚠️ **This component is a thin shell over `DatePicker`** — its class prefix and DOM all
> come from `date-picker` (`apollo-picker`). It has **no stylesheet of its own** and no
> Component Token. The only difference from `DatePicker` is that it reads the
> **`timePicker`** `ConfigProvider` config (not `datePicker`).

## Examples

See [`demo/`](./demo) (**14** demos). ⚠️ Differences from antd are listed in
`README.md` §5 (`12hours` / `interval-options` / `render-panel` are not ported).

## API

### TimePicker

| Property | Description | Type | Default |
|---|---|---|---|
| value | Current value (`v-model:value`) | `TimePickerValue` | — |
| defaultValue | Initial value (uncontrolled) | `TimePickerValue` | — |
| open | Whether the popup is open (`v-model:open`) | `boolean` | — |
| defaultOpen | Initial open state | `boolean` | — |
| format | Display format (e.g. `HH:mm:ss`; `HH:mm` shows two columns) | `DatePickerFormat` | `HH:mm:ss` |
| renderExtraFooter | Extra content at the bottom of the panel | `() => VNodeChild` | — |
| needConfirm | Commit only after clicking OK | `boolean` | `false` |
| changeOnScroll | Change the value by scrolling | `boolean` | `false` |
| disabled | Disabled | `boolean` | `false` |
| size | Size | `'small' \| 'middle' \| 'large'` | — |
| status | Validation status | `'error' \| 'warning'` | — |
| variant | Visual variant | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| allowClear | Show the clear button | `boolean \| { clearIcon?: VNodeChild }` | `true` |
| prefix | Prefix content | `VNodeChild` | — |
| suffixIcon | Suffix icon (clock by default; `null` / `false` hides it) | `VNodeChild` | — |
| placeholder | Input placeholder | `string` | `'Select time'` |
| locale | Locale (deep-merged with `ConfigProvider`) | `PickerLocale` | — |
| classNames | Semantic class names (4 flat + nested `popup`; **function form** supported) | `TimePickerSemanticValue<…>` | — |
| styles | Semantic styles (same) | `TimePickerSemanticValue<…>` | — |
| className / rootClassName / style | Extra class names and style on the root | — | — |
| getPopupContainer | Custom popup container | `(node: HTMLElement) => HTMLElement` | — |

#### ⚠️ Deprecated

| Property | Replacement |
|---|---|
| `addon` | `renderExtraFooter` (⚠️ **does** warn on the single TimePicker) |
| `popupClassName` | `classNames.popup.root` (⚠️ does **not** warn on the single one; **does** on the range) |
| `popupStyle` | `styles.popup.root` (same) |
| `bordered` | `variant` (⚠️ same asymmetry) |
| `onSelect` | `onCalendarChange` (⚠️ warns on both) |
| `dropdownClassName` | `classNames.popup.root` (⚠️ warns on both) |

> 🚨 **This table was measured**, not read off the types — see
> `tests/visual/debug/probe-time-picker-antd.mjs`. All of these carry `@deprecated` in
> the `.d.ts`, yet only some actually warn.

### TimeRangePicker

Same as `TimePicker`, plus:

| Property | Description | Type | Default |
|---|---|---|---|
| placeholder | Placeholders of both ends | `[string, string]` | — |
| separator | Separator between the two ends | `VNodeChild` | — |
| disabled | Disabled state (a single boolean applies to both) | `boolean \| [boolean, boolean]` | — |
| allowEmpty | Whether either end can be empty | `boolean \| [boolean, boolean]` | — |

⚠️ The range picker has **no** `addon`; `picker` / `showTime` are omitted on both.

### Events

| Event | Description | Arguments |
|---|---|---|
| `change` | Value changed | `(value, dateString)` |
| `update:value` | `v-model:value` | `(value)` |
| `calendarChange` | Fired on every change while selecting | `(value, dateString, info)` |
| `ok` | OK clicked | `(value)` |
| `openChange` / `update:open` | Popup open state | `(open, config?)` |
| `clear` | Clear button clicked | — |
| `focus` / `blur` | Focus | `(event, info)` |
| `panelChange` / `pickerValueChange` | Panel mode / view value | see `interface.ts` |

### Slots

The same set as `DatePicker` (a repo extension; upstream only has function props):
`prefix` / `suffixIcon` / `clearIcon` / `separator` / `panelRender` / `extraFooter` /
`cellRender` / `tagRender` / `presetRender`.

### Static members

- `TimeRangePicker` — equivalent to upstream's `TimePicker.RangePicker`;
- `TimePickerWithRange` — the `Object.assign` alias (so `TimePicker.RangePicker` is
  type-visible).

## Theme

**This component has no Component Token** (there is not a single line of style code in
`es/time-picker/`) ⇒ all visuals come from `date-picker`'s `-picker-*` styles and the
global tokens. To customize via `ConfigProvider`, use the **`timePicker`** entry
(**not** `datePicker`):

```vue
<ConfigProvider :components="{ timePicker: { classNames: { root: 'my-root' } } }">
  <TimePicker />
</ConfigProvider>
```

> ⚠️ The `timePicker` semantic slots are merged **twice** (once by the outer shell, once
> by the inner picker) ⇒ the class name appears twice. This matches upstream and is not
> a bug.
