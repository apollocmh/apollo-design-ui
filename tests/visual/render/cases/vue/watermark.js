/**
 * Vue 侧（@apollo-design/ui）的 Watermark 视觉用例。与 react/watermark.jsx 逐条对应。
 */

import { Watermark } from '@apollo-design/ui';
import { h } from 'vue';

const SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64"><rect width="120" height="64" fill="#1677ff"/><circle cx="60" cy="32" r="20" fill="#fff"/></svg>',
  );

const box = (style) => h('div', { style: { height: '260px', ...style } });

export default {
  basic: () => h(Watermark, { content: 'Ant Design' }, { default: () => box() }),

  'multi-line': () =>
    h(
      Watermark,
      { content: ['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }] },
      { default: () => box() },
    ),

  image: () => h(Watermark, { image: SVG, width: 130, height: 30 }, { default: () => box() }),

  'gap-offset': () =>
    h(
      Watermark,
      { content: 'Ant Design', gap: [40, 60], offset: [20, 20], rotate: -15 },
      { default: () => box({ background: 'rgb(250, 250, 250)' }) },
    ),
};
