<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85" show-size-changer show-quick-jumper>
    <template #total="{ total }">Total {{ total }} items</template>
  </Pagination>
</template>
