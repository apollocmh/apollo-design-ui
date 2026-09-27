/**
 * Vue 侧（@apollo-design/ui）的 FloatButton 视觉用例。与 react/float-button.jsx 逐条对应。
 * basic（icon-only + primary）/ shape-content（square + #content）/ badge-tooltip。
 */

import { FloatButton } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '120px', padding: '16px', width: '480px' } }, children);

export default {
  basic: () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px' } }, [
        h(FloatButton),
        h(FloatButton, { type: 'primary' }),
        h(FloatButton, { shape: 'square' }),
      ]),
    ),

  'shape-content': () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px', alignItems: 'flex-start' } }, [
        h(FloatButton, { shape: 'square' }, { content: () => 'HELP INFO' }),
        h(
          FloatButton,
          { shape: 'square' },
          {
            icon: () => h('span', { style: { fontSize: '14px' } }, '?'),
            content: () => 'HELP',
          },
        ),
      ]),
    ),

  'badge-tooltip': () =>
    box(
      h('div', { style: { display: 'flex', gap: '16px' } }, [
        h(FloatButton, { badge: { dot: true } }),
        h(FloatButton, { badge: { count: 5 } }),
        h(FloatButton, { tooltip: 'title text' }),
      ]),
    ),
};
