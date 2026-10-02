<script setup lang="ts">
// 对齐 antd 的 hide-column demo。
import { TimePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const format = 'HH:mm';
const value = dayjs('12:08', format);
</script>

<template>
  <TimePicker :default-value="value" :format="format" />
</template>
