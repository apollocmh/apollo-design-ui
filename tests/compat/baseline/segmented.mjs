#!/usr/bin/env node
/**
 * tests/compat/baseline/segmented.mjs — 生成 antd 6.6.4 Segmented 的 DOM 基线（机械 oracle）
 *
 * 与 `rate.mjs` 同一套路：构造用例 → `renderToStaticMarkup` → 写文件。
 * 归一化与比对在消费侧（`packages/ui/src/segmented/__tests__/semantic.test.ts`）完成。
 *
 * ⚠️ SSR（renderToStaticMarkup）下 MotionThumb 不渲染（useLayoutEffect 不跑），
 *    React 与 Vue 在这一层天然一致 —— thumb 的动画行为由 L1（index.test.ts）钉。
 *
 * 运行：
 *   node tests/compat/baseline/segmented.mjs
 *   node tests/compat/baseline/segmented.mjs --check
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/segmented.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Segmented, ConfigProvider } = antd;

/** 与 rate.mjs 同判：传完整前缀才能让两侧类名逐字对齐。 */
const PREFIX = 'apollo-segmented';

const cases = [];

const withIconPrefix = (node) => h(ConfigProvider, { iconPrefixCls: 'apollo-icon' }, node);

const render = (props) => renderToStaticMarkup(withIconPrefix(h(Segmented, props)));

const push = (id, props) => {
  cases.push({ id, html: render({ prefixCls: PREFIX, ...props }) });
};

const OPTIONS = ['Daily', 'Weekly', 'Monthly'];
const OBJECT_OPTIONS = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
];

// ---- 1. 基本形态 ----
push('basic', { options: OPTIONS, value: 'Weekly' });
push('options:primitive', { options: OPTIONS });
push('options:object', { options: OBJECT_OPTIONS, value: 'b' });
push('options:empty', { options: [] });
// 两侧都不传 prefixCls → antd 用 `ant-segmented`、我们用 `apollo-segmented`（消费侧 allow 登记为 D6）。
cases.push({
  id: 'prefix-cls:no-props',
  html: renderToStaticMarkup(withIconPrefix(h(Segmented, { options: OPTIONS }))),
});
push('prefix-cls:custom', { prefixCls: 'custom', options: OPTIONS });

// ---- 2. 选中 ----
push('value:first', { options: OPTIONS, value: 'Daily' });
push('value:last', { options: OPTIONS, value: 'Monthly' });
// 受控值不在 options 里 → 不自动切换（rc 判据：单一事实来源）
push('value:not-in-options', { options: OPTIONS, value: 'Missing' });

// ---- 3. disabled ----
push('disabled:group', { options: OPTIONS, disabled: true });
push('disabled:option', {
  options: [
    { label: 'A', value: 'a' },
    { label: 'B', value: 'b', disabled: true },
    { label: 'C', value: 'c' },
  ],
});

// ---- 4. 尺寸 / 形状 / 布局 ----
push('size:small', { options: OPTIONS, size: 'small' });
push('size:large', { options: OPTIONS, size: 'large' });
push('block', { options: OPTIONS, block: true });
push('vertical', { options: OPTIONS, vertical: true });
push('orientation:vertical', { options: OPTIONS, orientation: 'vertical' });
push('shape:round', { options: OPTIONS, shape: 'round', value: 'Weekly' });

// ---- 5. name / title ----
push('name', { options: OPTIONS, name: 'seg' });
push('title', {
  options: [
    { label: 'A', value: 'a', title: 'Option A' },
    { label: 'B', value: 'b', title: 'Option B' },
  ],
});

// ---- 6. icon ----
// icon 的 aria 由 ConfigProvider.iconPrefixCls 归一（与 rate 的 D15 同判）。
// 用 antd 自带图标（@ant-design/icons 经由 antd 暴露的 Search 无法直接拿 ——
// 但 Segmented options 的 icon 是纯 children，SSR 输出结构由 rc 的
// `-item-icon` span 承载；用字符串 icon 钉结构）。
push('icon:string', {
  options: [{ label: 'A', value: 'a', icon: '★' }, 'B'],
});

// ---- 7. RTL ----
cases.push({
  id: 'rtl',
  html: renderToStaticMarkup(
    h(
      ConfigProvider,
      { iconPrefixCls: 'apollo-icon', direction: 'rtl' },
      h(Segmented, { prefixCls: PREFIX, options: OPTIONS }),
    ),
  ),
});

// ---- 8. 语义化 classNames / styles ----
push('semantic:classNames', {
  options: OBJECT_OPTIONS,
  classNames: { root: 'seg-root', item: 'seg-item', label: 'seg-label' },
});
push('semantic:styles', {
  options: OBJECT_OPTIONS,
  styles: { root: { color: 'red' }, item: { fontWeight: 600 } },
});

const baseline = {
  $schema: '../schema.json',
  antdVersion: antdPkg.version,
  component: 'segmented',
  generatedAt: new Date().toISOString().slice(0, 10),
  cases,
};

if (check) {
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const next = JSON.stringify(baseline.cases, null, 2);
  const prev = JSON.stringify(current.cases, null, 2);
  if (next !== prev) {
    console.error(
      'baseline drift detected: run `node tests/compat/baseline/segmented.mjs` to update.',
    );
    process.exit(1);
  }
  console.log('segmented baseline up to date.');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`wrote ${OUT_FILE} (${cases.length} cases)`);
}
