<script setup lang="ts">
// 对齐 antd demo/circle-mini.tsx
import { Flex, Progress } from '@apollo-design/ui';
</script>

<template>
  <Flex wrap gap="small">
    <Progress type="circle" :percent="30" :size="80" />
    <Progress type="circle" :percent="70" :size="80" status="exception" />
    <Progress type="circle" :percent="100" :size="80" />
  </Flex>
</template>
