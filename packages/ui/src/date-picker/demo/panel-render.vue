<script setup lang="ts">
// 对齐 antd 的 demo/panel-render.tsx：包裹原始面板
import { DatePicker } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const panelRender = (originPanel: VNodeChild) =>
  h(
    'div',
    {
      style: {
        padding: '8px',
        border: '1px solid var(--apollo-color-border)',
        borderRadius: 'var(--apollo-border-radius-lg)',
      },
    },
    [originPanel, h('div', { class: 'demo-hint' }, '自定义面板容器')],
  );
</script>

<template>
  <DatePicker placeholder="自定义面板容器">
    <template #panelRender="{ originPanel }"><component :is="() => panelRender(originPanel)" /></template>
  </DatePicker>
</template>
