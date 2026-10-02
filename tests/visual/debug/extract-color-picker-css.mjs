/**
 * extract-color-picker-css.mjs — dump antd 6.6.4 ColorPicker 的 CSS 产物 / Component Token。
 *
 * 用法：
 *   node tests/visual/debug/extract-color-picker-css.mjs            # 原始 CSS 产物
 *   node tests/visual/debug/extract-color-picker-css.mjs --tokens   # Component Token + 变量声明
 *   node tests/visual/debug/extract-color-picker-css.mjs --selectors # 选择器清单（去重）
 *
 * ── 与 calendar 提取脚本的关键不同 ──────────────────────────────────────────────
 *
 * `ColorPicker` **有浮层**（`Popover`）⇒ 面板 DOM 不在 `children` 那一支里。
 * 实测：SSR 下 `open: true` **会把浮层内容内联渲染出来**（与 `extract-popover.mjs` 同判）
 * ⇒ 不需要 `PurePanel`（`_InternalPanelDoNotUseOrYouWillBeFired`）那套。
 * ⚠️ 但**未开启**时只有触发器那一支的 CSS 会进 cache ⇒ 本脚本**同时渲染两种**，
 * 保证面板规则一定被生成。
 *
 * ⚠️ `prefixCls` 走 `getPrefixCls('color-picker')` ⇒ 类名是 `ant-color-picker`
 * （**不是** `ant-picker-color`）。
 *
 * 🚨 扫变量的字符类**必须含下划线**（`[a-z0-9_-]`）—— PITFALLS 229 已经栽过两次
 * （date-picker / calendar 各一次，把 27 条读成 26）。本脚本从第一版就写对。
 */
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
const { ColorPicker, ConfigProvider } = require('antd');

const cache = createCache();
const h = React.createElement;

const PRESETS = [
  { label: 'Recent', colors: ['#f5222d', '#fa8c16', '#fadb14'], defaultOpen: true },
  { label: 'Basic', colors: ['#000000', '#ffffff'] },
];

/** 渐变值（走 `LineGradientType` 那一支）。 */
const GRADIENT = [
  { color: '#1677ff', percent: 0 },
  { color: '#ff4d4f', percent: 100 },
];

const el = h(
  StyleProvider,
  { cache },
  h(
    ConfigProvider,
    { theme: { cssVar: true } },
    h(
      'div',
      null,
      // ① 关着（只有触发器）
      h(ColorPicker, { value: '#1677ff' }),
      // ② 打开（面板：HSB 取色面板 + 色相/透明度滑块 + 格式输入）
      h(ColorPicker, { value: '#1677ff', open: true }),
      // ③ 打开 + 预设（多一个 Divider + 预设色板）
      h(ColorPicker, { value: '#1677ff', open: true, presets: PRESETS }),
      // ④ 渐变模式（多一个渐变条）
      h(ColorPicker, { value: GRADIENT, open: true, mode: 'gradient' }),
      // ⑤ 禁用 alpha（透明度滑块消失）
      h(ColorPicker, { value: '#1677ff', open: true, disabledAlpha: true }),
      // ⑥ 尺寸两支
      h(ColorPicker, { value: '#1677ff', size: 'small' }),
      h(ColorPicker, { value: '#1677ff', size: 'large' }),
      // ⑦ 显示文本（触发器里多一段文字）
      h(ColorPicker, { value: '#1677ff', showText: true }),
      // ⑧ 语义化槽（5 + 嵌套 popup）
      h(ColorPicker, {
        value: '#1677ff',
        open: true,
        classNames: {
          root: 'my-root',
          body: 'my-body',
          content: 'my-content',
          description: 'my-desc',
          popup: { root: 'my-popup' },
        },
      }),
    ),
  ),
);
renderToStaticMarkup(el);

// ⚠️ `extractStyle(cache, true)` 连 `@keyframes` 一起吐（SSR 默认不吐 keyframes）。
const css = extractStyle(cache, true);

const mode = process.argv.includes('--tokens')
  ? 'tokens'
  : process.argv.includes('--selectors')
    ? 'selectors'
    : 'css';

if (mode === 'css') {
  console.log(css);
} else if (mode === 'tokens') {
  // `--ant-color-picker-*` 的声明（按「名+值」去重，保序）
  const decls = [];
  for (const m of css.matchAll(/--ant-color-picker-([a-z0-9_-]+):([^;}]+)[;}]/g)) {
    const pair = [m[1], m[2]];
    if (!decls.some((d) => d[0] === pair[0] && d[1] === pair[1])) decls.push(pair);
  }
  console.log('### --ant-color-picker-* 声明');
  for (const [k, v] of decls) console.log(`--ant-color-picker-${k} = ${v}`);

  // 引用面
  const refs = new Set();
  for (const m of css.matchAll(/var\(--ant-color-picker-([a-z0-9_-]+)/g)) refs.add(m[1]);
  console.log('\n### 引用但**未声明**的 --ant-color-picker-*');
  console.log([...refs].filter((r) => !decls.some((d) => d[0] === r)).join(', ') || '（无）');

  // 声明了但**没被引用**的（死声明）
  console.log('\n### 声明但**未被引用**的 --ant-color-picker-*');
  console.log(
    [...decls]
      .filter((d) => !refs.has(d[0]))
      .map((d) => d[0])
      .join(', ') || '（无）',
  );

  console.log(`\n### 规模\n--ant-color-picker-* 声明条数 = ${decls.length}`);
} else {
  // 选择器清单（按「组件块」去重；只取 `{` 前那一段）
  const sels = new Set();
  for (const rule of css.split('}')) {
    const sel = (rule.split('{')[0] ?? '').trim();
    if (sel.includes('ant-color-picker')) sels.add(sel);
  }
  const list = [...sels];
  console.log(`### 含 .ant-color-picker 的选择器：${list.length} 条`);
  for (const s of list) console.log(s);
}
