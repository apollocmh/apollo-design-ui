const e=`<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx
import { Select, SelectPurePanel } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <SelectPurePanel :options="options" />
</template>
`;export{e as default};
