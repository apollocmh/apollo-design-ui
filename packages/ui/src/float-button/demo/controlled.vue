<script setup lang="ts">
// 对齐 antd demo/controlled.tsx（受控 open）
import { CustomerServiceOutlined } from '@apollo-design/icons';
import { FloatButton, FloatButtonGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <FloatButtonGroup
    v-model:open="open"
    trigger="click"
    type="primary"
    style="inset-inline-end: 24px"
  >
    <template #icon><CustomerServiceOutlined /></template>
    <FloatButton />
  </FloatButtonGroup>
</template>
