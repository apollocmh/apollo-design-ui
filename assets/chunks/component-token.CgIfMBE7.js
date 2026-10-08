const n=`<script setup lang="ts">
// 对齐 antd demo/component-token.tsx
import { ConfigProvider, Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <ConfigProvider
    :theme="{
      components: { Select: { optionHeight: 40, selectorBg: '#f6ffed' } },
    }"
  >
    <Select :options="options" style="width: 200px" />
  </ConfigProvider>
</template>
`;export{n as default};
