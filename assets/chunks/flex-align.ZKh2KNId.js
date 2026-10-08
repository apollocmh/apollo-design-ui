const n=`<script setup lang="ts">
// 对齐 antd 的 flex-align demo
import { Col, Row } from '@apollo-design/ui';

const aligns = ['top', 'middle', 'bottom'] as const;
<\/script>

<template>
  <Row v-for="a in aligns" :key="a" :align="a" style="height: 80px; background: rgba(128,128,128,0.08)">
    <Col :span="4"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-4</div></Col>
    <Col :span="4"><div style="height: 60px; background: #0092ff; border-radius: 4px; line-height: 60px; text-align: center; color: #fff">col-4</div></Col>
    <Col :span="4"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-4</div></Col>
  </Row>
</template>
`;export{n as default};
