const e=`<script setup lang="ts">
// 对齐 antd 的 need-confirm demo。

import type { TimePickerEmits } from '@apollo-design/ui';
import { TimePicker } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
<\/script>

<template>
  <TimePicker :need-confirm="true" @change="onChange" />
</template>
`;export{e as default};
