<script setup lang="ts">
// 对齐 antd 的 responsive-flex demo（gutter 响应式对象 + Col 响应式 flex）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <div class="grid-demo">
  <Row :gutter="[{ xs: 8, sm: 16, md: 24 }, 16]">
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">Flex col</div>
    </Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; padding-inline: 12px; box-sizing: border-box; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
