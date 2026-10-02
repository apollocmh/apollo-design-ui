#!/usr/bin/env node
/**
 * tests/compat/baseline/color-picker.mjs — 生成 antd 6.6.4 ColorPicker 的 DOM 基线（机械 oracle）
 *
 * 与 `breadcrumb.mjs` / `avatar.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（`packages/ui/src/color-picker/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 🚨 这个基线**只覆盖触发器**（+ 一条 `open` 的「面板不在 SSR 里」的哨兵）──────
 *
 * 实测（`renderToStaticMarkup`）：**面板在 Portal 里，SSR 不渲染**。告警原文：
 * `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`
 * ⇒ 面板的 DOM 契约由 **L6 视觉层**（真浏览器）承担，本基线**不覆盖**。
 * 这条要写清楚，否则后人会以为「面板没测」是疏漏。
 *
 * 同时实测：`ColorPicker._InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）在 SSR 下
 * **也不渲染面板**（`open` 由 `useEffect` 置真，SSR 不跑 effect ⇒ 浮层不开）
 * ⇒ 面板同样拿不到。本文件仍保留一条 `pure-panel` 用例把这件事**钉成事实**。
 *
 * ── 每个用例都包一层 `ConfigProvider` ─────────────────────────────────────────
 *
 * 与 breadcrumb 同判：触发器里的 `Divider` / `Slider` / `Input` / `Select` 等复用组件
 * 都从 `getPrefixCls` 取前缀 ⇒ 不包 Provider 时它们回落到 `ant-*`，与我们的 `apollo-*`
 * 对不上（那是 D1 的范畴，只应出现在 `bare` 用例里）。
 *
 * ── 用 `--check` 校验入库的产物没漂 ───────────────────────────────────────────
 *
 * 运行：
 *   node tests/compat/baseline/color-picker.mjs
 *   node tests/compat/baseline/color-picker.mjs --check
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
const OUT_FILE = path.join(__dirname, '../baselines/color-picker.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { ColorPicker, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 固定色值（不用任何与运行时刻相关的东西）。 */
const BLUE = '#1677ff';

const cases = [];

/** 每个用例都包一层 `ConfigProvider`（见文件头）。 */
const withPrefix = (node, direction) =>
  h(
    ConfigProvider,
    { prefixCls: PREFIX, iconPrefixCls: 'apollo-icon', ...(direction ? { direction } : {}) },
    node,
  );

const push = (id, props, { direction, bare, children } = {}) => {
  const node = h(ColorPicker, props, children);
  // `bare: true` ⇒ **不包** ConfigProvider：此时根前缀回落到各家的默认值
  // （antd `ant` vs 我们 `apollo`）⇒ 用来钉 D1 差异
  cases.push({ id, html: renderToStaticMarkup(bare ? node : withPrefix(node, direction)) });
};

const BASE = { prefixCls: PREFIX, defaultValue: BLUE };

// ---- 1. 基本形态（默认值 / 清空态）-----------------------------------------

push('color-picker:basic', BASE);
// 🚨 **不传 `value` / `defaultValue`** ⇒ `generateColor('')` ⇒ **cleared**
//    （上游文档的 `defaultValue` 默认值是 `-`，不是 `#1677ff`）
push('color-picker:cleared', { prefixCls: PREFIX });
push('color-picker:default-value-null', { prefixCls: PREFIX, defaultValue: null });
// 两侧都不传 prefixCls **且不包 Provider** → `ant-color-picker*` vs `apollo-color-picker*`（D1）
push('color-picker:prefix-cls:no-props', {}, { bare: true });
push('color-picker:prefix-cls:custom', { prefixCls: 'custom', defaultValue: BLUE });
push('color-picker:rtl', BASE, { direction: 'rtl' });

// ---- 2. 禁用 / 尺寸 --------------------------------------------------------

push('color-picker:disabled', { ...BASE, disabled: true });
push('color-picker:disabled-cleared', { prefixCls: PREFIX, disabled: true });
push('color-picker:size-small', { ...BASE, size: 'small' });
push('color-picker:size-large', { ...BASE, size: 'large' });

// ---- 3. showText 的六种分支 ------------------------------------------------

push('color-picker:show-text', { ...BASE, showText: true });
push('color-picker:show-text-cleared', { prefixCls: PREFIX, showText: true });
push('color-picker:show-text-fn', {
  ...BASE,
  showText: (color) => color.toHexString().toUpperCase(),
});
push('color-picker:show-text-format-rgb', { ...BASE, showText: true, format: 'rgb' });
push('color-picker:show-text-format-hsb', { ...BASE, showText: true, format: 'hsb' });
// ⚠️ 用**字符串**而不是 `{r,g,b,a}` 对象：两侧的 `ColorValueType` 都**不接受**对象形态
//    （只有 rc 的 `ColorGenInput` 接受，那是运行时通道）⇒ 用字符串让类型面也诚实。
push('color-picker:show-text-alpha', {
  prefixCls: PREFIX,
  defaultValue: 'rgba(22,119,255,0.5)',
  showText: true,
});

// ---- 4. 类名 / 透传属性 ----------------------------------------------------

push('color-picker:className', { ...BASE, className: 'my-cls', rootClassName: 'my-root' });
push('color-picker:attrs', { ...BASE, 'data-testid': 'cp', 'aria-label': '颜色' });

// ---- 5. 自定义触发器（children）-------------------------------------------

push(
  'color-picker:children',
  { prefixCls: PREFIX, defaultValue: BLUE },
  { children: h('div', { className: 'my-trigger' }, 'T') },
);

// ---- 6. 🚨 哨兵：`open` 时**面板仍不在 SSR 产物里** ------------------------
//
// 这一条是**事实钉**：它证明「面板的 DOM 契约不归 L4 管」（归 L6 的真浏览器）。
// 若哪天上游改成 SSR 也渲染浮层，这条用例的产物会变 ⇒ 我们会被提醒。
push('color-picker:open-no-portal', { ...BASE, open: true, placement: 'bottomLeft' });

// ---- 7. ⚠️ 面板 / PurePanel **不进 L4** ------------------------------------
//
// 实测两条事实（都写进文件头）：
//   - `open` 时面板在 Portal 里 ⇒ SSR 产物**没有**面板（用例 6 就是这条哨兵）；
//   - `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）在 SSR 下**也不渲染面板**
//     （`open` 由 `useEffect` 置真，SSR 不跑 effect）⇒ 同样拿不到。
// ⇒ 面板的 DOM 契约由 **L6 视觉层**（真浏览器）承担。本文件**不**为 PurePanel 造用例，
//    因为「拿不到 DOM 的用例」只会变成一条永远空转的假绿灯。

// ---- 8. 语义化槽（触发器侧的四个 + 嵌套 popup）-----------------------------

push('color-picker:class-names', {
  ...BASE,
  classNames: { root: 'cn-root', body: 'cn-body', content: 'cn-content', description: 'cn-desc' },
});
push('color-picker:class-names-popup', {
  ...BASE,
  classNames: { root: 'cn-root', popup: { root: 'cn-popup' } },
});
push('color-picker:styles', {
  ...BASE,
  classNames: { root: 'cn-root' },
  styles: { root: { background: '#fafafa' }, body: { opacity: 0.8 } },
});

const result = {
  $schema: '../schema.json',
  component: 'color-picker',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] color-picker.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] color-picker: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] color-picker: wrote', cases.length, 'cases →', OUT_FILE);
}
