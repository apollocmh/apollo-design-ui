<script setup lang="ts">
// 对齐 antd 的 gutter demo
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="16">
    <Col v-for="i in 6" :key="i" :span="6"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-6</div></Col>
  </Row>
  <Row :gutter="16">
    <Col v-for="i in 4" :key="i" :span="8"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-8</div></Col>
  </Row>
  <Row :gutter="24">
    <Col v-for="i in 4" :key="i" :span="8"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-8</div></Col>
  </Row>
</template>
