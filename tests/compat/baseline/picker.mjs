#!/usr/bin/env node
/**
 * tests/compat/baseline/picker.mjs — 生成 `@rc-component/picker@1.12.2` 面板层的 DOM 基线。
 *
 * ── 🚨 为什么基线直接打上游的 `PickerPanel` 而不是 antd 的 `DatePicker` ──────────
 *
 * antd 自己的 `DatePicker` 在 SSR 下**根本不渲染面板**（浮层走 Portal，而 Portal 只在
 * 客户端挂载）—— 2026-09-30 实测：`renderToStaticMarkup(<DatePicker open />)` 的输出只有
 * **889 字节**，且 `inline('picker-panel') === false`（只有输入框外壳），控制台还会打
 * `Portal only work in client side`。
 *
 * 于是 `@rc-component/picker` 成为唯一能在 Node 里拿到静态面板 DOM 的取数源
 * ⇒ 它进了根 `devDependencies`（R7 允许的第 ② 类用途：测试 Oracle）。
 *
 * ── 判据（基线只钉「参数驱动的确定形态」）──────────────────────────────────────
 *
 *   - 七个面板模式：`date` / `week` / `month` / `quarter` / `year` / `decade` / `time`
 *     以及 `date + showTime` 自动升成的 `datetime`；
 *   - 值：有值 / 无值 / 多选；hover（单值 hover 与 range hover）
 *   - 禁用：`disabledDate`、`minDate` / `maxDate`（决定四个方向键的 `disabled` 与 class）
 *   - 装饰：`showWeek`（周号列与 `-show-week` 类）、`cellRender`、
 *     语义槽 `classNames` / `styles`、`direction: 'rtl'`、`hideHeader`
 *   - 逃生通道：`hideHeader` 走 `PickerHackContext`
 *
 * ── 🚨 时间必须冻结 ────────────────────────────────────────────────────────────
 *
 * `-cell-today` 用 `generateConfig.getNow()` ⇒ **每天都会变**。这里把
 * `getNow()` 换成常量（`FIXED_NOW`），本仓那一侧用**同一个**覆盖后的
 * `generateConfig`。不冻结的话基线会在跨日时静默失效。
 *
 * ── ⚠️ 两侧都传**数组**形态的 `value` ─────────────────────────────────────────
 *
 * 上游的 `value` 接受 `DateType | DateType[]`（内部 `toArray` 归一）；本仓内部引擎的
 * `value` 只收数组（消费方是 `ui`，它天然按数组传）。基线两侧统一传数组，
 * 这样「单值 vs 数组」这个**上游独有的宽容**不会污染比对。
 *
 * 运行：node tests/compat/baseline/picker.mjs [--check] [--dump <caseId>]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/picker.dom.json');
const check = process.argv.includes('--check');
const dumpIndex = process.argv.indexOf('--dump');
const dumpId = dumpIndex === -1 ? null : process.argv[dumpIndex + 1];

const require = createRequire(import.meta.url);
// ⚠️ `require('@rc-component/picker/package.json')` 不行 —— 它的 `exports` 里没有
//    `./package.json` 这一项（antd 自己有，rc 没有）。直接从磁盘读。
const rcPickerPkg = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(require.resolve('@rc-component/picker')), '../package.json'),
    'utf8',
  ),
);
const { PickerPanel } = require('@rc-component/picker');
const dayjsGenerateConfig = require('@rc-component/picker/generate/dayjs').default;
const enUS = require('@rc-component/picker/locale/en_US').default;

// ⚠️ dayjs 的 locale 数据不是本包加载的（`generate/dayjs.js` 只 extend 插件）。
//    `en_US` 会被 localeMap 映射到内置的 `en` ⇒ 无需额外 import。
dayjsGenerateConfig.locale.parse = dayjsGenerateConfig.locale.parse ?? (() => null);

/** 冻结的「现在」（`-cell-today` / `-cell-selected` 的基准）。 */
export const FIXED_NOW = '2026-09-30 10:20:30';
/** 冻结的面板浏览值。 */
export const FIXED_PICKER_VALUE = '2026-09-30 10:20:30';

/**
 * 固定的 `generateConfig` —— 只把 `getNow` 换成常量，其余逐字用上游。
 *
 * ⚠️ 两侧**必须**用同一份（基线侧与 `ui`/本包测试侧），否则 `-cell-today` 会比错。
 */
function createFixedGenerateConfig(base) {
  return {
    ...base,
    getNow: () => base.getNow().startOf('day').add(10, 'hour').add(20, 'minute').add(30, 'second'),
  };
}

export const generateConfig = createFixedGenerateConfig(dayjsGenerateConfig);

/** 与 `packages/picker/src/__tests__/semantic.test.ts` 里逐字相同的一份。 */
export const locale = enUS;

const baseProps = () => ({
  prefixCls: 'apollo-picker',
  locale,
  generateConfig,
  pickerValue: generateConfig.getNow(),
  value: [generateConfig.getNow()],
});

const cases = [];
const push = (id, props) => {
  cases.push({
    id,
    html: renderToStaticMarkup(h(PickerPanel, { ...baseProps(), ...props })),
  });
};

// ── 日面板 ──
push('picker:date-basic', { picker: 'date', mode: 'date' });
push('picker:date-no-value', { picker: 'date', mode: 'date', value: [] });
push('picker:date-show-week', { picker: 'date', mode: 'date', showWeek: true });
push('picker:date-multiple', {
  picker: 'date',
  mode: 'date',
  multiple: true,
  value: [generateConfig.getNow(), generateConfig.addMonth(generateConfig.getNow(), 1)],
});
push('picker:date-other-month', {
  picker: 'date',
  mode: 'date',
  value: [generateConfig.addMonth(generateConfig.getNow(), 1)],
});

