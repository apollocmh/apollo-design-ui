const e=`<script setup lang="ts">
// 对齐 antd demo/coordinate.tsx：两个 Select 联动选坐标（Vue 写法等价替换）
import { Select } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const x = ref<number | undefined>(1);
const y = ref<number | undefined>(1);
const list = [1, 2, 3, 4];
const result = computed(() => \`(\${x.value ?? '-'}, \${y.value ?? '-'})\`);
<\/script>

<template>
  <div style="display: flex; gap: 8px; align-items: center">
    <Select v-model:value="x" :options="list.map((v) => ({ value: v, label: \`x\${v}\` }))" style="width: 90px" />
    <Select v-model:value="y" :options="list.map((v) => ({ value: v, label: \`y\${v}\` }))" style="width: 90px" />
    <span>{{ result }}</span>
  </div>
</template>
`;export{e as default};
