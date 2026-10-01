#!/usr/bin/env node
/**
 * tests/compat/baseline/steps.mjs — 生成 antd 6.6.4 Steps 的 DOM 基线（机械 oracle）
 *
 * 与 `anchor.mjs` / `breadcrumb.mjs` 同一套路：只做三件事 —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/steps/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Steps 没有 effect、没有浮层 ⇒ SSR 产物确定 ✓。
 * ⚠️ 唯一的坑是 `responsive` 默认 **true** + `useBreakpoint`：SSR 下没有 matchMedia
 * ⇒ `xs` 恒 false ⇒ 方向恒 **horizontal**（与浏览器窄屏下的行为不同，但那归 L6）。
 *
 * ── prefixCls ────────────────────────────────────────────────────────────────
 *
 * 与其它组件一致：每个用例显式传 `prefixCls: 'apollo'`，两侧同一个值。
 * 默认前缀（`apollo` vs `ant`）由 `steps:prefix-cls:no-props` 单独覆盖（D1）。
 *
 * 运行：
 *   node tests/compat/baseline/steps.mjs
 *   node tests/compat/baseline/steps.mjs --check
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/steps.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Steps, ConfigProvider } = antd;

const PREFIX = 'apollo';

const ITEMS = [
  { title: 'Finished', content: 'This is a description.' },
  { title: 'In Progress', content: 'This is a description.' },
  { title: 'Waiting', content: 'This is a description.' },
];

const cases = [];

const push = (id, props, { direction, bare } = {}) => {
  const node = h(Steps, props);
  cases.push({ id, html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)) });
};

const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

const BP = { prefixCls: PREFIX, items: ITEMS };

// ---- 1. 基本形态 -----------------------------------------------------------
push('steps:basic', BP);
push('steps:prefix-cls:no-props', { items: ITEMS }, { bare: true });
push('steps:prefix-cls:custom', { prefixCls: 'custom', items: ITEMS });
push('steps:rtl', BP, { direction: 'rtl' });
push('steps:items-empty', { ...BP, items: [] });

// ---- 2. current / initial / status / percent ------------------------------
push('steps:current-1', { ...BP, current: 1 });
push('steps:current-out-of-range', { ...BP, current: 9 });
push('steps:initial', { ...BP, initial: 1, current: 2 });
push('steps:item-status-error', {
  ...BP,
  items: [ITEMS[0], { ...ITEMS[1], status: 'error' }, ITEMS[2]],
});
push('steps:item-status-finish', {
  ...BP,
  items: [{ ...ITEMS[0], status: 'finish' }, { ...ITEMS[1], status: 'wait' }, ITEMS[2]],
});
push('steps:percent', { ...BP, percent: 60 });

// ---- 3. size / variant -----------------------------------------------------
push('steps:size-small', { ...BP, size: 'small' });
push('steps:size-medium', { ...BP, size: 'medium' });
push('steps:variant-outlined', { ...BP, variant: 'outlined' });
push('steps:variant-filled', { ...BP, variant: 'filled' });

// ---- 4. 方向与标题位置 ------------------------------------------------------
push('steps:orientation-vertical', { ...BP, orientation: 'vertical' });
push('steps:direction-vertical-deprecated', { ...BP, direction: 'vertical' });
push('steps:title-placement-vertical', { ...BP, titlePlacement: 'vertical' });
push('steps:label-placement-vertical-deprecated', { ...BP, labelPlacement: 'vertical' });
push('steps:responsive-false', { ...BP, responsive: false });

// ---- 5. type 四态 ----------------------------------------------------------
push('steps:type-navigation', { ...BP, type: 'navigation' });
push('steps:type-inline', { ...BP, type: 'inline' });
push('steps:type-panel', { ...BP, type: 'panel' });
push('steps:type-dot', { ...BP, type: 'dot' });
push('steps:progress-dot-deprecated', { ...BP, progressDot: true });

// ---- 6. items 的字段面 -----------------------------------------------------
push('steps:item-subtitle', {
  ...BP,
  items: [{ ...ITEMS[0], subTitle: '00:00' }, ITEMS[1], ITEMS[2]],
});
push('steps:item-description-deprecated', {
  ...BP,
  items: [
    { title: 'A', description: 'legacy description' },
    { title: 'B', description: 'legacy description' },
  ],
});
push('steps:item-icon', {
  ...BP,
  items: [{ ...ITEMS[0], icon: h('span', { className: 'my-icon' }, 'i') }, ITEMS[1], ITEMS[2]],
});
push('steps:item-disabled', {
  ...BP,
  items: [ITEMS[0], { ...ITEMS[1], disabled: true }, ITEMS[2]],
});
push('steps:item-class-style', {
  ...BP,
  items: [{ ...ITEMS[0], className: 'item-cls', style: { color: 'red' } }, ITEMS[1], ITEMS[2]],
});
push('steps:key-number', {
  ...BP,
  items: [
    { key: 0, title: 'A' },
    { key: 1, title: 'B' },
  ],
});

// ---- 7. 折叠 / 省略 --------------------------------------------------------
push('steps:max-count', {
  ...BP,
  maxCount: 3,
  current: 4,
  items: [
    { title: 'A' },
    { title: 'B' },
    { title: 'C' },
    { title: 'D' },
    { title: 'E' },
    { title: 'F' },
  ],
});
push('steps:ellipsis-false', {
  ...BP,
  ellipsis: false,
  items: [
    { title: 'A very long step title that would be truncated' },
    { title: 'B very long step title that would be truncated' },
  ],
});
push('steps:offset', { ...BP, type: 'inline', offset: 1 });

// ---- 8. 语义化（十个槽）----------------------------------------------------
push('steps:class-names', {
  ...BP,
  classNames: {
    root: 'custom-root',
    item: 'custom-item',
    itemWrapper: 'custom-item-wrapper',
    itemIcon: 'custom-item-icon',
    itemSection: 'custom-item-section',
    itemHeader: 'custom-item-header',
    itemTitle: 'custom-item-title',
    itemSubtitle: 'custom-item-subtitle',
    itemContent: 'custom-item-content',
    itemRail: 'custom-item-rail',
  },
});
push('steps:styles', {
  ...BP,
  styles: { root: { background: '#fafafa' }, itemTitle: { fontWeight: 'bold' } },
});
push('steps:class-names-fn', {
  ...BP,
  orientation: 'vertical',
  classNames: ({ props }) => ({ root: `dir-${props.orientation}`, item: 'fn-item' }),
});

const result = {
  $schema: '../schema.json',
  component: 'steps',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] steps.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] steps: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] steps: wrote', cases.length, 'cases →', OUT_FILE);
}
