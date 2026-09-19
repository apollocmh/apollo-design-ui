#!/usr/bin/env node
/**
 * tests/compat/baseline/space.mjs — 生成 antd 6.6.4 Space / Space.Compact /
 * Space.Addon 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `empty.mjs` 同一套路：**只做三件事** —— 构造用例、调用 React、
 * 写文件。中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/space/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 三个前缀，三组用例 ────────────────────────────────────────────────────────
 *
 *   Space         → `getPrefixCls('space', …)`        默认 `apollo-space`
 *   Space.Compact → `getPrefixCls('space-compact', …)` 默认 `apollo-space-compact`
 *   Space.Addon   → `getPrefixCls('space-addon', …)`   默认 `apollo-space-addon`
 *
 * 三者的后缀**都不一样**，而且 Addon 的紧凑类名长在它自己的前缀上
 * （`apollo-space-addon-compact-item`，不是 `-space-compact-item`）——
 * 这正是最容易照抄错的一处，所以三组用例都必须显式传 `prefixCls`。
 *
 * ── 为什么需要一个「探针」子组件 ────────────────────────────────────────────────
 *
 * `Space.Compact` 本身**不产生任何紧凑类名** —— 它只把
 * `compactSize` / `compactDirection` / `isFirstItem` / `isLastItem` 通过
 * `CompactItem` 广播出去，真正拼 `-compact-item` / `-compact-first-item` 的是
 * **下游组件自己**（Button / Input / Select…，共 10 个）。
 *
 * 那些下游组件在本次交付里都还不存在。若不引入探针，`Space.Compact` 的**全部**
 * 行为（首项/末项合取、嵌套、`NoCompactStyle` 隔离、`size` 继承）在基线里都是
 * 不可观测的 —— 比对会变成「两个空 div 相等」。
 *
 * 所以这里定义一个 `Probe`：它**只用公开 API**
 * （`useCompactItemContext`，就是那 10 个下游组件用的同一个函数）把上下文渲染成
 * 可比的类名。Vue 侧的 `semantic.test.ts` 里有一个**逐字对应**的探针。
 * 它不是「为测试特制的一条路径」—— 它就是下游组件的实现方式，只是没有样式。
 *
 * ── 为什么用 `antd/lib/space/Compact` 而不是 `antd/es/...` ─────────────────────
 *
 * 基线脚本是 CJS（`createRequire`）。`antd/es/**` 是 ESM 目录，Node 的 CJS
 * 解析器会报 `Directory import ... is not supported`。`antd/lib/**` 是 CJS 产物，
 * 与 `require('antd')` 同源（同一份源码的两份编译产物）。
 *
 * ── 关于 prefixCls（关键）─────────────────────────────────────────────────────
 *
 * antd 的默认前缀是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。
 * 本文件**给每个用例显式传 `prefixCls`**，两侧传同一个值 —— 于是类名可以逐字比对。
 * 默认前缀由 `prefix-cls:no-props` 单独覆盖（消费侧登记为 D6）。
 *
 * 运行：
 *   node tests/compat/baseline/space.mjs
 *   node tests/compat/baseline/space.mjs --check   # 只校验基线是否最新
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
const OUT_FILE = path.join(__dirname, '../baselines/space.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
// ⚠️ 必须是 `lib`（CJS）；`es` 是 ESM 目录，`require` 解析不了。理由见文件头。
const { useCompactItemContext, NoCompactStyle } = require('antd/lib/space/Compact');
const { Space, ConfigProvider } = antd;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

// ---------------------------------------------------------------------------
// 探针：把 `Space.Compact` 的上下文渲染成可比的类名
// ---------------------------------------------------------------------------

/**
 * 模拟一个下游紧凑组件（Button / Input / Select 的那一层）。
 *
 * 类名结构与它们完全一致 —— `{自己的前缀}-compact{item|first-item|last-item}`。
 * 前缀固定为 `probe`，与三组用例的前缀都不冲突，于是「探针拿到的类名」在
 * 差异里一眼可辨。
 *
 * `size` / `direction` 也渲染成类名（而不是 data 属性）：类名是 CSS 的落点，
 * 也是 L4 投影里**唯一**会被逐字比对的字符串通道。
 */
