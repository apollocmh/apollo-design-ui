<script setup lang="ts">
// 对齐 antd 的 demo/multiple.tsx
import { DatePicker, Flex } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const value = ref([dayjs().add(1, 'day'), dayjs().add(3, 'day')]);
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker v-model:value="value" multiple placeholder="可多选日期" />
    <DatePicker multiple max-tag-count="responsive" placeholder="标签自适应宽度" />
    <div class="demo-hint">已选 {{ Array.isArray(value) ? value.length : 0 }} 天</div>
  </Flex>
</template>
