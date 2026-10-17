/**
 * 站点路由。路径结构兼容旧 VitePress 站点：
 *   /components/<name>   组件详情（旧地址原样可用）
 *   /guide/<slug>        指南
 * 新增：/components/:name/demo/:demo 独立示例页（iframe 隔离场景与「新窗口打开」）。
 */
import type { LocationQueryRaw, RouteRecordRaw } from 'vue-router';

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

/**
 * 🚨 剥掉 `.html` 后缀的导航守卫（`main.ts` 里 `router.beforeEach` 挂载）。
 *
 * SSG 的 `dirStyle: 'flat'` 产出 `.html` 物理路径 —— sitemap、GitHub Pages 直链、
 * 收藏夹里的地址都长这样；而客户端路由（上面的表）只认**无后缀**路径。不剥的话，
 * 直开 `.html` 链接会先闪出预渲染内容、水合后被 catch-all 换成 404 页
 * （demo 全部消失 —— 2026-10-17 用户报告「没渲染 popconfirm」的根因之一）。
 *
 * 无后缀路径两种托管都可达：GitHub Pages 用 404.html 做 SPA 回退
 * （`vite.config.ts` onFinished 会生成），vite preview 有 history fallback。
 */
export function stripHtmlGuard(to: {
  path: string;
  query: LocationQueryRaw;
  hash: string;
}): { path: string; query: LocationQueryRaw; hash: string } | undefined {
  if (!to.path.endsWith('.html')) return undefined;
  const stripped = to.path.replace(/\.html$/, '');
  return {
    // `/index.html` 剥完是 `/index`，而首页路由是 `/` ⇒ 归一
    path: stripped === '/index' ? '/' : stripped || '/',
    query: to.query,
    hash: to.hash,
  };
}
