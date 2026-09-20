#!/usr/bin/env node
/**
 * tests/compat/baseline/button.mjs — 生成 antd 6.6.4 Button 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `empty.mjs` / `icons.mjs` 同一套路：**只做三件事** ——
 * 构造用例、调用 React、写文件。中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/button/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 为什么用 `renderToStaticMarkup` ────────────────────────────────────────────
 *
 * DOM 契约比的是**结构**，不需要布局与绘制（那是 L6 用 Playwright 的事）。
 * 纯 Node 渲染带来确定性与速度，且与 Vue 侧的 `mount()` 产物可直接对照。
 *
 * ── 关于 prefixCls ────────────────────────────────────────────────────────────
 *
 * 每个用例**显式传** `prefixCls`，两侧传同一个值 ⇒ 类名可逐字比对。
 * 默认前缀（`apollo` vs antd 的 `ant`）由 `prefix-cls:no-props` 单独立一条，
 * 在消费侧的 `allow` 里登记为已知差异 D6。
 *
 * ⚠️ 传 `prefixCls="apollo"` 时 `getPrefixCls('btn', 'apollo')` 直接返回 `apollo`
 *    （**不**加 `-btn`）—— antd 的 `defaultGetPrefixCls` 行为，两侧一致。
 *
 * ── 两处**刻意不进基线**的东西（不是漏了）─────────────────────────────────────
 *
 * 1. **布尔 `loading` 的内置加载图标**。它会展开成 `<span class="anticon anticon-loading">
 *    <svg>…</svg></span>`，而图标本体（含 `apolloicon` vs `anticon` 的前缀差 D14）
 *    已由 `tests/compat/baselines/icons.dom.json` 的 848 个用例逐属性钉住。
 *    这里重复比对只会把「图标包的差异」再记一遍。
 *    ⇒ 加载态用 `loading={{ delay: 0, icon }}` 的自定义图标形态进入契约，
 *      图标本体之外的结构（`-loading-icon` 类名、图标在内容之前）全部被覆盖。
 * 2. **两个中文字的整条链路**。`-two-chinese-chars` 由上游的 `useEffect` 置位，
 *    而 `renderToStaticMarkup` **不跑 effect** ⇒ SSR 基线里永远没有这个类，
 *    拿它比对只会测到「SSR 与 mount 的差异」而不是实现差异。
 *    ⇒ 该行为由 L1（`__tests__/index.test.ts` 的 `两个中文字` 一节）与 L6 判定；
 *    「antd 拼 `确 定`、我们用 `::first-letter` 的 letter-spacing」这条形态差异
 *    登记在 `COMPATIBILITY.md`，同样由 L6 的像素比对裁决。
 *
 * 运行：
 *   node tests/compat/baseline/button.mjs
 *   node tests/compat/baseline/button.mjs --check   # 只校验基线是否最新
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
const OUT_FILE = path.join(__dirname, '../baselines/button.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Button, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 两侧共用的自定义图标：`<i class="my-icon" />`。 */
const ICON = h('i', { className: 'my-icon' });
/** 两侧共用的自定义加载图标：`<i class="my-loading-icon" />`。 */
const LOADING_ICON = h('i', { className: 'my-loading-icon' });

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

const render = (props, children, { wrap } = {}) => {
  const node = children === undefined ? h(Button, props) : h(Button, props, children);
  return renderToStaticMarkup(wrap ? wrap(node) : node);
};

const push = (id, props, children, options) => {
  cases.push({ id, html: render(props, children, options) });
};

/** 带 children 的通用 props 基底。 */
const withText = { prefixCls: PREFIX };

// ---- 1. 基本形态 -----------------------------------------------------------

