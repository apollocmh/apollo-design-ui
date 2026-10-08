const e=`<script setup lang="ts">
// 对齐 antd 的 extra / collapsible demo
import { Collapse } from '@apollo-design/ui';

const items: import('@apollo-design/ui').CollapseItemType[] = [
  { key: '1', label: 'This is panel header 1', children: 'Content', extra: 'Extra' },
  { key: '2', label: 'This is panel header 2', children: 'Content', collapsible: 'header' },
  { key: '3', label: 'This is panel header 3', children: 'Content', collapsible: 'disabled' },
];
<\/script>

<template>
  <Collapse :items="items" />
</template>
`;export{e as default};
