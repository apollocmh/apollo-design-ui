/**
 * Tree G4-2 冒烟测试（临时 —— G5 会重写为正式 L1/L2 文件）。
 *
 * 验证：挂载渲染 / 选中流转 / 展开收起 / 勾选级联 / defaultExpandAll。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Tree } from '../index';

const treeData = [
  {
    key: '0-0',
    title: 'parent',
    children: [
      { key: '0-0-0', title: 'leaf-0' },
      { key: '0-0-1', title: 'leaf-1' },
    ],
  },
  { key: '0-1', title: 'standalone' },
];

const globalCfg = { stubs: { teleport: true } };

function getItems(w: ReturnType<typeof mount>) {
  return w.findAll('.apollo-tree-treenode');
}

describe('Tree smoke', () => {
  it('渲染平铺节点 + 展开子树', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    expect(getItems(w).map((n) => n.text())).toContain('leaf-0');
    // role=tree / treeitem
    expect(w.find('[role="tree"]').exists()).toBe(true);
    expect(w.find('[role="treeitem"]').exists()).toBe(true);
    w.unmount();
  });

  it('点击选中：单选 + update:selectedKeys + select 同发', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    await w.find('.apollo-tree-node-content-wrapper').trigger('click');
    expect(w.emitted('update:selectedKeys')?.[0]).toEqual([['0-0']]);
    expect(w.emitted('select')?.length).toBe(1);
    // 类名落地
    expect(w.find('.apollo-tree-treenode-selected').exists()).toBe(true);
    w.unmount();
  });

  it('点击 switcher 展开 / 再点收起', async () => {
    const w = mount(Tree, {
      props: { treeData },
      global: globalCfg,
    });
    await nextTick();
    expect(w.text()).not.toContain('leaf-0');
    await w.find('.apollo-tree-switcher').trigger('click');
    expect(w.emitted('update:expandedKeys')![0]).toEqual([['0-0']]);
    await nextTick();
    expect(w.text()).toContain('leaf-0');
    await w.find('.apollo-tree-switcher').trigger('click');
    // rc 判据：motion 进行中（listChanging）onNodeExpand 直接 return —— 等宏任务复位
    await new Promise((r) => setTimeout(r, 30));
    await w.find('.apollo-tree-switcher').trigger('click');
    expect(w.emitted('update:expandedKeys')![1]).toEqual([[]]);
    w.unmount();
  });

  it('勾选级联：勾父 ⇒ 子全选（conductCheck fill）', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    // 父节点的 checkbox（第一个）
    await w.find('.apollo-tree-checkbox').trigger('click');
    const emitted = w.emitted('update:checkedKeys')?.[0]?.[0] as string[];
    expect([...emitted].sort()).toEqual(['0-0', '0-0-0', '0-0-1']);
    // 父 indeterminate 不出现、checked 出现
    expect(w.find('.apollo-tree-checkbox-checked').exists()).toBe(true);
    w.unmount();
  });

  it('checkStrictly：返回对象形态', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        checkable: true,
        checkStrictly: true,
        expandedKeys: ['0-0'],
      },
      global: globalCfg,
    });
    await nextTick();
    await w.find('.apollo-tree-checkbox').trigger('click');
    const emitted = w.emitted('update:checkedKeys')?.[0]?.[0] as {
      checked: string[];
      halfChecked: string[];
    };
    expect(emitted.checked).toEqual(['0-0']);
    expect(emitted.halfChecked).toEqual([]);
    w.unmount();
  });

  it('defaultExpandAll：只展开有 children 的节点', async () => {
    const w = mount(Tree, { props: { treeData, defaultExpandAll: true }, global: globalCfg });
    await nextTick();
    expect(w.text()).toContain('leaf-0');
    expect(w.emitted('update:expandedKeys')).toBeUndefined();
    w.unmount();
  });

  it('键盘 ↓ ⇒ active 落到首个节点', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true },
      global: globalCfg,
      attachTo: document.body,
    });
    await nextTick();
    await w.find('[role="tree"]').trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(w.find('.apollo-tree-treenode-active').exists()).toBe(true);
    w.unmount();
  });

  it('fieldNames 改写字段', async () => {
    const w = mount(Tree, {
      props: {
        treeData: [{ id: 'a', name: 'A', subs: [{ id: 'a1', name: 'A1' }] }] as never,
        fieldNames: { key: 'id', title: 'name', children: 'subs' },
        defaultExpandAll: true,
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.text()).toContain('A1');
    w.unmount();
  });
});
