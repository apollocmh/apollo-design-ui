---
order: 4
title:
  zh-CN: 通知事项日历
  en-US: Notice Calendar
---

一个复杂的应用示例，用 `cellRender` 来自定义需要渲染的数据。

```vue
<script setup lang="ts">
// 对齐 antd 的 notice-calendar demo：日期格子里是 `Badge` 列表，月格子里是「积压数」。
//
// ⚠️ **两处 demo 级替换**（不是能力缺口）：
//   1. 上游用 `antd-style` 的 `createStyles` ⇒ 本仓改用**内联 style**（结构逐项对应）。
//   2. 上游用 `dateCellRender` / `monthCellRender` 两个**废弃 prop** 组 `cellRender` ——
//      本仓**照抄**（这正是演示三级回退的中间一级）；⚠️ 因此本 demo 会发**废弃告警**，
//      已在 `__tests__/demo.test.ts` 的 `allow` 里登记。

import type { BadgeProps, CalendarCellRenderInfo } from '@apollo-design/ui';
import { Badge, Calendar } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { h } from 'vue';

const getListData = (value: dayjs.Dayjs): { type: string; content: string }[] => {
  switch (value.date()) {
    case 8:
      return [
        { type: 'warning', content: 'This is warning event.' },
        { type: 'success', content: 'This is usual event.' },
      ];
    case 10:
      return [
        { type: 'warning', content: 'This is warning event.' },
        { type: 'success', content: 'This is usual event.' },
        { type: 'error', content: 'This is error event.' },
      ];
    case 15:
      return [
        { type: 'warning', content: 'This is warning event' },
        { type: 'success', content: 'This is very long usual event......' },
        { type: 'error', content: 'This is error event 1.' },
        { type: 'error', content: 'This is error event 2.' },
        { type: 'error', content: 'This is error event 3.' },
        { type: 'error', content: 'This is error event 4.' },
      ];
    default:
      return [];
  }
};

const getMonthData = (value: dayjs.Dayjs): number | undefined =>
  value.month() === 8 ? 1394 : undefined;

const monthCellRender = (value: dayjs.Dayjs) => {
  const num = getMonthData(value);
  return num
    ? h('div', { style: { fontSize: '28px', textAlign: 'center' } }, [
        h('section', { style: { fontSize: '28px' } }, String(num)),
        h('span', null, 'Backlog number'),
      ])
    : null;
};

const dateCellRender = (value: dayjs.Dayjs) => {
  const listData = getListData(value);
  return h(
    'ul',
    { style: { margin: 0, padding: 0, listStyle: 'none' } },
    listData.map((item) =>
      h('li', { key: item.content }, [
        h(Badge, { status: item.type as BadgeProps['status'], text: item.content }),
      ]),
    ),
  );
};

const cellRender = (current: dayjs.Dayjs, info: CalendarCellRenderInfo) => {
  if (info.type === 'date') {
    return dateCellRender(current);
  }
  if (info.type === 'month') {
    return monthCellRender(current);
  }
  return info.originNode;
};
</script>

<template>
  <Calendar :cell-render="cellRender" />
</template>
```
