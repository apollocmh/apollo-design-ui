import process from 'node:process';
import fs from 'node:fs';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import type { ViteSSGOptions } from 'vite-ssg';
import { buildManifest } from './tooling/content/build-manifest.mjs';

// GitHub Pages 项目子路径；本地可用 DOCS_BASE=/ 覆盖。
const BASE = process.env.DOCS_BASE ?? '/apollo-design-ui/';

/** 开发期内容热更：组件文档 / demo / 指南变化 ⇒ 重建 manifest + 整页刷新。 */
function contentWatchPlugin(): Plugin {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    name: 'apollo-docs-content-watch',
    apply: 'serve',
    configureServer(server) {
      const RELEVANT = /(packages\/ui\/src\/[^/]+\/(index\.(zh-CN|en-US)\.md|demo\/[^/]+\.(md|vue))|packages\/docs\/content\/)/;
      const schedule = (p: string): void => {
        if (!RELEVANT.test(p)) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          await buildManifest();
          server.ws.send({ type: 'full-reload' });
        }, 400);
      };
      server.watcher.on('add', schedule);
      server.watcher.on('change', schedule);
      server.watcher.on('unlink', schedule);
    },
  };
}

const config: UserConfig & { ssgOptions?: ViteSSGOptions } = {
  base: BASE,
  plugins: [vue(), contentWatchPlugin()],
  resolve: {
    alias: {
      // ⚠️ 顺序敏感：alias 是**前缀**匹配，必须把更长的说明符放在前面，
      //    否则 `@apollo-design/ui/style.css` 会被改写成 `<ui-src>/index.ts/style.css`
      //    （Not a directory）。样式指向 **dist**：文档站示例与发布产物视觉同源。
      '@apollo-design/ui/style.css': path.resolve(
        process.cwd(),
        '../../packages/ui/dist/index.css',
      ),
      // ⚠️ 不能用 import.meta.url 计算别名 —— vite.config 会被打包到临时目录执行，
      // 相对路径全部失准；vite 恒以 packages/docs 为 cwd（pnpm --filter 保证）。
      // packages/docs 的上两级 = 仓库根。
      '@apollo-design/ui': path.resolve(process.cwd(), '../../packages/ui/src/index.ts'),
      '@apollo-design/icons': path.resolve(process.cwd(), '../../packages/icons/src/index.ts'),
    },
  },
  build: {
    // demo 源码（?raw）+ 72 个组件页数据都是大字符串，提高上限避免误报
    chunkSizeWarningLimit: 1500,
    // ⚠️ Vite 8 默认 CSS 压缩器 lightningcss 会**拒绝**组件库产物里一段
    //    `transition: A !important, B !important`（collapse 样式，见缺陷台账 #D1 ——
    //    antd 上游根本没有 !important，这是本仓自加的非法声明）。
    //    浏览器对它的处理是「整条丢弃」，esbuild 与浏览器一样宽容（只压缩不校验），
    //    所以这里选 esbuild：文档站不该因为组件库的一段 CSS 而无法构建。
    //    那段 CSS 本身要在组件侧修（连同它钉住行为的 theme 测试一起），不在这里遮掩。
    cssMinify: 'esbuild',
  },
  server: {
    fs: {
      // demo 与文档真源在兄弟包里，开发服务器需要放行
      allow: ['../..'],
    },
  },
  ssgOptions: {
    // ⚠️ 目录风格实测（2026-10-16）：nested 产出 `components/button/index.html`，
    //    GitHub Pages 认，但 **vite preview 不认**（`/components/button` 会回落成
    //    根 index.html，只有带尾斜杠才命中）；flat 产出 `components/button.html`，
    //    两种托管**都**能直接访问。选能被本地验证到的那一种 —— 否则「深链接可用」
    //    这条结论在本地就无法被证伪。
    dirStyle: 'flat',
    // 预渲染全部静态路由 + 每个组件页（动态 :name 默认不会被展开）；
    // 过滤掉带 `:` 的字面量路径（catch-all 与未展开的动态段不该产出物理文件）
    includedRoutes: async (paths) => {
      const { manifest } = await buildManifest({ write: false });
      return [
        ...paths.filter((p) => !p.includes(':')),
        ...manifest.components.map((c) => `/components/${c.name}`),
        ...manifest.guides.map((g) => `/guide/${g.slug}`),
      ];
    },
    onFinished: async () => {
      // GitHub Pages 需要物理 404.html；同时生成 sitemap 与 SEO 复制页
      const outDir = path.resolve(process.cwd(), 'dist');
      const indexHtml = path.join(outDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        cpSync(indexHtml, path.join(outDir, '404.html'));
      }
      const { manifest } = await buildManifest({ write: false });
      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        ...manifest.components.map((c) => `/components/${c.name}`),
        ...manifest.guides.map((g) => `/guide/${g.slug}`),
        '/components',
        '/changelog',
        '/',
      ];
      const origin = 'https://apollocmh.github.io';
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${origin}${BASE.replace(/\/$/, '')}${u}</loc><lastmod>${today}</lastmod></url>`)
        .join('\n')}\n</urlset>\n`;
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap);
      writeFileSync(
        path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nSitemap: ${origin}${BASE}sitemap.xml\n`,
      );
    },
  },
};

export default defineConfig(config);
