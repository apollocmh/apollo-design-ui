#!/usr/bin/env node
/**
 * tests/compat/baseline/result.mjs — 生成 antd 6.6.4 Result 的 DOM 基线（机械 oracle）
 *
 * 与 badge.mjs / border-beam.mjs 同套路。关键取舍见文件头注释：
 * - **插画用例必须带 title/subTitle/extra**：插画分支的 `-icon -image` div 与
 *   SVG 逐节点进基线（Result 插画是静态 hex，SSR 字符串拼接可直接对齐）。
 * - **prefixCls 显式传**：除 no-props 用例外全部传 apollo 前缀，避免 D6 噪音淹没
 *   真实差异（badge 落地时的既定做法）。
 *
 * 运行：node tests/compat/baseline/result.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/result.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Result, Button, ConfigProvider } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

// ⚠️ iconPrefixCls 走 ConfigProvider（antd 的 anticon 前缀由 @ant-design/icons
//    的 IconContext 决定，组件 prop 改不了）—— 与我们的 apollo-icon 对齐后，
//    前缀差异收敛到组件自身（D6 只剩 no-props 一条）。
const CP = { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' };
const BP = { prefixCls: 'apollo-result' };
const Btn = (text) => h(Button, { prefixCls: 'apollo-btn' }, text);
const Extra = () => Btn('Go Console');
const wrap = (node) => h(ConfigProvider, CP, node);

push('result:prefix-cls:no-props', wrap(h(Result, null)));
push(
  'result:info-default',
  wrap(h(Result, { ...BP, title: 'Your operation has been executed' }, h('p', null, 'body'))),
);
push(
  'result:success',
  wrap(h(Result, { ...BP, status: 'success', title: 'Success', subTitle: 'Sub', extra: h(Extra) })),
);
push(
  'result:error',
  wrap(
    h(
      Result,
      { ...BP, status: 'error', title: 'Failed', subTitle: 'Check it' },
      h('div', { className: 'desc' }, 'details'),
    ),
  ),
);
push(
  'result:warning',
  wrap(h(Result, { ...BP, status: 'warning', title: 'Warning', subTitle: 'Be careful' })),
);
push('result:info-explicit', wrap(h(Result, { ...BP, status: 'info', title: 'Info' })));

// ---- 异常插画（静态 hex 直出）----

push(
  'result:404',
  wrap(h(Result, { ...BP, status: '404', title: '404', subTitle: 'Not Found', extra: h(Extra) })),
);
push(
  'result:500',
  wrap(h(Result, { ...BP, status: '500', title: '500', subTitle: 'Server Error' })),
);
push('result:403', wrap(h(Result, { ...BP, status: 403, title: '403', subTitle: 'Forbidden' })));

// ---- icon 分支 ----

push('result:icon-null', wrap(h(Result, { ...BP, title: 'No icon', icon: null })));
push('result:icon-false', wrap(h(Result, { ...BP, title: 'No icon', icon: false })));
push(
  'result:icon-custom',
  wrap(h(Result, { ...BP, title: 'Custom', icon: h('span', { className: 'my-icon' }, 'i') })),
);

// ---- 渲染守卫 ----

push('result:guard-empty-strings', wrap(h(Result, { ...BP, title: '', subTitle: '', extra: '' })));
push('result:body-renders', wrap(h(Result, { ...BP, title: 'T' }, h('p', null, 'body'))));

// ---- 语义槽位 ----

push(
  'result:semantic',
  wrap(
    h(Result, {
      ...BP,
      status: 'success',
      title: 'T',
      subTitle: 'S',
      extra: h(Extra),
      classNames: {
        root: 'demo-root',
        title: 'demo-title',
        subTitle: 'demo-sub',
        icon: 'demo-icon',
        extra: 'demo-extra',
      },
      styles: { root: { padding: 16 }, title: { color: 'red' }, icon: { opacity: 0.8 } },
    }),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/result.mjs 从 antd 6.6.4 的 Result 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/result.mjs',
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
    console.error('[compat:result] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/result.mjs');
    process.exit(1);
  }
  console.log(`[compat:result] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:result] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
