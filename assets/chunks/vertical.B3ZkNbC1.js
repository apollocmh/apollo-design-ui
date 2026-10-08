const e=`<script setup lang="ts">
// 对齐 antd 的 vertical demo
import { Descriptions } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
];
<\/script>

<template>
  <Descriptions layout="vertical" :items="items" />
</template>
`;export{e as default};
