const e=`<script setup lang="ts">
// 对齐 antd 的 bordered demo
import { Descriptions } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
];
<\/script>

<template>
  <Descriptions bordered :items="items" />
</template>
`;export{e as default};
