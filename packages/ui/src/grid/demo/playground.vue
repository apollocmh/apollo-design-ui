<script setup lang="ts">
// 使用 Slider 演示零/分数/整像素的独立双轴 gutter。

import { Col, Row, Slider } from '@apollo-design/ui';
import { ref } from 'vue';

const gutterKey = ref(3);
const verticalGutterKey = ref(2);
const colCountKey = ref(3);

const gutters = [0, 8, 10.5, 16, 24];
const vgutters = [0, 7.5, 16, 24];
const colCounts = [2, 3, 4, 6, 8, 12];
</script>

<template>
  <div class="grid-demo">
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <Row :gutter="[gutters[gutterKey] ?? 0, vgutters[verticalGutterKey] ?? 0]">
    <Col v-for="i in colCounts[colCountKey]" :key="i" :span="24 / (colCounts[colCountKey] ?? 1)">
      <div style="height: 30px; background: var(--grid-demo-cell-bg, var(--apollo-color-primary-bg)); border-radius: 4px; line-height: 30px; text-align: center; color: var(--apollo-color-text)">col-{{ 24 / (colCounts[colCountKey] ?? 1) }}</div>
    </Col>
  </Row>
  <div style="display: grid; gap: 12px">
    <div>Horizontal gutter: {{ gutters[gutterKey] }}px<Slider v-model:value="gutterKey" aria-label="horizontal gutter" :min="0" :max="gutters.length - 1" /></div>
    <div>Vertical gutter: {{ vgutters[verticalGutterKey] }}px<Slider v-model:value="verticalGutterKey" aria-label="vertical gutter" :min="0" :max="vgutters.length - 1" /></div>
    <div>Column count: {{ colCounts[colCountKey] }}<Slider v-model:value="colCountKey" aria-label="col count" :min="0" :max="colCounts.length - 1" /></div>
  </div>
  </div>
</template>

<style scoped>
.grid-demo { display: grid; gap: 16px; min-width: 0; padding-inline: 12px; box-sizing: border-box; }
.grid-demo :deep(.apollo-col:nth-child(even)) { --grid-demo-cell-bg: var(--apollo-color-primary-bg-hover); }
</style>
