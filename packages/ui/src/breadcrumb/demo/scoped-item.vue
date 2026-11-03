<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, Button, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(false);
const empty = ref(false);
const id = ref(42);
const order = ref(['a', 'b']);
const items = [
  { title: 'Apps', path: 'apps' },
  { title: 'Detail', path: ':id' },
];
</script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px">
    <Button @click="custom = !custom">Toggle item slot</Button>
    <Button @click="empty = !empty">Toggle empty item</Button>
    <Button @click="id++">Update route params</Button>
    <Button @click="order = [...order].reverse()">Reorder native crumbs</Button>
  </div>
  <Breadcrumb :items="items" :params="{ id }" aria-label="Scoped breadcrumb">
    <template v-if="custom" #itemRender="{ route, paths, href }">
      <a v-if="!empty" :href="href" :data-route-path="paths.join('/')">{{ route.title }}</a>
    </template>
  </Breadcrumb>
  <Breadcrumb aria-label="Native breadcrumb" style="margin-top: 12px">
    <BreadcrumbItem v-for="key in order" :key="key">
      <span>{{ key }}</span>
      <Input :aria-label="`Crumb ${key}`" :placeholder="key" style="width: 80px" />
    </BreadcrumbItem>
  </Breadcrumb>
</template>
