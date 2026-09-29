#!/usr/bin/env node
/**
 * tests/compat/baseline/form.mjs — 生成 antd 6.6.4 Form 的 DOM 基线（机械 oracle）。
 *
 * ── 判据（为什么基线只钉「静态形态」）──────────────────────────────────────────
 *
 * form 的**校验链是异步的**（`validateFields` / submit 之后才有 meta.errors），
 * `renderToStaticMarkup` 拿不到那条时间线。所以基线钉的是**参数驱动的确定形态**：
 *
 *   - 布局：horizontal / vertical / inline / 尺寸（-small / -large）
 *   - label：colon / requiredMark 三态 / tooltip / labelCol（含 24 栏的 vertical label）
 *   - 状态文案：help / extra / validateStatus（**显式 prop**，不经校验链）
 *   - 反馈图标：hasFeedback + 四态（success / warning / error / validating）
 *   - noStyle / hidden 的分支
 *
 * 校验链本身（异步 error → explain + aria-invalid + `-has-error`）由
 * `packages/ui/src/form/__tests__/form.test.ts`（L2）钉；antd 的真实运行时行为
 * 由 `tests/visual/debug/probe-form-nostyle.mjs` 取证。
 *
 * ⚠️ 控件用两侧各自的 **Input 组件**（antd Input / apollo Input）—— Form 的
 *    `cloneElement` 注入（value / id / aria-*）只有真实控件才看得到。Input 自身的
 *    差异已由它自己的基线钉过，这里比到的是「Form 注入后的合成结果」。
 *
 * 运行：node tests/compat/baseline/form.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/form.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Form, Input, ConfigProvider } = antd;
const Item = Form.Item;

const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/** 每个用例一个 Form；控件统一 Input。 */
const item = (props, children) => h(Item, { ...props }, children ?? h(Input));

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

// ---- 布局 ----
push('form:basic', h(Form, null, item({ label: 'User', name: 'user' })));
push(
  'form:required',
  h(Form, null, item({ label: 'User', name: 'user', required: true }), item({ label: 'Age' })),
);
push('form:vertical', h(Form, { layout: 'vertical' }, item({ label: 'User', name: 'user' })));
push('form:inline', h(Form, { layout: 'inline' }, item({ label: 'User', name: 'user' })));
push('form:size-small', h(Form, { size: 'small' }, item({ label: 'User', name: 'user' })));
push('form:size-large', h(Form, { size: 'large' }, item({ label: 'User', name: 'user' })));

// ---- label 形态 ----
push(
  'form:required-mark-optional',
  h(
    Form,
    { requiredMark: 'optional' },
    item({ label: 'User', name: 'user' }),
    item({ label: 'Age', name: 'age', required: true }),
  ),
);
push(
  'form:hide-required-mark',
  h(Form, { requiredMark: false }, item({ label: 'User', name: 'user' })),
);
push('form:no-colon', h(Form, { colon: false }, item({ label: 'User', name: 'user' })));
push('form:label-tooltip', h(Form, null, item({ label: 'User', name: 'user', tooltip: 'hint' })));
push(
  'form:label-col-24',
  h(Form, { labelCol: { span: 24 } }, item({ label: 'User', name: 'user' })),
);

// ---- 状态文案（显式 prop，不经校验链）----
push(
  'form:help',
  h(Form, null, item({ label: 'User', name: 'user', help: 'help text', validateStatus: 'error' })),
);
push('form:extra', h(Form, null, item({ label: 'User', name: 'user', extra: 'extra text' })));
push(
  'form:feedback-success',
  h(
    Form,
    null,
    item({ label: 'User', name: 'user', hasFeedback: true, validateStatus: 'success' }),
  ),
);
push(
  'form:feedback-warning',
  h(
    Form,
    null,
    item({ label: 'User', name: 'user', hasFeedback: true, validateStatus: 'warning' }),
  ),
);
push(
  'form:feedback-error',
  h(Form, null, item({ label: 'User', name: 'user', hasFeedback: true, validateStatus: 'error' })),
);
push(
  'form:feedback-validating',
  h(
    Form,
    null,
    item({ label: 'User', name: 'user', hasFeedback: true, validateStatus: 'validating' }),
  ),
);

// ---- 分支 ----
push('form:no-style', h(Form, null, item({ name: 'user', noStyle: true })));
push('form:hidden', h(Form, null, item({ label: 'User', name: 'user', hidden: true })));

// ---- 字段 id：form name 前缀 ----
push('form:form-name', h(Form, { name: 'login' }, item({ label: 'User', name: 'user' })));

const result = {
  $schema: '../schema.json',
  component: 'form',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] form.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log(`[baseline] form.dom.json 最新（${cases.length} 用例）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] 写入 form.dom.json（${cases.length} 用例）`);
