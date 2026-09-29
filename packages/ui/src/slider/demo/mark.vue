<script setup lang="ts">
// 对齐 antd `mark.tsx`：`marks` 的值可以是字符串 / 数字 / `{label, style}` 对象。
import { Slider } from '@apollo-design/ui';

const marks = {
  0: '0°C',
  26: '26°C',
  37: '37°C',
  100: { style: { color: '#f50' }, label: '100°C' },
};
</script>

<template>
  <Slider :default-value="37" :marks="marks" />
</template>
