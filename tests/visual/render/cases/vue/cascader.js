/**
 * Vue 侧（@apollo-design/ui）的 Cascader 视觉用例。与 react/cascader.jsx 逐条对应。
 */

import { Cascader, CascaderPanel } from '@apollo-design/ui';
import { h } from 'vue';

const OPTIONS = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  { value: 'jiangsu', label: '江苏', children: [{ value: 'nanjing', label: '南京' }] },
];

const box = (children) =>
  h('div', { style: { minHeight: '260px', padding: '24px', display: 'flex', alignItems: 'flex-end' } }, children);

export default {
  basic: () =>
    box(
      h('div', { style: { position: 'relative' } }, [
        h(Cascader, {
          options: OPTIONS,
          open: true,
          placement: 'bottomLeft',
          defaultValue: ['zhejiang', 'hangzhou'],
        }),
        h('div', { style: { position: 'absolute', top: '100%', left: 0, minWidth: '480px' } }, [
          h(CascaderPanel, { options: OPTIONS }),
        ]),
      ]),
    ),

  multiple: () =>
    box(
      h('div', { style: { position: 'relative' } }, [
        h(Cascader, { multiple: true, options: OPTIONS, open: true, placement: 'bottomLeft' }),
        h('div', { style: { position: 'absolute', top: '100%', left: 0, minWidth: '480px' } }, [
          h(CascaderPanel, { options: OPTIONS, multiple: true }),
        ]),
      ]),
    ),

  panel: () => box(h(CascaderPanel, { options: OPTIONS })),
};
