<script setup lang="ts">
// 对齐 antd 的 change-on-scroll demo。

import type { TimePickerEmits } from '@apollo-design/ui';
import { TimePicker } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <TimePicker :change-on-scroll="true" :need-confirm="false" @change="onChange" />
</template>
