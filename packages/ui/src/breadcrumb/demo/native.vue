<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from '@apollo-design/ui';
import { ref } from 'vue';

const menuOpen = ref(false);
const custom = ref(true);
const menu = {
  items: [
    { key: 'guide', title: 'Guide', href: '#guide' },
    { key: 'api', title: 'API', href: '#api' },
    { key: 'future', title: 'Future guide', disabled: true },
  ],
};
</script>

<template>
  <button type="button" style="margin-bottom: 12px" @click="custom = !custom">
    Toggle separator and icon slots
  </button>
  <Breadcrumb aria-label="Documentation path">
    <template v-if="custom" #separator><span>›</span></template>
    <template v-if="custom" #dropdownIcon><span>⌄</span></template>
    <BreadcrumbItem href="#home" id="documentation-home" class="native-crumb">
      Home
    </BreadcrumbItem>
    <BreadcrumbItem
      :menu="menu" :dropdown-props="{
        open: menuOpen,
        onOpenChange: (open: boolean) => { menuOpen = open; },
      }"
    >
      <strong>Documentation</strong>
    </BreadcrumbItem>
    <BreadcrumbSeparator><span>·</span></BreadcrumbSeparator>
    <BreadcrumbItem aria-current="page">Breadcrumb</BreadcrumbItem>
  </Breadcrumb>
</template>
