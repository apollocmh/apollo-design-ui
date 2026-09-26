/**
 * 临时脚本：React SSR + cssinjs extractStyle，把 antd Modal / Modal.confirm 的真实 CSS 产物
 * **机械转换**为本仓的静态样式（不做人肉转写）。
 *
 * 覆盖面（决定 style/index.ts 的选择器集合）：
 *   1. `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）普通面板 + 5 种 confirm 形态
 *      ⇒ `-pure-panel` / `-container` / `-header` / `-title` / `-body` / `-footer` / `-close`
 *        / `-confirm-*`
 *   2. 内联打开的 `<Modal open getContainer={false} centered loading width={对象}>`
 *      + ConfigProvider 的 `direction: 'rtl'`（逼出 `-wrap-rtl`）
 *      ⇒ `-root` / `-wrap` / `-mask` / `-mask-blur` / `-mask-hidden` / `-centered` /
 *        `-body-skeleton` / 响应式 `--ant-modal-{bp}-width` / zoom + fade 动效
 *
 * 转换规则（与 drawer / dropdown / tooltip 同款）：
 *   1. 去掉 `:where(.css-dev-only-do-not-override-XXXX)` 与 `.css-var-_R_x_` 前缀；
 *   2. `.ant-css-var` → `.apollo-modal`（变量声明块的宿主；见 D69 同判）；
 *   3. `.ant-*` → `.apollo-*`；`--ant-*` → `--apollo-*`；`.anticon` → `.apollo-icon`（D15）；
 *   4. 动效 keyframes 名换成稳定名：`apollo-modal-fade-in/-out`、`apollo-modal-zoom-in/-out`；
 *   5. 删除 `loadingCircle`（Skeleton 的，icons 基线职责）。
 *
 * 输出：`/tmp/modal-style.txt`，三段（DECLS / KEYFRAMES / RULES），原序。
 */

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const antdPath = require.resolve('antd');
const antdRoot = antdPath.slice(
  0,
  antdPath.indexOf('antd/es') >= 0 ? antdPath.indexOf('antd/es') : antdPath.indexOf('antd/dist'),
);
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdRoot] });

const { createCache, extractStyle, StyleProvider } = require(cssinjsPath);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ConfigProvider, Modal } = require('antd');

const cache = createCache();
const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;
const CONFIRM_TYPES = ['confirm', 'info', 'success', 'error', 'warning'];

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true }, direction: 'rtl' },
    React.createElement(
      'div',
      null,
      React.createElement(PurePanel, { title: 'T', footer: 'F', closable: true }, 'body'),
      ...CONFIRM_TYPES.map((type) =>
        React.createElement(PurePanel, { key: type, type, title: 'T', content: 'C' }),
      ),
      React.createElement(Modal, {
        open: true,
        getContainer: false,
        centered: true,
        loading: true,
        title: 'T',
        closable: true,
        width: { xs: 100, md: 300 },
      }),
    ),
  ),
);

renderToStaticMarkup(el);
const css = extractStyle(cache, true);
writeFileSync('/tmp/modal-full.css', css);

// ---------------------------------------------------------------- 括号配平分块
const blocks = [];
let idx = 0;
while (idx < css.length) {
  const braceStart = css.indexOf('{', idx);
  if (braceStart < 0) break;
  let start = idx;
  for (let i = braceStart - 1; i >= idx; i--) {
    if (css[i] === '}' || css[i] === ';') {
      start = i + 1;
      break;
    }
  }
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  blocks.push(css.slice(start, end));
  idx = end;
}

// ---------------------------------------------------------------- 筛选
/**
 * ⚠️ **`@media` 块也要保留** —— 它的「选择器」是 `@media (max-width: 575px)`，
 *    不含 `ant-modal`，按旧判据会被整块丢掉，于是**响应式规则全丢**
 *    （modal 的 `<575px` 断点有 `max-width: calc(100vw - 16px)` 与 `margin: 8px auto`）。
 *    实测：L6 的 mobile 视口因此整体下移 3px（`margin` 从 0 变 8px 的差）。
 */
const KEEP = (block) => {
  const sel = block.slice(0, block.indexOf('{'));
  // `@media` / `@supports` 这类 at-rule：判据要看**块体**里有没有 ant-modal
  if (sel.startsWith('@')) {
    if (sel.includes('@keyframes')) return true;
    return block.includes('ant-modal');
  }
  return sel.includes('ant-modal') || sel.includes('ant-zoom') || sel.includes('ant-fade');
};

const selected = blocks.filter(KEEP);

// ---------------------------------------------------------------- 转换
const HASH = /css-dev-only-do-not-override-[a-z0-9]+/g;

function transform(text) {
  return (
    text
      // 1. 去 hash 包裹（`:where(...)` 整段 + 裸 hash 前缀）
      .replace(/:where\(\.css-dev-only-do-not-override-[a-z0-9]+\)/g, '')
      .replace(/\.css-var-_R_[a-zA-Z0-9_]+_/g, '')
      // 4. 动效 keyframes 稳定名（必须在 ant- 替换**之前**，否则 hash 名已被改坏）
      .replace(/css-dev-only-do-not-override-[a-z0-9]+-antFadeIn/g, 'apollo-modal-fade-in')
      .replace(/css-dev-only-do-not-override-[a-z0-9]+-antFadeOut/g, 'apollo-modal-fade-out')
      .replace(/css-dev-only-do-not-override-[a-z0-9]+-antZoomIn/g, 'apollo-modal-zoom-in')
      .replace(/css-dev-only-do-not-override-[a-z0-9]+-antZoomOut/g, 'apollo-modal-zoom-out')
      // 2. 变量声明块的宿主（cssVar 模式下是死选择器 `.ant-css-var`）
      .replace(/\.ant-css-var/g, '.apollo-modal')
      // 3. 前缀替换
      .replace(/--ant-/g, '--apollo-')
      .replace(/\.anticon/g, '.apollo-icon')
      .replace(/ant-/g, 'apollo-')
      .replace(HASH, '')
  );
}

const transformed = selected.map(transform);

// ---------------------------------------------------------------- 三段切分
const decls = transformed
  .filter((b) => b.includes('.apollo-modal-css-var'))
  .map((b) => b.slice(b.indexOf('{') + 1, b.lastIndexOf('}')))
  .join('');

const keyframes = transformed.filter(
  (b) => b.startsWith('@keyframes') && !b.includes('loadingCircle'),
);
const rules = transformed.filter(
  (b) => !b.startsWith('@keyframes') && !b.includes('.apollo-modal-css-var'),
);

const out = [
  '/* ===== DECLS ===== */',
  decls,
  '',
  '/* ===== KEYFRAMES ===== */',
  keyframes.join('\n'),
  '',
  '/* ===== RULES ===== */',
  rules.join('\n'),
  '',
  `/* counts: decls=${decls.length} keyframes=${keyframes.length} rules=${rules.length} */`,
].join('\n');

writeFileSync('/tmp/modal-style.txt', out);
console.log(out);
