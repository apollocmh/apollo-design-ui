const o=`<script setup lang="ts">
// 对齐 antd 的 offset demo
import { Col, Row } from '@apollo-design/ui';
<\/script>

<template>
  <Row>
    <Col :span="8"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-8</div></Col>
    <Col :span="8" :offset="8"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-8</div></Col>
  </Row>
  <Row>
    <Col :span="6" :offset="6"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-6</div></Col>
    <Col :span="6" :offset="6"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-6</div></Col>
  </Row>
  <Row>
    <Col :span="12" :offset="6"><div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-12</div></Col>
  </Row>
</template>
`;export{o as default};
