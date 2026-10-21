<script setup lang="ts">
// 组件 Token：在根元素覆写 `--apollo-calendar-*` 变量。
// `lunar` 需要第三方 lunar-typescript，本仓未移植，因此不提供农历演示。
import type { CalendarDate } from '@apollo-design/ui';
import { Calendar } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref<CalendarDate>(dayjs('2026-10-15'));

const tokenStyle = {
  '--apollo-calendar-full-bg': '#f6ffed',
  '--apollo-calendar-full-panel-bg': '#f6ffed',
  '--apollo-calendar-item-active-bg': '#b7eb8f',
  '--apollo-calendar-year-control-width': '96px',
  '--apollo-calendar-month-control-width': '80px',
};
</script>

<template>
  <Calendar v-model:value="value" :style="tokenStyle" />
</template>
