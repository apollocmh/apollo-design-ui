const t=`<script setup lang="ts">
// 对齐 antd 的 playground demo（Slider 用原生 input range 等价替换，缺口见 README §7）

import { Col, Row } from '@apollo-design/ui';
import { ref } from 'vue';

const gutterKey = ref(1);
const verticalGutterKey = ref(1);
const colCountKey = ref(3);

const gutters: Record<number, number> = {};
const vgutters: Record<number, number> = {};
const colCounts: Record<number, number> = {};
[8, 16, 24].forEach((value, i) => {
  gutters[i] = value;
  vgutters[i] = value;
});
[2, 3, 4, 6, 8, 12].forEach((value, i) => {
  colCounts[i] = value;
});
<\/script>

<template>
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: #0092ff; border-radius: 4px; line-height: 30px; text-align: center; color: #fff">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <div style="margin-top: 16px">
    horizontal gutter:
    <input v-model.number="gutterKey" aria-label="horizontal gutter" type="range" min="0" :max="Object.keys(gutters).length - 1" style="vertical-align: middle" />
    {{ gutters[gutterKey] }}px
    vertical gutter:
    <input v-model.number="verticalGutterKey" aria-label="vertical gutter" type="range" min="0" :max="Object.keys(vgutters).length - 1" style="vertical-align: middle" />
    {{ vgutters[verticalGutterKey] }}px
    col count:
    <input v-model.number="colCountKey" aria-label="col count" type="range" min="0" :max="Object.keys(colCounts).length - 1" style="vertical-align: middle" />
    {{ colCounts[colCountKey] }} cols
  </div>
</template>
`;export{t as default};
