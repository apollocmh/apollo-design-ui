const e=`<script setup lang="ts">
// 对齐 antd 的 demo/textarea.tsx（autoSize）

import { TextArea } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
<\/script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 320px">
    <TextArea v-model:value="value" :auto-size="{ minRows: 2, maxRows: 6 }" placeholder="autoSize" />
    <TextArea placeholder="showCount" show-count :max-length="50" />
  </div>
</template>
`;export{e as default};
