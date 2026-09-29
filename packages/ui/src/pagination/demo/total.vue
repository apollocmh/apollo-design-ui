<script setup lang="ts">
// 对齐 antd `total.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85" :show-total="(total: number) => `Total ${total} items`" />
</template>
