<script setup lang="ts">
// 对齐 antd 的 sort demo（push/pull）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <div class="grid-demo">
  <Row>
    <Col :span="18" :push="6"><div style="min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; text-align: center; color: var(--apollo-color-text)">col-18 col-push-6</div></Col>
    <Col :span="6" :pull="18"><div style="min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; background: var(--apollo-color-primary-bg-hover); border-radius: 4px; line-min-height: 30px; height: 100%; box-sizing: border-box; padding: 4px; overflow-wrap: anywhere; text-align: center; color: var(--apollo-color-text)">col-6 col-pull-18</div></Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
