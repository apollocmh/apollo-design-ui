const e=`<script setup lang="ts">
// 对齐 antd demo/clear-suffix-debug.tsx
import { DownOutlined } from '@apollo-design/icons';
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('a1');
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <div>
    <Select v-model:value="value" :options="options" allow-clear style="width: 200px">
      <template #suffixIcon><DownOutlined /></template>
    </Select>
    <p>value: {{ value ?? 'null' }}</p>
  </div>
</template>
`;export{e as default};
