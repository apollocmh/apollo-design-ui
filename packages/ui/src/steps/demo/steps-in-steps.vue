<script setup lang="ts">
// 对齐 antd demo/steps-in-steps.tsx（嵌套；v1 以两个独立 Steps 组合近似展示）
import { Steps } from '@apollo-design/ui';

const outer = [
  { title: '阶段一', content: '准备' },
  { title: '阶段二', content: '执行' },
];
const inner = [{ title: '子步骤 1' }, { title: '子步骤 2' }];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <Steps :items="outer" :current="1" />
    <Steps :items="inner" :current="0" size="small" />
  </div>
</template>
