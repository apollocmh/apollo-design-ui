<script setup lang="ts">
// 对齐 antd 的 flex-align demo
import { Col, Row } from '@apollo-design/ui';

const aligns = ['top', 'middle', 'bottom', 'stretch'] as const;
</script>

<template>
  <Row v-for="a in aligns" :key="a" :align="a" style="height: 80px; background: var(--apollo-color-fill-alter)">
    <Col :span="4"><div style="height: 30px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
    <Col :span="4"><div style="height: 60px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 60px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-4</div></Col>
  </Row>
</template>
