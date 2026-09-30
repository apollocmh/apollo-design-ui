#!/usr/bin/env node
/**
 * tests/compat/baseline/date-picker.mjs — 生成 antd 6.6.4 DatePicker 的 DOM 基线
 * （机械 oracle）。
 *
 * 运行：node tests/compat/baseline/date-picker.mjs [--check]
 *
 * ── 覆盖范围：**只覆盖触发元素**（与 `cascader.mjs` 同判）──────────────────────
 *
 * SSR 下浮层走 Portal ⇒ **不渲染**（实测 `open: true` 的 SSR 只有 889 B，与不传 `open`
 * **字节相同**）⇒ 面板 DOM 在静态渲染期不可达。
 *
 * ⇒ **面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责**（它自己的 rc 基线与
 * 37 条用例），本文件不重复钉。
 * （`cascader.mjs` 的注释里对 `CascaderPanel` 有同样的结论；本组件的 `PurePanel`
 * 虽然**能**直渲出面板，但那是**样式提取**用的路子，DOM 契约仍以 picker 包为准 ——
 * 避免同一件事在两层各钉一份、日后漂移。）
 *
 * ── 与 cascader 的一处不同 ───────────────────────────────────────────────────
 *
 * cascader 的触发器是 **raw children**（SSR 只有 `<button>target</button>`）；
 * date-picker 的触发器是**内建输入框** ⇒ 本基线覆盖的是**完整的 `.apollo-picker` DOM**
 * （根类名 / `input` 的三个实测属性 / 后缀 / 清除按钮 / 范围两端 / 分隔符）。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/date-picker.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antdRoot = require.resolve('antd');
const antd = require('antd');
const { DatePicker, ConfigProvider } = antd;
/**
 * ⚠️ `RangePicker` **不是 antd 的顶层导出** —— 它是 `DatePicker.RangePicker`
 * （写成 `const { RangePicker } = antd` 会拿到 `undefined`，渲染时报
 * 「Element type is invalid … but got: undefined」，React 不说是哪个组件）。
 *
 * S1 只覆盖单值 ⇒ 这里**暂不取用**（S5 补范围用例时用）。
 */
void DatePicker.RangePicker;
const dayjs = require(
  require.resolve('dayjs', {
    paths: [
      antdRoot.slice(
        0,
        antdRoot.indexOf('antd/es') >= 0
          ? antdRoot.indexOf('antd/es')
          : antdRoot.indexOf('antd/dist'),
      ),
    ],
  }),
);

const D = (s) => dayjs(s);

/**
 * ⚠️ `prefixCls: 'apollo'` ⇒ DatePicker 的类名是 **`apollo-picker`**
 * （上游传的是**字面量** `'picker'`，不是组件名）—— 正好与本仓默认一致。
 */
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

// ---- 单值：结构 / 值 / 尺寸 / 变体 / 状态 / 禁用 / 装饰 ----
push('date-picker:basic', h(DatePicker));
push('date-picker:value', h(DatePicker, { defaultValue: D('2026-09-30') }));
push('date-picker:size-small', h(DatePicker, { size: 'small' }));
push('date-picker:size-large', h(DatePicker, { size: 'large' }));
push('date-picker:variant-filled', h(DatePicker, { variant: 'filled' }));
push('date-picker:variant-borderless', h(DatePicker, { variant: 'borderless' }));
push('date-picker:variant-underlined', h(DatePicker, { variant: 'underlined' }));
push('date-picker:status-error', h(DatePicker, { status: 'error' }));
push('date-picker:status-warning', h(DatePicker, { status: 'warning' }));
push('date-picker:disabled', h(DatePicker, { disabled: true }));
push(
  'date-picker:allow-clear-false',
  h(DatePicker, {
    allowClear: false,
    defaultValue: D('2026-09-30'),
  }),
);
push('date-picker:prefix', h(DatePicker, { prefix: 'P' }));
// `showTime` ⇒ 第一个 format 变成 `'YYYY-MM-DD HH:mm:ss'` ⇒ `input[size]` 从 12 变 **21**
push('date-picker:show-time', h(DatePicker, { showTime: true }));
push('date-picker:no-suffix', h(DatePicker, { suffixIcon: null }));
push('date-picker:picker-month', h(DatePicker, { picker: 'month' }));
push('date-picker:placeholder', h(DatePicker, { placeholder: '自定义' }));

// ---- 范围：**留到 S5**（`RangePicker.vue` 与「范围两端切换」同批落地）----
//
// ⚠️ 本文件当前**只覆盖单值**。范围版的 5 个用例（两端 / 分隔符 / 禁用的两端形态）
//    与 `RangePicker.vue` 一起在 **S5** 补 —— 在那之前放进来会让 `semantic.test.ts`
//    找不到对应实现（`domContractTest` 会直接抛「基线里有用例但 CASES 里没有」）。

const result = {
  $schema: '../schema.json',
  component: 'date-picker',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] date-picker.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] date-picker: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] date-picker: wrote', cases.length, 'cases →', OUT_FILE);
}
