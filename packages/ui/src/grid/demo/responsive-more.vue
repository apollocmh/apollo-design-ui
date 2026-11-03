<script setup lang="ts">
// 对齐 antd 的 responsive-more demo（span/offset 响应式对象）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <div class="grid-demo">
  <Row>
    <Col :xs="{ span: 20, offset: 2 }" :lg="{ span: 8, offset: 4 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
    <Col :xs="{ span: 2, offset: 0 }" :lg="{ span: 6, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
  </Row>
  <Row>
    <Col :xs="{ span: 22, offset: 1 }" :lg="{ span: 10, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
  </Row>
  <Row>
    <Col :xs="{ span: 10, offset: 1 }" :lg="{ span: 8, offset: 4 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
    <Col :xs="{ span: 10, offset: 2 }" :lg="{ span: 8, offset: 2 }"><div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Col</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
