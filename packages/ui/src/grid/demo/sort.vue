<script setup lang="ts">
// 对齐 antd 的 sort demo（push/pull）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row>
    <Col :span="18" :push="6"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-18 col-push-6</div></Col>
    <Col :span="6" :pull="18"><div style="height: 30px; background: rgba(0,146,255,0.75); border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-6 col-pull-18</div></Col>
  </Row>
</template>
