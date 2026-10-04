#!/usr/bin/env node
/**
 * tests/compat/baseline/transfer.mjs — 生成 antd 6.6.4 Transfer 的 DOM 基线（机械 oracle）
 *
 * 与 `spin.mjs` / `pagination.mjs` 同一套路：构造用例 → React SSR → 写文件，
 * 中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/transfer/__tests__/semantic.test.ts`）完成，且必须对称。
 *
 * ⚠️ 副作用：`renderToStaticMarkup` 不跑 `useEffect` —— Transfer 无 effect 依赖的
 *    首帧行为（勾选态由受控 props 驱动）不受影响。
 *
 * ⚠️ prefixCls：给每个用例显式传 `prefixCls="apollo"`（两侧共用），类名可逐字比对；
 *    默认前缀差异由 `prefix-cls:no-props` 单独钉住（allow 里登记为 D6 同族）。
 *
 * 运行：
 *   node tests/compat/baseline/transfer.mjs
 *   node tests/compat/baseline/transfer.mjs --check
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/transfer.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Transfer, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

const DATA_SOURCE = Array.from({ length: 8 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

// ---------------------------------------------------------------------------

const cases = [];

/**
 * ⚠️ 所有用例都包一层 ConfigProvider（prefixCls = apollo）：Transfer 是**复合组件**，
 * 内部的 Checkbox / Dropdown 各有自己的默认前缀（ant-checkbox / ant-dropdown-trigger），
 * 不跟随 Transfer 的 prefixCls prop。我们的 Vue 侧它们走 ConfigProvider 默认 `apollo`，
 * 所以 React 侧也用 ConfigProvider 对齐 —— 否则每个用例都会有几十条纯前缀噪音，
 * 把真正的 DOM 差异淹没（tree-select 同判）。
 */
const render = (props) =>
  renderToStaticMarkup(h(ConfigProvider, { prefixCls: PREFIX }, h(Transfer, props)));

const push = (id, props) => {
  cases.push({ id, html: render(props) });
};

const base = { dataSource: DATA_SOURCE };

// ---- 1. 基本形态 -----------------------------------------------------------

// ⚠️ 复合组件没有 `prefix-cls:no-props` 用例（tree-select 同判）：
//    内嵌 Checkbox/Dropdown 的默认前缀由 ConfigProvider 对齐，
//    「默认前缀」维度由 `prefix-cls:custom` 钉住。
push('prefix-cls:custom', { ...base, prefixCls: 'custom' });
push('basic', { ...base, prefixCls: PREFIX });
// ⚠️ 空 dataSource → notFoundContent（DefaultRenderEmpty → Empty small）
push('empty:data-source', { prefixCls: PREFIX, dataSource: [] });

// ---- 2. targetKeys / selectedKeys ------------------------------------------

push('target-keys', { ...base, prefixCls: PREFIX, targetKeys: ['5', '1'] });
push('target-keys+selected', {
  ...base,
  prefixCls: PREFIX,
  targetKeys: ['5', '1'],
  selectedKeys: ['0', '5'],
});
push('row-key', {
  prefixCls: PREFIX,
  dataSource: [
    { id: 'a', title: 'Alpha' },
    { id: 'b', title: 'Beta' },
  ],
  rowKey: (record) => record.id,
  targetKeys: ['b'],
});

// ---- 3. 文案 ---------------------------------------------------------------

push('titles', { ...base, prefixCls: PREFIX, titles: ['Source', 'Target'] });
push('locale', {
  ...base,
  prefixCls: PREFIX,
  locale: { itemUnit: '条', itemsUnit: '条目', searchPlaceholder: '请输入' },
});
push('select-all-labels', {
  ...base,
  prefixCls: PREFIX,
  selectAllLabels: ['左全选', '右全选'],
});
push('show-select-all:false', { ...base, prefixCls: PREFIX, showSelectAll: false });

// ---- 4. 搜索 ---------------------------------------------------------------

push('show-search', { ...base, prefixCls: PREFIX, showSearch: true });
push('show-search:object', {
  ...base,
  prefixCls: PREFIX,
  showSearch: { defaultValue: 'content2', placeholder: '搜一下' },
});

// ---- 5. oneWay -------------------------------------------------------------

push('one-way', {
  ...base,
  prefixCls: PREFIX,
  oneWay: true,
  targetKeys: ['5', '1'],
  selectedKeys: ['0'],
});

// ---- 6. 分页 ---------------------------------------------------------------

