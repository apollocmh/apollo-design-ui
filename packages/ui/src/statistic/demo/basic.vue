<script setup lang="ts">
// 对齐 antd 的 basic demo（components/statistic/demo/basic.tsx）
import { Col, Row, Statistic } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="[16, 16]">
    <Col :xs="24" :sm="12">
      <Statistic title="Active Users" :value="112893" />
    </Col>
    <Col :xs="24" :sm="12">
      <Statistic title="Account Balance (CNY)" :value="112893" :precision="2" />
    </Col>
    <Col :xs="24" :sm="12">
      <Statistic title="Active Users" :value="112893" loading />
    </Col>
  </Row>
</template>
