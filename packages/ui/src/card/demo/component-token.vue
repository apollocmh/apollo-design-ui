<script setup lang="ts">
// 组件 Token：在根元素覆写 `--apollo-card-*` 变量。
import { Card } from '@apollo-design/ui';

const tokenStyle = {
  width: '360px',
  '--apollo-card-header-bg': '#e6f4ff',
  '--apollo-card-header-font-size': '18px',
  '--apollo-card-header-padding': '16px 24px',
  '--apollo-card-body-padding': '20px 24px',
  '--apollo-card-actions-bg': '#f0f5ff',
};

const actions = ['Edit', 'More'];
</script>

<template>
  <Card
    title="Component token card"
    extra="Extra"
    hoverable
    :actions="actions"
    :style="tokenStyle"
  >
    <p>Card content</p>
    <p>Header, body and actions are styled with card component tokens.</p>
  </Card>
</template>
