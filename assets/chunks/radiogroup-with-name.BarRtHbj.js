const a=`<script setup lang="ts">
// 对齐 antd 的 radiogroup-with-name demo
import { Radio } from '@apollo-design/ui';

const options = [
  { value: 1, label: 'A' },
  { value: 2, label: 'B' },
  { value: 3, label: 'C' },
  { value: 4, label: 'D' },
];
<\/script>

<template>
  <Radio.Group name="radiogroup" :default-value="1" :options="options" />
</template>
`;export{a as default};
