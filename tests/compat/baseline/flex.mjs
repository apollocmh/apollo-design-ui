#!/usr/bin/env node
/**
 * tests/compat/baseline/flex.mjs — 生成 antd 6.6.4 Flex 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `affix.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/flex/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 关于 prefixCls（关键，同 divider.mjs）────────────────────────────────────
 *
 * 给每个用例显式传 `prefixCls: 'apollo'`，两侧传同一个值，类名逐字比对。
 * 默认前缀（`apollo` vs `ant`）由 `prefix-cls:no-props` 单独覆盖（消费侧 allow 登记为 D6）。
 *
 * ⚠️ `keepStyle` 由**消费侧**决定（本文件只产原始 HTML）。Flex 的 `flex` / `gap`
 *    内联样式与 ConfigProvider 的 style 合并顺序是最容易写错的地方，
 *    消费侧会显式传 `keepStyle: true`。
 *
 * 运行：
 *   node tests/compat/baseline/flex.mjs
 *   node tests/compat/baseline/flex.mjs --check   # 只校验基线是否最新
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
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(__dirname, '../baselines/flex.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Flex, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

const push = (id, props, children, { wrap } = {}) => {
  const node = children === undefined ? h(Flex, props) : h(Flex, props, children);
  cases.push({ id, html: renderToStaticMarkup(wrap ? wrap(node) : node) });
};

const withText = { prefixCls: PREFIX };

// ---- 1. 基本形态 -----------------------------------------------------------

push('basic', withText, 'Content');
push('prefix-cls:custom', { prefixCls: 'custom' });
// 两侧都不传 prefixCls → antd 用 `ant-flex`、我们用 `apollo-flex`（D6）。
push('prefix-cls:no-props', {});
push('empty', { prefixCls: PREFIX }); // :empty 的 display:none 是 CSS 行为，DOM 上只是没有子节点

// ---- 2. 方向：orientation > vertical > context.vertical --------------------

push('vertical:true', { prefixCls: PREFIX, vertical: true }, 'Content');
push('orientation:vertical', { prefixCls: PREFIX, orientation: 'vertical' }, 'Content');
push('orientation:horizontal', { prefixCls: PREFIX, orientation: 'horizontal' }, 'Content');
push(
  'orientation:vertical+vertical:false',
  {
    prefixCls: PREFIX,
    orientation: 'vertical',
    vertical: false,
  },
  'Content',
);
push(
  'orientation:invalid+vertical:true',
  {
    prefixCls: PREFIX,
    orientation: 'left',
    vertical: true,
  },
  'Content',
);
// 三者都不传 → horizontal（无 -vertical 类）
push('orientation:unset', { prefixCls: PREFIX }, 'Content');

// ---- 3. wrap（true → 'wrap'；非法值无类名）---------------------------------

push('wrap:true', { prefixCls: PREFIX, wrap: true }, 'Content');
push('wrap:nowrap', { prefixCls: PREFIX, wrap: 'nowrap' }, 'Content');
push('wrap:wrap-reverse', { prefixCls: PREFIX, wrap: 'wrap-reverse' }, 'Content');
push('wrap:invalid', { prefixCls: PREFIX, wrap: 'invalid' }, 'Content');

// ---- 4. justify / align ----------------------------------------------------

push('justify:center', { prefixCls: PREFIX, justify: 'center' }, 'Content');
push('justify:flex-start', { prefixCls: PREFIX, justify: 'flex-start' }, 'Content');
push('justify:invalid', { prefixCls: PREFIX, justify: 'invalid' }, 'Content');
push('align:center', { prefixCls: PREFIX, align: 'center' }, 'Content');
push('align:flex-end', { prefixCls: PREFIX, align: 'flex-end' }, 'Content');
// 垂直且未传 align → -align-stretch
push('align:stretch-implicit-vertical', { prefixCls: PREFIX, vertical: true }, 'Content');
// 垂直但显式 align → 不加 -align-stretch
push(
  'align:explicit-align-vertical',
  { prefixCls: PREFIX, vertical: true, align: 'center' },
  'Content',
);
push('align:stretch-implicit-horizontal', { prefixCls: PREFIX }, 'Content');

// ---- 5. flex / gap（内联样式；keepStyle 侧消费）-----------------------------

push('flex:string', { prefixCls: PREFIX, flex: '2 2 100px' }, 'Content');
push('flex:number', { prefixCls: PREFIX, flex: 1 }, 'Content');
push('gap:small', { prefixCls: PREFIX, gap: 'small' }, 'Content');
push('gap:medium', { prefixCls: PREFIX, gap: 'medium' }, 'Content');
push('gap:middle', { prefixCls: PREFIX, gap: 'middle' }, 'Content');
push('gap:large', { prefixCls: PREFIX, gap: 'large' }, 'Content');
// 非预设 → 内联 gap；数字会被 React 补 px（dangerousStyleValue）
push('gap:number', { prefixCls: PREFIX, gap: 16 }, 'Content');
// ⭐ gap:0 也写内联 gap —— React 输出 '0px'（不是 '0'！对 gap 属性 0 会补单位？
//    以基线实测为准：这里**不预判**，基线就是 oracle）
push('gap:zero', { prefixCls: PREFIX, gap: 0 }, 'Content');
push('gap:string', { prefixCls: PREFIX, gap: '10px' }, 'Content');

// ---- 6. component / attrs 透传 ----------------------------------------------

push('component:section', { prefixCls: PREFIX, component: 'section' }, 'Content');
push('attrs:passthrough', { prefixCls: PREFIX, id: 'my-flex', 'data-testid': 'x' }, 'Content');
// justify/wrap/align 不透传 DOM（antd 的 omit）—— contract 投影下表现为属性缺失
push(
  'omit:justify-wrap-align',
  {
    prefixCls: PREFIX,
    justify: 'center',
    wrap: true,
    align: 'center',
  },
  'Content',
);

// ---- 7. ConfigProvider -----------------------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

// ctxFlex.className / ctxFlex.style
push('ctx:className+style', withText, 'Content', {
  wrap: (node) => withProvider(node, { flex: { className: 'ctx-cls', style: { padding: '8px' } } }),
});
// ctxFlex.vertical 全局配置回落（vertical 未传时生效）
push('ctx:vertical', withText, 'Content', {
  wrap: (node) => withProvider(node, { flex: { vertical: true } }),
});
// 显式 vertical:false 压过 context.vertical（布尔判据：typeof === 'boolean'）
push('ctx:vertical+vertical:false', { prefixCls: PREFIX, vertical: false }, 'Content', {
  wrap: (node) => withProvider(node, { flex: { vertical: true } }),
});
// direction:rtl → -rtl 类
push('ctx:rtl', withText, 'Content', {
  wrap: (node) => withProvider(node, { direction: 'rtl' }),
});
// style 合并顺序：ctx style 在前，prop style 覆盖
push('style:ctx+prop-override', { prefixCls: PREFIX, style: { margin: '2px' } }, 'Content', {
  wrap: (node) => withProvider(node, { flex: { style: { padding: '8px', margin: '4px' } } }),
});

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/flex.mjs 从 antd 6.6.4 的 Flex 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/flex.mjs',
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
    console.error('[compat:flex] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/flex.mjs');
    process.exit(1);
  }
  console.log(`[compat:flex] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:flex] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
