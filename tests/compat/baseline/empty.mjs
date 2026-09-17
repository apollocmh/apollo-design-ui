#!/usr/bin/env node
/**
 * tests/compat/baseline/empty.mjs — 生成 antd 6.6.4 Empty 的 DOM 基线（机械 oracle）
 *
 * 与 `icons.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/empty/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 为什么用 `renderToStaticMarkup` 而不是浏览器 ──────────────────────────────
 *
 * 图标那次证明了这条路够用：DOM 契约比的是**结构**，不需要布局与绘制
 * （那是 L6 视觉回归的事，用 Playwright）。纯 Node 渲染还顺带带来两个好处：
 * 确定性（无浏览器版本差异）与速度（毫秒级）。
 *
 * ── 关于 prefixCls（关键）─────────────────────────────────────────────────────
 *
 * antd 的默认前缀是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。
 * 本文件**给每个用例显式传 `prefixCls`**，两侧传同一个值 —— 于是类名可以逐字比对。
 *
 * 这比「先渲染成 ant- 再归一化替换成 apollo-」更强：后者会把
 * 「我们根本没读 prefixCls」这个 bug 一起归一化掉。
 * 默认前缀（`apollo`）由消费侧的最后一个 describe 单独覆盖。
 *
 * 运行：
 *   node tests/compat/baseline/empty.mjs
 *   node tests/compat/baseline/empty.mjs --check   # 只校验基线是否最新
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
const OUT_FILE = path.join(__dirname, '../baselines/empty.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Empty, ConfigProvider } = antd;

/**
 * 两侧共用的前缀。取值就是我们的默认值 —— 这样这一份基线同时覆盖了
 * 「类名结构」与「prefixCls 真的被读到了」两件事。
 */
const PREFIX = 'apollo';

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

/** 渲染一个 antd Empty（可选包一层 ConfigProvider）。 */
const render = (props, { wrap } = {}) => {
  const node = h(Empty, props);
  return renderToStaticMarkup(wrap ? wrap(node) : node);
};

const push = (id, props, options) => {
  cases.push({ id, html: render(props, options) });
};

// ---- 1. 基本形态 -----------------------------------------------------------

push('plain', { prefixCls: PREFIX });
push('plain:no-props', {}); // 走 antd 的默认前缀 ant —— 单独一条，用于确认基线确实受 prefixCls 影响
push('prefix-cls:custom', { prefixCls: 'custom' });

// ---- 2. description 的四条分支 --------------------------------------------
//
// ⚠️ 这四条覆盖的是最容易写错的地方：`des` 的取值判据（`!== undefined`）与
//    渲染判据（`isReactRenderable`）**不是同一个**。

push('description:string', { prefixCls: PREFIX, description: 'Nothing here' });
push('description:false', { prefixCls: PREFIX, description: false });
push('description:empty-string', { prefixCls: PREFIX, description: '' });
push('description:zero', { prefixCls: PREFIX, description: 0 });
push('description:node', {
  prefixCls: PREFIX,
  description: h('span', { className: 'desc-node' }, 'node'),
});

// ---- 3. image 的四条分支 ---------------------------------------------------

push('image:simple', {
  prefixCls: PREFIX,
  image: Empty.PRESENTED_IMAGE_SIMPLE,
});
push('image:default-explicit', {
  prefixCls: PREFIX,
  image: Empty.PRESENTED_IMAGE_DEFAULT,
});
push('image:string', {
  prefixCls: PREFIX,
  image: 'https://example.com/empty.png',
});
push('image:node', {
  prefixCls: PREFIX,
  image: h('div', { className: 'my-image' }, 'img'),
});

// ---- 4. footer（children）-------------------------------------------------

push('children:present', { prefixCls: PREFIX }, {});
// 单独构造：children 需要作为 createElement 的第三参传，不能走 props。
cases.push({
  id: 'children:button',
  html: renderToStaticMarkup(
    h(Empty, { prefixCls: PREFIX, description: 'Nothing' }, h('button', null, 'Create')),
  ),
});
cases.push({
  id: 'children:empty-array',
  html: renderToStaticMarkup(h(Empty, { prefixCls: PREFIX }, [])),
});

// ---- 5. className / rootClassName / style / 属性透传 ------------------------

push('class:className', { prefixCls: PREFIX, className: 'my-class' });
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' });
push('class:both', { prefixCls: PREFIX, className: 'a', rootClassName: 'b' });
push('attrs:passthrough', {
  prefixCls: PREFIX,
  'data-testid': 'x',
  id: 'my-empty',
});

// ---- 6. 语义化 classNames / styles ----------------------------------------

push('semantic:classNames-root', {
  prefixCls: PREFIX,
  classNames: { root: 'cn-root' },
});
push('semantic:classNames-all', {
  prefixCls: PREFIX,
  classNames: {
    root: 'cn-root',
    image: 'cn-image',
    description: 'cn-description',
    footer: 'cn-footer',
  },
});
cases.push({
  id: 'semantic:classNames-all-with-footer',
  html: renderToStaticMarkup(
    h(
      Empty,
      {
        prefixCls: PREFIX,
        classNames: {
          root: 'cn-root',
          image: 'cn-image',
          description: 'cn-description',
          footer: 'cn-footer',
        },
      },
      h('button', null, 'Create'),
    ),
  ),
});
push('semantic:styles-all', {
  prefixCls: PREFIX,
  styles: {
    root: { color: 'red' },
    image: { margin: '1px' },
    description: { padding: '2px' },
  },
});
// 函数式变体（裁决 `empty-semantic-fn` = B：支持，与 antd 完全对齐）
push('semantic:classNames-fn', {
  prefixCls: PREFIX,
  classNames: () => ({ root: 'fn-root' }),
});
push('semantic:styles-fn', {
  prefixCls: PREFIX,
  styles: () => ({ root: { color: 'blue' } }),
});

// ---- 7. imageStyle（废弃）与 styles.image 的合并顺序 ------------------------

push('style:imageStyle-only', {
  prefixCls: PREFIX,
  imageStyle: { margin: '3px' },
});
push('style:imageStyle-merged', {
  prefixCls: PREFIX,
  imageStyle: { margin: '3px', color: 'red' },
  styles: { image: { color: 'blue' } },
});
// `style` prop 覆盖 `styles.root` —— 合并顺序里最反直觉的一条
push('style:style-over-root', {
  prefixCls: PREFIX,
  style: { color: 'green' },
  styles: { root: { color: 'red' } },
});

// ---- 8. ConfigProvider 的 empty 配置 --------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

push(
  'config:image',
  { prefixCls: PREFIX },
  {
    wrap: (node) => withProvider(node, { empty: { image: 'https://example.com/cfg.png' } }),
  },
);
push(
  'config:className',
  { prefixCls: PREFIX },
  {
    wrap: (node) => withProvider(node, { empty: { className: 'cfg-class' } }),
  },
);
push(
  'config:classNames',
  { prefixCls: PREFIX },
  {
    wrap: (node) => withProvider(node, { empty: { classNames: { root: 'cfg-root' } } }),
  },
);

// ---- 9. RTL ---------------------------------------------------------------

push(
  'direction:rtl',
  { prefixCls: PREFIX },
  {
    wrap: (node) => withProvider(node, { direction: 'rtl' }),
  },
);

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/empty.mjs 从 antd 6.6.4 的 Empty 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/empty.mjs',
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
    console.error('[compat:empty] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/empty.mjs');
    process.exit(1);
  }
  console.log(`[compat:empty] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:empty] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
