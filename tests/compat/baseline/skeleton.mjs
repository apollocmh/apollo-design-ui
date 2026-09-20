#!/usr/bin/env node
/**
 * tests/compat/baseline/skeleton.mjs — 生成 antd 6.6.4 Skeleton 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `empty.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧完成，且必须**对称**。
 *
 * ── 为什么用 `renderToStaticMarkup` ────────────────────────────────────────────
 * DOM 契约比的是**结构**，不需要布局与绘制（那是 L6 用 Playwright 的事）。
 *
 * ── 关于 prefixCls ────────────────────────────────────────────────────────────
 * ⚠️ 传 `prefixCls="apollo"` 时 `getPrefixCls('skeleton','apollo')` **直接返回** `apollo`
 *    （不加 `-skeleton` 后缀）—— antd 的 `defaultGetPrefixCls` 行为，两侧一致。
 *    于是本文件里所有类名是 `apollo` / `apollo-header` / `apollo-title` … 而不是 `apollo-skeleton-*`。
 *
 * 运行：
 *   node tests/compat/baseline/skeleton.mjs
 *   node tests/compat/baseline/skeleton.mjs --check
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，见 TESTING.md 反模式 A9。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.join(__dirname, '../baselines/skeleton.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Skeleton, ConfigProvider } = antd;

/** 两侧共用的前缀。 */
const PREFIX = 'apollo';

const cases = [];
const push = (id, props, children) => {
  const node = children === undefined ? h(Skeleton, props) : h(Skeleton, props, children);
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ---- 1. loading 三态（`Skeleton.js:105` 语义：`undefined` 与 `true` 都渲染骨架）
push('loading:unset', { prefixCls: PREFIX });
push('loading:true', { prefixCls: PREFIX, loading: true });
push('loading:false+children', { prefixCls: PREFIX, loading: false }, h('span', null, 'X'));
push('loading:false+no-children', { prefixCls: PREFIX, loading: false });

// ---- 2. 三块的互锁推导矩阵（`Skeleton.js:23-62`）—— 8 种存在性组合
for (const avatar of [undefined, false, true]) {
  for (const title of [undefined, false, true]) {
    for (const paragraph of [undefined, false, true]) {
      const tag = [
        `avatar:${avatar === undefined ? 'unset' : avatar}`,
        `title:${title === undefined ? 'unset' : title}`,
        `paragraph:${paragraph === undefined ? 'unset' : paragraph}`,
      ].join('+');
      push(`blocks:${tag}`, { prefixCls: PREFIX, avatar, title, paragraph });
    }
  }
}

// ---- 3. 用户对象覆盖基础推导
push('override:avatar-shape', {
  prefixCls: PREFIX,
  avatar: { shape: 'square' },
  paragraph: true,
});
push('override:title-width', { prefixCls: PREFIX, title: { width: '77%' } });
push('override:paragraph-rows', { prefixCls: PREFIX, paragraph: { rows: 4 } });
// width 是数组 ⇒ 逐行取
push('override:paragraph-width-array', {
  prefixCls: PREFIX,
  paragraph: { rows: 3, width: ['10%', '20%', '30%'] },
});
// width 是单值 ⇒ **只有最后一行**用（其余行无 width）
push('override:paragraph-width-scalar', {
  prefixCls: PREFIX,
  title: false,
  paragraph: { rows: 3, width: '42%' },
});

// ---- 4. 类名（`Skeleton.js:162-167`）
push('class:active', { prefixCls: PREFIX, active: true });
push('class:round', { prefixCls: PREFIX, round: true });
push('class:active+round', { prefixCls: PREFIX, active: true, round: true });
push('class:className', { prefixCls: PREFIX, className: 'my-class' });
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' });
// 两侧都不传 prefixCls ⇒ antd 用 `ant-skeleton`、我们用 `apollo-skeleton`（D6 家族）
push('prefix-cls:no-props', {});

// ---- 5. 属性透传
push('attrs:passthrough', { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-skeleton' });

// ---- 6. 语义化 classNames / styles
push('semantic:classNames-root', { prefixCls: PREFIX, classNames: { root: 'cn-root' } });
push(
  'semantic:classNames-all',
  {
    prefixCls: PREFIX,
    classNames: {
      root: 'cn-root',
      header: 'cn-header',
      section: 'cn-section',
      avatar: 'cn-avatar',
      title: 'cn-title',
      paragraph: 'cn-paragraph',
    },
  },
  undefined,
);
push(
  'semantic:styles-all',
  {
    prefixCls: PREFIX,
    styles: {
      root: { color: 'red' },
      header: { margin: '1px' },
      section: { margin: '2px' },
      avatar: { margin: '3px' },
      title: { margin: '4px' },
      paragraph: { margin: '5px' },
    },
  },
  undefined,
);

// ---- 7. ConfigProvider
push('config:className', { prefixCls: PREFIX }, undefined);
cases[cases.length - 1].html = renderToStaticMarkup(
  h(
    ConfigProvider,
    { prefixCls: PREFIX, skeleton: { className: 'cfg-class' } },
    h(Skeleton, { prefixCls: PREFIX }),
  ),
);

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/skeleton.mjs 从 antd 6.6.4 的 Skeleton 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/skeleton.mjs',
  antdVersion: antdPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: PREFIX,
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:skeleton] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/skeleton.mjs');
    process.exit(1);
  }
  console.log(`[compat:skeleton] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:skeleton] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
