const s=`<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（语义 classNames / styles）
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <Select
    :options="options"
    style="width: 200px"
    :class-names="{ root: 'demo-root', suffix: 'demo-suffix' }"
    :styles="{ content: { color: 'red' } }"
  />
</template>
`;export{s as default};
