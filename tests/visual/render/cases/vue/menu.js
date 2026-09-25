/**
 * Vue 侧（@apollo-design/ui）的 Menu 视觉用例。与 react/menu.jsx 逐条对应。
 */

import { Menu } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two' },
  { type: 'divider', key: 'd1' },
  { key: 'sub1', label: 'Sub', children: [
    { key: '3', label: 'Three' },
    { key: '4', label: 'Four' },
  ] },
  { type: 'group', key: 'g1', label: 'Group', children: [{ key: '5', label: 'Five' }] },
];

const darkItems = [
  { key: '1', label: 'Option 1' },
  { key: 'sub1', label: 'Navigation One', children: [{ key: '3', label: 'Option 3' }] },
];

const mk = (extra) =>
  h(Menu, {
    items,
    defaultOpenKeys: ['sub1'],
    selectedKeys: ['1'],
    ...extra,
  });

export default {
  vertical: () => box(mk({ mode: 'vertical', style: { width: '256px' } })),

  inline: () => box(mk({ mode: 'inline', style: { width: '256px' } })),

  dark: () =>
    box(
      h(Menu, {
        items: darkItems,
        defaultOpenKeys: ['sub1'],
        mode: 'inline',
        theme: 'dark',
        selectedKeys: ['1'],
        style: { width: '256px' },
      }),
    ),

  horizontal: () => box(mk({ mode: 'horizontal', style: { width: '400px' } })),
};
