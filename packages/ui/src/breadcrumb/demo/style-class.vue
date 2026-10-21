<script setup lang="ts">
// 语义化 classNames / styles：root / item / separator 三个槽位。
import type { BreadcrumbItemInput } from '@apollo-design/ui';
import { Breadcrumb } from '@apollo-design/ui';
import { h } from 'vue';

const items: BreadcrumbItemInput[] = [
  { title: h('a', { href: '' }, 'Home') },
  { title: h('a', { href: '' }, 'Components') },
  { title: 'Breadcrumb' },
];

const classNames = {
  root: 'demo-breadcrumb-root',
  item: 'demo-breadcrumb-item',
  separator: 'demo-breadcrumb-separator',
};

const styles = {
  root: {
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'var(--apollo-color-fill-quaternary)',
  },
  item: { fontWeight: 500 },
};
</script>

<template>
  <Breadcrumb :items="items" :class-names="classNames" :styles="styles" />
</template>

<style>
.demo-breadcrumb-root {
  border: 1px solid var(--apollo-color-border-secondary);
}

.demo-breadcrumb-separator {
  font-weight: 700;
}
</style>