const Probe = ({ dir = 'ltr', tag = 'i' }) => {
  const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
    'probe',
    dir,
  );
  const classes = [
    'probe',
    `probe-size-${String(compactSize)}`,
    `probe-dir-${String(compactDirection)}`,
    compactItemClassnames,
  ]
    .filter(Boolean)
    .join(' ');
  return h(tag, { className: classes });
};

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

const push = (id, html) => {
  cases.push({ id, html });
};

/** `renderToStaticMarkup` 的结果直接进用例 —— 不做任何后处理。 */
const mark = (node) => renderToStaticMarkup(node);

/** Space 的 children 基底：两个 `<span>`。 */
const twoSpans = () => [h('span', { key: 'a' }, '1'), h('span', { key: 'b' }, '2')];

const renderSpace = (props, children) => {
  const kids = children === undefined ? twoSpans() : children;
  return mark(h(Space, { prefixCls: PREFIX, ...props }, kids));
};

const pushSpace = (id, props, children) => push(id, renderSpace(props, children));

// ---- 1. 基本形态 / 空 children ---------------------------------------------

pushSpace('plain', {});
pushSpace('empty:no-children', {}, []);
// React 的 `toArray(false, {keepEmpty: true})` 保留一个占位 ⇒ 仍然渲染根元素
pushSpace('empty:false-child', {}, [false]);
pushSpace('empty:null-child', {}, [null]);
// 文本子节点：`toArray` 把相邻字符串合并成一个（下游 Item 拿到的仍是字符串）
pushSpace('children:text', {}, ['text']);
pushSpace('children:text+element', {}, ['text1', h('span', { key: 's' }, 'text2')]);
// 相邻的裸文本会被 React 合并成一个 child
pushSpace('children:adjacent-text', {}, ['a', 'b']);
// `<Null/>`（组件本身渲染 null）**是**可渲染的 ⇒ 渲染出空的 `-item`
pushSpace('children:null-component', {}, [h(() => null)]);
// Fragment 展开成多个 child
pushSpace('children:fragment', {}, [
  h('span', { key: 's' }, 'text1'),
  h('span', { key: 't' }, 'text3'),
]);

push('prefix-cls:custom', renderSpace({ prefixCls: 'custom' }));
// 两侧都不传 prefixCls → antd 用 `ant-space`、我们用 `apollo-space`（D6）
push('prefix-cls:no-props', mark(h(Space, null, twoSpans())));

// ---- 2. 方向：orientation > vertical > direction ---------------------------
//
// 与上游 `index.test.tsx` 的 `orientation attribute` 的 5 个 testCases 逐条对齐。

const ORIENTATION_CASES = [
  ['unset-unset', undefined, undefined],
  ['unset-vertical', undefined, 'vertical'],
  ['vertical-horizontal', 'vertical', 'horizontal'],
  ['vertical-unset', 'vertical', undefined],
  ['horizontal-vertical', 'horizontal', 'vertical'],
];

for (const [id, orientation, direction] of ORIENTATION_CASES) {
  pushSpace(`orientation:${id}`, { orientation, direction });
}
pushSpace('vertical:true', { vertical: true });
pushSpace('vertical:false', { vertical: false });
// `vertical` 是布尔（哪怕 false）⇒ 压过 `direction`
pushSpace('direction:vertical+vertical:false', { direction: 'vertical', vertical: false });
pushSpace('orientation:vertical+vertical:false', { orientation: 'vertical', vertical: false });
pushSpace('orientation:unset+vertical:unset', {});

