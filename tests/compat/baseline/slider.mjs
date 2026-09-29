#!/usr/bin/env node
/**
 * tests/compat/baseline/slider.mjs — 生成 antd 6.6.4 Slider 的 DOM 基线（机械 oracle）。
 *
 * ── 判据（为什么基线只钉「静态形态」）──────────────────────────────────────────
 *
 * `renderToStaticMarkup` 拿不到「拖拽中 / 键盘改值后」的 DOM（那是运行时状态），
 * 所以基线钉的是**参数驱动的确定形态**：
 *
 *   - 模式：单把手 / range（含 `editable`）/ `count` 补齐
 *   - 装饰：marks（含对象 `label`/`style`）/ dots / `startPoint` / `included=false`
 *   - 方向：vertical / reverse（位置 style 的四个分支）
 *   - 状态：disabled（布尔与**数组**）/ `step: null`
 *   - a11y：`ariaLabelForHandle` / `ariaRequired` / `ariaValueTextFormatterForHandle`
 *
 * 运行时的值机（拖拽、键盘、tooltip 三态）由
 * `packages/ui/src/slider/__tests__/{index,a11y}.test.ts` 钉。
 *
 * 运行：node tests/compat/baseline/slider.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/slider.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Slider, ConfigProvider } = antd;

const wrap = (node) => h(ConfigProvider, { prefixCls: 'apollo' }, node);

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

push('slider:basic', h(Slider, { defaultValue: 30 }));
push('slider:min-max', h(Slider, { min: 10, max: 200, defaultValue: 100 }));
push('slider:step-null', h(Slider, { step: null, defaultValue: 30, marks: { 0: 'a', 50: 'b' } }));
push('slider:range', h(Slider, { range: true, defaultValue: [20, 60] }));
push('slider:range-editable', h(Slider, { range: { editable: true }, defaultValue: [10, 50, 90] }));
push('slider:count', h(Slider, { range: true, count: 3, defaultValue: [10, 30] }));
push(
  'slider:marks',
  h(Slider, {
    defaultValue: 30,
    marks: { 0: '0°C', 26: '26°C', 100: { style: { color: 'rgb(245, 34, 45)' }, label: '100°C' } },
  }),
);
push('slider:dots', h(Slider, { defaultValue: 30, step: 10, dots: true }));
push('slider:start-point', h(Slider, { defaultValue: 60, startPoint: 20 }));
push('slider:included-false', h(Slider, { included: false, defaultValue: 70 }));
push('slider:track-false', h(Slider, { track: false, defaultValue: 70 }));
push('slider:vertical', h(Slider, { vertical: true, defaultValue: 40 }));
push('slider:reverse', h(Slider, { reverse: true, defaultValue: 40 }));
push('slider:disabled', h(Slider, { disabled: true, defaultValue: 30 }));
push(
  'slider:disabled-array',
  h(Slider, { range: true, defaultValue: [20, 60], disabled: [true, false] }),
);
push(
  'slider:aria',
  h(Slider, {
    defaultValue: 30,
    ariaLabelForHandle: '音量',
    ariaRequired: true,
    ariaValueTextFormatterForHandle: (v) => `${v} 分`,
  }),
);
push(
  'slider:aria-array',
  h(Slider, {
    range: true,
    defaultValue: [20, 60],
    ariaLabelForHandle: ['起', '止'],
    tabIndex: [0, -1],
  }),
);

const result = {
  $schema: '../schema.json',
  component: 'slider',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] slider.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log(`[baseline] slider.dom.json 最新（${cases.length} 用例）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] 写入 slider.dom.json（${cases.length} 用例）`);
