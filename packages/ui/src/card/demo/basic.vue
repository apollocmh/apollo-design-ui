<script setup lang="ts">
// 对齐 antd 的 basic demo。
import { Card, Space } from '@apollo-design/ui';
import { h } from 'vue';

const more = () => h('a', { href: '#' }, 'More');
</script>

<template>
  <Space vertical :size="16">
    <Card title="Default size card" :extra="more()" :style="{ width: '300px' }">
      <p>Card content</p>
      <p>Card content</p>
      <p>Card content</p>
    </Card>
    <Card size="small" title="Small size card" :extra="more()" :style="{ width: '300px' }">
      <p>Card content</p>
      <p>Card content</p>
      <p>Card content</p>
    </Card>
  </Space>
</template>
