<script setup lang="ts">
// 对齐 antd 的 gutter demo
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <div class="grid-demo">
  <Row :gutter="[10.5, 7.5]">
    <Col v-for="i in 6" :key="i" :span="6"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-6</div></Col>
  </Row>
  <Row :gutter="16">
    <Col v-for="i in 4" :key="i" :span="8"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-8</div></Col>
  </Row>
  <Row :gutter="[{ xs: 8, md: 24 }, { xs: 8, md: 16 }]">
    <Col v-for="i in 4" :key="i" :span="8"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-8</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; padding-inline: 12px; box-sizing: border-box; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
