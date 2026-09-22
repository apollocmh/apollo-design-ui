#!/usr/bin/env node
/**
 * tests/compat/baseline/alert.mjs — 生成 antd 6.6.4 Alert 的 DOM 基线（机械 oracle）
 *
 * 与 statistic.mjs 同套路。关键取舍（G1 §2）：
 * - **关闭动画不进基线**（运行时效果）：closed 后的 DOM 由 L1 fake timers 钉类名时序。
 * - ErrorBoundary 不进基线：React class 边界依赖运行时抛错，SSR 恒渲染 children
 *   （与 Vue onErrorCaptured 无错误时同构）。
 * - 覆盖：四 type × outlined/filled、banner、showIcon、description、action、
 *   closable 对象/布尔、closeText/closeIcon 各态、语义化、aria/data、rtl。
 *
 * 运行：node tests/compat/baseline/alert.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/alert.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Alert } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-alert' };
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('alert:no-props', wrap(h(Alert, BP)));
push('alert:basic', wrap(h(Alert, { ...BP, title: 'Success Text', type: 'success' })));
push(
  'alert:description',
  wrap(h(Alert, { ...BP, title: 'Info Text', description: 'Info Description', type: 'info' })),
);
push('alert:description-only', wrap(h(Alert, { ...BP, description: 'd' })));
push(
  'alert:zero-title-description-action',
  wrap(h(Alert, { ...BP, title: 0, description: 0, action: 0 })),
);
push('alert:type-defaults', wrap(h(Alert, { ...BP, title: 'x' })));
push('alert:type-warning', wrap(h(Alert, { ...BP, title: 'x', type: 'warning' })));

// ---- variant ----

push('alert:variant-outlined', wrap(h(Alert, { ...BP, title: 'Info', variant: 'outlined' })));
push('alert:variant-filled', wrap(h(Alert, { ...BP, title: 'Info', variant: 'filled' })));

// ---- banner / showIcon ----

push('alert:banner', wrap(h(Alert, { ...BP, title: 'Warning text', banner: true })));
push(
  'alert:banner-error',
  wrap(h(Alert, { ...BP, title: 'Error text', type: 'error', banner: true })),
);
push('alert:banner-no-icon', wrap(h(Alert, { ...BP, title: 'x', banner: true, showIcon: false })));
push('alert:show-icon', wrap(h(Alert, { ...BP, title: 'x', showIcon: true })));
push('alert:no-icon', wrap(h(Alert, { ...BP, title: 'x', showIcon: false })));

// ---- icon ----

push('alert:custom-icon', wrap(h(Alert, { ...BP, title: 'x', showIcon: true, icon: 'i' })));

// ---- closable / closeIcon / closeText ----

push('alert:closable', wrap(h(Alert, { ...BP, title: 'x', closable: true })));
push(
  'alert:closable-object',
  wrap(
    h(Alert, {
      ...BP,
      title: 'x',
      closable: { closeIcon: true, onClose: () => {}, 'aria-label': 'close' },
    }),
  ),
);
push(
  'alert:closable-object-closeIcon',
  wrap(h(Alert, { ...BP, title: 'x', closable: { closeIcon: 'C' } })),
);
push('alert:close-text', wrap(h(Alert, { ...BP, title: 'x', closeText: 'close' })));
push('alert:close-icon-string', wrap(h(Alert, { ...BP, title: 'x', closeIcon: 'X' })));
push('alert:close-icon-false', wrap(h(Alert, { ...BP, title: 'x', closeIcon: false })));
push('alert:close-icon-null', wrap(h(Alert, { ...BP, title: 'x', closeIcon: null })));

// ---- action ----

push(
  'alert:action',
  wrap(
    h(Alert, { ...BP, title: 'x', showIcon: true, action: h('button', { type: 'button' }, 'A') }),
  ),
);

// ---- aria/data / role / id ----

push(
  'alert:aria-data',
  wrap(h(Alert, { ...BP, 'data-test': 'test-id', 'aria-describedby': 'some-label' })),
);
push('alert:role-override', wrap(h(Alert, { ...BP, role: 'status' })));
push('alert:id', wrap(h(Alert, { ...BP, id: 'test-id' })));

// ---- 语义化 ----

push(
  'alert:semantic',
  wrap(
    h(Alert, {
      ...BP,
      title: 'Info Text',
      description: 'Info Description',
      showIcon: true,
      closable: true,
      type: 'info',
      action: h('div', null, 'A'),
      classNames: {
        root: 'demo-root',
        icon: 'demo-icon',
        section: 'demo-section',
        title: 'demo-title',
        description: 'demo-description',
        actions: 'demo-actions',
        close: 'demo-close',
      },
      styles: {
        root: { color: 'rgb(255, 0, 0)' },
        icon: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        section: { padding: '20px' },
        title: { backgroundColor: 'rgb(0, 0, 255)' },
        description: { fontSize: '20px' },
        actions: { color: 'rgb(0, 128, 0)' },
        close: { color: 'rgb(128, 0, 128)' },
      },
    }),
  ),
);

// ---- rtl ----

push(
  'alert:rtl',
  wrap(
    h(
      ConfigProvider,
      { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
      h(Alert, BP),
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/alert.mjs 从 antd 6.6.4 的 Alert 真实渲染生成。机械 oracle，禁止手改。',
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
    console.error('[compat:alert] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/alert.mjs');
    process.exit(1);
  }
  console.log(`[compat:alert] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:alert] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
