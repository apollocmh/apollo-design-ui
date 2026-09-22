#!/usr/bin/env node
/**
 * tests/compat/baseline/checkbox.mjs — 生成 antd 6.6.4 Checkbox 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（G1 §2）：
 * - `indeterminate` 是**运行时副作用**（直接写 input.indeterminate），SSR 不产
 *   attr —— 由 L1 钉；基线只对比 `-indeterminate` 类。
 * - focus/blur/事件冒泡锁是运行时行为 —— L1。
 * - 覆盖：wrapper/span/input 三段的类名合成与 attrs 分配、checked/disabled、
 *   Group 的 options 各形态、role、name 透传、语义化。
 *
 * 运行：node tests/compat/baseline/checkbox.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/checkbox.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Checkbox } = antd;
const { Group: CheckboxGroup } = Checkbox;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-checkbox' };
const ATTR_TAB_INDEX = 3;
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('checkbox:no-props', wrap(h(Checkbox, BP)));
push('checkbox:children', wrap(h(Checkbox, BP, 'label text')));
push('checkbox:zero-children', wrap(h(Checkbox, BP, 0)));
push('checkbox:default-checked', wrap(h(Checkbox, { ...BP, defaultChecked: true }, 'x')));
push('checkbox:checked', wrap(h(Checkbox, { ...BP, checked: true }, 'x')));
push('checkbox:disabled', wrap(h(Checkbox, { ...BP, disabled: true }, 'x')));
push('checkbox:indeterminate', wrap(h(Checkbox, { ...BP, indeterminate: true }, 'x')));
push('checkbox:checked-disabled', wrap(h(Checkbox, { ...BP, checked: true, disabled: true }, 'x')));

// ---- attrs 分配（id/required/tabIndex/autofocus/name 落 input；title 落 span）----

push(
  'checkbox:attrs',
  wrap(
    h(
      Checkbox,
      // ⚠️ tabIndex 用变量：a11y 规则禁字面量正数，而本用例要验证「任意 tabIndex 原样落到 input」
      {
        ...BP,
        id: 'x',
        name: 'n',
        required: true,
        tabIndex: ATTR_TAB_INDEX,
        autoFocus: true,
        title: 't',
      },
      'x',
    ),
  ),
);

// ---- Group ----

push(
  'group:options-string',
  wrap(h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'] })),
);
push(
  'group:default-value',
  wrap(h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'], defaultValue: ['Apple'] })),
);
push(
  'group:value-controlled',
  wrap(h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear'], value: ['Pear'] })),
);
push(
  'group:options-object',
  wrap(
    h(CheckboxGroup, {
      ...BP,
      options: [
        { label: 'Apple', value: 'Apple', className: 'label-1' },
        { label: 'Pear', value: 'Pear' },
      ],
    }),
  ),
);
push(
  'group:options-disabled',
  wrap(
    h(CheckboxGroup, {
      ...BP,
      options: [
        { label: 'Apple', value: 'Apple' },
        { label: 'Pear', value: 'Pear', disabled: true },
      ],
      disabled: false,
    }),
  ),
);
push(
  'group:disabled-all',
  wrap(h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear'], disabled: true })),
);
push(
  'group:number-options',
  wrap(h(CheckboxGroup, { ...BP, options: [1, 2, 3], defaultValue: [2] })),
);
push('group:name', wrap(h(CheckboxGroup, { ...BP, options: ['Yes', 'No'], name: 'cbgroup' })));
push('group:children', wrap(h(CheckboxGroup, { ...BP }, h(Checkbox, BP, 'child'))));
push('group:custom-role', wrap(h(CheckboxGroup, { ...BP, options: ['A'], role: 'list' })));
push('group:custom-prefix', wrap(h(CheckboxGroup, { prefixCls: 'my-checkbox', options: ['A'] })));

// ---- 语义化 ----

push(
  'checkbox:semantic',
  wrap(
    h(
      Checkbox,
      {
        ...BP,
        classNames: { root: 'custom-root', icon: 'custom-icon', label: 'custom-label' },
        styles: { root: { padding: '10px' }, icon: { borderRadius: '2px' } },
      },
      'x',
    ),
  ),
);

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/checkbox.mjs 从 antd 6.6.4 的 Checkbox 真实渲染生成。机械 oracle，禁止手改。indeterminate 的 input 副作用与事件行为由 L1 覆盖。',
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
    console.error('[compat:checkbox] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/checkbox.mjs');
    process.exit(1);
  }
  console.log(`[compat:checkbox] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:checkbox] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
