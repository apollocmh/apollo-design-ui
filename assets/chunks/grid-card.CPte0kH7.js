const r=`<script setup lang="ts">
// 对齐 antd 的 grid-card demo。
import { Card, CardGrid } from '@apollo-design/ui';
import type { CSSProperties } from 'vue';

const gridStyle: CSSProperties = { width: '25%', textAlign: 'center' };
<\/script>

<template>
  <Card title="Card Title">
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :hoverable="false" :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
  </Card>
</template>
`;export{r as default};
