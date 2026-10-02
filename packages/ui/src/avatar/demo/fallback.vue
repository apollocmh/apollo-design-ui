<script setup lang="ts">
// 对齐 antd 的 fallback demo。
import { Avatar, Space } from '@apollo-design/ui';

// ⚠️ 上游用的是真实的不存在地址；本仓用一个**必然加载失败**的相对地址（不发外链请求）
const broken = './not-exist-avatar.png';
</script>

<template>
  <Space>
    <Avatar shape="circle" :src="broken">A</Avatar>
    <Avatar shape="circle" :src="broken">ABC</Avatar>
  </Space>
</template>
