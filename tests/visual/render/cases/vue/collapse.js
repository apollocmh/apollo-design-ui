/**
 * Vue 侧（@apollo-design/ui）的 Collapse 视觉用例。与 react/collapse.jsx 逐条对应。
 */

import { Collapse } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '240px', padding: '16px' } }, children);

const items = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
  { key: '3', label: 'Header 3', children: 'Content 3' },
];

export default {
  basic: () =>
    box(h('div', { style: { width: '480px' } }, [h(Collapse, { items, defaultActiveKey: '1' })])),

  accordion: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Collapse, { items, accordion: true, defaultActiveKey: ['1', '2'] }),
      ]),
    ),

  borderless: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Collapse, { items, bordered: false, defaultActiveKey: ['1', '2'] }),
      ]),
    ),
};
