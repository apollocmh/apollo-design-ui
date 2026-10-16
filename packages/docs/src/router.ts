/**
 * 站点路由。路径结构兼容旧 VitePress 站点：
 *   /components/<name>   组件详情（旧地址原样可用）
 *   /guide/<slug>        指南
 * 新增：/components/:name/demo/:demo 独立示例页（iframe 隔离场景与「新窗口打开」）。
 */
import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/HomePage.vue'),
    meta: { chrome: 'site' },
  },
  {
    path: '/components',
    name: 'overview',
    component: () => import('./pages/OverviewPage.vue'),
    meta: { chrome: 'site' },
  },
  {
    path: '/components/:name',
    name: 'component',
    component: () => import('./pages/ComponentPage.vue'),
    meta: { chrome: 'site' },
  },
  {
    path: '/components/:name/demo/:demo',
    name: 'standalone-demo',
    component: () => import('./pages/DemoStandalonePage.vue'),
    meta: { chrome: 'bare' },
  },
  {
    path: '/guide',
    redirect: '/guide/getting-started',
  },
  {
    path: '/guide/:slug',
    name: 'guide',
    component: () => import('./pages/GuidePage.vue'),
    meta: { chrome: 'site' },
  },
  {
    path: '/changelog',
    name: 'changelog',
    component: () => import('./pages/ChangelogPage.vue'),
    meta: { chrome: 'site' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./pages/NotFoundPage.vue'),
    meta: { chrome: 'site' },
  },
];
