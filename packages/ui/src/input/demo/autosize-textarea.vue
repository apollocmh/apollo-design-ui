<script setup lang="ts">
// TextArea autoSize：随内容自动撑高，可用 minRows / maxRows 限定范围
import { TextArea } from '@apollo-design/ui';
import { ref } from 'vue';

const autoValue = ref('');
const rangeValue = ref('');
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 340px; font-family: sans-serif"
  >
    <TextArea v-model:value="autoValue" :auto-size="true" placeholder="autoSize: true" />
    <TextArea
      v-model:value="rangeValue"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      placeholder="minRows: 2 / maxRows: 6"
    />
    <div style="font-size: 12px; color: #999">
      当前字符数：{{ rangeValue.length }}（超过 6 行后出现滚动条）
    </div>
  </div>
</template>
