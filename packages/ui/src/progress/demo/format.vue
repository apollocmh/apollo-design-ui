<script setup lang="ts">
// 对齐 antd demo/format.tsx（format 为 fn prop）
import { Flex, Progress } from '@apollo-design/ui';
</script>

<template>
  <Flex gap="small" wrap>
    <Progress type="circle" :percent="75" :format="(p?: number) => `${p} Days`" />
    <Progress type="circle" :percent="100" :format="() => 'Done'" />
  </Flex>
</template>
