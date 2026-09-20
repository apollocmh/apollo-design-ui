#!/usr/bin/env node
/**
 * tests/compat/baseline/typography.mjs — 生成 antd 6.6.4 Typography 的 DOM 基线（机械 oracle）
 *
 * 与 `divider.mjs` / `spin.mjs` / `empty.mjs` 同一套路：**只做三件事** ——
 * 构造用例、调用 React、写文件。中间不经过任何「理解」步骤。归一化与比对在消费侧
 * （`packages/ui/src/typography/__tests__/semantic.test.ts`）完成，且必须**对称**。
 *
 * ── 关于 prefixCls ────────────────────────────────────────────────────────────
 *
 * antd 的默认前缀是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。
 * 本文件给每个用例显式传 `prefixCls: 'apollo'`，两侧传同一个值 —— 于是类名可以逐字比对。
 *
 * ⚠️ `getPrefixCls('typography', 'apollo')` **直接返回** `apollo`（不加 `-typography`
 *    后缀）—— 这是 antd 的 `defaultGetPrefixCls` 行为，两侧一致。所以基线里的类名是
 *    `apollo` / `apollo-danger` / `apollo-ellipsis` / `apollo-actions` 这种形态。
 *
 * ── 两类**必须**放在一起看的用例 ───────────────────────────────────────────────
 *
 *   1. **七个装饰的嵌套顺序**（`strong → u → del → code → mark → kbd → i`）。
 *      顺序错了「看起来一样」，但 DOM 契约会红。
 *   2. **`-link` 的判据是 `component === 'a'`**，不是「有没有 `type`」——
 *      所以 `Link type="danger"` 同时有 `-danger` 与 `-link`。
 *
 * ── 为什么**没有** `ellipsis` 的 JS 测量用例（`suffix` / `onEllipsis` / `expandable`）──
 *
 * 基线走 `renderToStaticMarkup`，**没有 effect**：antd 的 `cssEllipsis` 初值是
 * `mergedEnableEllipsis`（`true`），于是 SSR 会输出 `-ellipsis-single-line`；
 * 而 Vue 侧是**挂载后**渲染，`needMeasureEllipsis` 为真时 `cssEllipsis` 会被 effect
 * 置成 `false`，类名消失。这是「SSR 快照 vs 挂载后快照」的通道差异，不是组件行为差异 ——
 * 把它写进基线只会得到一条永远需要豁免的噪音。
 *
 * 那条路径由 L1/L2（`index.test.ts` 的 JS 二分裁剪用例）与 L6（真实浏览器）覆盖。
 * 这里只放**纯 CSS 路径**的 `ellipsis` 用例（`true` / `{rows: n}` / `{tooltip}`）——
 * 它们的类名在 SSR 与挂载后**相同**，是真正的契约。
 *
 * 运行：
 *   node tests/compat/baseline/typography.mjs
 *   node tests/compat/baseline/typography.mjs --check   # 只校验基线是否最新
 *
 * React 与 antd 只允许出现在本目录（tests/compat）下，
 * 见 tests/compat/README.md §7 与 TESTING.md 反模式 A9。
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Fragment, createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUT_FILE = path.join(__dirname, '../baselines/typography.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const antdPkg = require('antd/package.json');
const { Typography, ConfigProvider } = antd;
const { Text, Title, Paragraph, Link } = Typography;

/** 两侧共用的前缀。取值就是我们的默认前缀。 */
const PREFIX = 'apollo';

/** 长文本：用来让 `ellipsis` 的 CSS 路径有意义（长度本身不影响 SSR 结构）。 */
const LONG =
  'Ant Design, a design language for background applications, is refined by Ant UED Team.';

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];

const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

/** `prefixCls` 的默认基底。 */
const base = { prefixCls: PREFIX };

/** 带默认插槽的构造。 */
const withChildren = (Component, props, children) => h(Component, props, children);

// ---- 1. Typography 本体 ----------------------------------------------------

