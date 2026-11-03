<script setup lang="ts">
// 对齐 antd 的 unit demo（components/statistic/demo/unit.tsx）
import { LikeOutlined } from '@apollo-design/icons';
import { Col, Row, Statistic } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="[16, 16]">
    <Col :xs="24" :sm="12">
      <Statistic title="Feedback" :value="1128">
        <template #prefix>
          <LikeOutlined />
        </template>
      </Statistic>
    </Col>
    <Col :xs="24" :sm="12">
      <Statistic title="Unmerged" :value="93" suffix="/ 100" />
    </Col>
  </Row>
</template>
