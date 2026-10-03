<script setup lang="ts">
// 对齐 antd demo/size.tsx
import { Flex, Mentions } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="medium">
    <Mentions size="large" placeholder="large size" />
    <Mentions placeholder="default size" />
    <Mentions size="small" placeholder="small size" />
  </Flex>
</template>
