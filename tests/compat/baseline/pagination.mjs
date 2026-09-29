#!/usr/bin/env node
/**
 * tests/compat/baseline/pagination.mjs — 生成 antd 6.6.4 Pagination 的 DOM 基线（机械 oracle）。
 *
 * ── 判据（基线只钉「参数驱动的确定形态」）──────────────────────────────────────
 *
 *   - 值：total / current（含越界钳制）/ pageSize / pageSizeOptions
 *   - 模式：单页（`total` 小）/ range 段（`showLessItems`）/ `simple`（含 readOnly）
 *   - 装饰：`showTotal` / `itemRender` / `align` / `size` / `hideOnSinglePage`
 *   - 功能：`showQuickJumper`（含 `goButton`）/ `showSizeChanger` / `showPrevNextJumpers`
 *   - 状态：`disabled` / `role` / `aria-*` 透传
 *
 * 运行时的值机（点击改值、快速跳转的输入过滤、尺寸切换链路）由
 * `packages/ui/src/pagination/__tests__/{pagers,index}.test.ts` 钉。
 *
 * ⚠️ 尺寸切换器内部渲染的是 **Select**（浮层走 portal，SSR 不可达）——
 *    静态帧只有已选值，确定；下拉展开的状态不在基线里。
 *
 * 运行：node tests/compat/baseline/pagination.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/pagination.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const { Pagination, ConfigProvider } = require('antd');

// ⚠️ `iconPrefixCls` 必须一起传：antd 的图标前缀默认是 `anticon`，本仓是 `apollo-icon`
//    （差异 **D14**）。不传的话每条用例都会多出 4~5 条「图标类名不同」的噪音，
//    把真正的结构差异淹没掉 —— 与 `result.mjs` 同判（那边也是这么收敛的）。
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

push('pagination:basic', h(Pagination, { total: 500, defaultCurrent: 3 }));
push('pagination:clamped', h(Pagination, { total: 30, current: 999 }));
push('pagination:single-page', h(Pagination, { total: 5 }));
push('pagination:zero', h(Pagination, { total: 0 }));
push('pagination:page-size', h(Pagination, { total: 500, pageSize: 20, defaultCurrent: 2 }));
push(
  'pagination:less-items',
  h(Pagination, { total: 500, defaultCurrent: 10, showLessItems: true }),
);
push(
  'pagination:jumpers-off',
  h(Pagination, { total: 500, defaultCurrent: 10, showPrevNextJumpers: false }),
);
push(
  'pagination:total-text',
  h(Pagination, { total: 500, defaultCurrent: 3, showTotal: (t) => `共 ${t} 条` }),
);
push('pagination:simple', h(Pagination, { total: 500, defaultCurrent: 3, simple: true }));
push(
  'pagination:simple-readonly',
  h(Pagination, { total: 500, defaultCurrent: 3, simple: { readOnly: true } }),
);
push(
  'pagination:quick-jumper',
  h(Pagination, { total: 500, defaultCurrent: 3, showQuickJumper: true }),
);
push(
  'pagination:quick-jumper-button',
  h(Pagination, { total: 500, defaultCurrent: 3, showQuickJumper: { goButton: true } }),
);
push(
  'pagination:size-changer',
  h(Pagination, { total: 500, defaultCurrent: 3, showSizeChanger: true }),
);
push(
  'pagination:size-changer-options',
  h(Pagination, {
    total: 500,
    defaultCurrent: 3,
    showSizeChanger: true,
    pageSizeOptions: [50, 10],
  }),
);
push('pagination:disabled', h(Pagination, { total: 500, defaultCurrent: 3, disabled: true }));
push('pagination:small', h(Pagination, { total: 500, defaultCurrent: 3, size: 'small' }));
push('pagination:large', h(Pagination, { total: 500, defaultCurrent: 3, size: 'large' }));
push('pagination:align-center', h(Pagination, { total: 500, defaultCurrent: 3, align: 'center' }));
push('pagination:align-end', h(Pagination, { total: 500, defaultCurrent: 3, align: 'end' }));
push('pagination:hide-single', h(Pagination, { total: 5, hideOnSinglePage: true }));
push(
  'pagination:item-render',
  h(Pagination, {
    total: 30,
    defaultCurrent: 2,
    itemRender: (page, type, el) => (type === 'page' ? h('b', null, `p${page}`) : el),
  }),
);
push('pagination:role', h(Pagination, { total: 500, defaultCurrent: 3, role: 'navigation' }));
push(
  'pagination:aria',
  h(Pagination, { total: 500, defaultCurrent: 3, 'aria-label': '分页', 'data-testid': 'pg' }),
);

const result = {
  $schema: '../schema.json',
  component: 'pagination',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] pagination.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log(`[baseline] pagination.dom.json 最新（${cases.length} 用例）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] 写入 pagination.dom.json（${cases.length} 用例）`);
