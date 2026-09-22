/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Layout
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/layout.dom.json`，由 `tests/compat/baseline/layout.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Layout 产出。
 * 机械 oracle。`keepStyle: true`：Sider 的 `flex/maxWidth/minWidth/width` 与语义化
 * 样式的合并顺序是易错点。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明「Sider 嵌套在 div 里也能被检测」—— 那条依赖运行时 `addSider`
 *     注册（React useEffect），SSR 拿不到 ⇒ L1 钉。
 *   - 没证明响应式折叠 / onCollapse / onBreakpoint（L1 用 matchMedia 桩钉）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/layout.dom.json';
import { Content, Footer, Header, Layout, Sider } from '../index';

const BP = { prefixCls: 'apollo-layout' };
const SBP = { prefixCls: 'apollo-layout-sider' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'layout:no-props': { render: () => h(Layout, BP) },
  'layout:children': { render: () => h(Layout, BP, { default: () => 'content' }) },
  'layout:has-sider-direct': {
    render: () =>
      h(Layout, BP, {
        default: () => [
          h(Sider, SBP, { default: () => 'Sider' }),
          h(Content, BP, { default: () => 'Content' }),
        ],
      }),
  },
  'layout:has-sider-false': {
    render: () =>
      h(
        Layout,
        { ...BP, hasSider: false },
        { default: () => h(Sider, SBP, { default: () => 'Sider' }) },
      ),
  },
  'layout:has-sider-true': { render: () => h(Layout, { ...BP, hasSider: true }) },
  'layout:class-order': {
    render: () => h(Layout, { ...BP, className: 'cn', rootClassName: 'rcn' }),
  },
  'layout:style': { render: () => h(Layout, { ...BP, style: { height: '100vh' } }) },
  'layout:custom-prefix': { render: () => h(Layout, { prefixCls: 'my-layout' }) },

  'layout:header': { render: () => h(Header, BP, { default: () => 'Header' }) },
  'layout:footer': { render: () => h(Footer, BP, { default: () => 'Footer' }) },
  'layout:content': { render: () => h(Content, BP, { default: () => 'Content' }) },
  'layout:header-class': { render: () => h(Header, { ...BP, className: 'h' }) },
  'layout:header-custom-prefix': { render: () => h(Header, { prefixCls: 'my-header' }) },

  'sider:no-props': { render: () => h(Sider, SBP, { default: () => 'Sider' }) },
  'sider:theme-light': {
    render: () => h(Sider, { ...SBP, theme: 'light' }, { default: () => 'Sider' }),
  },
  'sider:default-collapsed': {
    render: () => h(Sider, { ...SBP, defaultCollapsed: true }, { default: () => 'Sider' }),
  },
  'sider:collapsed': {
    render: () => h(Sider, { ...SBP, collapsed: true }, { default: () => 'Sider' }),
  },
  'sider:width-number': {
    render: () => h(Sider, { ...SBP, width: 120 }, { default: () => 'Sider' }),
  },
  'sider:width-percent': {
    render: () => h(Sider, { ...SBP, width: '50%' }, { default: () => 'Sider' }),
  },
  'sider:width-zero': {
    render: () => h(Sider, { ...SBP, width: '0%' }, { default: () => 'Sider' }),
  },
  'sider:collapsible': {
    render: () => h(Sider, { ...SBP, collapsible: true }, { default: () => 'Sider' }),
  },
  'sider:trigger-null': {
    render: () =>
      h(Sider, { ...SBP, collapsible: true, trigger: null }, { default: () => 'Sider' }),
  },
  'sider:collapsed-width-zero': {
    render: () =>
      h(Sider, { ...SBP, collapsible: true, collapsedWidth: 0 }, { default: () => 'Sider' }),
  },
  'sider:collapsed-width-zero-collapsed': {
    render: () =>
      h(
        Sider,
        { ...SBP, collapsible: true, collapsedWidth: 0, collapsed: true },
        { default: () => 'Sider' },
      ),
  },
  'sider:zero-width-trigger-style': {
    render: () =>
      h(
        Sider,
        {
          ...SBP,
          collapsible: true,
          collapsedWidth: 0,
          zeroWidthTriggerStyle: { background: 'rgb(1, 2, 3)' },
        },
        { default: () => 'Sider' },
      ),
  },
  'sider:reverse-arrow': {
    render: () =>
      h(Sider, { ...SBP, collapsible: true, reverseArrow: true }, { default: () => 'Sider' }),
  },
  'sider:breakpoint': {
    render: () => h(Sider, { ...SBP, breakpoint: 'lg' }, { default: () => 'Sider' }),
  },
  'sider:class-name': {
    render: () => h(Sider, { ...SBP, className: 'my-sider' }, { default: () => 'Sider' }),
  },
  'sider:style': {
    render: () =>
      h(Sider, { ...SBP, style: { background: 'rgb(1, 2, 3)' } }, { default: () => 'Sider' }),
  },
  'sider:semantic': {
    render: () =>
      h(
        Sider,
        {
          ...SBP,
          classNames: { root: 'custom-sider-root', body: 'custom-sider-body' },
          styles: { root: { backgroundColor: 'rgb(1, 2, 3)' }, body: { display: 'flex' } },
        },
        { default: () => 'Sider' },
      ),
  },
  'sider:semantic-fn': {
    render: () =>
      h(
        Sider,
        {
          ...SBP,
          collapsible: true,
          classNames: ({ props }) => ({
            body: props.collapsed ? 'body-collapsed' : 'body-expanded',
          }),
          styles: ({ props }) => ({ body: { opacity: props.collapsed ? 0.5 : 1 } }),
        },
        { default: () => 'Sider' },
      ),
  },
  'sider:custom-trigger': {
    render: () =>
      h(
        Sider,
        { ...SBP, collapsible: true, trigger: h('span', { className: 'my-trigger' }) },
        { default: () => 'Sider' },
      ),
  },
};

domContractTest('Layout', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Layout L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
