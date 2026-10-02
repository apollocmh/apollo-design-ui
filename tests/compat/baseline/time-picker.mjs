#!/usr/bin/env node
/**
 * tests/compat/baseline/time-picker.mjs — 生成 antd 6.6.4 TimePicker 的 DOM 基线
 * （机械 oracle）。
 *
 * 运行：node tests/compat/baseline/time-picker.mjs [--check]
 *
 * ── 覆盖范围：**只覆盖触发元素**（与 `date-picker.mjs` / `cascader.mjs` 同判）────
 *
 * SSR 下浮层走 Portal ⇒ **不渲染** ⇒ 时间面板的 DOM 在静态渲染期不可达。
 * ⇒ **面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责**，本文件不重复钉 ——
 * 避免同一件事在两层各钉一份、日后漂移。
 *
 * ⚠️ 本组件是 `DatePicker` 的**薄壳** ⇒ 这份基线的价值是「**薄壳没有改变 DOM**」：
 * 同一个用例的产物应当与 `date-picker.mjs` 里 `picker='time'` 的那份**同构**
 * （差别只有后缀图标的 `aria-label`：`clock-circle` vs `calendar`）。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * ① 时间一律用**固定字面量**（`dayjs('12:30:45', 'HH:mm:ss')`），不用 `dayjs()`；
 * ② 浮层不渲染 ⇒ 没有 `getNow()` 的参与。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/time-picker.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antdRoot = require.resolve('antd');
const antd = require('antd');
const { TimePicker, ConfigProvider } = antd;

/**
 * ⚠️ `RangePicker` **不是 antd 的顶层导出** —— 它是 `TimePicker.RangePicker`
 * （写成 `const { RangePicker } = antd` 会拿到 `undefined`）。
 */
const { RangePicker } = TimePicker;

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

const T = (s) => dayjs(s, 'HH:mm:ss');

/**
 * ⚠️ `prefixCls: 'apollo'` ⇒ TimePicker 的类名是 **`apollo-picker`**
 * （上游传的是**字面量** `'picker'`，不是组件名）—— 与 `date-picker` 同一个类名前缀，
 * 正好与本仓默认一致。
 */
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

// ---- 单值：结构 / 值 / 尺寸 / 变体 / 状态 / 禁用 / 装饰 ----
push('time-picker:basic', h(TimePicker));
push('time-picker:value', h(TimePicker, { defaultValue: T('12:30:45') }));
push('time-picker:size-small', h(TimePicker, { size: 'small' }));
push('time-picker:size-large', h(TimePicker, { size: 'large' }));
push('time-picker:variant-filled', h(TimePicker, { variant: 'filled' }));
push('time-picker:variant-borderless', h(TimePicker, { variant: 'borderless' }));
push('time-picker:variant-underlined', h(TimePicker, { variant: 'underlined' }));
push('time-picker:status-error', h(TimePicker, { status: 'error' }));
push('time-picker:status-warning', h(TimePicker, { status: 'warning' }));
push('time-picker:disabled', h(TimePicker, { disabled: true }));
push(
  'time-picker:allow-clear-false',
  h(TimePicker, { allowClear: false, defaultValue: T('12:30:45') }),
);
push('time-picker:prefix', h(TimePicker, { prefix: 'P' }));
push('time-picker:no-suffix', h(TimePicker, { suffixIcon: null }));
push('time-picker:placeholder', h(TimePicker, { placeholder: '自定义' }));
/** `format` 影响的是**占位符与字段文本**（`HH:mm` ⇒ 没有秒）。 */
push('time-picker:format', h(TimePicker, { format: 'HH:mm', defaultValue: T('12:30:45') }));
/** 有值 + 清除按钮（`allowClear` 默认开 ⇒ 有值时才渲染）。 */
push('time-picker:clear', h(TimePicker, { defaultValue: T('00:00:00') }));

// ---- 范围 ----
push('time-picker:range-basic', h(RangePicker));
push('time-picker:range-value', h(RangePicker, { defaultValue: [T('09:00:00'), T('18:30:00')] }));
/** 自定义分隔符 ⇒ 去掉 `aria-hidden`（默认图标那个 span 是带 `aria-hidden` 的）。 */
push('time-picker:range-separator', h(RangePicker, { separator: '→' }));
/** 两端都禁用 ⇒ 根上**有** `-disabled`。 */
push('time-picker:range-disabled', h(RangePicker, { disabled: true }));
/** 🚨 只禁用**一端** ⇒ 根上**不该**有 `-disabled`（判据是 `every`）。 */
push(
  'time-picker:range-disabled-one',
  h(RangePicker, { disabled: [true, false], defaultValue: [T('09:00:00'), T('18:30:00')] }),
);

const result = {
  $schema: '../schema.json',
  component: 'time-picker',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] time-picker.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] time-picker: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] time-picker: wrote', cases.length, 'cases →', OUT_FILE);
}
