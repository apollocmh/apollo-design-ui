<script setup lang="ts">
// 对齐 antd demo/custom-tag-render.tsx（tagRender 作用域插槽，prop 优先）
import { Select, Tag } from '@apollo-design/ui';

const options = [
  { value: 'gold', label: 'Gold' },
  { value: 'lime', label: 'Lime' },
];
</script>

<template>
  <Select mode="multiple" :options="options" style="width: 100%">
    <template #tagRender="{ label, value, closable, onClose }">
      <Tag :closable="closable" style="margin-inline-end: 4px" @close="onClose">
        {{ label }} ({{ value }})
      </Tag>
    </template>
  </Select>
</template>