// ---- 3. align --------------------------------------------------------------

for (const align of ['start', 'end', 'center', 'baseline']) {
  pushSpace(`align:${align}`, { align });
}
// 水平时不传 ⇒ 折成 center
pushSpace('align:unset-horizontal', {});
// 垂直时不传 ⇒ 保持 undefined，**不产生** `-align-*` 类名
pushSpace('align:unset-vertical', { orientation: 'vertical' });
pushSpace('align:unset-vertical-legacy', { vertical: true });
// 垂直时显式传 align 仍然生效
pushSpace('align:center-vertical', { orientation: 'vertical', align: 'center' });

// ---- 4. size ---------------------------------------------------------------
//
// 四条路径：预设串 → 类名；非零数字 → 内联 gap；元组 → 两向分别取；
// `0` → 取用但不产生任何 gap（`isValidGapNumber` 的真值短路）。

for (const size of ['small', 'medium', 'middle', 'large']) {
  pushSpace(`size:${size}`, { size });
}
pushSpace('size:number', { size: 10 });
// ⚠️ 数字 0：`size ?? 'small'` 里 `0` 是**有效值**（不回落），但两条 gap 判据都为假
pushSpace('size:zero', { size: 0 });
// NaN：`isValidGapNumber(NaN)` 为假 ⇒ 无 gap（上游 `gap.test.tsx` 的 `should NaN work`）
pushSpace('size:nan', { size: [Number.NaN, Number.NaN] });
pushSpace('size:tuple-numbers', { size: [10, 20] });
pushSpace('size:tuple-preset', { size: ['small', 'large'] });
pushSpace('size:tuple-mixed', { size: [10, 'large'] });
pushSpace('size:tuple-reversed', { size: ['large', 'small'] });
// 负数：`isValidGapNumber` 只判 `typeof number && !Number.isNaN`，负数**通过**
pushSpace('size:negative', { size: -5 });
// 字符串数字：`isValidGapNumber` 要求 `typeof === 'number'` ⇒ 不产生 gap
pushSpace('size:numeric-string', { size: '10' });

// ---- 5. wrap ---------------------------------------------------------------

pushSpace('wrap:true', { wrap: true });
pushSpace('wrap:false', { wrap: false });
pushSpace('wrap:true+size-number', { wrap: true, size: 10 });

// ---- 6. separator / split --------------------------------------------------

pushSpace('separator:string', { separator: '-' }, ['a', 'b', 'c']);
pushSpace('separator:empty-string', { separator: '' }, ['a', 'b']);
pushSpace('separator:zero', { separator: 0 }, ['a', 'b']);
pushSpace('separator:element', { separator: h('b', null, '|') }, ['a', 'b']);
// 最后一个**有内容**的 item 之后没有分隔符 ⇒ 3 个孩子只有 2 个分隔符
pushSpace('separator:three-items', { separator: '-' }, ['a', 'b', 'c']);
// 不可渲染的孩子不参与 latestIndex
pushSpace('separator:with-null-child', { separator: '-' }, ['a', null, 'c']);
// `separator ?? split`：`separator=''` 不回落（`??` 而不是 `||`），且真值判据不渲染
pushSpace('separator:empty+split', { separator: '', split: '-' }, ['a', 'b']);
pushSpace('split:legacy', { split: '-' }, ['a', 'b']);
pushSpace('split:legacy+separator', { split: '|', separator: '-' }, ['a', 'b']);

// ---- 7. className / rootClassName / 属性透传 -------------------------------

pushSpace('class:className', { className: 'my-class' });
pushSpace('class:rootClassName', { rootClassName: 'root-class' });
pushSpace('class:both', { className: 'a', rootClassName: 'b' });
pushSpace('attrs:passthrough', { 'data-testid': 'x', id: 'my-space', title: 'tip' });

// ---- 8. 语义化 classNames / styles -----------------------------------------

