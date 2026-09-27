/**
 * Vue 侧（@apollo-design/ui）的 Steps 视觉用例。与 react/steps.jsx 逐条对应。
 */

import { Steps } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '220px', padding: '16px', width: '640px' } }, children);

const items = [
  { title: 'Login', content: 'Enter your credentials' },
  { title: 'Pay', content: 'Pay the bill' },
  { title: 'Done', content: 'All finished' },
];

export default {
  basic: () => box(h(Steps, { items, current: 1 })),

  vertical: () =>
    box(
      h('div', { style: { height: '260px' } }, [
        h(Steps, { items, current: 1, orientation: 'vertical' }),
      ]),
    ),

  dot: () => box(h(Steps, { items, current: 1, type: 'dot' })),
};
