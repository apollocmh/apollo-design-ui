<script setup lang="ts">
// 对齐 antd demo/select-users.tsx（tagRender + 已选列表，Vue 等价替换）
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string[]>([]);
const options = [
  { value: 'jack', label: 'Jack' },
  { value: 'lucy', label: 'Lucy' },
  { value: 'tom', label: 'Tom' },
];
</script>

<template>
  <div>
    <Select
      v-model:value="value"
      mode="multiple"
      :options="options"
      style="width: 100%"
    />
    <p>已选：{{ value.join(', ') || '无' }}</p>
  </div>
</template>
