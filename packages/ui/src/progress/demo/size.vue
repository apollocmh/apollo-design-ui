<script setup lang="ts">
// 对齐 antd demo/size.tsx
import { Flex, Progress } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="medium">
    <Flex vertical gap="small" style="width: 300px">
      <Progress :percent="50" />
      <Progress :percent="50" size="small" />
      <Progress :percent="50" :size="[300, 20]" />
    </Flex>
    <Flex align="center" wrap gap="30px">
      <Progress type="circle" :percent="50" />
      <Progress type="circle" :percent="50" size="small" />
      <Progress type="circle" :percent="50" :size="20" />
    </Flex>
    <Flex align="center" wrap gap="30px">
      <Progress type="dashboard" :percent="50" />
      <Progress type="dashboard" :percent="50" size="small" />
      <Progress type="dashboard" :percent="50" :size="20" />
    </Flex>
    <Flex align="center" wrap gap="30px">
      <Progress :steps="3" :percent="50" />
      <Progress :steps="3" :percent="50" size="small" />
      <Progress :steps="3" :percent="50" :size="20" />
      <Progress :steps="3" :percent="50" :size="[20, 30]" />
    </Flex>
  </Flex>
</template>
