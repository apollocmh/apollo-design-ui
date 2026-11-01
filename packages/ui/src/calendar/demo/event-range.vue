<script setup lang="ts">
// Continuous bars use the demo's content layer; ordinary Calendar lists keep scrolling.
import { dayjsGenerateConfig } from '@apollo-design/picker';
import { Calendar } from '@apollo-design/ui';
import dayjs from 'dayjs';

interface CalendarEvent {
  key: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  color: string;
}

/** 色值 = 默认主题的 `colorPrimary` / `colorSuccess` / `colorWarning` / `colorError`。 */
const EVENTS: CalendarEvent[] = [
  {
    key: 'release',
    title: 'Release window',
    start: dayjs('2026-01-08'),
    end: dayjs('2026-01-10'),
    color: '#1677ff',
  },
  {
    key: 'design-review',
    title: 'Design review',
    start: dayjs('2026-01-14'),
    end: dayjs('2026-01-14'),
    color: '#52c41a',
  },
  {
    key: 'cross-week',
    title: 'Cross-week delivery',
    start: dayjs('2026-01-17'),
    end: dayjs('2026-01-20'),
    color: '#1677ff',
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    start: dayjs('2026-01-21'),
    end: dayjs('2026-01-24'),
    color: '#faad14',
  },
  {
    key: 'bug-fix',
    title: 'Bug fix',
    start: dayjs('2026-01-30'),
    end: dayjs('2026-01-31'),
    color: '#ff4d4f',
  },
];

/** 上游 `defaultValue={dayjs('2026-01-01')}` —— 锚定到有事件的那个月。 */
const defaultValue = dayjs('2026-01-01');

const isInRange = (current: dayjs.Dayjs, event: CalendarEvent) =>
  !current.isBefore(event.start, 'day') && !current.isAfter(event.end, 'day');

type RangePosition = 'single' | 'start' | 'middle' | 'end';

const getRangePosition = (
  current: dayjs.Dayjs,
  event: CalendarEvent,
  weekFirstDay: number,
): RangePosition => {
  const starts = current.isSame(event.start, 'day') || current.day() === weekFirstDay;
  const ends = current.isSame(event.end, 'day') || current.day() === (weekFirstDay + 6) % 7;
  if (starts && ends) return 'single';
  if (starts) return 'start';
  if (ends) return 'end';
  return 'middle';
};

const getCellEvents = (current: dayjs.Dayjs, locale: string) => {
  // Use the same locale service as PickerPanel, including Monday/Saturday weeks.
  const firstDay = dayjsGenerateConfig.locale.getWeekFirstDay(locale);
  return EVENTS.filter((event) => isInRange(current, event)).map((event) => ({
    event,
    position: getRangePosition(current, event, firstDay),
  }));
};

/** 色条圆角（上游 `barRadius = 999`）。 */
const BAR_RADIUS = '999px';
/** `marginXXS` / `controlHeightSM` / `fontSizeSM` / `paddingXS` / `marginXS` / `paddingXXS` 的默认值。 */
const MARGIN_XXS = 4;
const CONTROL_HEIGHT_SM = 24;
const FONT_SIZE_SM = 12;
const PADDING_XS = 8;
const MARGIN_XS = 8;
const PADDING_XXS = 4;

const barStyle = {
  display: 'block',
  height: `${CONTROL_HEIGHT_SM - MARGIN_XXS}px`,
  overflow: 'hidden',
  color: '#fff',
  fontSize: `${FONT_SIZE_SM}px`,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
} as const;

const rangeStyle: Record<RangePosition, Record<string, string>> = {
  start: {
    marginInlineEnd: `${-(PADDING_XS + MARGIN_XS / 2)}px`,
    paddingInlineStart: `${PADDING_XXS + PADDING_XXS}px`,
    borderStartStartRadius: BAR_RADIUS,
    borderEndStartRadius: BAR_RADIUS,
  },
  middle: { marginInline: `${-(PADDING_XS + MARGIN_XS / 2)}px` },
  end: {
    marginInlineStart: `${-(PADDING_XS + MARGIN_XS / 2)}px`,
    borderStartEndRadius: BAR_RADIUS,
    borderEndEndRadius: BAR_RADIUS,
  },
  single: { paddingInlineStart: `${PADDING_XXS + PADDING_XXS}px`, borderRadius: BAR_RADIUS },
};
</script>

<template>
  <Calendar :default-value="defaultValue" :styles="{ itemContent: { overflow: 'visible' } }">
    <template #cellRender="{ current, info }">
      <div v-if="info.type === 'date'" :style="{ minHeight: '32px', paddingBlockStart: `${MARGIN_XXS}px` }">
        <div :style="{ display: 'flex', flexDirection: 'column', gap: `${MARGIN_XXS}px` }">
          <span v-for="{ event, position } in getCellEvents(current, info.locale.locale)" :key="event.key"
            :data-event="event.key" :data-position="position" :title="event.title"
            :style="{ ...barStyle, ...rangeStyle[position], backgroundColor: event.color }">
            {{ ['start', 'single'].includes(position) ? event.title : '' }}
          </span>
        </div>
      </div>
    </template>
  </Calendar>
</template>
