#!/usr/bin/env node
/**
 * tests/compat/baseline/switch.mjs — 生成 antd 6.6.4 Switch 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（G1 §2）：
 * - **三层恒存在**：`-handle` 的 div 与 `-inner-checked` / `-inner-unchecked` 两个 span
 *   都无条件渲染（前者只有图标是条件渲染）—— 基线把这条钉死。
 * - `checked` / `disabled` / `aria-checked` 里的**布尔**是 `contract` 档的投影对象
 *   （`aria-checked` 是 aria-*，进契约；`checked` / `disabled` 是原生属性，不进）。
 * - 左右方向键 / 点击的 legacy 语义（`onClick` 收到结果值）是运行时行为 —— L1。
 * - 覆盖：尺寸三档（含废弃的 `default`）、loading（含强制 disabled）、children 各形态、
 *   `value` / `defaultValue` 别名、attrs 透传、语义化。
 *
 * 运行：node tests/compat/baseline/switch.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/switch.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Switch } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-switch' };
const ATTR_TAB_INDEX = 3;
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('switch:no-props', wrap(h(Switch, BP)));
push('switch:default-checked', wrap(h(Switch, { ...BP, defaultChecked: true })));
push('switch:checked', wrap(h(Switch, { ...BP, checked: true })));
push('switch:disabled', wrap(h(Switch, { ...BP, disabled: true })));
push('switch:checked-disabled', wrap(h(Switch, { ...BP, checked: true, disabled: true })));

// ---- value / defaultValue 别名（@since 5.12.0）----

push('switch:value-alias', wrap(h(Switch, { ...BP, value: true })));
push('switch:default-value-alias', wrap(h(Switch, { ...BP, defaultValue: true })));

// ---- loading（⚠️ 强制 disabled）----

push('switch:loading', wrap(h(Switch, { ...BP, loading: true })));
push('switch:loading-checked', wrap(h(Switch, { ...BP, loading: true, checked: true })));
push('switch:loading-small', wrap(h(Switch, { ...BP, loading: true, size: 'small' })));

// ---- size（三档 + 废弃的 default）----

push('switch:size-small', wrap(h(Switch, { ...BP, size: 'small' })));
push('switch:size-medium', wrap(h(Switch, { ...BP, size: 'medium' })));
push('switch:size-default-deprecated', wrap(h(Switch, { ...BP, size: 'default' })));

// ---- children ----

push(
  'switch:children-string',
  wrap(h(Switch, { ...BP, checkedChildren: 'On', unCheckedChildren: 'Off' })),
);
push(
  'switch:children-string-checked',
  wrap(h(Switch, { ...BP, checkedChildren: 'On', unCheckedChildren: 'Off', checked: true })),
);
push(
  'switch:children-number',
  wrap(h(Switch, { ...BP, checkedChildren: 1, unCheckedChildren: 0, checked: true })),
);
push(
  'switch:children-small',
  wrap(
    h(Switch, {
      ...BP,
      checkedChildren: 'On',
      unCheckedChildren: 'Off',
      size: 'small',
      checked: true,
    }),
  ),
);

// ---- attrs 透传 ----

push(
  'switch:attrs',
  wrap(
    h(Switch, {
      ...BP,
      id: 'x',
      title: 't',
      // ⚠️ tabIndex 用变量：a11y 规则禁字面量正数
      tabIndex: ATTR_TAB_INDEX,
      autoFocus: true,
    }),
  ),
);
push('switch:aria-data', wrap(h(Switch, { ...BP, 'aria-label': 'switch', 'data-x': '1' })));

// ---- 语义化 ----

push(
  'switch:semantic',
  wrap(
    h(Switch, {
      ...BP,
      checkedChildren: 'On',
      unCheckedChildren: 'Off',
      checked: true,
      classNames: { root: 'custom-root', content: 'custom-content', indicator: 'custom-indicator' },
      styles: {
        root: { margin: '4px' },
        content: { fontStyle: 'italic' },
        indicator: { top: '1px' },
      },
    }),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/switch.mjs 从 antd 6.6.4 的 Switch 真实渲染生成。机械 oracle，禁止手改。checked/disabled 等原生属性与键盘/点击行为由 L1 覆盖（contract 档不投影它们）。',
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
    console.error('[compat:switch] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/switch.mjs');
    process.exit(1);
  }
  console.log(`[compat:switch] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:switch] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
