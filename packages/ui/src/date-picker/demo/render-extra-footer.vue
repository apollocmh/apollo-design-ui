<script setup lang="ts">
// 对齐 antd 的 demo/render-extra-footer.tsx
import { DatePicker } from '@apollo-design/ui';

const renderExtraFooter = () => '自定义面板底部内容';
</script>

<template>
  <DatePicker :render-extra-footer="renderExtraFooter" placeholder="面板底部有额外内容" />
</template>
