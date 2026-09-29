/**
 * probe-form-nostyle.mjs — 用 antd 6.6.4 的**真实运行时**回答一个判据问题：
 *
 * > 外层布局 `Form.Item`（无 name）套一个 `noStyle` 的 `Form.Item`（有 name + rules），
 * > 校验失败时，**外层**那个 `-item` 会不会拿到 `-has-error`？
 *
 * 为什么要 probe 而不是读源码：`ItemHolder` 的状态取值链（`meta.errors` vs 合并后的
 * `errors`）只有运行时能证伪 —— 而这条直接决定 L4/L2 断言怎么写。
 *
 * 结论（2026-09-29 实测，见输出）：
 *   - 外层 item **没有** `-has-error`（状态取自己的 `meta.errors`，外层无 Field ⇒ 恒空）
 *   - 错误文案仍然渲染在外层的 `-item-explain-error` 上（那是 debounce 后的合并值）
 *
 * 用法：node tests/visual/debug/probe-form-nostyle.mjs
 */
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// Node 22 的 globalThis.navigator 是只读 getter ⇒ 用 defineProperty 覆盖
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
// antd 的 responsiveObserver 直接调 window.matchMedia（jsdom 不实现）
const matchMediaStub = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});
dom.window.matchMedia = matchMediaStub;
globalThis.matchMedia = matchMediaStub;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react');
const { Form, Input } = require('antd');

const Item = Form.Item;

const Demo = () =>
  React.createElement(
    Form,
    { initialValues: { user: '' } },
    // A：外层布局 Item（无 name）+ 内层 noStyle
    React.createElement(
      Item,
      { label: 'OuterA' },
      React.createElement(
        Item,
        { name: 'user', noStyle: true, rules: [{ required: true, message: 'need user' }] },
        React.createElement(Input),
      ),
    ),
    // B：外层带 name + 内层 noStyle（antd 自测的经典嵌套形态）
    React.createElement(
      Item,
      { name: 'group', label: 'OuterB' },
      React.createElement(
        Item,
        { name: 'inner', noStyle: true, rules: [{ required: true, message: 'need inner' }] },
        React.createElement(Input),
      ),
    ),
  );

const container = document.getElementById('root');
const root = createRoot(container);

await act(async () => {
  root.render(React.createElement(Demo));
});

// 触发校验（提交即可）
await act(async () => {
  const form = container.querySelector('form');
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
});
await act(async () => {
  await new Promise((r) => setTimeout(r, 120));
});

const items = [...container.querySelectorAll('.ant-form-item')];
for (const [index, el] of items.entries()) {
  console.log(`item[${index}] class="${el.className}"`);
}
const explain = container.querySelector('.ant-form-item-explain-error');
console.log('explain-error text =', explain ? JSON.stringify(explain.textContent) : '(none)');
console.log(
  'outer has -has-error ?',
  [...container.querySelectorAll('.ant-form-item')].some((el) =>
    el.className.includes('ant-form-item-has-error'),
  ),
);
const input = container.querySelector('input');
console.log('input attrs =', input ? input.outerHTML : '(none)');
