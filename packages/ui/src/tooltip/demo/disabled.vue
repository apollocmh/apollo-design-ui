<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx

import { Button, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(true);
</script>

<template>
  <div style="font-family: sans-serif">
    <!-- C8-R2：title 收窄 string；'' ⇒ noTitle 抑制（antd 的 null 语义等价） -->
    <Tooltip :title="disabled ? '' : 'prompt text'">
      <Button @click="disabled = !disabled">{{ disabled ? 'Enable' : 'Disable' }}</Button>
    </Tooltip>
  </div>
</template>
