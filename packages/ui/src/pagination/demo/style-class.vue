<script setup lang="ts">
// 语义化 classNames / styles：root / item 两个槽位。
import { Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);

const classNames = {
  root: 'demo-pagination-style-root',
  item: 'demo-pagination-style-item',
};

const styles = {
  root: {
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: 'var(--apollo-color-fill-quaternary)',
  },
  item: { transition: 'transform 0.2s' },
};
</script>

<template>
  <Pagination v-model:current="current" :total="80" :class-names="classNames" :styles="styles" />
</template>

<style>
.demo-pagination-style-root {
  border: 1px solid var(--apollo-color-border-secondary);
}

.demo-pagination-style-item:hover {
  transform: translateY(-1px);
}
</style>
