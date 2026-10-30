---
category: Data Display
title: Calendar
subtitle: Calendar
---

Display and select dates using an inline month or year panel.

## Examples

See [`demo/`](./demo) for nine examples, including native header/cell slots and current component tokens.

## API

### Props

| Property | Description | Type | Default |
|---|---|---|---|
| value | Accepted date (`v-model:value`) | `CalendarDate` (Dayjs) | — |
| defaultValue | Initial uncontrolled date; later changes do not reset state | `CalendarDate` | Today |
| mode | Accepted panel mode (`v-model:mode`) | `'month' \| 'year'` | `'month'` |
| fullscreen | Full calendar; false uses a compact card | `boolean` | `true` |
| showWeek | Show week numbers | `boolean` | `false` |
| validRange | Inclusive selectable bounds | `[CalendarDate, CalendarDate]` | — |
| disabledDate | Additional disabled predicate, OR-ed with the range | `(date: CalendarDate) => boolean` | — |
| locale | Deep merge with the current `ConfigProvider.locale.Calendar` | `PickerLocale` | Current locale |
| classNames | Six semantic targets; object or current-props function | `CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps>` | — |
| styles | Six semantic targets; object or current-props function | `CalendarSemanticValue<CalendarSemanticStyles, CalendarProps>` | — |
| prefixCls | Picker class prefix | `string` | Current root prefix + `-picker` |

Native `class`, all Vue `style` forms, id, ARIA/data attrs, tabindex and ordinary DOM listeners reach the actual root div. Native style follows theme/Provider/local semantic style. Owned notification listeners are consumed by Vue emits.

Controlled models emit proposals. Rejected proposals do not become hidden local state; removing control preserves the last accepted value/mode. Defaults only initialize uncontrolled state.

### Slots

| Slot | Scope | Behavior |
|---|---|---|
| `headerRender` | `{ value, type, onChange, onTypeChange }` (`CalendarHeaderRenderConfig`) | Replace the header. The two commands request a date/mode change through the normal Calendar path. |
| `cellRender` | `{ current, info }` (`CalendarCellSlotProps`) | Content below the default date/month label. |
| `fullCellRender` | `{ current, info }` (`CalendarCellSlotProps`) | Replace the complete cell, including its label. Takes precedence over `cellRender`. |

`current` is a Dayjs date; `info` is the existing `CalendarCellRenderInfo` from PickerPanel, including `type`, `locale` and `originNode`. Slots are read during render, so conditional addition/removal works. Arrays, text, 0 and explicit empty content keep their Vue meanings.

```vue
<Calendar v-model:value="date" v-model:mode="mode">
  <template #headerRender="{ value, type, onChange, onTypeChange }">
    <button @click="onChange(value.add(1, 'month'))">Next month</button>
    <button @click="onTypeChange(type === 'month' ? 'year' : 'month')">{{ type }}</button>
  </template>
  <template #cellRender="{ current }">{{ events[current.format('YYYY-MM-DD')] }}</template>
</Calendar>
```

Migration: `headerRender`, `cellRender`, `fullCellRender` content props and the four legacy date/month content props are removed. Use the named slots directly. Split date/month content using `info.type`. There is no fallback callback or deprecation channel; `disabledDate` remains a genuine predicate service.

### Events

| Event | Payload |
|---|---|
| `update:value` | `(date: CalendarDate)` |
| `change` | `(date: CalendarDate)` |
| `update:mode` | `(mode: CalendarMode)` |
| `panelChange` | `(date: CalendarDate, mode: CalendarMode)` |
| `select` | `(date: CalendarDate, info: { source: 'date' \| 'month' \| 'year' \| 'customize' })` |

Date requests emit `update:value`, then `panelChange` when crossing a month in month mode or a year in year mode, then `change`, then `select`. The same day only emits `select`. Mode requests emit `update:mode` only when different, then `panelChange` with the current date. The panel's select source is `date` or `month`; header date commands use `customize`.

### Ref

`nativeElement: HTMLDivElement | null` is the actual root and becomes null on unmount. Calendar exposes no imperative focus/blur methods. Its panel and controls retain their own native keyboard/focus behavior.

## Presentation and theme

Semantic targets are `root`, `header`, `body`, `content`, `item`, `itemContent`. The last four reach PickerPanel; `itemContent` also decorates Calendar's default content container. Semantic functions read current public props; fullscreen is resolved (default true), mode remains the raw prop. Returning undefined contributes no override.

`ConfigProvider.components.calendar` supplies presentation defaults. `ConfigProvider.theme.components.Calendar` supplies the six component tokens; replacement/removal updates existing instances.

| Token | Type | Default |
|---|---|---|
| fullBg | string | colorBgContainer |
| fullPanelBg | string | colorBgContainer |
| itemActiveBg | string | controlItemBgActive |
| yearControlWidth | number or CSS length string | 80 |
| monthControlWidth | number or CSS length string | 70 |
| miniContentHeight | number or CSS length string | 256 |

Numeric lengths become px, including 0. Static CSS and the existing 21 shared panel declarations remain in use; class and variable namespaces differ (`apollo-picker-calendar` versus `--apollo-calendar-*`). Custom class prefixes require the matching generated stylesheet.
