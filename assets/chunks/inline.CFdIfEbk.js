const t=`<script setup lang="ts">
// 对齐 antd demo/inline.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '下单', content: '2023-06-01' },
  { title: '支付', content: '2023-06-02' },
  { title: '发货', content: '2023-06-03' },
];
<\/script>

<template>
  <Steps type="inline" :items="items" :current="1" />
</template>
`;export{t as default};
