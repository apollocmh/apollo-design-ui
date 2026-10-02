#!/usr/bin/env node
/**
 * tests/compat/baseline/avatar.mjs — 生成 antd 6.6.4 Avatar 的 DOM 基线（机械 oracle）
 *
 * 与 `card.mjs` / `breadcrumb.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/avatar/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Avatar 没有浮层（`Avatar.Group` 的 `max` 溢出 Popover **默认不展开** ⇒ SSR 产物里没有 popup），
 * 也没有 effect（`scale` 的测量只在客户端跑）⇒ SSR 产物完全确定 ✓。
 * ⚠️ SSR 里 `-string` span 恒是**首帧形态**（`style="opacity:0"`，无 transform）。
 *
 * ── 🚨 每个用例都包一层 `ConfigProvider`，但**不传任何 `prefixCls` prop** ────────
 *
 * 理由：`Avatar.Group` 内部那个「+N」头像是用 `<Avatar>`（**不带 prefixCls**）造的
 * ⇒ 它取 `getPrefixCls('avatar')`；而子头像如果传了 `prefixCls: 'apollo'`，两边就**不同前缀**
 * （实测产物：`apollo-avatar-*` vs `apollo-*`）。
 * ⇒ 统一「只靠 ConfigProvider 的根前缀」，两侧的所有头像才是同一个前缀。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/avatar.mjs
 *   node tests/compat/baseline/avatar.mjs --check
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，见 tests/compat/README.md §7。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/avatar.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Avatar, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

const cases = [];

/**
 * 推入一个用例。
 *
 * ⚠️ **不传 `prefixCls`**（见文件头）。
 */
const push = (id, props = {}, { children, bare, direction } = {}) => {
  const node = h(Avatar, props, children);
  cases.push({
    id,
    html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)),
  });
};

/** `Avatar.Group` 的用例（单独一个 push）。 */
const pushGroup = (id, props = {}, { children, bare, direction } = {}) => {
  const node = h(Avatar.Group, props, children);
  cases.push({
    id,
    html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)),
  });
};

const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

const kids = (n) =>
  Array.from({ length: n }, (_, i) => h(Avatar, { key: i }, String.fromCharCode(65 + i)));

// ---- 1. 基本形态 / 前缀 -----------------------------------------------------

push('avatar:basic', {}, { children: 'U' });
// 两侧都不传 prefixCls **且不包 Provider** → antd `ant-avatar*` vs 我们 `apollo-avatar*`（D1）
push('avatar:prefix-cls:no-props', {}, { children: 'U', bare: true });
push('avatar:prefix-cls:custom', { prefixCls: 'custom' }, { children: 'U' });
// 无 children / 无 icon ⇒ 仍然渲染 `-string` span（内容为空）
push('avatar:empty', {});

// ---- 2. shape / size --------------------------------------------------------

push('avatar:shape-square', { shape: 'square' }, { children: 'U' });
push('avatar:shape-circle', { shape: 'circle' }, { children: 'U' });
push('avatar:size-large', { size: 'large' }, { children: 'U' });
push('avatar:size-small', { size: 'small' }, { children: 'U' });
push('avatar:size-medium', { size: 'medium' }, { children: 'U' });
// 数字尺寸 ⇒ **内联** width/height/fontSize（无 icon ⇒ fontSize 18）
push('avatar:size-number', { size: 40 }, { children: 'U' });
// 数字尺寸 + icon ⇒ fontSize = size / 2
push('avatar:size-number-icon', { size: 40, icon: h('span', { className: 'my-icon' }, 'i') });
// 响应式尺寸（SSR 里 `useBreakpoint` 拿到的是默认 screens ⇒ 无内联样式）
push(
  'avatar:size-responsive',
  { size: { xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 } },
  {
    children: 'U',
  },
);
// 数字尺寸 + square（两条规则叠加）
push('avatar:size-number-square', { size: 40, shape: 'square' }, { children: 'U' });

// ---- 3. 五路互斥分支 --------------------------------------------------------

push('avatar:icon', { icon: h('span', { className: 'my-icon' }, 'i') });
push('avatar:src-string', { src: 'x.png' });
push('avatar:src-string-attrs', {
  src: 'x.png',
  srcSet: 'x.png 2x',
  alt: 'a',
  crossOrigin: 'anonymous',
  draggable: false,
});
// `src` 是 vnode ⇒ 原样渲染
push('avatar:src-vnode', { src: h('span', { className: 'my-src' }, 'S') });
// `src` 与 `icon` 同时给 ⇒ **src 赢**，但 `-icon` 类名仍在（判据是 `!!icon`）
push('avatar:src-and-icon', {
  src: 'x.png',
  icon: h('span', { className: 'my-icon' }, 'i'),
});
// `draggable="false"` 字符串形态
push('avatar:draggable-string', { src: 'x.png', draggable: 'false' });

// ---- 4. className / style / attrs ------------------------------------------

push('avatar:className', { className: 'user-cls', rootClassName: 'root-cls' }, { children: 'U' });
push(
  'avatar:style',
  { style: { backgroundColor: '#fde3cf', color: '#f56a00' } },
  { children: 'U' },
);
push('avatar:attrs', { 'data-testid': 'av', 'aria-label': '头像' }, { children: 'U' });

// ---- 5. Avatar.Group --------------------------------------------------------

pushGroup('avatar:group', {}, { children: kids(3) });
pushGroup('avatar:group-empty', {});
pushGroup('avatar:group-max', { max: { count: 1 } }, { children: kids(3) });
pushGroup(
  'avatar:group-max-style',
  { max: { count: 1, style: { color: '#f56a00' } } },
  {
    children: kids(3),
  },
);
// `maxCount`（deprecated）
pushGroup('avatar:group-max-count-deprecated', { maxCount: 1 }, { children: kids(3) });
// `max.count >= children.length` ⇒ 不截断
pushGroup('avatar:group-max-no-truncate', { max: { count: 5 } }, { children: kids(3) });
// `size` / `shape` 经 context 透传
pushGroup('avatar:group-size-shape', { size: 'large', shape: 'square' }, { children: kids(2) });
pushGroup('avatar:group-rtl', {}, { children: kids(2), direction: 'rtl' });
pushGroup(
  'avatar:group-className',
  { className: 'g-cls', rootClassName: 'g-root' },
  {
    children: kids(2),
  },
);

const result = {
  $schema: '../schema.json',
  component: 'avatar',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] avatar.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] avatar: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] avatar: wrote', cases.length, 'cases →', OUT_FILE);
}
