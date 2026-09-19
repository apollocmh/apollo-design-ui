#!/usr/bin/env node
/**
 * tests/compat/baseline/spin.mjs — 生成 antd 6.6.4 Spin 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `empty.mjs` / `icons.mjs` 同一套路：**只做三件事** —— 构造用例、
 * 调用 React、写文件。中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/spin/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 为什么用 `renderToStaticMarkup` ────────────────────────────────────────────
 *
 * DOM 契约比的是**结构**，不需要布局与绘制（那是 L6 用 Playwright 的事）。
 * 纯 Node 渲染带来确定性与速度，且与 Vue 侧的 `mount()` 产物可直接对照。
 *
 * ⚠️ 副作用：`renderToStaticMarkup` **不跑** `useEffect` / `useLayoutEffect`，
 *    所以 Spin 的 `delay` 推进与 `Progress` 的「第二帧才渲染」在基线里都看不到 ——
 *    它们体现为「初始状态」。这正是我们要的：
 *      - `spinning + delay=500` ⇒ 基线里**没有** `-spinning`、没有指示器；
 *      - `percent={30}` ⇒ `Progress` 的 `render` 初值是 `false` ⇒ **没有** `<svg>`。
 *    这两条的**动态**行为由 L1/L2（`index.test.ts`）用 fake timers 覆盖，
 *    基线只负责锁「首帧」。
 *
 * ── 关于 prefixCls（关键）─────────────────────────────────────────────────────
 *
 * antd 的默认前缀是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。
 * 本文件**给每个用例显式传 `prefixCls`**，两侧传同一个值 —— 于是类名可以逐字比对。
 * 这比「先渲染成 ant- 再归一化替换」更强：后者会把「我们根本没读 prefixCls」这个 bug
 * 一起归一化掉。默认前缀（`apollo`）由 `prefix-cls:no-props` 单独覆盖。
 *
 * ⚠️ 传 `prefixCls="apollo"` 时 `getPrefixCls('spin', 'apollo')` **直接返回** `apollo`
 *    （不加 `-spin` 后缀）—— 这是 antd 的 `defaultGetPrefixCls` 行为，两侧一致。
 *
 * 运行：
 *   node tests/compat/baseline/spin.mjs
 *   node tests/compat/baseline/spin.mjs --check   # 只校验基线是否最新
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，
 * 见 tests/compat/README.md §7 与 TESTING.md 反模式 A9。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.join(__dirname, '../baselines/spin.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Spin, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

/** 渲染一个 antd Spin（可选 children / 可选包一层 ConfigProvider）。 */
const render = (props, children, { wrap } = {}) => {
  const node = children === undefined ? h(Spin, props) : h(Spin, props, children);
  return renderToStaticMarkup(wrap ? wrap(node) : node);
};

const push = (id, props, children, options) => {
  cases.push({ id, html: render(props, children, options) });
};

/** 一个会把自己收到的 `percent` 渲染出来的自定义指示器（对齐 antd 的测试）。 */
const MyIndicator = ({ percent }) => h('div', { className: 'custom-indicator' }, String(percent));

/** 嵌套模式的 children：一个带背景的方块（对齐 antd 的 `tip.tsx` demo）。 */
const content = h('div', { style: { padding: 50, background: 'rgba(0, 0, 0, 0.05)' } });

// ---- 1. 基本形态 -----------------------------------------------------------

push('plain', { prefixCls: PREFIX });
push('prefix-cls:custom', { prefixCls: 'custom' });
// 两侧都不传 prefixCls → antd 用 `ant-spin`、我们用 `apollo-spin`。
// 这条刻意把「默认值不同」钉成断言（消费侧的 allow 里登记为 D6）。
push('prefix-cls:no-props', {});

// ---- 2. spinning ----------------------------------------------------------

push('spinning:false', { prefixCls: PREFIX, spinning: false });
push('spinning:true', { prefixCls: PREFIX, spinning: true });
// 有 delay 时**首帧**不 spinning（effect 不跑）⇒ 没有指示器、没有 -spinning。
push('spinning:true+delay', { prefixCls: PREFIX, spinning: true, delay: 500 });

// ---- 3. size --------------------------------------------------------------

push('size:small', { prefixCls: PREFIX, size: 'small' });
push('size:medium', { prefixCls: PREFIX, size: 'medium' });
push('size:middle', { prefixCls: PREFIX, size: 'middle' });
push('size:large', { prefixCls: PREFIX, size: 'large' });

// ---- 4. 文案 --------------------------------------------------------------

push('description', { prefixCls: PREFIX, description: 'Loading' });
// `tip` 已废弃，但 DOM 与 `description` 相同（差别只在于告警）。
push('description:tip', { prefixCls: PREFIX, tip: 'Loading' });
// `description` 优先于 `tip`
push('description:both', { prefixCls: PREFIX, tip: 'from-tip', description: 'from-description' });

// ---- 5. 嵌套（hasChildren || fullscreen）------------------------------------

push('nested', { prefixCls: PREFIX }, content);
push('nested:spinning-false', { prefixCls: PREFIX, spinning: false }, content);
push('nested:description', { prefixCls: PREFIX, description: 'Loading' }, content);
push('nested:wrapper-class-name', { prefixCls: PREFIX, wrapperClassName: 'my-wrapper' }, content);

