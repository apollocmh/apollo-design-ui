<script setup lang="ts">
// 对齐 antd 的 separator-component demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [
  { title: 'Location' },
  { type: 'separator', separator: ':' },
  { href: '', title: 'Application Center' },
  { type: 'separator' },
  { href: '', title: 'Application List' },
  { type: 'separator' },
  { title: 'An Application' },
];
</script>

<template>
  <Breadcrumb separator="" :items="items" />
</template>
