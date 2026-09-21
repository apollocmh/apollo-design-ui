#!/usr/bin/env node
/**
 * tests/compat/baseline/affix.mjs — 生成 antd 6.6.4 Affix 的 DOM 基线（机械 oracle）
 *
 * 与 `skeleton.mjs` 同一套路：构造用例、调用 React、写文件。
 *
 * ── ⚠️ 只放「未固钉」的静态形态 ────────────────────────────────────────────────
 *
 * `renderToStaticMarkup`（SSR）没有布局 ⇒ `getBoundingClientRect()` 全 0 ⇒
 * antd 的 Affix 在 SSR 里**永远不固钉**：不渲染占位层、固钉层**没有** `apollo-affix` 类名。
 * 这正好是可测的范围 —— 固钉态留给 L6/人工（`docs/analysis/affix.md` §8）。
 * **不要**往基线里塞「应该固钉」的用例：它不会固钉，只会产出一个「预期错位」的假基线。
 *
 * 运行：
 *   node tests/compat/baseline/affix.mjs
 *   node tests/compat/baseline/affix.mjs --check
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/affix.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Affix, ConfigProvider } = antd;

/** 两侧共用的前缀。⚠️ `getPrefixCls('affix','apollo')` **直接返回** `apollo`（不加后缀）。 */
const PREFIX = 'apollo';

const cases = [];
const push = (id, props, children) => {
  const node = children === undefined ? h(Affix, props) : h(Affix, props, children);
  cases.push({ id, html: renderToStaticMarkup(node) });
};

/** 默认子内容（两侧同形）。 */
const CHILD = () => h('span', null, 'X');

// ---- 1. 基础形态（SSR 恒不固钉）--------------------------------------------

push('basic', { prefixCls: PREFIX }, CHILD());
push('children:none', { prefixCls: PREFIX });

// ---- 2. 偏移（SSR 下不影响渲染结果，但钉住 props 透传不崩）--------------------

push('offset:top', { prefixCls: PREFIX, offsetTop: 64 }, CHILD());
push('offset:bottom', { prefixCls: PREFIX, offsetBottom: 64 }, CHILD());
push('offset:both', { prefixCls: PREFIX, offsetTop: 64, offsetBottom: 64 }, CHILD());
push('offset:zero', { prefixCls: PREFIX, offsetTop: 0 }, CHILD());

// ---- 3. 类名与样式 ----------------------------------------------------------

push('class:className', { prefixCls: PREFIX, className: 'my-class' }, CHILD());
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' }, CHILD());
push('style:passthrough', { prefixCls: PREFIX, style: { color: 'red' } }, CHILD());

// ---- 4. 属性透传（restProps 落在**外层**占位测量层）---------------------------

push('attrs:passthrough', { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-affix' }, CHILD());

// ---- 5. ConfigProvider ------------------------------------------------------

push('config:className', { prefixCls: PREFIX }, CHILD());
// ⚠️ antd 的 ConfigProvider 没有 `components.affix.className` 这种组件级配置入口
//    （Affix 只从 context 拿 getPrefixCls / getTargetContainer）。
//    所以这条与 `basic` 相同 —— 保留它是为了让消费侧的用例清单与基线一一对应。

const out = {
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const current = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : null;
  const same = current && JSON.stringify(current.cases) === JSON.stringify(cases);
  console.log(same ? '[compat:affix] ✅ 基线与用例一致' : '[compat:affix] ❌ 需要重新生成');
  process.exit(same ? 0 : 1);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(out, null, 2)}\n`);
console.log(`[compat:affix] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
