<script setup lang="ts">
// 对齐 antd 的 separator demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [
  { title: 'Home' },
  { title: 'Application Center', href: '' },
  { title: 'Application List', href: '' },
  { title: 'An Application' },
];
</script>

<template>
  <Breadcrumb separator=">" :items="items" />
</template>
