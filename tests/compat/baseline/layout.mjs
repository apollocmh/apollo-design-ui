#!/usr/bin/env node
/**
 * tests/compat/baseline/layout.mjs — 生成 antd 6.6.4 Layout 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（G1 §2）：
 * - **只比对 SSR 可得的部分**：`has-sider` 的「嵌套一层 div」场景依赖运行时
 *   `addSider` 注册（React useEffect），SSR 拿不到 —— 那条由 L1 钉（挂载后）。
 *   基线里的 children 检测只覆盖**直系** Sider。
 * - Sider 的响应式（`matchMedia`）在 SSR 不跑；`onCollapse` / `onBreakpoint`
 *   是运行时回调 —— 都交给 L1。
 * - 覆盖：四组件的 tagName 与类名合成、has-sider 三源、Sider 的
 *   width/collapsedWidth/theme/trigger/collapsible/zero-width/语义化/rlt。
 *
 * 运行：node tests/compat/baseline/layout.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/layout.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Layout } = antd;
const { Header, Footer, Content, Sider } = Layout;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-layout' };
const SBP = { prefixCls: 'apollo-layout-sider' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- Layout ----

push('layout:no-props', wrap(h(Layout, BP)));
push('layout:children', wrap(h(Layout, BP, 'content')));
push(
  'layout:has-sider-direct',
  wrap(h(Layout, BP, h(Sider, SBP, 'Sider'), h(Content, BP, 'Content'))),
);
push('layout:has-sider-false', wrap(h(Layout, { ...BP, hasSider: false }, h(Sider, SBP, 'Sider'))));
push('layout:has-sider-true', wrap(h(Layout, { ...BP, hasSider: true })));
push('layout:class-order', wrap(h(Layout, { ...BP, className: 'cn', rootClassName: 'rcn' })));
push('layout:style', wrap(h(Layout, { ...BP, style: { height: '100vh' } })));
push('layout:custom-prefix', wrap(h(Layout, { prefixCls: 'my-layout' })));

// ---- Header / Footer / Content（Basic）----

push('layout:header', wrap(h(Header, BP, 'Header')));
push('layout:footer', wrap(h(Footer, BP, 'Footer')));
push('layout:content', wrap(h(Content, BP, 'Content')));
push('layout:header-class', wrap(h(Header, { ...BP, className: 'h' })));
push('layout:header-custom-prefix', wrap(h(Header, { prefixCls: 'my-header' })));

// ---- Sider ----

push('sider:no-props', wrap(h(Sider, SBP, 'Sider')));
push('sider:theme-light', wrap(h(Sider, { ...SBP, theme: 'light' }, 'Sider')));
push('sider:default-collapsed', wrap(h(Sider, { ...SBP, defaultCollapsed: true }, 'Sider')));
push('sider:collapsed', wrap(h(Sider, { ...SBP, collapsed: true }, 'Sider')));
push('sider:width-number', wrap(h(Sider, { ...SBP, width: 120 }, 'Sider')));
push('sider:width-percent', wrap(h(Sider, { ...SBP, width: '50%' }, 'Sider')));
push('sider:width-zero', wrap(h(Sider, { ...SBP, width: '0%' }, 'Sider')));
push('sider:collapsible', wrap(h(Sider, { ...SBP, collapsible: true }, 'Sider')));
push('sider:trigger-null', wrap(h(Sider, { ...SBP, collapsible: true, trigger: null }, 'Sider')));
push(
  'sider:collapsed-width-zero',
  wrap(h(Sider, { ...SBP, collapsible: true, collapsedWidth: 0 }, 'Sider')),
);
push(
  'sider:collapsed-width-zero-collapsed',
  wrap(h(Sider, { ...SBP, collapsible: true, collapsedWidth: 0, collapsed: true }, 'Sider')),
);
push(
  'sider:zero-width-trigger-style',
  wrap(
    h(
      Sider,
      {
        ...SBP,
        collapsible: true,
        collapsedWidth: 0,
        zeroWidthTriggerStyle: { background: 'rgb(1, 2, 3)' },
      },
      'Sider',
    ),
  ),
);
push(
  'sider:reverse-arrow',
  wrap(h(Sider, { ...SBP, collapsible: true, reverseArrow: true }, 'Sider')),
);
push('sider:breakpoint', wrap(h(Sider, { ...SBP, breakpoint: 'lg' }, 'Sider')));
push('sider:class-name', wrap(h(Sider, { ...SBP, className: 'my-sider' }, 'Sider')));
push('sider:style', wrap(h(Sider, { ...SBP, style: { background: 'rgb(1, 2, 3)' } }, 'Sider')));
push(
  'sider:semantic',
  wrap(
    h(
      Sider,
      {
        ...SBP,
        classNames: { root: 'custom-sider-root', body: 'custom-sider-body' },
        styles: { root: { backgroundColor: 'rgb(1, 2, 3)' }, body: { display: 'flex' } },
      },
      'Sider',
    ),
  ),
);
push(
  'sider:semantic-fn',
  wrap(
    h(
      Sider,
      {
        ...SBP,
        collapsible: true,
        classNames: ({ props }) => ({ body: props.collapsed ? 'body-collapsed' : 'body-expanded' }),
        styles: ({ props }) => ({ body: { opacity: props.collapsed ? 0.5 : 1 } }),
      },
      'Sider',
    ),
  ),
);
push(
  'sider:custom-trigger',
  wrap(
    h(
      Sider,
      { ...SBP, collapsible: true, trigger: h('span', { className: 'my-trigger' }) },
      'Sider',
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/layout.mjs 从 antd 6.6.4 的 Layout 真实渲染生成。机械 oracle，禁止手改。has-sider 的嵌套场景、响应式折叠、onCollapse 回调由 L1 覆盖（SSR 拿不到）。',
  antdVersion: antdPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: 'apollo',
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:layout] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/layout.mjs');
    process.exit(1);
  }
  console.log(`[compat:layout] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:layout] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