push('pagination:true', { ...base, prefixCls: PREFIX, pagination: true });
push('pagination:object', {
  ...base,
  prefixCls: PREFIX,
  pagination: { pageSize: 3 },
});
push('pagination:object+size-changer', {
  ...base,
  prefixCls: PREFIX,
  pagination: { pageSize: 3, showSizeChanger: true, simple: false },
});

// ---- 7. 状态 / 禁用 ---------------------------------------------------------

push('status:error', { ...base, prefixCls: PREFIX, status: 'error' });
push('status:warning', { ...base, prefixCls: PREFIX, status: 'warning' });
push('disabled', { ...base, prefixCls: PREFIX, disabled: true });

// ---- 8. 操作区 -------------------------------------------------------------

push('actions', { ...base, prefixCls: PREFIX, actions: ['去右边', '去左边'] });
// ⚠️ operations 已废弃，行为与 actions 相同（差别只在于告警）
push('operations', { ...base, prefixCls: PREFIX, operations: ['R', 'L'] });
push('selections-icon', {
  ...base,
  prefixCls: PREFIX,
  selectionsIcon: h('span', { className: 'custom-selections' }, 'S'),
});

// ---- 9. render / footer ----------------------------------------------------

push('render:object', {
  ...base,
  prefixCls: PREFIX,
  render: (item) => ({ label: `${item.title}（label）`, value: `value-${item.title}` }),
});
push('render:string', {
  ...base,
  prefixCls: PREFIX,
  render: (item) => `r-${item.title}`,
});
push('footer', {
  ...base,
  prefixCls: PREFIX,
  footer: () => h('div', { className: 'my-footer' }, 'footer-content'),
});

// ---- 10. class / attrs / style ----------------------------------------------

push('class:both', { ...base, prefixCls: PREFIX, className: 'a', rootClassName: 'b' });
push('attrs:passthrough', {
  ...base,
  prefixCls: PREFIX,
  'data-testid': 'x',
  id: 'my-transfer',
});
push('style:style-over-root', {
  ...base,
  prefixCls: PREFIX,
  style: { color: 'green' },
});

// ---- 11. 语义化 classNames / styles -----------------------------------------

// ⚠️ source / target 方向子结构的合并语义较复杂，本批基线不覆盖（登记 README 缺口）。
push('semantic:classNames', {
  ...base,
  prefixCls: PREFIX,
  classNames: {
    root: 'cn-root',
    section: 'cn-section',
    header: 'cn-header',
    title: 'cn-title',
    body: 'cn-body',
    list: 'cn-list',
    item: 'cn-item',
    itemIcon: 'cn-item-icon',
    itemContent: 'cn-item-content',
    footer: 'cn-footer',
    actions: 'cn-actions',
  },
  footer: () => h('div', { className: 'my-footer' }, 'footer'),
});
push('semantic:styles', {
  ...base,
  prefixCls: PREFIX,
  styles: {
    root: { color: 'red' },
    section: { margin: '4px' },
    header: { padding: '2px' },
    title: { fontWeight: 700 },
    body: { minHeight: '10px' },
    list: { outline: '1px solid blue' },
    item: { lineHeight: '2' },
    itemIcon: { opacity: '0.5' },
    itemContent: { letterSpacing: '1px' },
    footer: { borderTopWidth: '2px' },
    actions: { gap: '2px' },
  },
  footer: () => h('div', { className: 'my-footer' }, 'footer'),
});

// ── ConfigProvider / rtl ─────────────────────────────────────────────────────
// 2026-10-04 加回：Vue 侧的 rtl 链已在（Transfer 根 `-rtl` + Actions 按 direction
// 翻转 + Checkbox/Empty 各自消费 direction 加 `-rtl`），补上对拍用例钉住。
cases.push({
  id: 'config:direction-rtl',
  html: renderToStaticMarkup(
    h(
      ConfigProvider,
      { prefixCls: PREFIX, direction: 'rtl' },
      h(Transfer, { ...base, prefixCls: PREFIX }),
    ),
  ),
});

// ---------------------------------------------------------------------------

const baseline = {
  $schema: '../schema.json',
  component: 'transfer',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  for (const c of baseline.cases) {
    const prev = existing.cases.find((x) => x.id === c.id);
    if (!prev) {
      console.error(`[transfer] 基线缺少用例 "${c.id}"`);
      process.exit(1);
    }
    if (prev.html !== c.html) {
      console.error(`[transfer] 用例 "${c.id}" 的 HTML 与基线不一致（antd 版本或用例变了）`);
      process.exit(1);
    }
  }
  console.log(`[transfer] 基线校验通过（${baseline.cases.length} 条）`);
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`[transfer] 基线已写出（${baseline.cases.length} 条）→ ${OUT_FILE}`);
}
