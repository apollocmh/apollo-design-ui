<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85">
    <template #total="{ total }">Total {{ total }} items</template>
  </Pagination>
</template>
