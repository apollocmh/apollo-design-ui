---
order: 4
title:
  zh-CN: 通知事项日历
  en-US: Notice Calendar
---

一个复杂的应用示例，用 `cellRender` 来自定义需要渲染的数据。

```vue
<script setup lang="ts">
import type { BadgeProps } from '@apollo-design/ui';
import { Badge, Calendar } from '@apollo-design/ui';
import type dayjs from 'dayjs';

const getListData = (
  value: dayjs.Dayjs,
): { type: NonNullable<BadgeProps['status']>; content: string }[] => {
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
</script>

<template>
  <Calendar>
    <template #cellRender="{ current, info }">
      <ul v-if="info.type === 'date'" style="margin: 0; padding: 0; list-style: none">
        <li v-for="item in getListData(current)" :key="item.content">
          <Badge :status="item.type" :text="item.content" />
        </li>
      </ul>
      <div v-else-if="info.type === 'month' && getMonthData(current) !== undefined" style="font-size: 28px; text-align: center">
        <section style="font-size: 28px">{{ getMonthData(current) }}</section>
        <span>Backlog number</span>
      </div>
    </template>
  </Calendar>
</template>
```
