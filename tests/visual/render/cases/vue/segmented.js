/**
 * Vue 侧（@apollo-design/ui）的 Segmented 视觉用例。与 react/segmented.jsx 逐条对应。
 */

import { Segmented } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '120px', padding: '16px', width: '640px' } }, children);

const OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

export default {
  basic: () => box(h(Segmented, { options: OPTIONS, value: 'Weekly' })),

  'shape-round': () =>
    box(h(Segmented, { options: OPTIONS, value: 'Monthly', shape: 'round' })),

  vertical: () =>
    box(
      h('div', { style: { height: '220px' } }, [
        h(Segmented, { options: ['Daily', 'Weekly', 'Monthly'], value: 'Weekly', vertical: true }),
      ]),
    ),

  sizes: () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' } }, [
        h(Segmented, { size: 'small', options: OPTIONS, value: 'Weekly' }),
        h(Segmented, { options: OPTIONS, value: 'Weekly' }),
        h(Segmented, { size: 'large', options: OPTIONS, value: 'Weekly' }),
      ]),
    ),
};
