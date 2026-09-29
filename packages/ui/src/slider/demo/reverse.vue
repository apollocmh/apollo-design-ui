<script setup lang="ts">
// 对齐 antd `reverse.tsx`：`reverse` 让横向滑块反向（RTL 页面上会再取反一次）。
import { Slider } from '@apollo-design/ui';
</script>

<template>
  <Slider reverse :default-value="40" :marks="{ 0: '0', 50: '50', 100: '100' }" />
</template>
