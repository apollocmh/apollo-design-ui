#!/usr/bin/env node
/**
 * tests/compat/baseline/statistic.mjs — 生成 antd 6.6.4 Statistic 的 DOM 基线（机械 oracle）
 *
 * 与 tag.mjs 同套路。关键取舍（G1 §2）：
 * - **Timer 只做 SSR 形态**（showTime 未置位 ⇒ '-'）：interval 是运行时效果，
 *   无静态差异；计时行为由 L1 fake timers 钉住。
 * - **Countdown 不进基线**：SSR 产物与 Timer type=countdown 完全一致（转发组件），
 *   废弃告警由 L1 钉。
 * - Number 的内部 fallback（'-' / 'bamboo' / 负 precision）从 Statistic 侧覆盖
 *   （antd 不导出 StatisticNumber，`@apollo-design/ui` 同样不导出）。
 * - Skeleton（loading）是已落地组件，其 DOM 契约由自身基线锁定，这里只断言
 *   「loading 时 content 消失、骨架出现」的结构事实。
 *
 * 运行：node tests/compat/baseline/statistic.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/statistic.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Statistic } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-statistic' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('statistic:no-props', wrap(h(Statistic, BP)));
push(
  'statistic:basic',
  wrap(h(Statistic, { ...BP, title: 'Active Users', value: 112893, precision: 2 }, 'x')),
);
push(
  'statistic:prefix-suffix',
  wrap(
    h(Statistic, {
      ...BP,
      title: 'Feedback',
      value: 1128,
      prefix: h('i', { className: 'my-icon' }),
      suffix: '/ 100',
    }),
  ),
);
push(
  'statistic:group-separator',
  wrap(h(Statistic, { ...BP, value: 112893, groupSeparator: '__TEST__' })),
);
push(
  'statistic:decimal-separator',
  wrap(h(Statistic, { ...BP, value: 112893.12345, precision: 3, decimalSeparator: ',' })),
);
push(
  'statistic:precision-negative',
  wrap(h(Statistic, { ...BP, value: -112893.1212, precision: -2 })),
);
push('statistic:illegal-value', wrap(h(Statistic, { ...BP, value: 'bamboo' })));
push('statistic:dash-value', wrap(h(Statistic, { ...BP, value: '-' })));
push(
  'statistic:zero-title-prefix-suffix',
  wrap(h(Statistic, { ...BP, title: 0, prefix: 0, suffix: 0 })),
);
push(
  'statistic:formatter-fn',
  wrap(h(Statistic, { ...BP, value: 1128, formatter: (v) => `*${v}*` })),
);

// ---- 属性透传 / 语义化 ----

push(
  'statistic:aria-data',
  wrap(h(Statistic, { ...BP, 'data-abc': '1', 'aria-label': 'label', role: 'status' })),
);
push(
  'statistic:semantic',
  wrap(
    h(Statistic, {
      ...BP,
      title: 'T',
      value: 11.28,
      precision: 2,
      prefix: h('i', { className: 'my-icon' }),
      suffix: '%',
      classNames: {
        root: 'demo-root',
        header: 'demo-header',
        title: 'demo-title',
        content: 'demo-content',
        value: 'demo-value',
        prefix: 'demo-prefix',
        suffix: 'demo-suffix',
      },
      styles: { root: { padding: '8px' }, content: { color: 'red' }, value: { opacity: 0.8 } },
    }),
  ),
);
push(
  'statistic:value-style',
  wrap(h(Statistic, { ...BP, title: 'T', value: 5, valueStyle: { color: 'red' } })),
);

// ---- loading（Skeleton 分支） ----

push(
  'statistic:loading',
  wrap(h(Statistic, { ...BP, title: 'Active Users', value: 112112, loading: true })),
);

// ---- rtl ----

push(
  'statistic:rtl',
  wrap(
    h(
      ConfigProvider,
      { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
      h(Statistic, BP),
    ),
  ),
);

// ---- Timer（SSR 形态：showTime 未置位 ⇒ '-'） ----

push(
  'statistic:timer-ssr',
  wrap(h(Statistic.Timer, { ...BP, type: 'countdown', value: Date.parse('2026-01-01T00:00:00Z') + 1000 * 60 * 2 })),
);
push(
  'statistic:timer-title',
  wrap(
    h(Statistic.Timer, { ...BP, type: 'countdown', title: 'Deadline', value: Date.parse('2026-01-01T00:00:00Z') + 1000 }),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/statistic.mjs 从 antd 6.6.4 的 Statistic 真实渲染生成。机械 oracle，禁止手改。',
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
    console.error('[compat:statistic] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/statistic.mjs');
    process.exit(1);
  }
  console.log(`[compat:statistic] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:statistic] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
