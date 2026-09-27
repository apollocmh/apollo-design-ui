<script setup lang="ts">
// 对齐 antd demo/clear.tsx
import { Flex, Rate } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="medium">
    <Flex gap="medium">
      <Rate :default-value="3" />
      <span>allowClear: true</span>
    </Flex>
    <Flex gap="medium">
      <Rate :default-value="3" :allow-clear="false" />
      <span>allowClear: false</span>
    </Flex>
  </Flex>
</template>
