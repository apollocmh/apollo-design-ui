const n=`<script setup lang="ts">
// 对齐 antd 的 event-range demo：用 \`cellRender\` 画**跨日期的色条**。
//
// ⚠️ **一处 demo 级替换**：上游用 \`antd-style\` 的 \`createStyles\`（第三方 CSS-in-JS）生成
//    类名 —— 本仓没有这个依赖 ⇒ 改用**内联 style 对象**（结构、几何、颜色逐项对应）。
//    色值用 token 的**等值字面量**（\`colorPrimary\` / \`colorSuccess\` / \`colorWarning\` /
//    \`colorError\` 的默认解析值），因为本仓没有 \`theme.useToken()\`。

import type { CalendarCellRenderInfo } from '@apollo-design/ui';
import { Calendar } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { h } from 'vue';

interface CalendarEvent {
  key: string;
  title: string;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  color: string;
}

/** 色值 = 默认主题的 \`colorPrimary\` / \`colorSuccess\` / \`colorWarning\` / \`colorError\`。 */
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

/** 上游 \`defaultValue={dayjs('2026-01-01')}\` —— 锚定到有事件的那个月。 */
const defaultValue = dayjs('2026-01-01');

const isInRange = (current: dayjs.Dayjs, event: CalendarEvent) =>
  !current.isBefore(event.start, 'day') && !current.isAfter(event.end, 'day');

type RangePosition = 'single' | 'start' | 'middle' | 'end';

const getRangePosition = (current: dayjs.Dayjs, event: CalendarEvent): RangePosition => {
  const starts = current.isSame(event.start, 'day');
  const ends = current.isSame(event.end, 'day');
  if (starts && ends) return 'single';
  if (starts) return 'start';
  if (ends) return 'end';
  return 'middle';
};

/** 色条圆角（上游 \`barRadius = 999\`）。 */
const BAR_RADIUS = '999px';
/** \`marginXXS\` / \`controlHeightSM\` / \`fontSizeSM\` / \`paddingXS\` / \`marginXS\` / \`paddingXXS\` 的默认值。 */
const MARGIN_XXS = 4;
const CONTROL_HEIGHT_SM = 24;
const FONT_SIZE_SM = 12;
const PADDING_XS = 8;
const MARGIN_XS = 8;
const PADDING_XXS = 4;

const barStyle = {
  display: 'block',
  height: \`\${CONTROL_HEIGHT_SM - MARGIN_XXS}px\`,
  overflow: 'hidden',
  color: '#fff',
  fontSize: \`\${FONT_SIZE_SM}px\`,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
} as const;

const rangeStyle: Record<RangePosition, Record<string, string>> = {
  start: {
    marginInlineEnd: \`\${-(PADDING_XS + MARGIN_XS / 2)}px\`,
    paddingInlineStart: \`\${PADDING_XXS + PADDING_XXS}px\`,
    borderStartStartRadius: BAR_RADIUS,
    borderEndStartRadius: BAR_RADIUS,
  },
  middle: { marginInline: \`\${-(PADDING_XS + MARGIN_XS / 2)}px\` },
  end: {
    marginInlineStart: \`\${-(PADDING_XS + MARGIN_XS / 2)}px\`,
    borderStartEndRadius: BAR_RADIUS,
    borderEndEndRadius: BAR_RADIUS,
  },
  single: { paddingInlineStart: \`\${PADDING_XXS + PADDING_XXS}px\`, borderRadius: BAR_RADIUS },
};

const cellRender = (current: dayjs.Dayjs, info: CalendarCellRenderInfo) => {
  if (info.type !== 'date') {
    return info.originNode;
  }

  const currentEvents = EVENTS.filter((event) => isInRange(current, event));

  return h('div', { style: { minHeight: '32px', overflow: 'visible' } }, [
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: \`\${MARGIN_XXS}px\`,
          marginTop: \`\${MARGIN_XXS}px\`,
        },
      },
      currentEvents.map((event) => {
        const position = getRangePosition(current, event);
        return h(
          'span',
          {
            key: event.key,
            style: { ...barStyle, ...rangeStyle[position], backgroundColor: event.color },
          },
          // ⚠️ 用**数组**形态传 children：\`VNodeChild\` 含 \`null\`，直传不满足 \`h\` 的
          //    \`RawChildren\`（仓内惯例，见 \`picker/panel-body.ts\`）
          [position === 'start' || position === 'single' ? event.title : null],
        );
      }),
    ),
  ]);
};
<\/script>

<template>
  <Calendar :default-value="defaultValue" :cell-render="cellRender" />
</template>
`;export{n as default};
