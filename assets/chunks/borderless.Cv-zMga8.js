const e=`<script setup lang="ts">
// 对齐 antd 的 borderless / ghost demo
import { Collapse } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'This is panel header 1', children: 'Content' },
  { key: '2', label: 'This is panel header 2', children: 'Content' },
];
<\/script>

<template>
  <Collapse :items="items" :bordered="false" style="margin-bottom: 24px" />
  <Collapse :items="items" ghost />
</template>
`;export{e as default};
