<script setup lang="ts">
// 对齐 antd `all.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination
    :total="85"
    show-size-changer
    show-quick-jumper
    :show-total="(total: number) => `Total ${total} items`"
  />
</template>
