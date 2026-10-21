<script setup lang="ts">
// 对齐 antd 的 demo/size.tsx、status.tsx、variant.tsx
import { DatePicker, Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <Flex wrap gap="small">
      <DatePicker size="small" placeholder="small" />
      <DatePicker placeholder="middle" />
      <DatePicker size="large" placeholder="large" />
    </Flex>
    <Flex wrap gap="small">
      <DatePicker status="error" placeholder="error" />
      <DatePicker status="warning" placeholder="warning" />
    </Flex>
    <Flex wrap gap="small">
      <DatePicker variant="filled" placeholder="filled" />
      <DatePicker variant="borderless" placeholder="borderless" />
      <DatePicker variant="underlined" placeholder="underlined" />
    </Flex>
  </Flex>
</template>
