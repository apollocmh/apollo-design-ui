<script setup lang="ts">
// 对齐 antd 的 type demo。⚠️ 图片用 **data URI**（外网图片会污染 L6 基线）
import { Avatar, Space } from '@apollo-design/ui';
import { h } from 'vue';

const url =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
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
    <Avatar :style="{ backgroundColor: '#fde3cf', color: '#f56a00' }">U</Avatar>
    <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
  </Space>
</template>