pushSpace('semantic:classNames-all', {
  classNames: { root: 'cn-root', item: 'cn-item', separator: 'cn-sep' },
  separator: '-',
});
pushSpace('semantic:classNames-root', { classNames: { root: 'cn-root' } });
// 函数式：`info.props` 必须是**合并后**的 props（orientation / align / size）
pushSpace('semantic:classNames-fn', {
  orientation: 'vertical',
  classNames: (info) => ({
    root: `fn-${String(info.props.orientation)}-${String(info.props.align)}-${String(info.props.size)}`,
  }),
});
pushSpace('semantic:styles-all', {
  styles: {
    root: { color: 'red' },
    item: { color: 'green' },
    separator: { color: 'blue' },
  },
  separator: '-',
});
// 函数式 `styles` 只证明「函数形态被支持」；`info.props` 是合并后 props 这件事
// 由 `semantic:classNames-fn` 证明（类名不过 CSSOM 校验）。与 divider 同形。
pushSpace('semantic:styles-fn', {
  styles: () => ({ root: { color: 'blue' } }),
});

// ---- 9. style 合并顺序 -----------------------------------------------------
//
// antd：`style={{...gapStyle, ...mergedStyles.root}}`，而 `mergedStyles` 的来源顺序
// 是 `[contextStyles, contextStyleRoot, styles, styleRoot]` ⇒ `style` **覆盖**
// `styles.root`，且两者都覆盖 gapStyle。

pushSpace('style:style-over-root', {
  style: { color: 'green' },
  styles: { root: { color: 'red' } },
});
pushSpace('style:style-over-gap', { size: 10, style: { columnGap: '3px' } });
pushSpace('style:gap-only', { size: 10 });

// ---- 10. ConfigProvider ----------------------------------------------------

const withProvider = (node, config) =>
  mark(h(ConfigProvider, { prefixCls: PREFIX, ...config }, node));

push('config:size', withProvider(renderSpaceAsNode({}), { space: { size: 'large' } }));
// ⚠️ `space.size = 0`：`0 ?? 'small'` 取 `0` ⇒ 不产生 `-gap-*` 类名（上游有专门用例）
push('config:size-zero', withProvider(renderSpaceAsNode({}), { space: { size: 0 } }));
// prop 的 `size` 压过 ConfigProvider 的
push(
  'config:size+prop-size',
  withProvider(renderSpaceAsNode({ size: 'medium' }), { space: { size: 'large' } }),
);
push(
  'config:className',
  withProvider(renderSpaceAsNode({}), { space: { className: 'cfg-class' } }),
);
push(
  'config:classNames',
  withProvider(renderSpaceAsNode({}), { space: { classNames: { root: 'cfg-root' } } }),
);
push(
  'config:styles',
  withProvider(renderSpaceAsNode({}), { space: { styles: { root: { color: 'red' } } } }),
);
// ConfigProvider 的 `style` 排在 `styles` **之前** ⇒ prop 的 `style` 覆盖它
push(
  'config:style+prop-style',
  withProvider(renderSpaceAsNode({ style: { color: 'green' } }), {
    space: { style: { color: 'red' } },
  }),
);
// RTL：根元素多一个 `-rtl` 类名
push('direction:rtl', withProvider(renderSpaceAsNode({}), { direction: 'rtl' }));

/** 把「一个 Space 节点」而不是「它的 HTML」交给 ConfigProvider 包一层。 */
function renderSpaceAsNode(props, children) {
  return h(Space, { prefixCls: PREFIX, ...props }, children === undefined ? twoSpans() : children);
}

// ---- 11. Space.Compact -----------------------------------------------------

const { Compact, Addon } = Space;

const renderCompact = (props, children) =>
  mark(h(Compact, { prefixCls: `${PREFIX}-space-compact`, ...props }, children));

const probeChildren = () => [
  h(Probe, { key: 'p0' }),
  h(Probe, { key: 'p1' }),
  h(Probe, { key: 'p2' }),
];

