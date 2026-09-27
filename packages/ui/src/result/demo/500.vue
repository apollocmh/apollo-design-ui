<script setup lang="ts">
// 对齐 antd 的 500 demo。C8-R2：extra 走 `#extra` 插槽。
import { Button, Result } from '@apollo-design/ui';
</script>

<template>
  <Result
    status="500"
    title="500"
    sub-title="Sorry, something went wrong on server."
  >
    <template #extra>
      <Button type="primary">Go Console</Button>
    </template>
  </Result>
</template>
