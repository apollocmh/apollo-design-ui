#!/usr/bin/env node
/**
 * tests/compat/baseline/radio.mjs — 生成 antd 6.6.4 Radio 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（G1 §2）：
 * - Group 的 `name` 有 useId 默认值（antd 侧是 `_R_xx_`，我们侧是 `v-x`），
 *   字面值必然不同 —— `contract` 档不投影 `name`，所以不影响比对；
 *   「整组同一个 name」这条语义由 L1 钉（`__tests__/index.test.ts`）。
 * - `checked` / `disabled` / `value` 这些 input 属性不进 `contract` 档（T10 只保留
 *   tag / class / role / aria-* / data-*）—— 它们的语义同样由 L1 钉。
 * - hover / focus / 冒泡锁是运行时行为 —— L1。
 * - 覆盖：label / span / input / label-span 四层的类名合成、button 形态换前缀、
 *   Group 的 options 各形态、orientation/vertical/block/size/buttonStyle、
 *   语义化、aria/data 透传。
 *
 * 运行：node tests/compat/baseline/radio.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/radio.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Radio } = antd;
const { Group: RadioGroup, Button: RadioButton } = Radio;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const BP = { prefixCls: 'apollo-radio' };
const ATTR_TAB_INDEX = 3;
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 基本形态 ----

push('radio:no-props', wrap(h(Radio, BP)));
push('radio:children', wrap(h(Radio, BP, 'label text')));
push('radio:default-checked', wrap(h(Radio, { ...BP, defaultChecked: true }, 'x')));
push('radio:checked', wrap(h(Radio, { ...BP, checked: true }, 'x')));
push('radio:disabled', wrap(h(Radio, { ...BP, disabled: true }, 'x')));
push('radio:checked-disabled', wrap(h(Radio, { ...BP, checked: true, disabled: true }, 'x')));
push('radio:value', wrap(h(Radio, { ...BP, value: 'a' }, 'x')));

// ---- attrs 分配（id/name/required/tabIndex/autofocus/value 落 input；title 落 label）----

push(
  'radio:attrs',
  wrap(
    h(
      Radio,
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

// ---- Group：options 各形态 ----

push('group:options-string', wrap(h(RadioGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'] })));
push(
  'group:default-value',
  wrap(h(RadioGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'], defaultValue: 'Apple' })),
);
push(
  'group:value-controlled',
  wrap(h(RadioGroup, { ...BP, options: ['Apple', 'Pear'], value: 'Pear' })),
);
push(
  'group:options-object',
  wrap(
    h(RadioGroup, {
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
    h(RadioGroup, {
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
  wrap(h(RadioGroup, { ...BP, options: ['Apple', 'Pear'], disabled: true })),
);
push('group:number-options', wrap(h(RadioGroup, { ...BP, options: [1, 2, 3], defaultValue: 2 })));
push('group:name', wrap(h(RadioGroup, { ...BP, options: ['Yes', 'No'], name: 'radiogroup' })));
push(
  'group:children',
  wrap(h(RadioGroup, BP, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B'))),
);
push('group:custom-role', wrap(h(RadioGroup, { ...BP, options: ['A'], role: 'list' })));
push('group:custom-prefix', wrap(h(RadioGroup, { prefixCls: 'my-radio', options: ['A'] })));

// ---- Group：方向 / 尺寸 / block / buttonStyle ----

push('group:vertical', wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], vertical: true })));
push(
  'group:orientation-horizontal',
  wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], vertical: true, orientation: 'horizontal' })),
);
push('group:block', wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], block: true })));
push('group:size-large', wrap(h(RadioGroup, { ...BP, options: ['A'], size: 'large' })));
push('group:size-small', wrap(h(RadioGroup, { ...BP, options: ['A'], size: 'small' })));

// ---- Group：button 形态 ----

push(
  'group:button-type',
  wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button' })),
);
push(
  'group:button-solid',
  wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button', buttonStyle: 'solid' })),
);
push(
  'group:button-vertical',
  wrap(h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button', vertical: true })),
);
push(
  'group:button-disabled',
  wrap(h(RadioGroup, { ...BP, options: ['A'], optionType: 'button', disabled: true })),
);
push(
  'group:radio-button-children',
  wrap(
    h(
      RadioGroup,
      { ...BP, optionType: 'button' },
      h(RadioButton, { value: 'a' }, 'A'),
      h(RadioButton, { value: 'b' }, 'B'),
    ),
  ),
);

// ---- aria / data 透传（antd 的 pickAttrs({aria,data})）----

push(
  'group:aria-data',
  wrap(
    h(RadioGroup, {
      ...BP,
      options: ['A'],
      'data-radio-group-id': 'radio-group-id',
      'aria-label': 'radio-group',
    }),
  ),
);

// ---- 语义化 ----

push(
  'radio:semantic',
  wrap(
    h(
      Radio,
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
    'DOM 基线：由 tests/compat/baseline/radio.mjs 从 antd 6.6.4 的 Radio 真实渲染生成。机械 oracle，禁止手改。checked/disabled/name 等 input 属性与事件行为由 L1 覆盖（contract 档不投影它们）。',
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
    console.error('[compat:radio] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/radio.mjs');
    process.exit(1);
  }
  console.log(`[compat:radio] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:radio] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
