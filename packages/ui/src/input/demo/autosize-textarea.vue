<script setup lang="ts">
// TextArea autoSize：随内容自动撑高，可用 minRows / maxRows 限定范围
import { TextArea } from '@apollo-design/ui';
import { ref } from 'vue';

const autoValue = ref('');
const rangeValue = ref('');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: min(100%, 340px)">
    <TextArea
      v-model:value="autoValue"
      aria-label="随内容自动增高的文本域"
      :auto-size="true"
      placeholder="autoSize: true"
    />
    <TextArea
      v-model:value="rangeValue"
      aria-label="限制为二至六行的文本域"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      placeholder="minRows: 2 / maxRows: 6"
    />
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">
      当前字符数：{{ rangeValue.length }}（超过 6 行后出现滚动条）
    </div>
  </div>
</template>
