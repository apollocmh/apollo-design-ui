<script setup lang="ts">
// 对齐 antd 的 demo/need-confirm.tsx
import { DatePicker, Flex } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref(dayjs());
const text = ref(value.value.format('YYYY-MM-DD'));

const onChange = (_date: unknown, dateString: string | string[] | null) => {
  text.value = typeof dateString === 'string' ? dateString : '';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker v-model:value="value" need-confirm @change="onChange" />
    <div class="demo-hint">已提交：{{ text || '（空）' }}</div>
  </Flex>
</template>
