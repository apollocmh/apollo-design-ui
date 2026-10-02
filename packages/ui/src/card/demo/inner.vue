<script setup lang="ts">
// 对齐 antd 的 inner demo。
import { Card } from '@apollo-design/ui';
import { h } from 'vue';

const more = () => h('a', { href: '#' }, 'More');
</script>

<template>
  <Card title="Card title">
    <Card type="inner" title="Inner Card title" :extra="more()">Inner Card content</Card>
    <Card
      :style="{ marginTop: '16px' }"
      type="inner"
      title="Inner Card title"
      :extra="more()"
    >
      Inner Card content
    </Card>
  </Card>
</template>
