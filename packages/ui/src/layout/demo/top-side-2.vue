<script setup lang="ts">
import { Breadcrumb, Layout, Menu } from '@apollo-design/ui';

const { Header, Content, Sider } = Layout;
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

const groups = [
  {
    key: 'workspace',
    label: 'Workspace',
    children: [
      { key: 'tasks', label: 'Tasks' },
      { key: 'files', label: 'Files' },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    children: [
      { key: 'members', label: 'Members' },
      { key: 'roles', label: 'Roles' },
    ],
  },
];
</script>
<template><Layout><Header class="demo-header"><strong>Apollo</strong><Menu class="demo-navigation" theme="dark" mode="horizontal" :items="nav" :default-selected-keys="['home']" /></Header><Layout><Sider theme="light" :width="160"><Menu class="demo-navigation" mode="inline" :items="groups" :default-open-keys="['workspace']" :default-selected-keys="['tasks']" /></Sider><Content class="demo-content"><Breadcrumb class="demo-breadcrumb" :items="crumbs" /><div class="demo-card">Project content</div></Content></Layout></Layout></template>

<style scoped>
.demo-header { display: flex; align-items: center; gap: 16px; padding-inline: 20px; }
.demo-header :deep(.apollo-menu-horizontal) { flex: 1; min-width: 0; }
.demo-content { min-width: 0; padding: 20px; }
.demo-card { min-height: 240px; padding: 20px; background: var(--apollo-color-bg-container); color: var(--apollo-color-text); border-radius: var(--apollo-border-radius-lg); }
.demo-footer { text-align: center; }
.demo-breadcrumb { margin-bottom: 16px; }

:deep(.demo-navigation.apollo-menu-dark) {
  --apollo-menu-item-bg: transparent;
  --apollo-menu-dark-item-bg: transparent;
}
</style>
