const e=`<script setup lang="ts">
// 对齐 antd demo/autoSize.tsx
import { Mentions } from '@apollo-design/ui';

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];
<\/script>

<template>
  <Mentions auto-size style="width: 100%" :options="options" />
</template>
`;export{e as default};
