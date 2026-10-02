<script setup lang="ts">
// 对齐 antd 的 basic demo。
import { Avatar, Space } from '@apollo-design/ui';
import { h } from 'vue';

// ⚠️ 图标替身：demo 里用纯色方块（与视觉用例同一份结构，避免外链图标带来的差异）
const icon = () =>
  h('span', {
    style: { display: 'inline-block', width: '1em', height: '1em', background: '#999' },
  });
</script>

<template>
  <Space vertical :size="16">
    <Space wrap :size="16">
      <Avatar :size="64" :icon="icon()" />
      <Avatar size="large" :icon="icon()" />
      <Avatar :icon="icon()" />
      <Avatar size="small" :icon="icon()" />
      <Avatar :size="14" :icon="icon()" />
    </Space>
    <Space wrap :size="16">
      <Avatar shape="square" :size="64" :icon="icon()" />
      <Avatar shape="square" size="large" :icon="icon()" />
      <Avatar shape="square" :icon="icon()" />
      <Avatar shape="square" size="small" :icon="icon()" />
      <Avatar shape="square" :size="14" :icon="icon()" />
    </Space>
  </Space>
</template>
