<script setup lang="ts">
import { DatePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const hasDot = (value: unknown) => dayjs.isDayjs(value) && value.date() % 7 === 0;
</script>

<template>
  <DatePicker placeholder="每 7 天有一个圆点">
    <template #cellRender="{ current, info }">
      <div v-if="info.type === 'date' && hasDot(current)" class="date-picker-custom-cell">
        <component :is="info.originNode" />
        <span class="date-picker-custom-cell-dot" />
      </div>
      <component :is="info.originNode" v-else />
    </template>
  </DatePicker>
</template>

<style scoped>
.date-picker-custom-cell { position: relative; }
.date-picker-custom-cell-dot { position: absolute; inset-inline-end: 2px; bottom: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--apollo-color-primary); }
</style>