push('plain', { prefixCls: PREFIX });
push('plain:with-text', withText, 'Text');
push('prefix-cls:custom', { prefixCls: 'custom' }, 'Text');
// 两侧都不传 prefixCls → antd 用 `ant-btn`、我们用 `apollo-btn`（D6）
push('prefix-cls:no-props', {}, 'Text');
// htmlType：默认 button，可透传
push('html-type:default', { prefixCls: PREFIX }, 'Text');
push('html-type:submit', { prefixCls: PREFIX, htmlType: 'submit' }, 'Text');
push('html-type:reset', { prefixCls: PREFIX, htmlType: 'reset' }, 'Text');

// ---- 2. type 糖 ------------------------------------------------------------

push('type:primary', { prefixCls: PREFIX, type: 'primary' }, 'Text');
push('type:default', { prefixCls: PREFIX, type: 'default' }, 'Text');
push('type:dashed', { prefixCls: PREFIX, type: 'dashed' }, 'Text');
push('type:text', { prefixCls: PREFIX, type: 'text' }, 'Text');
push('type:link', { prefixCls: PREFIX, type: 'link' }, 'Text');

// ---- 3. danger（-dangerous vs -color-dangerous）----------------------------

push('danger:alone', { prefixCls: PREFIX, danger: true }, 'Text');
push('danger:primary', { prefixCls: PREFIX, type: 'primary', danger: true }, 'Text');
push('danger:dashed', { prefixCls: PREFIX, type: 'dashed', danger: true }, 'Text');
push('danger:text', { prefixCls: PREFIX, type: 'text', danger: true }, 'Text');
push('danger:false', { prefixCls: PREFIX, danger: false }, 'Text');
// ⚠️ 只给 color="danger"（不传 danger prop）⇒ 有 -color-dangerous、无 -dangerous
push('color:danger-only', { prefixCls: PREFIX, color: 'danger', variant: 'solid' }, 'Text');

// ---- 4. color / variant ---------------------------------------------------

push('color-variant:blue-solid', { prefixCls: PREFIX, color: 'blue', variant: 'solid' }, 'Text');
push('color-variant:cyan-filled', { prefixCls: PREFIX, color: 'cyan', variant: 'filled' }, 'Text');
push('color-variant:green-dashed', { prefixCls: PREFIX, color: 'green', variant: 'dashed' }, 'Text');
push('color-variant:gold-link', { prefixCls: PREFIX, color: 'gold', variant: 'link' }, 'Text');
// 只有 variant=solid ⇒ primary + solid
push('variant:solid-only', { prefixCls: PREFIX, variant: 'solid' }, 'Text');
// 只有 variant（非 solid）⇒ 落回 default/outlined
push('variant:filled-only', { prefixCls: PREFIX, variant: 'filled' }, 'Text');
// color+variant 压过 type/danger
push(
  'color-variant:over-type',
  { prefixCls: PREFIX, type: 'primary', danger: true, color: 'blue', variant: 'solid' },
  'Text',
);

// ---- 5. ghost --------------------------------------------------------------

push('ghost:primary', { prefixCls: PREFIX, type: 'primary', ghost: true }, 'Text');
push('ghost:default', { prefixCls: PREFIX, ghost: true }, 'Text');
push('ghost:dashed', { prefixCls: PREFIX, type: 'dashed', ghost: true }, 'Text');
// 无边框变体 + ghost ⇒ 不加 -background-ghost（并告警）
push('ghost:link', { prefixCls: PREFIX, type: 'link', ghost: true }, 'Text');
push('ghost:false', { prefixCls: PREFIX, type: 'primary', ghost: false }, 'Text');

// ---- 6. size / shape / block ----------------------------------------------

push('size:small', { prefixCls: PREFIX, size: 'small' }, 'Text');
push('size:middle', { prefixCls: PREFIX, size: 'middle' }, 'Text');
push('size:large', { prefixCls: PREFIX, size: 'large' }, 'Text');
push('shape:circle', { prefixCls: PREFIX, shape: 'circle', icon: ICON }, 'Text');
push('shape:round', { prefixCls: PREFIX, shape: 'round' }, 'Text');
push('shape:square', { prefixCls: PREFIX, shape: 'square' }, 'Text');
push('block', { prefixCls: PREFIX, block: true }, 'Text');

