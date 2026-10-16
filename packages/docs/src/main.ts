/**
 * 站点入口（vite-ssg 契约：导出 createApp）。
 *
 * SSR 注意：只在浏览器可用的逻辑一律放进 onMounted / 客户端守卫分支；
 * demo 组件通过 DemoRenderer 的「仅客户端加载」策略进入页面，构建期不执行任何示例代码。
 */
import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { provideSiteLocale } from './composables/locale';
import { setupTheme } from './composables/theme';
import { routes } from './router';

import '@apollo-design/theme/tokens.css';
// ⚠️ 组件样式必须显式引入：文档站的示例走的是**发布产物同源**的静态 CSS
//    （R7：零 @ant-design 运行时依赖，也就没有 cssinjs 运行时注入）。
//    漏掉这条的症状非常隐蔽 —— demo 能渲染、交互正常，只是「长得像裸 HTML」。
import '@apollo-design/ui/style.css';
import './styles/site.css';
import './styles/markdown.css';

export const createApp = ViteSSG(
  App,
  {
    // ⚠️ 必须显式传 base：vite-ssg 内部是 createWebHistory(routerOptions.base)，
    // 缺省等于 '/' —— 部署到 GitHub Pages 子路径 /apollo-design-ui/ 时
    // 客户端会把整段子路径当成路由去匹配，所有页面都会落到 catch-all 404。
    base: import.meta.env.BASE_URL,
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved;
      if (to.hash) return { el: to.hash, behavior: 'smooth', top: 72 };
      if (to.path !== from.path) return { top: 0 };
    },
  },
  ({ app, router, isClient }) => {
    app.provide('is-client', isClient);
    if (isClient) {
      setupTheme();
      router.afterEach(() => {
        // 锚点跳转交给 scrollBehavior；这里只负责回顶后的焦点复位（无障碍）
      });
    }
    provideSiteLocale(app);
  },
);
