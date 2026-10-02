<script setup lang="ts">
// 对齐 antd 的 colored-popup demo。

import type { TimePickerEmits } from '@apollo-design/ui';
import { TimePicker } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};

const classNames = { popup: { root: 'myCustomClassName' } };
</script>

<template>
  <TimePicker :class-names="classNames" @change="onChange" />
</template>
