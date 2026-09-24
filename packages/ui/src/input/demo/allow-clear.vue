<script setup lang="ts">
// 对齐 antd 的 demo/allow-clear.tsx

import { Input } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('clear me');
</script>

<template>
  <div style="font-family: sans-serif; width: 240px">
    <Input v-model:value="value" allow-clear placeholder="allowClear" />
  </div>
</template>
