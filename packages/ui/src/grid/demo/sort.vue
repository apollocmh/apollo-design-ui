<script setup lang="ts">
// 对齐 antd 的 sort demo（push/pull）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="18" :push="6"><div style="height: 30px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-18 col-push-6</div></Col>
    <Col :span="6" :pull="18"><div style="height: 30px; background: var(--apollo-color-primary-bg-hover); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-6 col-pull-18</div></Col>
  </Row>
</template>
