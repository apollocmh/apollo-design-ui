---
category: Data Entry
title: TimePicker
subtitle: Time Picker
---

Choose a single time or use `TimeRangePicker` for a time range.

> Current contract, 2026-10-30: both entries have a fixed time axis. The actual models are `value`, `open` and `pickerValue`. Unsupported `mode/defaultMode/update:mode` declarations are removed. Content uses named slots, notifications use emits, and DOM handles are nullable.

## Examples

See the 16 implemented [demos](./demo).

## API

| Property | Meaning | Default |
|---|---|---|
| value / defaultValue | Dayjs value; a single value may be null, a range has two endpoints | — |
| open / defaultOpen | Current open state / initial uncontrolled state | — |
| pickerValue / defaultPickerValue | Browsing time / initial browsing time | — |
| defaultOpenValue | Empty panel template, without committing a value | — |
| format | Display/parser format, formatter or mask | `HH:mm:ss` |
| use12Hours | Show meridiem | `false` |
| showHour / showMinute / showSecond / showMillisecond | Visible columns, inferred from format when omitted | — |
| hourStep / minuteStep / secondStep / millisecondStep | Unit steps | `1` |
| disabledTime | Disabled units; range callbacks also receive range and `{ from }` | — |
| hideDisabledOptions | Hide disabled units | `false` |
| needConfirm | Require confirmation; false commits when leaving the panel | `true` |
| changeOnScroll | Select the nearest enabled unit after scrolling stops for 300ms | `false` |
| inputReadOnly | Prevent typing while retaining panel selection | `false` |
| allowClear | Clear button; accepts `{ clearIcon }` | `true` |
| disabled / size / status / variant | Disabled state, size, validation and variant | variant: `outlined` |
| classNames / styles | Current semantic classes/styles, including function forms | — |
| prefix / suffixIcon / clearIcon | Static decoration, also available as named slots | Clock suffix |
| placeholder / locale | Input hint and language | `Select time` |
| presets | Preset values, including values evaluated at interaction time | — |

TimeRangePicker additionally supports separator, allowEmpty and per-endpoint disabled states. Calendar navigation, multiple tags and calendar mode switching are not part of the time-axis API.

Native input metadata goes to the actual input; class/style/data attributes go to the root. A range id string identifies the start input; `{ start, end }` identifies both endpoints. Exposed methods are focus and blur, with nullable nativeElement; range refs also expose nullable startInput/endInput.

## Events and slots

Semantic change/openChange/pickerValueChange events accompany their update:value/update:open/update:pickerValue proposals. Rejected controlled proposals never become hidden accepted values; releasing control retains the last accepted value. Other events are calendarChange, ok, clear, focus, blur, invalid and panelChange; the single picker also emits select. Keydown receives one native KeyboardEvent and honors preventDefault().

Single-picker slots are prefix, suffixIcon, clearIcon, panelRender, extraFooter, cellRender and presetRender. Range adds separator. CellRender receives `{ current, info }`, panelRender receives `{ originPanel }`, and extraFooter receives `{ mode }`. Explicitly empty slots remain empty and current slot presence is reactive. Legacy render props and addon are removed.

For readonly inputs, ArrowDown enters the panel, arrows navigate enabled units, Enter/Space selects and Escape restores input focus. Use the OK button to confirm under the default confirmation policy.

## Configuration and styles

Both entries read the current components.timePicker configuration, including root classes/styles, semantic configuration, variant, icons and range separator. Input hints follow the current locale.TimePicker fragment, with explicit local placeholder/locale values taking precedence. DatePicker and rangePicker configurations do not leak into Time entries. Ordinary DateRangePicker retains its rangePicker owner.

TimePicker reuses DatePicker static CSS and theme variables. It has no independent Component Token, stylesheet or PurePanel. Existing deprecated popupClassName/popupStyle/bordered/dropdownClassName inputs remain; prefer semantic styles and variant.

TimePickerWithRange.RangePicker and the named TimeRangePicker refer to the same component.
