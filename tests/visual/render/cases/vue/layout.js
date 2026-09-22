/**
 * Vue 侧（@apollo-design/ui）的 Layout 视觉用例。与 react/layout.jsx 逐条对应。
 */

import { Layout } from '@apollo-design/ui';
import { h } from 'vue';

const { Header, Footer, Sider, Content } = Layout;

const box = (style) => h('div', { style: { minHeight: '220px', ...style } });
const nav = (color) => h('div', { style: { padding: '16px', color } }, 'nav 1');

export default {
  basic: () => [
    h(Layout, null, {
      default: () => [
        h(Header, null, { default: () => 'Header' }),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
        h(Footer, null, { default: () => 'Footer' }),
      ],
    }),
  ],

  side: () =>
    h(Layout, null, {
      default: () => [
        h(Sider, { width: 160 }, { default: () => nav('rgba(255,255,255,0.65)') }),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
      ],
    }),

  'side-light': () =>
    h(Layout, null, {
      default: () => [
        h(
          Sider,
          { theme: 'light', width: 160 },
          { default: () => h('div', { style: { padding: '16px' } }, 'nav 1') },
        ),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
      ],
    }),

  collapsible: () =>
    h(Layout, null, {
      default: () => [
        h(
          Sider,
          { collapsible: true, width: 160 },
          { default: () => nav('rgba(255,255,255,0.65)') },
        ),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
      ],
    }),

  collapsed: () =>
    h(Layout, null, {
      default: () => [
        h(
          Sider,
          { collapsible: true, collapsed: true, width: 160 },
          { default: () => nav('rgba(255,255,255,0.65)') },
        ),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
      ],
    }),

  'zero-width': () =>
    h(Layout, null, {
      default: () => [
        h(
          Sider,
          { collapsible: true, collapsed: true, collapsedWidth: 0, width: 160 },
          { default: () => nav('rgba(255,255,255,0.65)') },
        ),
        h(Content, null, { default: () => box({ background: 'rgb(240, 242, 245)' }) }),
      ],
    }),
};
