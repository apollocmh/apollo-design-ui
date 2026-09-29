<script setup lang="ts">
// 对齐 antd `basic.tsx`。
import { Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);
</script>

<template>
  <Pagination v-model:current="current" :total="50" />
</template>
