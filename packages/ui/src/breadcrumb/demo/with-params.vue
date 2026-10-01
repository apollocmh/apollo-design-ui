<script setup lang="ts">
// 对齐 antd 的 withParams demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [{ title: 'Users' }, { title: ':id', href: '' }];
</script>

<template>
  <Breadcrumb :items="items" :params="{ id: 1 }" />
</template>
