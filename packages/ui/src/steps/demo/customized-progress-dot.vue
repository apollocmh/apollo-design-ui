<script setup lang="ts">
// 对齐 antd demo/customized-progress-dot.tsx（C8-R2：progressDot fn → #progressDot 插槽）
import { Steps } from '@apollo-design/ui';
import { h } from 'vue';

const items = [{ title: '等待中' }, { title: '处理中' }, { title: '已发货' }, { title: '已完成' }];
const renderDot = (p: { index: number; status: string }) =>
  h(
    'span',
    {
      style:
        'display:inline-flex;width:16px;height:16px;border-radius:50%;background:' +
        (p.status === 'finish' ? '#1677ff' : p.status === 'process' ? '#91caff' : '#e0e0e0') +
        ';color:#fff;font-size:10px;align-items:center;justify-content:center',
    },
    String(p.index + 1),
  );
const titleSlot = (p: { index: number; status: string }) => renderDot(p);
</script>

<template>
  <Steps :items="items" type="dot" :current="2">
    <template #progressDot="{ index, status }">
      <component :is="h('span', {
        style: 'display:inline-flex;width:16px;height:16px;border-radius:50%;background:' + (status === 'finish' ? '#1677ff' : status === 'process' ? '#91caff' : '#e0e0e0') + ';color:#fff;font-size:10px;align-items:center;justify-content:center',
      }, String(index + 1))" />
    </template>
  </Steps>
</template>
