<script setup lang="ts">
// 原生范围控件演示零/分数/整像素的独立双轴 gutter。

import { Col, Row } from '@apollo-design/ui';
import { ref } from 'vue';

const gutterKey = ref(3);
const verticalGutterKey = ref(2);
const colCountKey = ref(3);

const gutters = [0, 8, 10.5, 16, 24];
const vgutters = [0, 7.5, 16, 24];
const colCounts = [2, 3, 4, 6, 8, 12];
</script>

<template>
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: var(--apollo-color-primary-bg); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <div style="margin-top: 16px">
    horizontal gutter:
    <input v-model.number="gutterKey" aria-label="horizontal gutter" type="range" min="0" :max="gutters.length - 1" style="vertical-align: middle" />
    {{ gutters[gutterKey] }}px
    vertical gutter:
    <input v-model.number="verticalGutterKey" aria-label="vertical gutter" type="range" min="0" :max="vgutters.length - 1" style="vertical-align: middle" />
    {{ vgutters[verticalGutterKey] }}px
    col count:
    <input v-model.number="colCountKey" aria-label="col count" type="range" min="0" :max="colCounts.length - 1" style="vertical-align: middle" />
    {{ colCounts[colCountKey] }} cols
  </div>
</template>
