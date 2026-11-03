<script setup lang="ts">
// 对齐 antd 的 flex-order demo
import { Col, Row } from '@apollo-design/ui';

const cols = [
  { key: '1', order: 3 },
  { key: '2', order: 2 },
  { key: '3', order: 1 },
];
</script>

<template>
  <div class="grid-demo">
  <Row>
    <Col v-for="c in cols" :key="c.key" :span="6" :order="c.order">
      <div style="min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; text-align: center; color: var(--apollo-color-text)">{{ c.key }} col-order-{{ c.order }}</div>
    </Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
