<script setup lang="ts">
import type { CalendarDate } from '@apollo-design/ui';
import { Calendar, ConfigProvider } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref<CalendarDate>(dayjs('2026-10-15'));
const theme = {
  components: {
    Calendar: {
      fullBg: 'var(--apollo-color-success-bg)',
      fullPanelBg: 'var(--apollo-color-success-bg)',
      itemActiveBg: 'var(--apollo-color-success-bg-hover)',
      yearControlWidth: 96,
      monthControlWidth: '80px',
      miniContentHeight: 288,
    },
  },
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <Calendar v-model:value="value" :fullscreen="false" />
  </ConfigProvider>
</template>
