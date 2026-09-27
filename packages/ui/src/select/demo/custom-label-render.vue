<script setup lang="ts">
// 对齐 antd demo/custom-label-render.tsx
import { Select } from '@apollo-design/ui';
import { h } from 'vue';

const options = [
  { value: 'gold', label: 'Gold' },
  { value: 'lime', label: 'Lime' },
];
const labelRender = (props: { label?: unknown; value?: unknown }) =>
  h('span', { style: 'font-weight: bold' }, [`${props.label ?? props.value} (custom)`]);
</script>

<template>
  <Select :options="options" :label-render="labelRender" style="width: 200px" />
</template>
