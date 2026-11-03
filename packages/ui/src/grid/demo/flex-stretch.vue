<script setup lang="ts">
// 对齐 antd 的 flex-stretch demo（百分比列 + 内容撑满）
import { Col, Row } from '@apollo-design/ui';

const contents = [
  { key: '1', percent: '33.33%' },
  { key: '2', percent: '66.67%' },
  { key: '3', percent: '50%' },
];
</script>

<template>
  <div class="grid-demo">
  <Row style="height: 120px">
    <Col v-for="c in contents" :key="c.key" :span="8" :style="{ display: 'flex', flexDirection: 'column' }">
      <div :style="{ background: 'var(--apollo-color-primary-bg)', borderRadius: '4px', color: 'var(--apollo-color-text)', textAlign: 'center', height: c.percent }">
        {{ c.percent }}
      </div>
    </Col>
  </Row>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
