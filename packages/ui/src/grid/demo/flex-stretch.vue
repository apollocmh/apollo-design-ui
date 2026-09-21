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
  <Row style="height: 120px">
    <Col v-for="c in contents" :key="c.key" :span="8" :style="{ display: 'flex', flexDirection: 'column' }">
      <div :style="{ background: '#0092ff', borderRadius: '4px', color: '#fff', textAlign: 'center', height: c.percent }">
        {{ c.percent }}
      </div>
    </Col>
  </Row>
</template>
