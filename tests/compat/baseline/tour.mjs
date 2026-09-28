#!/usr/bin/env node
/**
 * tests/compat/baseline/tour.mjs — 生成 antd 6.6.4 Tour 的 DOM 基线（机械 oracle）。
 *
 * 判据与 popconfirm.mjs 同构：
 * - SSR 里 rc-tour 的渲染门（`targetElement === undefined || !hasOpened`）在静态渲染期
 *   恒走 null（layout effect 不跑）；Portal 的 Mask 也不可达 ⇒ `Tour` 本体的 SSR 产物
 *   是空串 —— 这一条本身也是契约（两侧都为空）。
 * - `TourPurePanel`（_InternalPanelDoNotUseOrYouWillBeFired）是 SSR 可达的**唯一完整
 *   面板 DOM** —— panelRender 的六段结构靠它钉。
 *
 * 运行：node tests/compat/baseline/tour.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tour.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Tour, ConfigProvider } = antd;
const PurePanel = Tour._InternalPanelDoNotUseOrYouWillBeFired;

const BP = { prefixCls: 'apollo-tour' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  // ⚠️ React 19 的 SSR 会给 <img src> 前置 `<link rel="preload" as="image">`（fetch
  //    伪影，非 DOM 契约 —— 与 cssinjs hash 同判，剥掉再入基线）。
  const html = renderToStaticMarkup(node).replace(/<link rel="preload"[^>]*>/g, '');
  cases.push({ id, html });
};

// ---- Tour 本体（SSR 渲染门 ⇒ 空串契约）----
push(
  'tour:open-with-steps',
  wrap(h(Tour, { ...BP, open: true, steps: [{ title: 't', description: 'd' }] })),
);
push('tour:closed', wrap(h(Tour, { ...BP, open: false, steps: [{ title: 't' }] })));

// ---- PurePanel（静态面板 DOM）----
push(
  'tour:pure-panel',
  wrap(h(PurePanel, { ...BP, title: 'Hello World!', description: 'Hello World?!' })),
);
push(
  'tour:pure-panel-cover',
  wrap(
    h(PurePanel, {
      ...BP,
      title: 'Hello World!',
      description: 'Hello World?!',
      cover: h('img', {
        draggable: false,
        alt: 'tour.png',
        src: 'https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png',
      }),
      current: 5,
      total: 7,
    }),
  ),
);
push(
  'tour:pure-panel-primary',
  wrap(
    h(PurePanel, {
      ...BP,
      title: 'Hello World!',
      description: 'Hello World?!',
      type: 'primary',
      current: 4,
      total: 5,
    }),
  ),
);
push(
  'tour:pure-panel-close-icon-false',
  wrap(h(PurePanel, { ...BP, title: 't', closeIcon: false })),
);
push(
  'tour:pure-panel-custom-close-icon',
  wrap(
    h(PurePanel, {
      ...BP,
      title: 't',
      closeIcon: h('span', { className: 'custom-close' }, 'Close'),
    }),
  ),
);
push(
  'tour:pure-panel-button-props',
  wrap(
    h(PurePanel, {
      ...BP,
      title: 't',
      nextButtonProps: { children: 'Go', className: 'custom-next' },
      prevButtonProps: { children: 'Back' },
    }),
  ),
);
push('tour:pure-panel-single-step', wrap(h(PurePanel, { ...BP, title: 'only' })));
push(
  'tour:pure-panel-class-name',
  wrap(
    h(PurePanel, {
      ...BP,
      title: 't',
      description: 'd',
      className: 'custom-root',
      style: { padding: 20 },
    }),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'tour',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] tour.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] tour: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] tour: wrote', cases.length, 'cases →', OUT_FILE);
}