// ---- 7. icon ---------------------------------------------------------------

push('icon:with-text', { prefixCls: PREFIX, icon: ICON }, 'Text');
// 无 children ⇒ -icon-only
push('icon:only', { prefixCls: PREFIX, icon: ICON });
push('icon:placement-end', { prefixCls: PREFIX, icon: ICON, iconPlacement: 'end' }, 'Text');
// 已废弃的 iconPosition 仍然生效
push('icon:position-end', { prefixCls: PREFIX, icon: ICON, iconPosition: 'end' }, 'Text');

// ---- 8. loading（自定义图标形态，理由见文件头）-----------------------------

push('loading:custom-icon', { prefixCls: PREFIX, loading: { delay: 0, icon: LOADING_ICON } }, 'Text');
push('loading:custom-icon-only', {
  prefixCls: PREFIX,
  loading: { delay: 0, icon: LOADING_ICON },
});

// ---- 9. disabled（<button> vs <a> 两分支）----------------------------------

push('disabled:button', { prefixCls: PREFIX, disabled: true }, 'Text');
push('disabled:button-false', { prefixCls: PREFIX, disabled: false }, 'Text');
push('href:enabled', { prefixCls: PREFIX, href: 'https://example.com' }, 'Text');
push('href:disabled', { prefixCls: PREFIX, href: 'https://example.com', disabled: true }, 'Text');
push('href:target', { prefixCls: PREFIX, href: '#', target: '_blank' }, 'Text');

// ---- 10. className / 属性透传 ----------------------------------------------

push('class:className', { prefixCls: PREFIX, className: 'my-class' }, 'Text');
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' }, 'Text');
push('class:both', { prefixCls: PREFIX, className: 'a', rootClassName: 'b' }, 'Text');
push('attrs:passthrough', { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-btn' }, 'Text');

// ---- 11. 语义化 classNames / styles ----------------------------------------

push('semantic:classNames-root', { prefixCls: PREFIX, classNames: { root: 'cn-root' } }, 'Text');
push(
  'semantic:classNames-all',
  {
    prefixCls: PREFIX,
    icon: ICON,
    classNames: { root: 'cn-root', icon: 'cn-icon', content: 'cn-content' },
  },
  'Text',
);
push(
  'semantic:styles-all',
  {
    prefixCls: PREFIX,
    icon: ICON,
    styles: {
      root: { color: 'red' },
      icon: { opacity: '0.5' },
      content: { padding: '2px' },
    },
  },
  'Text',
);

// ---- 12. style 合并顺序 ----------------------------------------------------

// `style` 覆盖 `styles.root`
push(
  'style:style-over-root',
  { prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } },
  'Text',
);

// ---- 13. ConfigProvider ---------------------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

push('config:className', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { button: { className: 'cfg-class' } }),
});
push('config:classNames', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { button: { classNames: { root: 'cfg-root' } } }),
});
push('config:color-variant', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { button: { color: 'cyan', variant: 'filled' } }),
});
push('config:variant-solid-only', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { button: { variant: 'solid' } }),
});
push('config:shape', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { button: { shape: 'round' } }),
});
push('config:auto-insert-space-off', { prefixCls: PREFIX }, '确定', {
  wrap: (node) => withProvider(node, { button: { autoInsertSpace: false } }),
});
push('direction:rtl', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { direction: 'rtl' }),
});
push('size-context', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { componentSize: 'large' }),
});
push('disabled-context', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { componentDisabled: true }),
});

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/button.mjs 从 antd 6.6.4 的 Button 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/button.mjs',
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
    console.error('[compat:button] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/button.mjs');
    process.exit(1);
  }
  console.log(`[compat:button] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:button] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
