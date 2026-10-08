import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

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
      .push({ name: e.name, text: `${title}${subtitle ? ` ${subtitle}` : ''}` });
  }
  return [...categories.entries()].map(([text, items]) => ({
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
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}logo.svg` }]],

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
      { text: '全部组件', items: componentGroups },
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
