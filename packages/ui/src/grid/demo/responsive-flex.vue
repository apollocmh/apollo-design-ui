<script setup lang="ts">
// 对齐 antd 的 responsive-flex demo（gutter 响应式对象 + Col 响应式 flex）
import { Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Row :gutter="{ xs: 8, sm: 16, md: 24 }">
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">Flex col</div>
    </Col>
    <Col :xs="{ flex: '100%' }" :sm="{ flex: '50%' }" :md="{ flex: '33.33%' }" :lg="{ flex: '25%' }">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">Flex col</div>
    </Col>
  </Row>
</template>
