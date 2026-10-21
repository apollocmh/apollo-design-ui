<script setup lang="ts">
// 省略后缀：在省略号后追加自定义文本
import { Paragraph, Text } from '@apollo-design/ui';

const longText =
  'Apollo Design UI 以 Vue 3.5 与 TypeScript 原生实现，组件行为、视觉与 DOM 结构对齐参考实现。' +
  '这段文字故意写得很长，用来观察省略号之后追加的后缀文本。';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: 320px">
    <Paragraph :ellipsis="{ rows: 2, suffix: '…… 查看全文' }">
      {{ longText }}
    </Paragraph>
    <Text :ellipsis="{ suffix: '… 更多' }" :style="{ display: 'block', width: '260px' }">
      {{ longText }}
    </Text>
    <p style="margin: 0; color: #999; font-size: 12px">
      suffix 会触发 JS 裁剪：省略号后还能继续放置内容。
    </p>
  </div>
</template>
