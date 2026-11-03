<script setup lang="ts">
// 对齐 antd 的 offset demo
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <div class="grid-demo">
  <Row>
    <Col :span="8"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-8</div></Col>
    <Col :span="8" :offset="8"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-8</div></Col>
  </Row>
  <Row>
    <Col :span="6" :offset="6"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-6</div></Col>
    <Col :span="6" :offset="6"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-6</div></Col>
  </Row>
  <Row>
    <Col :span="12" :offset="6"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-12</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