push('typography:default', h(Typography, base, 'Text'));
push('typography:component-section', h(Typography, { ...base, component: 'section' }, 'Text'));
// 本体**不支持** type / ellipsis / strong —— 传了也不会有类名（antd 的形状）
push(
  'typography:unsupported-props',
  h(Typography, { ...base, type: 'danger', ellipsis: true, strong: true }, 'Text'),
);
push('typography:class-both', h(Typography, { ...base, className: 'a', rootClassName: 'b' }, 'x'));
push('typography:attrs-passthrough', h(Typography, { ...base, id: 'my-typo' }, 'x'));
push(
  'typography:style-over-root',
  h(Typography, { ...base, style: { color: 'green' }, styles: { root: { color: 'red' } } }, 'x'),
);
push('typography:no-style', h(Typography, base, 'x'));

// ---- 2. Text · 标签与语义色 ------------------------------------------------

push('text:default', withChildren(Text, base, 'Text'));
push('text:type-secondary', withChildren(Text, { ...base, type: 'secondary' }, 'Text'));
push('text:type-success', withChildren(Text, { ...base, type: 'success' }, 'Text'));
push('text:type-warning', withChildren(Text, { ...base, type: 'warning' }, 'Text'));
push('text:type-danger', withChildren(Text, { ...base, type: 'danger' }, 'Text'));
push('text:disabled', withChildren(Text, { ...base, disabled: true }, 'Text'));
push('text:disabled+danger', withChildren(Text, { ...base, disabled: true, type: 'danger' }, 'T'));
// Text 显式覆盖 `component` 为 span（哪怕用户传 a）
push('text:component-a', withChildren(Text, { ...base, component: 'a' }, 'Text'));

// ---- 3. 七个装饰 · 单个 + 嵌套顺序 -----------------------------------------

push('text:strong', withChildren(Text, { ...base, strong: true }, 'x'));
push('text:underline', withChildren(Text, { ...base, underline: true }, 'x'));
push('text:delete', withChildren(Text, { ...base, delete: true }, 'x'));
push('text:code', withChildren(Text, { ...base, code: true }, 'x'));
push('text:mark', withChildren(Text, { ...base, mark: true }, 'x'));
push('text:keyboard', withChildren(Text, { ...base, keyboard: true }, 'x'));
push('text:italic', withChildren(Text, { ...base, italic: true }, 'x'));
// ★ 全部打开 ⇒ 顺序契约：strong → u → del → code → mark → kbd → i（strong 最内、i 最外）
push(
  'text:decorations-all',
  withChildren(
    Text,
    {
      ...base,
      strong: true,
      underline: true,
      delete: true,
      code: true,
      mark: true,
      keyboard: true,
      italic: true,
    },
    'x',
  ),
);
// 只开相邻两层：mark 包 code（顺序反了会变成 code 包 mark）
push('text:mark+code', withChildren(Text, { ...base, code: true, mark: true }, 'x'));
push('text:strong+underline', withChildren(Text, { ...base, strong: true, underline: true }, 'x'));

// ---- 4. Title --------------------------------------------------------------

push('title:default', withChildren(Title, base, 'Title'));
push('title:level-2', withChildren(Title, { ...base, level: 2 }, 'T'));
push('title:level-3', withChildren(Title, { ...base, level: 3 }, 'T'));
push('title:level-4', withChildren(Title, { ...base, level: 4 }, 'T'));
push('title:level-5', withChildren(Title, { ...base, level: 5 }, 'T'));
// ★ 非法 level 退回 h1（不是 h6，也不是不渲染）
push('title:level-invalid', withChildren(Title, { ...base, level: 6 }, 'T'));
push('title:level-zero', withChildren(Title, { ...base, level: 0 }, 'T'));
// strong 不在 TitleProps 里，但运行时仍透传（上游的 `{...restProps}` 形状）
push('title:strong-passthrough', withChildren(Title, { ...base, strong: true }, 'T'));
push('title:type-danger', withChildren(Title, { ...base, type: 'danger' }, 'T'));

