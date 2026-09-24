#!/usr/bin/env node
/**
 * tests/compat/baseline/popover.mjs — 生成 antd 6.6.4 Popover 的 DOM 基线
 * （机械 oracle）。
 *
 * 判据（docs/analysis/popover.md §3）：
 * - SSR 里 rc-trigger 只渲染**触发元素**（popup 走 portal，SSR 不可达）；
 * - title/content 双双为空 ⇒ noTitle 抑制（aria-describedby 不出现）；
 * - PurePanel 是纯静态渲染（SSR 可达的唯一完整浮层 DOM，含 -placement 类）。
 *
 * 运行：node tests/compat/baseline/popover.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/popover.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Popover } = antd;
const PurePopover = Popover._InternalPanelDoNotUseOrYouWillBeFired;

const BP = { prefixCls: 'apollo-popover' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  const html = renderToStaticMarkup(node);
  cases.push({ id, html });
};

// ---- 触发元素（SSR 可达部分）----

push('popover:basic', wrap(h(Popover, { ...BP, title: 'Title', content: 'Content' }, 'target')));
push(
  'popover:open',
  wrap(
    h(Popover, { ...BP, title: 'Title', content: 'Content', open: true, id: 'pop-1' }, 'target'),
  ),
);
push(
  'popover:open-placement',
  wrap(
    h(
      Popover,
      {
        ...BP,
        title: 'Title',
        content: 'Content',
        open: true,
        id: 'pop-2',
        placement: 'bottomRight',
      },
      'target',
    ),
  ),
);
push(
  'popover:open-no-content',
  wrap(h(Popover, { ...BP, title: 'Title', open: true, id: 'pop-3' }, 'target')),
);
push(
  'popover:open-no-title',
  wrap(h(Popover, { ...BP, content: 'Content', open: true, id: 'pop-4' }, 'target')),
);
push('popover:no-title-no-content', wrap(h(Popover, { ...BP, open: true, id: 'pop-5' }, 'target')));
push(
  'popover:zero-title',
  wrap(h(Popover, { ...BP, title: 0, content: 'Content', open: true, id: 'pop-6' }, 'target')),
);
push(
  'popover:render-function',
  wrap(
    h(
      Popover,
      { ...BP, title: () => 'lazy-title', content: () => 'lazy-content', open: true, id: 'pop-7' },
      'target',
    ),
  ),
);
push(
  'popover:existing-describedby',
  wrap(
    h(
      Popover,
      { ...BP, title: 'Title', content: 'Content', open: true, id: 'pop-8' },
      h('span', { 'aria-describedby': 'other' }, 'target'),
    ),
  ),
);

// ---- PurePanel（静态浮层 DOM）----

push('popover:pure-panel', wrap(h(PurePopover, { ...BP, title: 'Title', content: 'Content' })));
push(
  'popover:pure-panel-placement',
  wrap(
    h(PurePopover, {
      ...BP,
      title: 'Title',
      content: 'Content',
      placement: 'bottomLeft',
    }),
  ),
);
push('popover:pure-panel-title-only', wrap(h(PurePopover, { ...BP, title: 'Title' })));
push('popover:pure-panel-content-only', wrap(h(PurePopover, { ...BP, content: 'Content' })));

const result = {
  $schema: '../schema.json',
  component: 'popover',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] popover.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] popover: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] popover: wrote', cases.length, 'cases →', OUT_FILE);
}
