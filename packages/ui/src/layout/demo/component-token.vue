<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { Breadcrumb, Button, ConfigProvider, Layout, Menu } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const { Header, Content, Footer, Sider } = Layout;
const custom = ref(true);
const componentFields: Record<string, string | number> = {
  headerBg: 'var(--apollo-color-primary-bg)',
  headerColor: 'var(--apollo-color-text)',
  headerHeight: 72,
  headerPadding: '0 20px',
  footerPadding: '16px 20px',
  siderBg: '#343e59',
  triggerBg: '#343e59',
  triggerHeight: 40,
  zeroTriggerWidth: 36,
  zeroTriggerHeight: 36,
};
const theme = computed<ThemeConfig>(() =>
  custom.value ? { components: { Layout: componentFields } } : {},
);
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
<template>
  <div><Button style="margin-bottom: 16px" @click="custom = !custom">{{ custom ? 'Use default tokens' : 'Use component tokens' }}</Button>
  <ConfigProvider :theme="theme"><Layout><Header class="demo-header">Current Layout tokens</Header><Layout><Sider collapsible :width="160"><Menu class="demo-navigation" theme="dark" mode="inline" :items="nav" :default-selected-keys="['projects']" /></Sider><Content class="demo-content"><Breadcrumb class="demo-breadcrumb" :items="crumbs" /><div class="demo-card">Project content</div></Content></Layout><Footer class="demo-footer">Apollo Design · Workspace</Footer></Layout></ConfigProvider></div>
</template>

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
