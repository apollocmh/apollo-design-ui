<script setup lang="ts">
import { Breadcrumb, Layout, Menu } from '@apollo-design/ui';

const { Header, Content, Footer, Sider } = Layout;
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
<template><Layout><Sider class="demo-fixed-sider" :width="160"><Menu class="demo-navigation" theme="dark" mode="inline" :items="nav" :default-selected-keys="['projects']" /></Sider><Layout><Header class="demo-header">Project workspace</Header><Content class="demo-content"><Breadcrumb class="demo-breadcrumb" :items="crumbs" /><div class="demo-card">Project content</div></Content><Footer class="demo-footer">Apollo Design · Workspace</Footer></Layout></Layout></template>

<style scoped>
.demo-header { display: flex; align-items: center; gap: 16px; padding-inline: 20px; }
.demo-header :deep(.apollo-menu-horizontal) { flex: 1; min-width: 0; }
.demo-content { min-width: 0; padding: 20px; }
.demo-card { min-height: 800px; padding: 20px; background: var(--apollo-color-bg-container); color: var(--apollo-color-text); border-radius: var(--apollo-border-radius-lg); }
.demo-footer { text-align: center; }
.demo-breadcrumb { margin-bottom: 16px; }

:deep(.demo-navigation.apollo-menu-dark) {
  --apollo-menu-item-bg: transparent;
  --apollo-menu-dark-item-bg: transparent;
}
</style>

<style scoped>.demo-fixed-sider { position: sticky; top: 0; height: min(100vh, 520px); overflow: auto; }</style>
