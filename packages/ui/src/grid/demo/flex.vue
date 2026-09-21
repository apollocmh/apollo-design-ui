<script setup lang="ts">
// 对齐 antd 的 flex demo（justify 排版）
import { Col, Row } from '@apollo-design/ui';

const justifies = [
  'start',
  'center',
  'end',
  'space-between',
  'space-around',
  'space-evenly',
] as const;
</script>

<template>
  <Row v-for="j in justifies" :key="j" :justify="j">
    <Col :span="4"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-4</div></Col>
  </Row>
</template>