// ---- 5. Paragraph ----------------------------------------------------------

push('paragraph:default', withChildren(Paragraph, base, 'P'));
push('paragraph:type-danger', withChildren(Paragraph, { ...base, type: 'danger' }, 'P'));

// ---- 6. Link ---------------------------------------------------------------

push('link:default', withChildren(Link, { ...base, href: 'https://x' }, 'L'));
// ★ `-link` 的判据是 component === 'a' ⇒ 这里同时有 -danger 与 -link
push('link:type-danger', withChildren(Link, { ...base, href: 'https://x', type: 'danger' }, 'L'));
// target=_blank 且未传 rel ⇒ 补 noopener noreferrer
push(
  'link:target-blank',
  withChildren(Link, { ...base, href: 'https://x', target: '_blank' }, 'L'),
);
// 显式传 rel ⇒ 不补（判据是 === undefined，不是真值）
push(
  'link:rel-explicit',
  withChildren(Link, { ...base, href: 'https://x', target: '_blank', rel: 'me' }, 'L'),
);
// 显式传 rel="" ⇒ 也**不**补（用户显式关掉反向链接保护是允许的）
push(
  'link:rel-empty',
  withChildren(Link, { ...base, href: 'https://x', target: '_blank', rel: '' }, 'L'),
);
push('link:underline', withChildren(Link, { ...base, href: 'https://x', underline: true }, 'L'));

// ---- 7. copyable -----------------------------------------------------------

push('copyable:true', withChildren(Text, { ...base, copyable: true }, 'copy me'));
push('copyable:icon-false', withChildren(Text, { ...base, copyable: { icon: false } }, 'copy me'));
// tooltips: false ⇒ 不包 Tooltip（`needDom` 为假的分支）
push(
  'copyable:tooltips-false',
  withChildren(Text, { ...base, copyable: { tooltips: false } }, 'copy me'),
);
// 无内容 ⇒ 仅图标模式（`-copy-icon-only`）
push('copyable:no-content', h(Text, { ...base, copyable: true }));

// ---- 8. editable -----------------------------------------------------------

push('editable:true', withChildren(Text, { ...base, editable: true }, 'Edit me'));
push(
  'editable:trigger-icon',
  withChildren(Text, { ...base, editable: { triggerType: ['icon'] } }, 'E'),
);
// triggerType 不含 icon ⇒ 不渲染编辑按钮
push(
  'editable:trigger-text',
  withChildren(Text, { ...base, editable: { triggerType: ['text'] } }, 'E'),
);
push('editable:tab-index', withChildren(Text, { ...base, editable: { tabIndex: 3 } }, 'E'));

// ---- 9. actions.placement --------------------------------------------------

push(
  'actions:placement-start',
  withChildren(Text, { ...base, copyable: true, actions: { placement: 'start' } }, 'copy me'),
);
push(
  'actions:placement-end',
  withChildren(Text, { ...base, copyable: true, actions: { placement: 'end' } }, 'copy me'),
);

// ---- 10. ellipsis（**只放 CSS 路径**，理由见文件头）-------------------------

push('ellipsis:true', withChildren(Text, { ...base, ellipsis: true }, LONG));
push('ellipsis:rows-1', withChildren(Paragraph, { ...base, ellipsis: { rows: 1 } }, LONG));
push('ellipsis:rows-2', withChildren(Paragraph, { ...base, ellipsis: { rows: 2 } }, LONG));
push('ellipsis:rows-3', withChildren(Paragraph, { ...base, ellipsis: { rows: 3 } }, LONG));
push('ellipsis:false', withChildren(Text, { ...base, ellipsis: false }, LONG));
// `tooltip` 单独存在**不**触发 JS 测量（它不是 needMeasureEllipsis 的判据）⇒ CSS 路径
push('ellipsis:tooltip', withChildren(Text, { ...base, ellipsis: { tooltip: true } }, LONG));
// Text 会把 rows 剥掉 ⇒ 永远单行
push('ellipsis:text-rows-stripped', withChildren(Text, { ...base, ellipsis: { rows: 3 } }, LONG));