push('compact:plain', renderCompact({}, probeChildren()));
push('compact:empty', renderCompact({}, []));
push('compact:prefix-custom', mark(h(Compact, { prefixCls: 'custom-compact' }, probeChildren())));
// 不传 prefixCls ⇒ `ant-space-compact`（D6）
push('compact:no-props', mark(h(Compact, null, probeChildren())));
push('compact:block', renderCompact({ block: true }, probeChildren()));
push('compact:orientation-vertical', renderCompact({ orientation: 'vertical' }, probeChildren()));
push('compact:direction-vertical', renderCompact({ direction: 'vertical' }, probeChildren()));
push('compact:vertical-false', renderCompact({ vertical: false }, probeChildren()));
push('compact:vertical-true', renderCompact({ vertical: true }, probeChildren()));
push(
  'compact:orientation+vertical',
  renderCompact({ orientation: 'vertical', vertical: false }, probeChildren()),
);
push('compact:class:className', renderCompact({ className: 'cc' }, probeChildren()));
push('compact:class:rootClassName', renderCompact({ rootClassName: 'cc-root' }, probeChildren()));
push('compact:style', renderCompact({ style: { color: 'red' } }, probeChildren()));
push('compact:attrs', renderCompact({ 'data-testid': 'c', id: 'my-compact' }, probeChildren()));
// size：探针把它渲染成 `probe-size-{size}`
push('compact:size-small', renderCompact({ size: 'small' }, probeChildren()));
push('compact:size-large', renderCompact({ size: 'large' }, probeChildren()));
// RTL：Compact 根多 `-rtl`，探针多 `-compact-item-rtl`
push(
  'compact:direction-rtl',
  withProvider(renderCompactAsNode({}, probeChildren()), { direction: 'rtl' }),
);
// ConfigProvider 的 `componentSize` 被 Compact 继承
push(
  'compact:config-component-size',
  withProvider(renderCompactAsNode({}, probeChildren()), { componentSize: 'large' }),
);
// Compact 自己的 `size` 压过 `componentSize`
push(
  'compact:config-component-size+size',
  withProvider(renderCompactAsNode({ size: 'small' }, probeChildren()), { componentSize: 'large' }),
);
// 单个子节点 ⇒ 它同时是首项与末项
push('compact:single-item', renderCompact({}, [h(Probe, { key: 'p0' })]));
// RTL 的探针：类名末尾多一个 `-item-rtl`（下游自己拼，与 Compact 的 `-rtl` 是两回事）
push('compact:probe-rtl', renderCompact({}, [h(Probe, { key: 'p0', dir: 'rtl' })]));
push(
  'compact:probe-rtl-vertical',
  renderCompact({ orientation: 'vertical' }, [h(Probe, { key: 'p0', dir: 'rtl' })]),
);
// ⚠️ `toArray(children)` **不带** `keepEmpty`（与 `Space` 相反）⇒ 假值子节点被丢弃，
// 既不占下标也不影响 `isLastItem`。
push('compact:false-child', renderCompact({}, [h(Probe, { key: 'p0' }), false]));
push('compact:null-child', renderCompact({}, [h(Probe, { key: 'p0' }), null]));
push('compact:only-false-child', renderCompact({}, [false]));

/** 把「一个 Compact 节点」而不是「它的 HTML」交给 ConfigProvider 包一层。 */
function renderCompactAsNode(props, children) {
  return h(Compact, { prefixCls: `${PREFIX}-space-compact`, ...props }, children);
}

