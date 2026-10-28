<script setup lang="ts">
import { Breadcrumb, Layout, Menu } from '@apollo-design/ui';
import { ref } from 'vue';

const { Header, Content, Footer, Sider } = Layout;
const collapsed = ref(false),
  broken = ref(false),
  source = ref('initial');
const onBreakpoint = (value: boolean) => {
  broken.value = value;
};
const onCollapse = (_value: boolean, type: 'clickTrigger' | 'responsive') => {
  source.value = type;
};
const nav = [
  { key: 'home', label: 'Overview' },
  { key: 'projects', label: 'Projects' },
  { key: 'settings', label: 'Settings' },
];
const crumbs = [
  { title: 'Home', href: '#/layout-home' },
  { title: 'Projects' },
  { title: 'Details' },
];
</script>
<template><Layout><Sider v-model:collapsed="collapsed" breakpoint="lg" :collapsed-width="0" :width="180" @breakpoint="onBreakpoint" @collapse="onCollapse"><Menu class="demo-navigation" theme="dark" mode="inline" :items="nav" :default-selected-keys="['home']" /></Sider><Layout><Header class="demo-header">Responsive workspace</Header><Content class="demo-content" :class="{ 'demo-content-floating': broken }"><Breadcrumb class="demo-breadcrumb" :items="crumbs" /><div class="demo-card"><p>Below breakpoint: {{ broken }}</p><p>Collapsed: {{ collapsed }}</p><p>Source: {{ source }}</p></div></Content><Footer class="demo-footer">Apollo Design · Workspace</Footer></Layout></Layout></template>

<style scoped>
.demo-header { display: flex; align-items: center; gap: 16px; padding-inline: 20px; }
.demo-header :deep(.apollo-menu-horizontal) { flex: 1; min-width: 0; }
.demo-content { min-width: 0; padding: 20px; }
.demo-content-floating { padding-block-start: calc(var(--apollo-control-height-lg) + 20px); }
.demo-card { min-height: 240px; padding: 20px; background: var(--apollo-color-bg-container); color: var(--apollo-color-text); border-radius: var(--apollo-border-radius-lg); }
.demo-footer { text-align: center; }
.demo-breadcrumb { margin-bottom: 16px; }

:deep(.demo-navigation .apollo-menu-submenu-selected > .apollo-menu-submenu-title) {
  color: var(--apollo-color-text);
  background: var(--apollo-color-primary-bg);
}
/* Keep selected navigation readable in the demo's current theme. */
:deep(.demo-navigation), :deep(.demo-navigation .apollo-menu) {
  --apollo-menu-item-bg: var(--apollo-color-bg-container);
  --apollo-menu-item-color: var(--apollo-color-text);
  --apollo-menu-group-title-color: var(--apollo-color-text-secondary);
  --apollo-menu-sub-menu-item-bg: var(--apollo-color-fill-alter);
  --apollo-menu-sub-menu-item-selected-color: var(--apollo-color-text);
  --apollo-menu-item-selected-color: var(--apollo-color-text);
  --apollo-menu-item-selected-bg: var(--apollo-color-primary-bg);
  --apollo-menu-horizontal-item-selected-color: var(--apollo-color-text);
  --apollo-menu-horizontal-item-selected-bg: var(--apollo-color-primary-bg);
  --apollo-menu-dark-item-selected-color: var(--apollo-color-text);
  --apollo-menu-dark-item-selected-bg: var(--apollo-color-primary-bg);
}
</style>
