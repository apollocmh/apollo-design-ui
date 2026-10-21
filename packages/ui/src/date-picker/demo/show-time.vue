<script setup lang="ts">
// 对齐 antd 的 demo/show-time.tsx
import { DatePicker, Flex, type SingleValue } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<SingleValue>(null);
const text = ref('');

const onChange = (date: SingleValue, dateString: string | string[] | null) => {
  value.value = date;
  text.value = typeof dateString === 'string' ? dateString : '';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker
      v-model:value="value"
      show-time
      format="YYYY-MM-DD HH:mm:ss"
      placeholder="选择日期时间"
      @change="onChange"
    />
    <div class="demo-hint">当前值：{{ text || '（空）' }}</div>
  </Flex>
</template>
