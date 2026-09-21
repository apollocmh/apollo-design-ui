/**
 * Vue 侧（@apollo-design/ui）的 Badge 视觉用例。与 react/badge.jsx 逐条对应。
 * ⚠️ 固件色值直接内联（H9 不适用于测试固件）。
 */

import { Badge } from '@apollo-design/ui';
import { h } from 'vue';

const box = () =>
  h('div', {
    style: { width: '40px', height: '40px', background: '#f0f0f0', borderRadius: '4px' },
  });

const statuses = ['success', 'processing', 'error', 'default', 'warning'];
const colors = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
];

export default {
  basic: () => [
    h(Badge, { count: 5 }, { default: box }),
    h(Badge, { count: 100, overflowCount: 99 }, { default: box }),
    h(Badge, { count: 0, showZero: true }, { default: box }),
  ],

  status: () => statuses.map((s) => h(Badge, { status: s, text: s }, { default: undefined })),

  colorful: () => colors.map((c) => h(Badge, { status: 'default', color: c, text: c })),

  dot: () => [
    h(Badge, { dot: true }, { default: box }),
    h(Badge, { dot: true, count: 5 }, { default: box }),
  ],

  ribbon: () => [
    h(Badge.Ribbon, { text: 'Hippopotamus' }, { default: box }),
    h(Badge.Ribbon, { text: 'pink', color: 'pink' }, { default: box }),
    h(Badge.Ribbon, { text: 'start', placement: 'start', color: 'blue' }, { default: box }),
    h(Badge.Ribbon, { text: '#2db7f5', color: '#2db7f5' }, { default: box }),
  ],

  'offset-size': () => [
    h(Badge, { count: 5, size: 'small' }, { default: box }),
    h(Badge, { count: 5, offset: [10, 10] }, { default: box }),
    h(Badge, { count: 25 }, { default: box }),
  ],
};