// ---- 11. className / rootClassName / 属性透传 ------------------------------

push('class:className', withChildren(Text, { ...base, className: 'my-class' }, 'x'));
push('class:rootClassName', withChildren(Text, { ...base, rootClassName: 'root-class' }, 'x'));
push('class:both', withChildren(Text, { ...base, className: 'a', rootClassName: 'b' }, 'x'));
push('attrs:passthrough', withChildren(Text, { ...base, id: 'my-text' }, 'x'));
push('attrs:title', withChildren(Text, { ...base, title: 'hover me' }, 'x'));

// ---- 12. 语义化 classNames / styles ---------------------------------------

push(
  'semantic:classNames-root',
  withChildren(Text, { ...base, classNames: { root: 'cn-root' } }, 'x'),
);
push(
  'semantic:classNames-all',
  withChildren(
    Text,
    {
      ...base,
      copyable: true,
      classNames: { root: 'cn-root', actions: 'cn-actions', action: 'cn-action' },
    },
    'x',
  ),
);
// 函数式：info.props 是**合并后**的 props（prefixCls 是解析后的 `apollo`）
push(
  'semantic:classNames-fn',
  withChildren(
    Text,
    {
      ...base,
      classNames: (info) => ({
        root: `fn-${String(info.props.prefixCls)}-${String(info.props.type)}`,
      }),
    },
    'x',
  ),
);
push(
  'semantic:styles-all',
  withChildren(
    Text,
    {
      ...base,
      copyable: true,
      styles: { root: { color: 'red' }, actions: { opacity: '0.5' }, action: { padding: '2px' } },
    },
    'x',
  ),
);
push(
  'semantic:styles-fn',
  withChildren(Text, { ...base, styles: () => ({ root: { color: 'blue' } }) }, 'x'),
);

// ---- 13. style 合并顺序 ----------------------------------------------------

// `style` 覆盖 `styles.root`（InternalTypography 里 `{...styles.root, ...style}`）
push(
  'style:style-over-root',
  withChildren(
    Text,
    { ...base, style: { color: 'green' }, styles: { root: { color: 'red' } } },
    'x',
  ),
);
// 多行省略时 `style` 与 `WebkitLineClamp` 并存
push(
  'style:with-line-clamp',
  withChildren(Paragraph, { ...base, style: { color: 'green' }, ellipsis: { rows: 2 } }, LONG),
);

// ---- 14. ConfigProvider ----------------------------------------------------

const withProvider = (node, config) => h(ConfigProvider, { prefixCls: PREFIX, ...config }, node);

push(
  'config:className',
  withProvider(withChildren(Text, base, 'x'), { typography: { className: 'cfg-class' } }),
);
push(
  'config:classNames',
  withProvider(withChildren(Text, base, 'x'), { typography: { classNames: { root: 'cfg-root' } } }),
);
push(
  'config:style',
  withProvider(withChildren(Text, base, 'x'), { typography: { style: { color: 'purple' } } }),
);
push('direction:rtl', withProvider(withChildren(Text, base, 'x'), { direction: 'rtl' }));

// ---- 15. 多个子组件并列（一棵树里的相对结构）-------------------------------

push(
  'composite:family',
  h(
    Fragment,
    null,
    h(Title, { ...base, level: 2 }, 'T'),
    h(Paragraph, { ...base, type: 'secondary' }, 'P'),
    h(Text, { ...base, strong: true, mark: true }, 'S'),
    h(Link, { ...base, href: 'https://x' }, 'L'),
  ),
);

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/typography.mjs 从 antd 6.6.4 的 Typography 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/typography.mjs',
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
    console.error('[compat:typography] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/typography.mjs');
    process.exit(1);
  }
  console.log(`[compat:typography] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:typography] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, OUT_FILE)}`);
