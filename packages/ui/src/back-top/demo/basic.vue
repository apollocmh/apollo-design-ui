<script setup lang="ts">
// 对齐 antd 的 basic demo（deprecated 组件唯一 demo）
import { BackTop } from '@apollo-design/ui';

const lines = Array.from(
  { length: 20 },
  (_, index) => `第 ${index + 1} 行内容，向下滚动查看右下角按钮。`,
);
</script>

<template>
  <BackTop :visibility-height="0" />
  <div class="demo-back-top-content">
    <p v-for="line in lines" :key="line">{{ line }}</p>
  </div>
</template>
