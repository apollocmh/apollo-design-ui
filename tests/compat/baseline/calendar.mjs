#!/usr/bin/env node
/**
 * tests/compat/baseline/calendar.mjs — 生成 antd 6.6.4 Calendar 的 DOM 基线（机械 oracle）
 *
 * 与 `card.mjs` / `breadcrumb.mjs` / `anchor.mjs` 同一套路：**只做三件事** ——
 * 构造用例、调用 React、写文件。归一化与比对在消费侧
 * （`packages/ui/src/calendar/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 这个基线为什么是确定的（不 flaky）────────────────────────────────────────
 *
 * Calendar **没有浮层**（面板内联）⇒ SSR 产物完全确定 ✓。
 *
 * 🚨 **`value` 必须落在「过去」**（`V = '2025-06-15'`，与 L6 的 `CALENDAR_VALUE` 同值）：
 * `-date-today` 由 `getNow()` 决定 —— 只要「今天」落在当前渲染的**月份网格**
 * （**含上/下月补位格**）或**年模式的那一年**里，产物就会随运行日漂移。
 * 2025-06 的网格是 `2025-05-25 … 2025-07-05`（整段在过去），年模式渲染 2025 年
 * 而今天是 2026 ⇒ 两条都避开 ⇒ **永久稳定**。
 *
 * ── 🚨 每个用例都要包一层 `ConfigProvider` ───────────────────────────────────
 *
 * `Calendar` 的 `prefixCls` 默认是 `getPrefixCls('picker')`（**根前缀 + `picker`**），
 * 而内嵌的 `Select` / `Radio` 也各自读根前缀 ⇒ 不包 Provider 时根前缀是 antd 的
 * 默认 `ant`，与我们侧对不上。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 *   node tests/compat/baseline/calendar.mjs
 *   node tests/compat/baseline/calendar.mjs --check
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，见 tests/compat/README.md §7。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/calendar.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antdRoot = require.resolve('antd');
const antd = require('antd');
const { Calendar, ConfigProvider } = antd;
/**
 * ⚠️ `dayjs` **不能直接 `require('dayjs')`**（根 node_modules 里没有它的顶层条目 ——
 * 它挂在 antd 的 `.pnpm` 目录下）⇒ 从 **antd 自己的目录**解析
 * （与 `date-picker.mjs` / `time-picker.mjs` 同一手法）。
 */
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

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 🚨 必须落在**过去**（见文件头）。 */
const V = dayjs('2025-06-15');

const cases = [];

/**
 * 推入一个用例。
 *
 * @param id    用例 id
 * @param props `Calendar` 的 props
 * @param opts  `bare`（不包 ConfigProvider，用来钉 D1）/ `direction`（RTL）
 */
const push = (id, props, { bare, direction } = {}) => {
  const node = h(Calendar, props);
  cases.push({ id, html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)) });
};

const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

const BP = { prefixCls: PREFIX, value: V };

// ---- 1. 三个模式 / 全屏形态 ------------------------------------------------

push('calendar:basic', BP);
push('calendar:mini', { ...BP, fullscreen: false });
push('calendar:year', { ...BP, mode: 'year' });
push('calendar:year-mini', { ...BP, mode: 'year', fullscreen: false });
push('calendar:show-week', { ...BP, showWeek: true });
push('calendar:show-week-false', { ...BP, showWeek: false });

// ---- 2. 约束（禁用）--------------------------------------------------------

push('calendar:valid-range', { ...BP, validRange: [dayjs('2025-06-10'), dayjs('2025-06-20')] });
push('calendar:disabled-date', {
  ...BP,
  disabledDate: (d) => d.date() === 15,
});
push('calendar:valid-range-and-disabled-date', {
  ...BP,
  validRange: [dayjs('2025-06-10'), dayjs('2025-06-20')],
  disabledDate: (d) => d.date() === 12,
});

// ---- 3. 三个渲染 prop ------------------------------------------------------

push('calendar:cell-render', {
  ...BP,
  cellRender: () => h('span', { className: 'probe-cell' }, 'c'),
});
push('calendar:full-cell-render', {
  ...BP,
  fullCellRender: (d) => h('span', { className: 'probe-full' }, String(d.date())),
});
push('calendar:header-render', {
  ...BP,
  headerRender: ({ value }) =>
    h('div', { className: 'probe-header' }, `H-${value.format('YYYY-MM')}`),
});
push('calendar:header-render-only', {
  ...BP,
  headerRender: () => h('div', null, 'H'),
});

