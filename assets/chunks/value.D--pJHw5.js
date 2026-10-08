const e=`<script setup lang="ts">
// 对齐 antd 的 value demo。

import type { TimePickerValue } from '@apollo-design/ui';
import { TimePicker } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TimePickerValue>(null);
<\/script>

<template>
  <TimePicker v-model:value="value" />
</template>
`;export{e as default};
