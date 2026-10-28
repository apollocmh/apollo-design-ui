<script setup lang="ts">
// 对齐 antd 的 demo/textarea.tsx（autoSize）

import { TextArea } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; width: min(100%, 320px)">
    <TextArea
      v-model:value="value"
      aria-label="自适应高度的文本域"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      placeholder="autoSize"
    />
    <TextArea aria-label="带字数统计的文本域" placeholder="showCount" show-count :max-length="50" />
  </div>
</template>
