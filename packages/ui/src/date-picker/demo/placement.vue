<script setup lang="ts">
// 对齐 antd 的 demo/placement.tsx
import { DatePicker, Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex wrap gap="middle">
    <DatePicker placement="bottomLeft" placeholder="bottomLeft" />
    <DatePicker placement="bottomRight" placeholder="bottomRight" />
    <DatePicker placement="topLeft" placeholder="topLeft" />
    <DatePicker placement="topRight" placeholder="topRight" />
  </Flex>
</template>
