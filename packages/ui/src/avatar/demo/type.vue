<script setup lang="ts">
// 对齐 antd 的 type demo。⚠️ 图片用 **data URI**（外网图片会污染 L6 基线）
import { Avatar, Space } from '@apollo-design/ui';
import { h } from 'vue';

const url =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23dbeafe%22/%3E%3Ccircle cx=%2240%22 cy=%2228%22 r=%2214%22 fill=%22%231e40af%22/%3E%3Cpath d=%22M12 80a28 28 0 0 1 56 0%22 fill=%22%231e40af%22/%3E%3C/svg%3E';
const icon = () =>
  h('span', {
    style: { display: 'inline-block', width: '1em', height: '1em', background: '#999' },
  });
</script>

<template>
  <Space :size="16" wrap>
    <Avatar :icon="icon()" />
    <Avatar>U</Avatar>
    <Avatar :size="40">USER</Avatar>
    <Avatar :src="url" alt="avatar" />
    <Avatar :src="h('img', { draggable: false, src: url, alt: 'avatar' })" />
    <Avatar :style="{ backgroundColor: '#fde3cf', color: '#873800' }">U</Avatar>
    <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
  </Space>
</template>
