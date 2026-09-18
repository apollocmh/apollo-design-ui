#!/usr/bin/env node
/**
 * tests/compat/baseline/divider.mjs — 生成 antd 6.6.4 Divider 的 DOM 基线（机械 oracle）
 *
 * 与 `empty.mjs` / `icons.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、写文件。
 * 中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/divider/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 为什么用 `renderToStaticMarkup` ────────────────────────────────────────────
 *
 * DOM 契约比的是**结构**，不需要布局与绘制（那是 L6 用 Playwright 的事）。
 * 纯 Node 渲染带来确定性与速度，且与 Vue 侧的 `mount()` 产物可直接对照。
 *
 * ── 关于 prefixCls（关键）─────────────────────────────────────────────────────
 *
 * antd 的默认前缀是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。
 * 本文件**给每个用例显式传 `prefixCls`**，两侧传同一个值 —— 于是类名可以逐字比对。
 * 这比「先渲染成 ant- 再归一化替换」更强：后者会把「我们根本没读 prefixCls」这个 bug
 * 一起归一化掉。默认前缀（`apollo`）由 `prefix-cls:no-props` 单独覆盖。
 *
 * ⚠️ 传 `prefixCls="apollo"` 时 `getPrefixCls('divider', 'apollo')` **直接返回** `apollo`
 *    （不加 `-divider` 后缀）—— 这是 antd 的 `defaultGetPrefixCls` 行为，两侧一致。
 *
 * 运行：
 *   node tests/compat/baseline/divider.mjs
 *   node tests/compat/baseline/divider.mjs --check   # 只校验基线是否最新
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
const OUT_FILE = path.join(__dirname, '../baselines/divider.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Divider, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

/** 渲染一个 antd Divider（可选 children / 可选包一层 ConfigProvider）。 */
const render = (props, children, { wrap } = {}) => {
  const node = children === undefined ? h(Divider, props) : h(Divider, props, children);
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
push('prefix-cls:custom', { prefixCls: 'custom' });
// 两侧都不传 prefixCls → antd 用 `ant-divider`、我们用 `apollo-divider`。
// 这条刻意把「默认值不同」钉成断言（消费侧的 allow 里登记为 D6）。
push('prefix-cls:no-props', {});

// ---- 2. 方向：orientation > vertical > type --------------------------------

push('orientation:horizontal', { prefixCls: PREFIX, orientation: 'horizontal' });
push('orientation:vertical', { prefixCls: PREFIX, orientation: 'vertical' });
push('vertical:true', { prefixCls: PREFIX, vertical: true });
push('vertical:false', { prefixCls: PREFIX, vertical: false });
// orientation 合法 → 压过 vertical
push('vertical:true+orientation:horizontal', {
  prefixCls: PREFIX,
  vertical: true,
  orientation: 'horizontal',
});
push('type:vertical', { prefixCls: PREFIX, type: 'vertical' });
push('type:horizontal', { prefixCls: PREFIX, type: 'horizontal' });
// vertical 是布尔（哪怕 false）→ 压过 type
push('type:vertical+vertical:false', { prefixCls: PREFIX, type: 'vertical', vertical: false });
push('orientation:vertical+type:horizontal', {
  prefixCls: PREFIX,
  orientation: 'vertical',
  type: 'horizontal',
});
// 三者都不传 → horizontal
push('orientation:unset', { prefixCls: PREFIX });
// orientation 取「标题位置」的值 → 方向退回 horizontal，同时它是旧版标题位置
push('orientation:left', { prefixCls: PREFIX, orientation: 'left' }, 'Text');
// vertical + children：children 不渲染（并告警）
push('vertical:true+with-text', { prefixCls: PREFIX, vertical: true }, 'Text');

// ---- 3. titlePlacement ----------------------------------------------------

push('titlePlacement:center', { prefixCls: PREFIX, titlePlacement: 'center' }, 'Text');
push('titlePlacement:start', { prefixCls: PREFIX, titlePlacement: 'start' }, 'Text');
push('titlePlacement:end', { prefixCls: PREFIX, titlePlacement: 'end' }, 'Text');
// left / right 在 ltr 下折成 start / end
push('titlePlacement:left', { prefixCls: PREFIX, titlePlacement: 'left' }, 'Text');
push('titlePlacement:right', { prefixCls: PREFIX, titlePlacement: 'right' }, 'Text');

// ---- 4. orientationMargin（废弃）-------------------------------------------

push(
  'orientation-margin:number+start',
  { prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: 20 },
  'Text',
);
push(
  'orientation-margin:string+end',
  { prefixCls: PREFIX, titlePlacement: 'end', orientationMargin: '10' },
  'Text',
);
// center 时不生效（hasMarginStart / hasMarginEnd 都为假）
push(
  'orientation-margin:number+center',
  { prefixCls: PREFIX, titlePlacement: 'center', orientationMargin: 20 },
  'Text',
);
// 非数字字符串原样透传（不转 px）
push(
  'orientation-margin:non-numeric+start',
  { prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: '2em' },
  'Text',
);
// 数值 0：React 的 dangerousStyleValue 对 0 **不补** px（输出 `0`）——
// 这条用例把「我们补 px 的规则」钉成与 React 一致。
push(
  'orientation-margin:zero+start',
  { prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: 0 },
  'Text',
);

// ---- 5. dashed / variant --------------------------------------------------

push('dashed', { prefixCls: PREFIX, dashed: true });
push('dashed:with-text', { prefixCls: PREFIX, dashed: true }, 'Text');
push('variant:dashed', { prefixCls: PREFIX, variant: 'dashed' });
push('variant:dotted', { prefixCls: PREFIX, variant: 'dotted' });
push('variant:dotted:with-text', { prefixCls: PREFIX, variant: 'dotted' }, 'Text');
push('variant:solid', { prefixCls: PREFIX, variant: 'solid' });

// ---- 6. plain -------------------------------------------------------------

push('plain:true', { prefixCls: PREFIX, plain: true }, 'Text');

// ---- 7. size --------------------------------------------------------------

push('size:small', { prefixCls: PREFIX, size: 'small' });
push('size:medium', { prefixCls: PREFIX, size: 'medium' });
push('size:middle', { prefixCls: PREFIX, size: 'middle' });
push('size:large', { prefixCls: PREFIX, size: 'large' });

// ---- 8. className / rootClassName / 属性透传 -------------------------------

push('class:className', { prefixCls: PREFIX, className: 'my-class' });
push('class:rootClassName', { prefixCls: PREFIX, rootClassName: 'root-class' });
push('class:both', { prefixCls: PREFIX, className: 'a', rootClassName: 'b' });
push('attrs:passthrough', { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-divider' });

// ---- 9. 语义化 classNames / styles -----------------------------------------

push('semantic:classNames-root', { prefixCls: PREFIX, classNames: { root: 'cn-root' } }, 'Text');
push(
  'semantic:classNames-all',
  { prefixCls: PREFIX, classNames: { root: 'cn-root', rail: 'cn-rail', content: 'cn-content' } },
  'Text',
);
// 无 children：rail 语义类名落到**根元素**上
push('semantic:classNames-rail-no-children', {
  prefixCls: PREFIX,
  classNames: { root: 'cn-root', rail: 'cn-rail' },
});
// 函数式：info.props 收到的是**合并后**的 props（orientation / titlePlacement / size）
push(
  'semantic:classNames-fn',
  {
    prefixCls: PREFIX,
    titlePlacement: 'left',
    classNames: (info) => ({
      root: `fn-${String(info.props.titlePlacement)}-${String(info.props.orientation)}`,
    }),
  },
  'Text',
);
push(
  'semantic:styles-all',
  {
    prefixCls: PREFIX,
    styles: { root: { color: 'red' }, rail: { opacity: '0.5' }, content: { padding: '2px' } },
  },
  'Text',
);
// ⚠️ 函数式 `styles` 只证明「函数形态被支持」，**不**用它去读 `info.props`。
//
// 原因：`info.props.prefixCls` 的值是 `'apollo'`，而 `color: apollo` 不是合法颜色 ——
// React 的 `renderToStaticMarkup` 直出字符串会原样保留，但 Vue 侧走 jsdom 的
// `CSSStyleDeclaration`，cssstyle 会**静默丢弃**非法值（实测 jsdom 30：
// `style.color = 'apollo'` → `getAttribute('style') === null`）。于是差异来自
// 「直出字符串 vs CSSOM 序列化」这条夹具通道，而不是组件行为。
//
// `info.props` 是**合并后**的 props 这件事由 `semantic:classNames-fn` 证明
// （类名不过 CSSOM 校验，可以放心承载任意探针值）。与 empty 的 `semantic:styles-fn`
// 保持同一形态。
push(
  'semantic:styles-fn',
  { prefixCls: PREFIX, styles: () => ({ root: { color: 'blue' } }) },
  'Text',
);

// ---- 10. style 合并顺序 ----------------------------------------------------

// `style` 覆盖 `styles.root`（合并顺序里最反直觉的一条）
push(
  'style:style-over-root',
  { prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } },
  'Text',
);
// 无 children 时根元素额外吃到 `styles.rail`
push('style:root-rail-merge', {
  prefixCls: PREFIX,
  styles: { rail: { margin: '4px' } },
});
// 无 children 且 styles.rail 有值 → 根元素同时有 root 与 rail 的样式
push('style:root-rail-merge-both', {
  prefixCls: PREFIX,
  styles: { root: { color: 'blue' }, rail: { margin: '4px' } },
});

// ---- 11. ConfigProvider ---------------------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

push('config:className', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { divider: { className: 'cfg-class' } }),
});
push('config:classNames', { prefixCls: PREFIX }, 'Text', {
  wrap: (node) => withProvider(node, { divider: { classNames: { root: 'cfg-root' } } }),
});
// RTL 下 left/right 折成 start/end 的方向互换
push('direction:rtl+titlePlacement:left', { prefixCls: PREFIX, titlePlacement: 'left' }, 'Text', {
  wrap: (node) => withProvider(node, { direction: 'rtl' }),
});

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/divider.mjs 从 antd 6.6.4 的 Divider 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/divider.mjs',
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
    console.error('[compat:divider] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/divider.mjs');
    process.exit(1);
  }
  console.log(`[compat:divider] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:divider] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
