<script setup lang="ts">
// 中间省略：固定保留尾部内容，省略中间部分
import { Text } from '@apollo-design/ui';

const text =
  'Ant Design, a design language for background applications, is refined by Ant UED Team.';
const suffixCount = 12;
const start = text.slice(0, text.length - suffixCount);
const suffix = text.slice(-suffixCount).trim();
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; font-family: sans-serif">
    <Text :style="{ maxWidth: '260px' }" :ellipsis="{ suffix, tooltip: text }">
      {{ start }}
    </Text>
    <div style="font-size: 12px; color: var(--apollo-color-text)">
      尾部固定保留「{{ suffix }}」，悬浮可查看完整文本
    </div>
  </div>
</template>
