const e=`<script setup lang="ts">
// 对齐 antd 的 basic demo（items 首选形态）
import { Collapse } from '@apollo-design/ui';

const items = [
  {
    key: '1',
    label: 'This is panel header 1',
    children: 'A dog is a type of domesticated animal.',
  },
  {
    key: '2',
    label: 'This is panel header 2',
    children: 'A dog is a type of domesticated animal.',
  },
  {
    key: '3',
    label: 'This is panel header 3',
    children: 'A dog is a type of domesticated animal.',
  },
];
<\/script>

<template>
  <Collapse :items="items" />
</template>
`;export{e as default};
