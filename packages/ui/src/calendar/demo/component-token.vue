<script setup lang="ts">
import type { CalendarDate } from '@apollo-design/ui';
import { Calendar, ConfigProvider } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref<CalendarDate>(dayjs('2026-10-15'));
const theme = {
  components: {
    Calendar: {
      fullBg: '#f6ffed',
      fullPanelBg: '#f6ffed',
      itemActiveBg: '#b7eb8f',
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
