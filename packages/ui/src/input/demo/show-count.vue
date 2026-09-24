<script setup lang="ts">
// 对齐 antd 的 demo/show-count.tsx

import { Input } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 240px">
    <Input v-model:value="value" show-count :max-length="20" placeholder="show count" />
  </div>
</template>