// ── 禁用 / 边界 ──
push('picker:date-disabled-date', {
  picker: 'date',
  mode: 'date',
  disabledDate: (date) => date.date() % 7 === 0,
});
push('picker:date-min-date', {
  picker: 'date',
  mode: 'date',
  minDate: generateConfig.setDate(generateConfig.getNow(), 5),
});
push('picker:date-max-date', {
  picker: 'date',
  mode: 'date',
  maxDate: generateConfig.addMonth(generateConfig.getNow(), -1),
});
push('picker:date-min-and-max', {
  picker: 'date',
  mode: 'date',
  minDate: generateConfig.addMonth(generateConfig.getNow(), -1),
  maxDate: generateConfig.addMonth(generateConfig.getNow(), 1),
});

// ── hover ──
push('picker:date-hover-value', {
  picker: 'date',
  mode: 'date',
  hoverValue: [generateConfig.setDate(generateConfig.getNow(), 10)],
});
push('picker:date-hover-range', {
  picker: 'date',
  mode: 'date',
  value: [],
  hoverRangeValue: [
    generateConfig.setDate(generateConfig.getNow(), 8),
    generateConfig.setDate(generateConfig.getNow(), 18),
  ],
});

// ── 周面板 ──
push('picker:week', { picker: 'week', mode: 'week' });
push('picker:week-hover-range', {
  picker: 'week',
  mode: 'week',
  value: [],
  hoverRangeValue: [
    generateConfig.setDate(generateConfig.getNow(), 1),
    generateConfig.setDate(generateConfig.getNow(), 20),
  ],
});

// ── 上层面板 ──
push('picker:month', { picker: 'month', mode: 'month' });
push('picker:month-mode', { picker: 'date', mode: 'month' });
push('picker:month-disabled', {
  picker: 'month',
  mode: 'month',
  // 只有**整月**都禁用才算禁用（MonthPanel 的合并规则）
  disabledDate: (date) => date.month() === 2,
});
push('picker:quarter', { picker: 'quarter', mode: 'quarter' });
push('picker:year', { picker: 'year', mode: 'year' });
push('picker:year-disabled', {
  picker: 'year',
  mode: 'year',
  disabledDate: (date) => date.year() === 2024,
});
push('picker:decade', { picker: 'year', mode: 'decade' });

// ── 时间 ──
push('picker:time', { picker: 'time', mode: 'time' });
push('picker:time-12h', { picker: 'time', mode: 'time', use12Hours: true });
push('picker:time-ms', {
  picker: 'time',
  mode: 'time',
  showMillisecond: true,
  millisecondStep: 250,
});
push('picker:time-no-value', { picker: 'time', mode: 'time', value: [] });
push('picker:time-disabled-hour', {
  picker: 'time',
  mode: 'time',
  disabledHours: () => [2, 3],
});
push('picker:time-steps', {
  picker: 'time',
  mode: 'time',
  hourStep: 6,
  minuteStep: 15,
  secondStep: 20,
});
push('picker:time-format-only-hour', {
  picker: 'time',
  mode: 'time',
  showTime: { format: 'HH' },
});
push('picker:time-hide-disabled', {
  picker: 'time',
  mode: 'time',
  hideDisabledOptions: true,
  disabledHours: () => [2, 3],
});

// ── datetime（`picker='date'` + `showTime` 自动升成）──
push('picker:datetime', { picker: 'date', mode: 'date', showTime: true });
push('picker:datetime-12h', { picker: 'date', mode: 'date', showTime: { use12Hours: true } });
push('picker:datetime-no-value', {
  picker: 'date',
  mode: 'date',
  showTime: true,
  value: [],
});

// ── 逃生通道与渲染替换 ──
push('picker:hide-header', { picker: 'date', mode: 'date', hideHeader: true });
push('picker:rtl', { picker: 'date', mode: 'date', direction: 'rtl' });
push('picker:tab-index-neg', { picker: 'date', mode: 'date', tabIndex: -1 });
push('picker:cell-render', {
  picker: 'date',
  mode: 'date',
  cellRender: (date, info) =>
    h('span', { className: 'custom-cell' }, `${info.prefixCls}:${date.date()}`),
});

// ── 语义槽 ──
push('picker:semantic', {
  picker: 'date',
  mode: 'date',
  classNames: {
    header: 'c-header',
    body: 'c-body',
    content: 'c-content',
    item: 'c-item',
  },
  styles: {
    header: { color: 'rgb(1, 2, 3)' },
    body: { color: 'rgb(4, 5, 6)' },
    content: { color: 'rgb(7, 8, 9)' },
    item: { color: 'rgb(10, 11, 12)' },
  },
});
push('picker:semantic-time', {
  picker: 'time',
  mode: 'time',
  classNames: { content: 'c-content', item: 'c-item' },
});

if (dumpId) {
  const hit = cases.find((item) => item.id === dumpId);
  if (!hit) {
    console.error(
      `[baseline] 没有 id 为 ${dumpId} 的用例。可用：${cases.map((c) => c.id).join(', ')}`,
    );
    process.exit(1);
  }
  process.stdout.write(`${hit.html}\n`);
  process.exit(0);
}

const result = {
  $schema: '../schema.json',
  component: 'picker',
  antdVersion: rcPickerPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] picker.dom.json 与当前上游产物不一致');
    process.exit(1);
  }
  console.log(`[baseline] picker.dom.json 最新（${cases.length} 用例）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] picker.dom.json 已写入（${cases.length} 用例）`);
