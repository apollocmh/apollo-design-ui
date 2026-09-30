#!/usr/bin/env node
/**
 * dump-datepicker-antd.mjs — 一次性分析探针（G1）：SSR dump antd 6.6.4 的
 * `DatePicker` / `RangePicker` **输入框侧** DOM。
 *
 * 为什么只打输入框侧：面板/浮层走 Portal ⇒ SSR 不渲染（实测 `open: true` 也只有
 * 「触发器 + 空浮层占位」）。**面板侧的 DOM 契约由 `@apollo-design/picker` 的
 * 基线负责**（`tests/compat/baseline/picker.mjs`，打 rc 的 `PickerPanel`）。
 *
 * 用法：`node tests/visual/debug/dump-datepicker-antd.mjs [用例名…]`
 */

import { createRequire } from 'node:module';
import { ConfigProvider, DatePicker } from 'antd';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ⚠️ `dayjs` 不是本仓的**直接**依赖（pnpm 严格 node_modules）⇒ 从虚拟store 里显式解析。
//    这也是事实：`antd` 的 `value` / `defaultValue` **必须是 Dayjs 实例**，
//    传 ISO 字符串会在 rc 的 `isValidate` 处抛 `isValid is not a function`（实测）。
const require = createRequire(import.meta.url);
const dayjs = require(require.resolve('dayjs', { paths: [require.resolve('antd/package.json')] }));

const { RangePicker } = DatePicker;

const CASES = {
  'date-basic': React.createElement(DatePicker, {}),
  'date-value': React.createElement(DatePicker, { defaultValue: dayjs('2026-09-30') }),
  'date-small': React.createElement(DatePicker, { size: 'small' }),
  'date-large': React.createElement(DatePicker, { size: 'large' }),
  'date-disabled': React.createElement(DatePicker, { disabled: true }),
  'date-status-error': React.createElement(DatePicker, { status: 'error' }),
  'date-status-warning': React.createElement(DatePicker, { status: 'warning' }),
  'date-variant-filled': React.createElement(DatePicker, { variant: 'filled' }),
  'date-variant-borderless': React.createElement(DatePicker, { variant: 'borderless' }),
  'date-no-allow-clear': React.createElement(DatePicker, { allowClear: false }),
  'date-show-time': React.createElement(DatePicker, { showTime: true }),
  'date-multiple': React.createElement(DatePicker, { multiple: true }),
  'date-picker-week': React.createElement(DatePicker, { picker: 'week' }),
  'date-picker-month': React.createElement(DatePicker, { picker: 'month' }),
  'date-picker-quarter': React.createElement(DatePicker, { picker: 'quarter' }),
  'date-picker-year': React.createElement(DatePicker, { picker: 'year' }),
  'date-open': React.createElement(DatePicker, { open: true }),
  'date-presets': React.createElement(DatePicker, {
    presets: [{ label: 'Now', value: dayjs('2026-09-30') }],
  }),
  'range-basic': React.createElement(RangePicker, {}),
  'range-open': React.createElement(RangePicker, { open: true }),
  'range-show-time': React.createElement(RangePicker, { showTime: true }),
  'range-separator': React.createElement(RangePicker, { separator: '→' }),
  'range-presets': React.createElement(RangePicker, {
    presets: [{ label: 'Week', value: [dayjs('2026-09-28'), dayjs('2026-09-30')] }],
  }),
};

const wanted = process.argv.slice(2);
const names = wanted.length > 0 ? wanted : Object.keys(CASES);

for (const name of names) {
  const node = CASES[name];
  if (!node) {
    console.log(`\n===== ${name}  ✗ 无此用例 =====`);
    continue;
  }
  const html = renderToStaticMarkup(React.createElement(ConfigProvider, null, node));
  console.log(`\n===== ${name}  (${html.length} bytes) =====`);
  console.log(html);
}
