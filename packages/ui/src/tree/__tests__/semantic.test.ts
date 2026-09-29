/**
 * Tree · L4 语义化槽位（G6）。
 *
 * 判据：antd `semantic.test.tsx`（5 槽：root/item/itemIcon/itemTitle/itemSwitcher）
 * + 函数形态（裁决 empty-semantic-fn = B）。index.test.ts 已覆盖对象形态落点，
 * 这里覆盖函数形态与槽位全集（icon 槽只在 showIcon + 定制 icon 时可见）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Tree } from '../index';

const treeData = [
  {
    key: '0-0',
    title: 'parent',
    children: [{ key: '0-0-0', title: 'leaf' }],
  },
];

describe('Tree · 语义槽（L4）', () => {
  it('函数形态：classNames/styles 五槽全落点', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        showIcon: true,
        icon: 'I',
        classNames: () => ({
          root: 'fn-root',
          item: 'fn-item',
          itemIcon: 'fn-icon',
          itemTitle: 'fn-title',
          itemSwitcher: 'fn-switcher',
        }),
        styles: () => ({
          root: { padding: '1px' },
          item: { margin: '2px' },
          itemTitle: { color: 'red' },
        }),
      },
    });
    await nextTick();
    expect(w.find('.fn-root').exists()).toBe(true);
    expect(w.find('.fn-item').exists()).toBe(true);
    expect(w.find('.fn-icon').exists()).toBe(true);
    expect(w.find('.fn-title').exists()).toBe(true);
    expect(w.find('.fn-switcher').exists()).toBe(true);
    expect(w.find('.fn-root').attributes('style')).toContain('padding: 1px');
    expect(w.find('.fn-item').attributes('style')).toContain('margin: 2px');
    expect(w.find('.fn-title').attributes('style')).toContain('color: red');
    w.unmount();
  });

  it('config-provider 组件级 classNames/styles 与 props 合并', async () => {
    const w = mount(
      {
        setup() {
          return () =>
            h(
              ConfigProvider,
              {
                components: {
                  tree: { classNames: { root: 'ctx-root' }, styles: { root: { padding: '9px' } } },
                },
              },
              { default: () => h(Tree, { treeData, classNames: { root: 'prop-root' } }) },
            );
        },
      },
      { global: { stubs: { teleport: true } } },
    );
    await nextTick();
    const root = w.find('.apollo-tree');
    // eslint-disable-next-line no-console
    console.log(
      'ROOT classes:',
      JSON.stringify(root.classes()),
      'style:',
      root.attributes('style'),
    );
    expect(root.classes()).toContain('ctx-root');
    expect(root.classes()).toContain('prop-root');
    expect(root.attributes('style')).toContain('padding: 9px');
    w.unmount();
  });
});
