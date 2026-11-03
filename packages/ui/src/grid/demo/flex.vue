<script setup lang="ts">
// 对齐 antd 的 flex demo（justify 排版）
import { Col, Row } from '@apollo-design/ui';

const justifies = [
  'start',
  'center',
  'end',
  'space-between',
  'space-around',
  'space-evenly',
] as const;
</script>

<template>
  <div class="grid-demo">
  <Row v-for="j in justifies" :key="j" :justify="j">
    <Col :span="4"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
