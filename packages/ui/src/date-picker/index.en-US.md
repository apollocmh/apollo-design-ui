---
title: DatePicker
titleTemplate: '%s - @apollo-design/ui'
description: To select or input a date.
---

# DatePicker

To select or input a date.

## When To Use

- When the user needs to input a date, they can click the standard input box and pick
  from the popped-up date panel;
- Use `picker` to switch between granularities (`date` / `week` / `month` / `quarter` /
  `year` / `time`);
- Use `RangePicker` to select a date range.

## Import

```ts
import { DatePicker, RangePicker } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

<!-- TODO(G11 · examples): antd ships 30+ demos for date-picker; this repo currently only
     has `basic`. The rest will land together with the panel capabilities of
     `@apollo-design/picker`.
     ⚠️ **Do not reference demos that do not exist** — a broken link is worse than a
     missing section. -->

## API

### DatePicker

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| value (`v-model:value`) | Controlled value. `null` means "controlled and empty" | `DateType \| DateType[] \| null` | —— |
| defaultValue | Uncontrolled initial value | same as above | —— |
| picker | Granularity | `'time' \| 'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'date'` |
| mode | Current panel view granularity (handle `panelChange` yourself when controlled) | `'time' \| 'date' \| 'week' \| 'month' \| 'quarter' \| 'year' \| 'decade'` | —— |
| format | Format: string / array / mask object / **function** | `DatePickerFormat` | derived from `picker` + locale |
| showTime | Show time selection (`true` or a config object) | `boolean \| SharedTimeProps` | —— |
| showWeek | Show week number (week picker only) | `boolean` | —— |
| showToday | Show "Today" | `boolean` | `true` |
| showNow | Show "Now" in the time panel | `boolean` | `true` |
| open (`v-model:open`) | Controlled open state. `undefined` = uncontrolled | `boolean` | —— |
| defaultOpen | Uncontrolled initial open state | `boolean` | `false` |
| needConfirm | Whether an "OK" click is required. ⚠️ **Default depends on granularity**: `true` for `time` / `datetime`, `false` otherwise | `boolean` | see left |
| multiple | Multiple selection | `boolean` | `false` |
| order | Sort by date when `multiple` | `boolean` | `true` |
| presets | Shortcut options. `value` accepts a **function** (lazy) | `ValueDate[]` | —— |
| renderExtraFooter | Extra footer of the panel | `(mode) => VNodeChild` | —— |
| panelRender | Customize the whole panel | `(props: { originPanel }) => VNodeChild` | —— |
| cellRender | Customize a cell | `(current, info) => VNodeChild` | —— |
| disabledDate | Disabled dates | `(date, info) => boolean` | —— |
| minDate / maxDate | Selectable bounds. **Accepts a function** | `LimitDate` | —— |
| placeholder | Placeholder | `string` | from locale |
| locale | Locale (deep-merged with `ConfigProvider`'s `locale.DatePicker`) | `PickerLocale` | —— |
| size | Size (falls back to `ConfigProvider`) | `'small' \| 'medium' \| 'middle' \| 'large'` | —— |
| variant | Variant | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | `'outlined'` |
| status | Validation status. ⚠️ **Class name only — does not change `aria-invalid`** | `'error' \| 'warning'` | —— |
| disabled | Disabled | `boolean` | `false` |
| inputReadOnly | Read-only input (panel only, no typing) | `boolean` | `false` |
| allowClear | Allow clearing. Pass an object to customize the icon | `boolean \| { clearIcon }` | `true` |
| suffixIcon | Suffix icon | `VNodeChild` | calendar icon |
| prefix | Prefix | `VNodeChild` | —— |
| clearIcon | **deprecated** → `allowClear.clearIcon` | `VNodeChild` | —— |
| popupClassName | **deprecated** → `classNames.popup` | `string` | —— |
| popupStyle | **deprecated** → `styles.popup` | `CSSProperties` | —— |
| dropdownClassName | Same as `popupClassName` (**deprecated**) | `string` | —— |
| placement | Popup placement. Defaults by direction (LTR `bottomLeft` / RTL `bottomRight`) | `'bottomLeft' \| 'bottomRight' \| 'topLeft' \| 'topRight'` | —— |
| popupAlign | Popup align offset | `AlignType` | —— |
| builtinPlacements | Custom placement table | `Record<string, AlignType>` | 4 built-in |
| getPopupContainer | Popup mount container | `(node) => HTMLElement` | `document.body` |
| transitionName | Popup motion name | `string` | `${rootPrefixCls}-slide-up` |
| required | Native `required` (forwarded to `input[required]` and `aria-required`) | `boolean` | —— |
| name / autoComplete / id | Forwarded to the native `input` | `string` | —— |
| prefixCls | Class prefix. ⚠️ Defaults to **`apollo-picker`** (not `apollo-date-picker`) | `string` | —— |
| rootClassName | Extra class on the root node | `string` | —— |
| classNames / styles | Semantic class names / styles (**4 flat + 7 nested `popup`**). `popup` accepts a **string** (= `popup.root`) | `DatePickerSemanticAllType` | —— |

### Events

| Event | Description | Payload |
| --- | --- | --- |
| `update:value` | `v-model:value` channel | `(date)` |
| `change` | Value changed (emitted **together with** `update:value`) | `(date, dateString)` |
| `calendarChange` | Every change while picking (even before submit) | `(date, dateString, info)` |
| `ok` | "OK" clicked | `(date)` |
| `openChange` | Popup open/close | `(open, config?)` |
| `update:open` | `v-model:open` channel | `(open)` |
| `pickerValueChange` | Panel view value changed | `(date, info)`, `info.source` is `'reset' \| 'panel'` |
| `update:pickerValue` | `v-model:pickerValue` channel | `(date)` |
| `panelChange` | Panel granularity changed | `(value, mode)` |
| `clear` | Clear button clicked | —— |
| `focus` / `blur` | Focus in/out | `(event, info)` |
| `invalid` | Invalid typed value | `(invalid)` |
| `submit` | Form submit | `(event)` |
| `keydown` | Keydown (channel of the deprecated `onKeyDown`) | `(event, preventDefault)` |

### Slots

| Slot | Description | Params |
| --- | --- | --- |
| `panelRender` | Replaces the `panelRender` prop | `{ originPanel }` |
| `extraFooter` | Replaces the `renderExtraFooter` prop | `{ mode }` |
| `cellRender` | Replaces the `cellRender` prop | `{ current, info }` |

### Expose

| Method | Description | Type |
| --- | --- | --- |
| `focus` | Focus the input | `(options?: FocusOptions) => void` |
| `blur` | Blur | `() => void` |
| `nativeElement` | Root node | `HTMLDivElement` |

### RangePicker (differences from DatePicker)

| Property | Difference |
| --- | --- |
| `value` / `defaultValue` | Tuple `[start, end]`. ⚠️ **`null` and `undefined` mean different things**: `null` = "clear this end", `undefined` = "not picked yet" |
| `placeholder` | Tuple `[string, string]` |
| `separator` | Separator between the two ends. **The default one carries `aria-hidden`; a custom one drops it** |
| `allowEmpty` | Allow one end to be empty (`boolean` or a tuple) |
| `disabled` | `boolean` or a tuple. ⚠️ The `-disabled` root class is added only when **both ends** are disabled |
| `showTime` | `boolean \| RangeTimeProps` (`disabledTime` gets two extra params) |
| `presets` | `RangeValueDate[]` |
| `onSelect` | **deprecated**, and only effective when `picker === 'time'` |
| `focus` | Different signature: `(index?) => void` |
| `startInput` / `endInput` | The two native inputs |

## Theme

Component tokens — **45**, all emitted as CSS variables `--apollo-date-picker-*`.

> The table below holds **measured** values from
> `node tests/visual/debug/extract-date-picker-css.mjs --tokens` (antd 6.6.4 default
> theme), not guesses.

| Token | Default |
| --- | --- |
| `activeBg` | `#ffffff` |
| `activeBorderColor` | `#1677ff` |
| `activeShadow` | `0 0 0 2px rgba(5,145,255,0.1)` |
| `addonBg` | `rgba(0,0,0,0.02)` |
| `arrowPath` | `path('M 0 8 A 4 4 0 0 0 2.828…')` |
| `arrowPolygon` | `polygon(1.6568542494923806px 100%, 50% 1.6568542494923806px, …)` |
| `arrowShadowWidth` | `8.970562748477143px` |
| `cellActiveWithRangeBg` | `#e6f4ff` |
| `cellBgDisabled` | `rgba(0,0,0,0.04)` |
| `cellHeight` | `24px` |
| `cellHoverBg` | `rgba(0,0,0,0.04)` |
| `cellHoverWithRangeBg` | `#cbe0fd` |
| `cellRangeBorderColor` | `#82b4f9` |
| `cellWidth` | `36px` |
| `errorActiveShadow` | `0 0 0 2px rgba(255,38,5,0.06)` |
| `hoverBg` | `#ffffff` |
| `hoverBorderColor` | `#4096ff` |
| `inputFontSize` | `14px` |
| `inputFontSizeLG` | `16px` |
| `inputFontSizeSM` | `14px` |
| `lineWidthFocus` | `1px` |
| `multipleItemBg` | `rgba(0,0,0,0.06)` |
| `multipleItemBorderColor` | `transparent` |
| `multipleItemBorderColorDisabled` | `transparent` |
| `multipleItemColorDisabled` | `rgba(0,0,0,0.25)` |
| `multipleItemHeight` | `24px` |
| `multipleItemHeightLG` | `32px` |
| `multipleItemHeightSM` | `16px` |
| `multipleSelectorBgDisabled` | `rgba(0,0,0,0.04)` |
| `paddingBlock` | `4px` |
| `paddingBlockLG` | `7px` |
| `paddingBlockSM` | `0px` |
| `paddingInline` | `11px` |
| `paddingInlineLG` | `11px` |
| `paddingInlineSM` | `7px` |
| `presetsMaxWidth` | `200px` |
| `presetsWidth` | `120px` |
| `textHeight` | `40px` |
| `timeCellHeight` | `28px` |
| `timeColumnHeight` | `224px` |
| `timeColumnWidth` | `56px` |
| `warningActiveShadow` | `0 0 0 2px rgba(255,215,5,0.1)` |
| `withoutTimeCellHeight` | `66px` |
| `zIndexPopup` | `1050` |
| `INTERNAL_FIXED_ITEM_MARGIN` | `2px` — the variable name is **`--apollo-date-picker-internal_fixed_item_margin`** (with an **underscore**) |

> ⚠️ There is **one more** variable declared **inside the rules**:
> `--apollo-date-picker-affix-color` (default `inherit`, overridden in the error/warning
> states). It is **not** part of `prepareComponentToken`'s return value. See `README §4`.

## Design notes

### Class prefix and CSS variable namespace are **not** the same

The default class name is **`apollo-picker`** (upstream passes the **literal** `'picker'`
to `getPrefixCls`), while CSS variables are **`--apollo-date-picker-*`** (derived from the
component name `DatePicker`). This mismatch is **upstream behaviour**, not a typo.

### time-picker shares this stylesheet

The `ant-picker` prefix is shared by date-picker and time-picker (upstream does this on
purpose), so this component's stylesheet contains time-picker rules. That is **correct**
(same component family).

### One known difference of static CSS

Values resolved at build time (padding formulas, the `activeShadow` template string,
`lighten(35)` for `cellHoverWithRangeBg`, …) are **inlined as literals** in the static CSS,
so they do **not** follow the primary colour (upstream cssinjs recomputes at runtime).
This is an inherent difference of this repo's "static CSS + CSS variables" architecture,
not a bug; its impact is covered by the L6 theme matrix.
