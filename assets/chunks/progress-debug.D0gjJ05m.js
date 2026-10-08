const t=`<script setup lang="ts">
// 对齐 antd demo/progress-debug.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '第一步', content: '说明' },
  { title: '第二步', content: '说明' },
];
<\/script>

<template>
  <Steps :items="items" :current="0" :percent="100" />
</template>
`;export{t as default};
