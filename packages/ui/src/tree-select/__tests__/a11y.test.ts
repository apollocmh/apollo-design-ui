/**
 * L5 可访问性 —— TreeSelect 浮层树与触发器的 ARIA 契约。
 *
 * 触发器：role=combobox + aria-expanded + aria-haspopup（BaseSelect 协议）。
 * 浮层树：role=tree/treeitem + 勾选框 role=checkbox + aria-checked=mixed
 *（半勾）+ aria-disabled。demo axe 扫描接入 a11y 项目。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { config, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

config.global.stubs = { ...config.global.stubs, teleport: false };

import { TreeSelect } from '../index';

a11yDemoTest('TreeSelect', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason:
        'combobox 的可访问名由 role=combobox + aria-* 状态承担（select 收口同款放行，antd 自测一致）。',
    },
  ],
});

const TREE_DATA = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1', disabled: true },
    ],
  },
  { title: 'parent 2', value: '0-1' },
];

const P = { prefixCls: 'apollo-tree-select' };

describe('TreeSelect · ARIA（L5）', () => {
  it('触发器：combobox + aria-haspopup=listbox', async () => {
    const w = mount(TreeSelect, {
      props: { ...P, treeData: TREE_DATA, open: true },
      attachTo: document.body,
    });
    await nextTick();
    const input = w.find('input[role="combobox"]');
    expect(input.exists()).toBe(true);
    expect(input.attributes('aria-haspopup')).toBe('listbox');
    w.unmount();
  });

  it('浮层树：treeitem 结构 + disabled 节点 aria-disabled', async () => {
    const w = mount(TreeSelect, {
      props: { ...P, treeData: TREE_DATA, open: true, treeDefaultExpandAll: true },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();
    const items = [...document.querySelectorAll('[role="treeitem"]')];
    expect(items.length).toBe(4);
    const disabledItem = items.find((n) => n.textContent?.includes('leaf 2'));
    expect(disabledItem?.getAttribute('aria-disabled')).toBe('true');
    w.unmount();
  });

  it('勾选态：checkbox aria-checked（半勾 = mixed）', async () => {
    // ⚠️ 用无 disabled 的数据：disabled 子不参与半勾计数（conductCheck 逐字），
    // 上面的数据里 leaf 2 disabled ⇒ 勾 leaf 1 时父是全勾（true）而非 mixed
    const w = mount(TreeSelect, {
      props: {
        ...P,
        treeData: [
          {
            title: 'parent 1',
            value: '0-0',
            children: [
              { title: 'leaf 1', value: '0-0-0' },
              { title: 'leaf 2', value: '0-0-1' },
              { title: 'leaf 3', value: '0-0-2' },
            ],
          },
        ],
        open: true,
        treeDefaultExpandAll: true,
        treeCheckable: true,
        defaultValue: ['0-0-0'],
      },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();
    // leaf 1 勾选 ⇒ 父 halfChecked = mixed
    const mixed = document.querySelector('[aria-checked="mixed"]');
    expect(mixed).toBeTruthy();
    w.unmount();
  });
});