// ---- 4. 4 个废弃 prop（三级回退的中间一级）--------------------------------

push('calendar:date-full-cell-render', {
  ...BP,
  dateFullCellRender: (d) => h('span', { className: 'probe-legacy-full' }, String(d.date())),
});
push('calendar:date-cell-render', {
  ...BP,
  dateCellRender: () => h('span', { className: 'probe-legacy-cell' }, 'c'),
});
push('calendar:month-full-cell-render', {
  ...BP,
  mode: 'year',
  monthFullCellRender: (d) => h('span', { className: 'probe-legacy-month-full' }, String(d.date())),
});
push('calendar:month-cell-render', {
  ...BP,
  mode: 'year',
  monthCellRender: () => h('span', { className: 'probe-legacy-month-cell' }, 'c'),
});

// ---- 5. 语义槽（6 平铺）----------------------------------------------------

push('calendar:semantic-class-names', {
  ...BP,
  classNames: {
    root: 's-root',
    header: 's-header',
    body: 's-body',
    content: 's-content',
    item: 's-item',
    itemContent: 's-item-content',
  },
});
push('calendar:semantic-styles', {
  ...BP,
  styles: { root: { color: 'rgb(1, 2, 3)' }, header: { color: 'rgb(4, 5, 6)' } },
});
push('calendar:semantic-fn', {
  ...BP,
  classNames: ({ props }) => ({ root: `m-${props.mode}` }),
});

// ---- 6. 根节点 ------------------------------------------------------------

push('calendar:rtl', BP, { direction: 'rtl' });
push('calendar:className', { ...BP, className: 'user-cls', rootClassName: 'root-cls' });
push('calendar:style', { ...BP, style: { color: 'rgb(7, 8, 9)' } });
push('calendar:attrs', { ...BP, 'data-testid': 'cal', 'aria-label': '日历' });

// ---- 7. 前缀（D1）---------------------------------------------------------

/**
 * 🚨 **这里刻意不写 `bare: true` 的用例**（与 card / steps / breadcrumb 不同）。
 *
 * `bare` 会让两侧的根前缀分别回落成 antd 的 `ant` 与我们的 `apollo` ⇒
 * **日历的每一层带前缀的元素**都不同（实测 **193** 条 diff）—— 那是 D1 的**同一个事实**
 * 重复 193 遍（本组件的 DOM 是一整张月历）。D1 已由 card / steps / breadcrumb /
 * anchor / avatar / timeline / list 逐个钉住（它们的 DOM 小，逐条登记是可行的）。
 *
 * 而**本组件特有的那件事**是「默认前缀派生 = `{根前缀}-picker-calendar`」——
 * 下面这条用例**包了 Provider 但不传 `prefixCls` prop**，两侧都会算出
 * `apollo-picker-calendar` ⇒ **0 条 diff**，把派生关系钉死，又不制造 193 行噪声。
 */
push('calendar:prefix-cls:default', { value: V });
push('calendar:prefix-cls:custom', { ...BP, prefixCls: 'custom' });

// ---- 8. locale / 受控形态 --------------------------------------------------

push('calendar:default-value', { prefixCls: PREFIX, defaultValue: V });
// 🚨 **刻意不生成 `calendar:no-value`**（2026-10-03 移除）：
//    不传 `value`/`defaultValue` 时上游取 **`getNow()`** ⇒ 产物**随运行日变化**
//    ⇒ 它在「字节精确」的 oracle 里**本质上不可测**（基线 10-02 生成、10-03 跑就红：
//    `-today` 那一格从 `td[5]` 挪到 `td[6]`）。
//    ⚠️ 「不传值时默认是今天」这条**行为**仍被 `calendar/__tests__/index.test.ts` 用
//    **语义断言**覆盖（「`-date-today` 恰好落在今天那一格」——不比对字节，故与日期无关）。
//    ⇒ 这不是「为了绿灯删断言」，是把**度量不了的用例**从错误的层里拿走（见 PITFALLS 334）。

const result = {
  $schema: '../schema.json',
  component: 'calendar',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] calendar.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] calendar: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] calendar: wrote', cases.length, 'cases →', OUT_FILE);
}
