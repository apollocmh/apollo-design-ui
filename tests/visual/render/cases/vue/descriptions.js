/**
 * Vue 侧（@apollo-design/ui）的 Descriptions 视觉用例。与 react/descriptions.jsx 逐条对应。
 */

import { Descriptions } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '200px', padding: '16px' } }, children);

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
];

export default {
  basic: () => box(h('div', { style: { width: '640px' } }, [h(Descriptions, { items })])),

  bordered: () =>
    box(
      h('div', { style: { width: '640px' } }, [
        h(Descriptions, { bordered: true, title: 'Bordered', items }),
      ]),
    ),

  vertical: () =>
    box(h('div', { style: { width: '640px' } }, [h(Descriptions, { layout: 'vertical', items })])),

  size: () =>
    box(
      h('div', { style: { width: '640px' } }, [
        h(Descriptions, { size: 'small', title: 'Small', items, style: { marginBottom: '16px' } }),
        h(Descriptions, { title: 'Medium', items }),
      ]),
    ),
};
