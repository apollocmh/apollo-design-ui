---
category: Data Display
title: Calendar
subtitle: Calendar
---

A container for displaying data in calendar form.

## When To Use

- When data is in the form of dates, such as schedules, timetables, prices calendar, lunar calendar;
- When you need to browse and pick a date on a whole-month scale.

> 🚨 **The class prefix is `apollo-picker-calendar`** (upstream `getPrefixCls('picker')`),
> while the **CSS variables are `--apollo-calendar-*`** — **the class and the variable
> namespaces differ**. ⚠️ But passing `prefixCls` as a **prop** overrides it entirely
> (passing `'apollo'` yields `apollo-calendar`), because in
> `getPrefixCls(suffix, customize)` the `customize` wins.

## Examples

See [`demo/`](./demo) (**8** demos). ⚠️ Gaps vs. antd are listed in `README.md` §5
(`lunar` / `component-token` are not ported).

## API

### Calendar

| Property | Description | Type | Default |
|---|---|---|---|
| value | The displayed date (`v-model:value`) | `CalendarDate` | —— |
| defaultValue | Uncontrolled initial value | `CalendarDate` | —— |
| mode | Calendar mode (`v-model:mode`) | `'year' \| 'month'` | `'month'` |
| fullscreen | Full screen (`false` renders a mini calendar) | `boolean` | `true` |
| showWeek | Show the week-number column | `boolean` | `false` |
| validRange | Selectable range (**inclusive**; endpoints are *not* disabled) | `[CalendarDate, CalendarDate]` | —— |
| disabledDate | Extra disabled predicate | `(date: CalendarDate) => boolean` | —— |
| headerRender | Custom header (**function prop**) | `(config) => VNodeChild` | —— |
| cellRender | Customize the cell **content** | `(date, info) => VNodeChild` | —— |
| fullCellRender | Customize the **whole** cell | `(date, info) => VNodeChild` | —— |
| locale | Locale (deep-merged with `ConfigProvider`'s `locale.Calendar`) | `PickerLocale` | —— |
| classNames | Semantic class names (6 slots, **function form** supported) | `CalendarSemanticValue<…>` | —— |
| styles | Semantic styles (same) | `CalendarSemanticValue<…>` | —— |
| prefixCls | Custom class prefix | `string` | `apollo-picker` |
| class / style | **Native root attrs** (not Props) | `string \| array \| object` / `CSSProperties` | —— |
| style | Inline style of the root | `CSSProperties` | —— |
| dateFullCellRender | **@deprecated** Use `fullCellRender` | `(date) => VNodeChild` | —— |
| dateCellRender | **@deprecated** Use `cellRender` | `(date) => VNodeChild` | —— |
| monthFullCellRender | **@deprecated** Use `fullCellRender` | `(date) => VNodeChild` | —— |
| monthCellRender | **@deprecated** Use `cellRender` | `(date) => VNodeChild` | —— |

> ⚠️ **The four deprecated props are detected with `!== undefined`** (Vue's `props`
> always contains every declared key, so copying upstream's `in props` would warn
> **unconditionally**).
> ⚠️ **When neither `value` nor `defaultValue` is given, it falls back to `getNow()`
> ("today")** — that makes screenshots/assertions drift with the run date, so
> **tests must pass `value` explicitly**.
> ⚠️ Upstream's Calendar root has **no `{...restProps}`** (measured: `restProps` occurs
> **0** times in `generateCalendar.js`) ⇒ `id` / `data-*` / `aria-*` do **not** land on
> the root element. This repo follows that (Vue's `class` / `style` are still merged,
> because on the React side they are props).

### Events

| Event | Description | Payload |
|---|---|---|
| `change` | The selected date changed | `(date: CalendarDate)` |
| `update:value` | `v-model:value` | `(date: CalendarDate)` |
| `panelChange` | Panel granularity / panel value changed | `(date: CalendarDate, mode: CalendarMode)` |
| `update:mode` | `v-model:mode` | `(mode: CalendarMode)` |
| `select` | Every selection (including `headerRender`'s own `onChange`) | `(date: CalendarDate, info: { source })` |

> 🚨 **Order is semantics** (`triggerChange`): when the picked day is the **same day**
> as the current value, **neither `change` nor `panelChange` fires**; a **`panelChange`
> is only re-emitted** when the date crosses a month (`panelMode === 'date'`) or a year
> (`panelMode === 'month'`).
> ⚠️ `update:mode` fires **only when the mode actually changed** — `panelChange` fires
> one extra time when the date crosses a month/year.
> ⚠️ For the **panel** branch, `select`'s `source` is **`panelMode`**
> (`'date'` \| `'month'`), not the literal `'date'`.

### Slots

| Slot | Description |
|---|---|
| `headerRender` | Slot form of `headerRender` (same `config` shape) |
| `cellRender` | Slot form of `cellRender` (`{ current, info }`) |
| `fullCellRender` | Slot form of `fullCellRender` (`{ current, info }`) |

### expose

| Field | Description |
|---|---|
| `nativeElement` | Root DOM (`<div class="apollo-picker-calendar …">`) |

> ⚠️ Upstream's `CalendarRef` has **only** `nativeElement` (no `focus` / `blur` — those
> belong to `DatePicker`'s `PickerRef`) ⇒ this repo does **not** add them.

## Theme

**6 Component Tokens** (`fullBg` / `fullPanelBg` / `itemActiveBg` /
`yearControlWidth` / `monthControlWidth` / `miniContentHeight`), but
`prepareComponentToken` spreads `...initPanelComponentToken(token)` which brings in
**21** panel tokens ⇒ **27** `--apollo-calendar-*` declarations are emitted.

⚠️ To customize through `ConfigProvider`, use the **`calendar`** entry
(**not** `datePicker`):

```vue
<ConfigProvider :components="{ calendar: { classNames: { root: 'my-root' } } }">
  <Calendar />
</ConfigProvider>
```

⚠️ **`styles` / `classNames` support the function form** (`(info: { props }) => object`);
`info.props.fullscreen` is the **resolved** value (absent ⇒ `true`), while
`info.props.mode` stays the **raw prop** (absent ⇒ `undefined`) — same as upstream's
`{...props, mode, fullscreen, showWeek}`.
