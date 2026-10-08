import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { compareCategories } from '../scripts/categories.mjs';

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const UI_SRC = nodePath.resolve(__dirname, '../../ui/src');

/**
 * 从 packages/ui/src/<c>/index.zh-CN.md 的 frontmatter 收集组件目录信息。
 * 与 scripts/gen-component-pages.mjs 同一真源，避免两处漂移。
 */
function collectNav() {
  const categories = new Map();
  for (const e of fs.readdirSync(UI_SRC, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const mdPath = nodePath.join(UI_SRC, e.name, 'index.zh-CN.md');
    if (!fs.existsSync(mdPath)) continue;
    const raw = fs.readFileSync(mdPath, 'utf8');
    const fm = /^---\n([\s\S]*?)\n---/.exec(raw);
    const meta = {};
    if (fm) {
      for (const line of fm[1].split('\n')) {
        const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line.trim());
        if (kv) meta[kv[1]] = kv[2].trim();
      }
    }
    const title = meta.title ?? e.name;
    const subtitle = meta.subtitle ?? '';
    const category = meta.category ?? '其他';
    if (!categories.has(category)) categories.set(category, []);
    categories
      .get(category)
      // 🚨 必须带 link：缺 link 的条目会被渲染成空分组标题（不可点击跳转）
      .push({ text: `${title}${subtitle ? ` ${subtitle}` : ''}`, link: `/components/${e.name}` });
  }
  return [...categories.entries()]
    .sort(([a], [b]) => compareCategories(a, b))
    .map(([text, items]) => ({
      text,
      items: items.sort((a, b) => a.text.localeCompare(b.text)),
    }));
}

const componentGroups = collectNav();

// GitHub Pages 项目站点子路径 —— 与仓库 apollocmh/apollo-design-ui 对应。
const BASE = '/apollo-design-ui/';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Apollo Design',
  description: 'Vue 3 原生实现的 Ant Design 兼容组件库',
  base: BASE,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}logo.svg` }],
    ['link', { rel: 'alternate icon', type: 'image/x-icon', href: `${BASE}favicon.ico` }],
  ],

  // 🚨 浏览器的 favicon 兜底请求打在 **origin 根**（/favicon.ico），而项目站
  //    一切资源都挂在 base 子路径下 ⇒ 每页一个 404 console error。
  //    dev 侧用 middleware 重写到 base 路径；生产侧在 buildEnd 把
  //    public/favicon.ico 复制到 dist 根（GitHub Pages 同样吃这条 404）。
  vite: {
    // 🚨 依赖预构建「首访税」：demo 按需 import dayjs 插件/locale 等，vite 默认只扫
    //    index.html 入口 ⇒ 巡检/首访到某页才发现新依赖 → 重新预构建 → 整页 reload，
    //    在飞的动态导入全部中断（假阴性 + 白屏闪）。把 entries 指向全部 demo 源文件，
    //    启动时一次性收集依赖。
    optimizeDeps: {
      // ⚠️ entries 相对 **vite root**（packages/docs）解析 —— 不是 .vitepress！
      //    写 ../../ui/src 会指到仓库根下的 ui/src（不存在）⇒ 扫描零文件静默失效。
      entries: ['../ui/src/*/demo/*.vue', '../ui/src/*/*/demo/*.vue'],
      // 🚨 ui 的 dist barrel 运行时才 import 这些（entries 扫不到）——显式列全，
      //    缺一个就会在首访对应组件页时触发重新预构建 + 整页 reload。
      include: [
        'dayjs',
        'dayjs/plugin/advancedFormat.js',
        'dayjs/plugin/customParseFormat.js',
        // ⚠️ calendar/demo/customize-header.vue 用的是**无 .js** 说明符，
        //    dist barrel 用的是带 .js —— vite 视为两个 dep id，两个都要列。
        'dayjs/plugin/localeData',
        'dayjs/plugin/localeData.js',
        'dayjs/plugin/weekOfYear.js',
        'dayjs/plugin/weekYear.js',
        'dayjs/plugin/weekday.js',
        'scroll-into-view-if-needed',
      ],
    },
    plugins: [
      {
        name: 'docs-favicon-fallback',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url === '/favicon.ico') req.url = `${BASE}favicon.ico`;
            next();
          });
        },
      },
    ],
  },

  buildEnd({ outDir }) {
    const src = nodePath.resolve(__dirname, '../public/favicon.ico');
    if (fs.existsSync(src)) fs.copyFileSync(src, nodePath.join(outDir, 'favicon.ico'));
  },

  themeConfig: {
    siteTitle: 'Apollo Design',
    logo: '/logo.svg',
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到亮色',
    darkModeSwitchTitle: '切换到暗色',
    socialLinks: [{ icon: 'github', link: 'https://github.com/apollocmh/apollo-design-ui' }],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有结果',
            resetButtonTitle: '清除查询',
            displayDetails: '显示详细列表',
            footer: { selectText: '选择', navigateText: '切换' },
          },
        },
      },
    },
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '组件', link: '/components/overview' },
      // ⚠️ nav 下拉只支持一层平铺 items（{text, link}）；嵌套分组会让
      //    VPNavBarMenuGroup 渲染抛错 → 整页白屏（VitePress 的已知约束）。
      //    全量分类入口放侧边栏，这里只放几个高频组件的快捷入口。
      {
        text: '常用组件',
        items: [
          { text: 'Button 按钮', link: '/components/button' },
          { text: 'Form 表单', link: '/components/form' },
          { text: 'Table 表格', link: '/components/table' },
          { text: 'Modal 对话框', link: '/components/modal' },
          { text: 'Select 选择器', link: '/components/select' },
          { text: 'DatePicker 日期选择', link: '/components/date-picker' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [{ text: '快速开始', link: '/guide/getting-started' }],
        },
      ],
      '/components/': [
        {
          text: '组件',
          items: [{ text: '总览', link: '/components/overview' }],
        },
        ...componentGroups,
      ],
    },
  },

  markdown: {
    // 🚨 关闭 markdown-it-attrs：API 表里大量 `{ x?: T; y?: U }` 类型字面量
    //    会被 attrs 语法吞成元素属性（`boolean | { style?, color? }` → td 属性），
    //    进而在 Vue 模板编译期报 Duplicate attribute。
    attrs: { disable: true },
  },

  vue: {
    template: {
      // 组件库源码在 SSR 编译期不执行浏览器 API（运行时统一 <ClientOnly> 包裹）
      compilerOptions: {},
    },
  },
});
