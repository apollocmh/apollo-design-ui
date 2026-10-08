const t=`<script setup lang="ts">
// 对齐 antd demo/variant-debug.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '第一步', content: '说明' },
  { title: '第二步', content: '说明' },
];
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Steps :items="items" :current="1" variant="filled" />
    <Steps :items="items" :current="1" variant="outlined" />
  </div>
</template>
`;export{t as default};
