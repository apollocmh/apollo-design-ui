<script setup lang="ts">
// 对齐 antd 的 demo/basic.tsx

import { Input } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
</script>

<template>
  <div style="font-family: sans-serif; width: 240px">
    <Input v-model:value="value" placeholder="Basic usage" />
  </div>
</template>
