<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
import { ConfigProvider, Rate } from '@apollo-design/ui';
</script>

<template>
  <ConfigProvider :theme="{ components: { Rate: { starColor: 'blue', starSize: 36 } } }">
    <Rate />
  </ConfigProvider>
</template>
