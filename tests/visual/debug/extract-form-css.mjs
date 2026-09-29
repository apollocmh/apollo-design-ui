/**
 * extract-form-css.mjs — 用 antd 6.6.4 的真实产物 dump Form 的 CSS。
 *
 * 两种用法：
 *
 *   node tests/visual/debug/extract-form-css.mjs              # 原始产物（带 hash / css-var 轨）
 *   node tests/visual/debug/extract-form-css.mjs --emit-static # 机械转换成静态 CSS
 *
 * `--emit-static` 的转换与 `packages/ui/src/<c>/style/index.ts` 的 RULES 段一一对应：
 *
 *   1. 去掉 `:where(.css-dev-only-do-not-override-XXX)` 作用域壳（D5：我们没有 hash 轨）
 *   2. 去掉 `.ant-form-css-var` 双轨段（D5：零运行时无 css-var 类机制）
 *   3. `.ant-` → `.apollo-`、`--ant-` → `--apollo-`（catalog 里的默认前缀）
 *   4. 只保留选择器提到 `form` 的规则 + Form 用到的 keyframes（zoomIn）
 *   5. 折叠空白成「一行一条规则」，便于与产物逐条对拍
 *
 * ⚠️ 规则体**不做任何改写**（值也不动）：这是机械移植的前提，
 *    否则「两侧像素一致」就变成「两边都想通了」（`AGENTS.md` H2/H3）。
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
const { ConfigProvider, Form, Input } = require('antd');

const emitStatic = process.argv.includes('--emit-static');

const cache = createCache();

const Item = (props) =>
  React.createElement(
    Form.Item,
    { ...props },
    React.createElement(Input, { placeholder: props.placeholder }),
  );

// ⚠️ 必须把**所有形态**都渲染一遍：cssinjs 按需生成，未渲染到的分支不会进 cache
//    （size / vertical / inline / feedback / explain / tooltip / hidden / labelCol 24）。
const forms = [
  React.createElement(
    Form,
    { key: 'f1' },
    React.createElement(Item, { label: 'User', name: 'user' }),
    React.createElement(Item, { label: 'Age', name: 'age', required: true }),
  ),
  React.createElement(
    Form,
    { key: 'f2', layout: 'vertical' },
    React.createElement(Item, { label: 'User', name: 'u2' }),
  ),
  React.createElement(
    Form,
    { key: 'f3', layout: 'vertical', requiredMark: 'optional' },
    React.createElement(Item, { label: 'User', name: 'u3' }),
    React.createElement(Item, { label: 'Opt', name: 'o3', required: true }),
  ),
  React.createElement(
    Form,
    { key: 'f4', requiredMark: false },
    React.createElement(Item, { label: 'User', name: 'u4' }),
  ),
  React.createElement(
    Form,
    { key: 'f5', layout: 'inline' },
    React.createElement(Item, { label: 'User', name: 'u5' }),
    React.createElement(Item, { name: 'u5b' }),
  ),
  React.createElement(
    Form,
    { key: 'f6', size: 'small' },
    React.createElement(Item, { label: 'User', name: 'u6' }),
  ),
  React.createElement(
    Form,
    { key: 'f7', size: 'large' },
    React.createElement(Item, { label: 'User', name: 'u7' }),
  ),
  React.createElement(
    Form,
    { key: 'f8' },
    React.createElement(Item, { label: 'T', name: 'u8', tooltip: 'tip' }),
    React.createElement(Item, {
      label: 'H',
      name: 'u8b',
      help: 'help text',
      extra: 'extra text',
      validateStatus: 'error',
    }),
    React.createElement(Item, {
      label: 'S',
      name: 'u8c',
      hasFeedback: true,
      validateStatus: 'success',
    }),
    React.createElement(Item, {
      label: 'W',
      name: 'u8d',
      hasFeedback: true,
      validateStatus: 'warning',
    }),
    React.createElement(Item, {
      label: 'V',
      name: 'u8e',
      hasFeedback: true,
      validateStatus: 'validating',
    }),
  ),
  React.createElement(
    Form,
    { key: 'f9', labelCol: { span: 24 } },
    React.createElement(Item, { label: 'User', name: 'u9' }),
  ),
  React.createElement(
    Form,
    { key: 'f10' },
    React.createElement(Item, { name: 'u10', noStyle: true }),
    React.createElement(Item, { label: 'Hid', name: 'u10b', hidden: true }),
  ),
];

const el = React.createElement(
  StyleProvider,
  { cache },
  React.createElement(
    ConfigProvider,
    { theme: { cssVar: true } },
    React.createElement('div', null, ...forms),
  ),
);
renderToStaticMarkup(el);
const raw = extractStyle(cache);

if (!emitStatic) {
  console.log(raw);
  process.exit(0);
}

// ── 转换 ─────────────────────────────────────────────────────────────────────

/** 花括号配平切分：@media 里有嵌套规则，朴素 indexOf('}') 会把块切碎。 */
function splitRules(css) {
  const out = [];
  let depth = 0;
  let start = 0;
  let at = 0; // 当前顶层规则的 {  位置
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === '{') {
      if (depth === 0) at = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        out.push([css.slice(start, at).trim(), css.slice(at + 1, i)]);
        start = i + 1;
      }
    }
  }
  return out;
}

/**
 * 归一化：去 `<style>` 壳 → 去 hash 作用域 → 空白折叠为**单个空格**。
 *
 * ⚠️ 空白必须折成空格而不是删掉：antd 的 CSS-in-JS 会把后代选择器写成换行 +
 *    缩进（`.ant-form\n  .ant-form-item`），删空白会把「后代」粘成「复合」——
 *    那是**语义改变**，不是格式整理（实测过：`.ant-form.ant-form-item` 匹配不到任何东西）。
 */
const stripScope = (s) =>
  s
    .replace(/<\/?style[^>]*>/g, '')
    .replace(/:where\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const rename = (s) => s.replace(/--ant-/g, '--apollo-').replace(/\.ant-/g, '.apollo-');
/** 哈希化的 keyframes 名 → 无 hash 名（`css-dev-only-…-antZoomIn` ⇒ `apolloZoomIn`）。 */
const unhashKeyframes = (s) =>
  s.replace(/css-dev-only-do-not-override-[A-Za-z0-9]+-antZoomIn/g, 'apolloZoomIn');

const clean = (s) => rename(unhashKeyframes(stripScope(s))).replace(/\.anticon/g, '.apollo-icon');

const rules = splitRules(raw)
  .map(([head, body]) => [clean(head), clean(body)])
  .filter(([head]) => !head.includes('-css-var'))
  .filter(
    ([head, body]) =>
      (head.includes('form') || (head.startsWith('@media') && body.includes('form'))) &&
      !head.includes('input') &&
      !body.includes('apollo-input'),
  );

// 只保留 form 相关的 keyframes
const keyframes = splitRules(raw)
  .map(([head, body]) => [clean(head), clean(body)])
  .filter(([head]) => head.startsWith('@keyframes') && head.includes('ZoomIn'));

const lines = [
  ...rules.map(([head, body]) => `${head}{${body}}`),
  ...keyframes.map(([head, body]) => `${head}{${body}}`),
];

console.error(`[extract-form] 规则 ${rules.length} 条 + keyframes ${keyframes.length} 条`);
console.log(lines.join('\n'));
