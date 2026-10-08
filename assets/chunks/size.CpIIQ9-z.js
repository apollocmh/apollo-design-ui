const e=`<script setup lang="ts">
// 对齐 antd 的 size demo
import { Segmented } from '@apollo-design/ui';
<\/script>

<template>
  <!-- 🚨 flex 列容器的 align-items 默认 stretch，会把 inline-block 子项拉满宽 -->
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px">
    <Segmented size="large" :options="['Daily', 'Weekly', 'Monthly']" />
    <Segmented :options="['Daily', 'Weekly', 'Monthly']" />
    <Segmented size="small" :options="['Daily', 'Weekly', 'Monthly']" />
  </div>
</template>
`;export{e as default};
