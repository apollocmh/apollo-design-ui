<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx

import { Button, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(true);
</script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip :title="disabled ? null : 'prompt text'">
      <Button @click="disabled = !disabled">{{ disabled ? 'Enable' : 'Disable' }}</Button>
    </Tooltip>
  </div>
</template>
