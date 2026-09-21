<script setup lang="ts">
// 对齐 antd 的 flex-order demo
import { Col, Row } from '@apollo-design/ui';

const cols = [
  { key: '1', order: 3 },
  { key: '2', order: 2 },
  { key: '3', order: 1 },
];
</script>

<template>
  <Row>
    <Col v-for="c in cols" :key="c.key" :span="6" :order="c.order">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">{{ c.key }} col-order-{{ c.order }}</div>
    </Col>
  </Row>
</template>