// ---- 6. fullscreen --------------------------------------------------------

push('fullscreen', { prefixCls: PREFIX, fullscreen: true });
push('fullscreen:spinning-false', { prefixCls: PREFIX, fullscreen: true, spinning: false });
push('fullscreen:children', { prefixCls: PREFIX, fullscreen: true }, content);
push('fullscreen:description', { prefixCls: PREFIX, fullscreen: true, description: 'Loading' });

// ---- 7. percent -----------------------------------------------------------

push('percent:30', { prefixCls: PREFIX, percent: 30 });
// ⚠️ `Progress` 的 `render` 初值是 false（useLayoutEffect 不跑）⇒ SSR 里**没有** svg。
push('percent:auto', { prefixCls: PREFIX, percent: 'auto' });
push('percent:negative', { prefixCls: PREFIX, percent: -50 });
push('percent:over', { prefixCls: PREFIX, percent: 150 });

// ---- 8. indicator ---------------------------------------------------------

push('indicator:custom', { prefixCls: PREFIX, indicator: h(MyIndicator) });
// ⚠️ 传**原生元素**而不是组件：`cloneElement` 会把 `${prefixCls}-dot` 追加到它的
//    className 上，这条用例是「克隆真的发生了」的唯一可观测证据 ——
//    传组件时（上面的 `indicator:custom`）组件自己忽略了 className，什么都看不出来。
push('indicator:custom-element', {
  prefixCls: PREFIX,
  indicator: h('div', { className: 'custom-indicator' }),
});
push('indicator:custom-element+semantic', {
  prefixCls: PREFIX,
  indicator: h('div', { className: 'custom-indicator' }),
  classNames: { indicator: 'cn-indicator' },
  styles: { indicator: { color: 'red' } },
});
push('indicator:custom+percent', { prefixCls: PREFIX, indicator: h(MyIndicator), percent: 23 });
push('indicator:custom+nested', { prefixCls: PREFIX, indicator: h(MyIndicator) }, content);
// 传 null → `isValidElement(null)` 为假 → 回落默认 Looper
push('indicator:null', { prefixCls: PREFIX, indicator: null });

// ---- 9. 语义化 classNames / styles -----------------------------------------

push('semantic:classNames-all', {
  prefixCls: PREFIX,
  classNames: {
    root: 'cn-root',
    section: 'cn-section',
    indicator: 'cn-indicator',
    description: 'cn-description',
    container: 'cn-container',
  },
  description: 'Loading',
}, content);
push('semantic:classNames-mask', { prefixCls: PREFIX, fullscreen: true, classNames: { mask: 'cn-mask' } });
push('semantic:classNames-tip', { prefixCls: PREFIX, classNames: { tip: 'cn-tip' }, description: 'Loading' });
push('semantic:styles-all', {
  prefixCls: PREFIX,
  styles: {
    root: { color: 'red' },
    section: { margin: '4px' },
    indicator: { opacity: '0.5' },
    description: { padding: '2px' },
    container: { border: '1px solid blue' },
  },
  description: 'Loading',
}, content);
push('semantic:styles-mask', {
  prefixCls: PREFIX,
  fullscreen: true,
  styles: { mask: { background: 'green' } },
});
// 函数式：`info.props` 必须是**合并后**的 props（spinning 是内部态、size 是合并尺寸）
push('semantic:classNames-fn', {
  prefixCls: PREFIX,
  size: 'small',
  classNames: (info) => ({
    root: `fn-${String(info.props.size)}-${String(info.props.spinning)}`,
  }),
});

// ---- 10. style / className / 属性透传 ---------------------------------------

push('class:className', { prefixCls: PREFIX, className: 'my-class' });
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' });
push('class:both', { prefixCls: PREFIX, className: 'a', rootClassName: 'b' });
push('attrs:passthrough', { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-spin' });
// `style` 覆盖 `styles.root`
push('style:style-over-root', {
  prefixCls: PREFIX,
  style: { color: 'green' },
  styles: { root: { color: 'red' } },
});
// 非嵌套时 `styles.section` 合并进**根元素**
push('style:section-on-root', { prefixCls: PREFIX, styles: { section: { margin: '4px' } } });

// ---- 11. ConfigProvider ---------------------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

push('config:indicator', { prefixCls: PREFIX }, undefined, {
  wrap: (node) => withProvider(node, { spin: { indicator: h(MyIndicator) } }),
});
push('config:className', { prefixCls: PREFIX }, undefined, {
  wrap: (node) => withProvider(node, { spin: { className: 'cfg-class' } }),
});
push('config:classNames', { prefixCls: PREFIX }, undefined, {
  wrap: (node) => withProvider(node, { spin: { classNames: { root: 'cfg-root' } } }),
});
push('direction:rtl', { prefixCls: PREFIX }, undefined, {
  wrap: (node) => withProvider(node, { direction: 'rtl' }),
});

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/spin.mjs 从 antd 6.6.4 的 Spin 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/spin.mjs',
  antdVersion: antdPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: PREFIX,
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:spin] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/spin.mjs');
    process.exit(1);
  }
  console.log(`[compat:spin] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:spin] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
