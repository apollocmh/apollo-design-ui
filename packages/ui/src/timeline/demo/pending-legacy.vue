<script setup lang="ts">
// 对齐 antd 的 `pending-legacy` demo。
import { Flex, Timeline } from '@apollo-design/ui';

const items = [{ content: 'Create a services site 2015-09-01' }];
</script>

<template>
  <Flex vertical :gap="16" align="flex-start">
    <Timeline pending="Recording..." :items="items" />
    <Timeline pending="Recording..." pending-dot="🔴" :items="items" />
  </Flex>
</template>
