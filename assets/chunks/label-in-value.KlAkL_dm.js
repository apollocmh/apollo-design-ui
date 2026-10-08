const n=`<script setup lang="ts">
// 对齐 antd demo/label-in-value.tsx
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<{ label?: unknown; value: string | number }>({
  value: 'a1',
  label: 'Jack',
});

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
const onChange = (v: unknown): void => {
  value.value = v as { label?: unknown; value: string | number };
};
<\/script>

<template>
  <div>
    <Select :value="value" label-in-value :options="options" style="width: 200px" @change="onChange" />
    <p>{{ value }}</p>
  </div>
</template>
`;export{n as default};
