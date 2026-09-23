/**
 * Vue 侧（@apollo-design/ui）的 Listy 视觉用例。与 react/listy.jsx 逐条对应。
 */

import { Listy } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '200px', padding: '16px' } }, children);

const items = Array.from({ length: 6 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const groupItems = Array.from({ length: 8 }, (_, i) => ({
  key: i,
  group: `Group ${i % 2}`,
  content: `Item ${i}`,
}));
const group = {
  key: (item) => item.group,
  title: (key, groupItemsOfKey) => `${key} (${groupItemsOfKey.length})`,
};

export default {
  basic: () =>
    box(
      h('div', { style: { width: '420px' } }, [
        h(Listy, { items, rowKey: 'key', itemRender: (item) => item.content }),
      ]),
    ),

  groupSticky: () =>
    box(
      h('div', { style: { width: '420px' } }, [
        h(Listy, {
          items: groupItems,
          rowKey: 'key',
          group,
          sticky: true,
          height: 240,
          itemRender: (item) => item.content,
        }),
      ]),
    ),

  height: () =>
    box(
      h('div', { style: { width: '420px' } }, [
        h(Listy, { items, rowKey: 'key', height: 160, itemRender: (item) => item.content }),
      ]),
    ),
};
