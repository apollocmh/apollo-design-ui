/**
 * Vue 侧（@apollo-design/ui）的 Select 视觉用例。与 react/select.jsx 逐条对应。
 */

import { Select } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

const options = [
  { value: 'jack', label: 'Jack' },
  { value: 'lucy', label: 'Lucy', disabled: true },
  { value: 'tom', label: 'Tom' },
];

export default {
  basic: () =>
    box(
      h(Select, {
        options,
        defaultValue: 'jack',
        allowClear: true,
        style: { width: '220px' },
      }),
    ),

  multiple: () =>
    box(
      h(Select, {
        options,
        mode: 'multiple',
        defaultValue: ['jack', 'tom'],
        style: { width: '320px' },
      }),
    ),

  open: () =>
    box(
      h('div', { style: { height: '300px' } }, [
        h(Select, { options, open: true, style: { width: '220px' } }),
      ]),
    ),
};
