<script setup lang="ts">
// 对齐 antd `status.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 10 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
}));

const targetKeys = ref<string[]>(['2', '4']);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Transfer :data-source="mockData" status="error" v-model:target-keys="targetKeys" />
    <Transfer :data-source="mockData" status="warning" v-model:target-keys="targetKeys" />
  </div>
</template>
