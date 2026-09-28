#!/usr/bin/env node
/**
 * tests/compat/baseline/progress.mjs — antd 6.6.4 Progress 的 DOM 基线。
 *
 * ⚠️ prefixCls 传 **'apollo'**（ConfigProvider 级）—— progress 的类链
 * `${prefixCls}-progress`；iconPrefixCls 归一 apollo-icon（alert/rate 同款）。
 *
 * ⚠️ gradient circle（conic mask + useId）不在基线：id 形态 React/Vue 必然不同
 * （`_R_x_` vs `v-x`），结构由 L1 覆盖、外观由 L6 视觉覆盖。
 *
 * 运行：node tests/compat/baseline/progress.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/progress.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Progress, ConfigProvider } = antd;

const withIconPrefix = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, props) => {
  cases.push({
    id,
    html: renderToStaticMarkup(withIconPrefix(h(Progress, props))),
  });
};

// ---- line ----
push('plain', { percent: 30 });
push('percent:100', { percent: 100 });
push('status:active', { percent: 40, status: 'active' });
push('status:exception', { percent: 70, status: 'exception' });
push('show-info:false', { percent: 50, showInfo: false });
push('size:small', { percent: 30, size: 'small' });
push('size:array', { percent: 30, size: [300, 20] });
push('steps', { percent: 60, steps: 5 });
push('stroke-color', { percent: 30, strokeColor: { from: '#108ee9', to: '#87d068' } });
push('success', { percent: 60, success: { percent: 20 } });
push('linecap:butt', { percent: 30, strokeLinecap: 'butt' });
push('rail-color', { percent: 30, railColor: '#e6f4ff' });
push('percent-position:inner', {
  percent: 10,
  percentPosition: { align: 'center', type: 'inner' },
  size: [300, 20],
});

// ---- circle / dashboard ----
push('type:circle', { percent: 75, type: 'circle' });
push('type:dashboard', { percent: 75, type: 'dashboard' });
push('circle:small', { percent: 50, type: 'circle', size: 'small' });
push('circle:stroke-width', { percent: 50, type: 'circle', strokeWidth: 12 });

// ---- 杂项 ----
push('class-name', { percent: 30, className: 'extra' });
push('aria', { percent: 30, 'aria-label': 'uploading' });
push('prefix-cls:custom', { percent: 30, prefixCls: 'custom' });

const baseline = {
  $schema: '../schema.json',
  antdVersion: antdPkg.version,
  component: 'progress',
  generatedAt: new Date().toISOString().slice(0, 10),
  cases,
};

if (check) {
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(baseline.cases, null, 2) !== JSON.stringify(current.cases, null, 2)) {
    console.error('baseline drift detected: rerun node tests/compat/baseline/progress.mjs');
    process.exit(1);
  }
  console.log('progress baseline up to date.');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`wrote ${OUT_FILE} (${cases.length} cases)`);
}
