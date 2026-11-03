<script setup lang="ts">
// 对齐 antd 的 responsive demo
import { Col, Row } from '@apollo-design/ui';

const cols = [
  { key: '1', xs: 2, md: 4, xl: 6, xxl: 8 },
  { key: '2', xs: 20, md: 8, xl: 12, xxl: 16 },
];
</script>

<template>
  <div class="grid-demo">
  <Row>
    <Col v-for="c in cols" :key="c.key" :xs="c.xs" :md="c.md" :xl="c.xl" :xxl="c.xxl">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div>
    </Col>
  </Row>
  <Row>
    <Col :xs="{ span: 5, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
    <Col :xs="{ span: 11, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
    <Col :xs="{ span: 5, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
  </Row>
  <Row>
    <Col :xs="{ span: 11, offset: 1 }" :lg="{ span: 6, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
