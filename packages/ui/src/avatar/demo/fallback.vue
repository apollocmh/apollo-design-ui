<script setup lang="ts">
// 对齐 antd 的 fallback demo。
import { Avatar, Space } from '@apollo-design/ui';

// Invalid local image data exercises the real image error without a network request.
const broken = 'data:image/png,invalid';
</script>

<template>
  <Space>
    <Avatar shape="circle" :src="broken">A</Avatar>
    <Avatar shape="circle" :src="broken">ABC</Avatar>
  </Space>
</template>