// 嵌套：内层的首项只有在**外层也是首项**时才算首项（`i === 0 && (!ctx || ctx.isFirstItem)`）。
// 所以内层 Compact 整体作为外层的第 2 个孩子时，内层的「首项」不带 `-first-item`。
push(
  'compact:nested-not-first',
  renderCompact({}, [h(Probe, { key: 'p0' }), renderCompactAsNode({}, probeChildren())]),
);
push(
  'compact:nested-is-first',
  renderCompact({}, [renderCompactAsNode({}, probeChildren()), h(Probe, { key: 'p0' })]),
);
// 嵌套且方向不同：内层 vertical，外层 horizontal
push(
  'compact:nested-vertical',
  renderCompact({}, [
    h(Probe, { key: 'p0' }),
    renderCompactAsNode({ orientation: 'vertical' }, probeChildren()),
  ]),
);
// `NoCompactStyle` 把上下文重置为 `null` ⇒ 探针一个紧凑类名都不带
push(
  'compact:no-compact-style',
  renderCompact({}, [h(Probe, { key: 'p0' }), h(NoCompactStyle, { key: 'n' }, h(Probe))]),
);
// 探针在 Compact **外面** ⇒ 同样没有紧凑类名
push('compact:probe-outside', mark(h(Probe)));

// ---- 12. Space.Addon -------------------------------------------------------

const renderAddon = (props, children) =>
  mark(h(Addon, { prefixCls: `${PREFIX}-space-addon`, ...props }, children ?? 'Addon'));

push('addon:plain', renderAddon({}));
push('addon:prefix-custom', mark(h(Addon, { prefixCls: 'custom-addon' }, 'Addon')));
// 不传 prefixCls ⇒ `ant-space-addon`（D6）
push('addon:no-props', mark(h(Addon, null, 'Addon')));
for (const variant of ['outlined', 'borderless', 'filled', 'underlined']) {
  push(`addon:variant-${variant}`, renderAddon({ variant }));
}
for (const status of ['success', 'warning', 'error', 'validating', '']) {
  push(`addon:status-${status === '' ? 'empty' : status}`, renderAddon({ status }));
}
push('addon:disabled', renderAddon({ disabled: true }));
push('addon:disabled+status-error', renderAddon({ disabled: true, status: 'error' }));
push('addon:class:className', renderAddon({ className: 'my-addon' }));
push('addon:style', renderAddon({ style: { color: 'red' } }));
push('addon:attrs', renderAddon({ 'data-testid': 'a', id: 'my-addon' }));
push('addon:children-element', renderAddon({}, h('span', null, 'Addon')));
// ⚠️ 紧凑类名长在 **Addon 自己的前缀** 上：`apollo-space-addon-compact-item`
push(
  'addon:inside-compact',
  renderCompact({}, [
    h(Addon, { key: 'a0', prefixCls: `${PREFIX}-space-addon` }, 'A0'),
    h(Addon, { key: 'a1', prefixCls: `${PREFIX}-space-addon` }, 'A1'),
  ]),
);
push(
  'addon:inside-compact-vertical',
  renderCompact({ orientation: 'vertical' }, [
    h(Addon, { key: 'a0', prefixCls: `${PREFIX}-space-addon` }, 'A0'),
    h(Addon, { key: 'a1', prefixCls: `${PREFIX}-space-addon` }, 'A1'),
  ]),
);
// size 类名（`-small` / `-large`）来自 Compact 广播的 `compactSize`
push(
  'addon:inside-compact-size',
  renderCompact({ size: 'small' }, [
    h(Addon, { key: 'a0', prefixCls: `${PREFIX}-space-addon` }, 'A0'),
    h(Addon, { key: 'a1', prefixCls: `${PREFIX}-space-addon` }, 'A1'),
  ]),
);
// Addon 在 Compact 外面 ⇒ 没有紧凑类名，也没有 size 类名
push('addon:outside-compact', renderAddon({}));

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/space.mjs 从 antd 6.6.4 的 Space / Space.Compact / Space.Addon 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/space.mjs',
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
    console.error('[compat:space] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/space.mjs');
    process.exit(1);
  }
  console.log(`[compat:space] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:space] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
