/**
 * Vue 侧（@apollo-design/ui）的 Listy 视觉用例。与 react/listy.jsx 逐条对应。
 */

import { Listy } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '200px', padding: '16px' } }, children);
const FRAME = { width: '420px', maxWidth: '100%', boxSizing: 'border-box' };

const items = Array.from({ length: 6 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const groupItems = Array.from({ length: 8 }, (_, i) => ({
  key: i,
  group: `Group ${i % 2}`,
  content: `Item ${i}`,
}));
const group = {
  key: (item) => item.group,
};
const item = ({ item: row }) => row.content;
const groupHeader = ({ groupKey, items: rows }) => `${groupKey} (${rows.length})`;

export default {
  basic: () =>
    box(h('div', { style: FRAME }, [h(Listy, { items, rowKey: 'key' }, { default: item })])),

  groupSticky: () =>
    box(
      h('div', { style: FRAME }, [
        h(
          Listy,
          { items: groupItems, rowKey: 'key', group, sticky: true, height: 240 },
          { default: item, groupHeader },
        ),
      ]),
    ),

  height: () =>
    box(
      h('div', { style: FRAME }, [
        h(Listy, { items, rowKey: 'key', height: 160 }, { default: item }),
      ]),
    ),
};
