<script setup lang="ts">
// 对齐 antd `simple.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination simple :default-current="2" :total="50" />
</template>
