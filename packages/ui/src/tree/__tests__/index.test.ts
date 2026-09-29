/**
 * Tree · L1/L2（G5/G6）。
 *
 * 判据：antd `index.test.tsx`（19 用例）+ `directory.test.tsx`（21）主行为，
 * `<TreeNode>` children 形态用 treeData 等价镜像（UPSTREAM deprecated 不实现）。
 * 快照类断言改为行为断言（本仓不养快照，TESTING.md L1 规则）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
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

const items = (w: ReturnType<typeof mount>) => w.findAll('.apollo-tree-treenode');

describe('Tree · 渲染与展开', () => {
  it('平铺渲染 + role=tree/treeitem + aria-expanded', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    expect(items(w).map((n) => n.text())).toContain('leaf-0');
    expect(w.find('[role="tree"]').exists()).toBe(true);
    expect(w.find('[role="treeitem"]').attributes('aria-expanded')).toBe('true');
    w.unmount();
  });

  it('defaultExpandAll：只展开有 children 的节点（rc gDSFP 判据）', async () => {
    const w = mount(Tree, { props: { treeData, defaultExpandAll: true }, global: globalCfg });
    await nextTick();
    expect(w.text()).toContain('leaf-0');
    expect(w.emitted('update:expandedKeys')).toBeUndefined();
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

  it('叶子节点渲染 `-treenode-leaf` + `-switcher-noop`', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.apollo-tree-treenode-leaf').exists()).toBe(true);
    expect(w.find('.apollo-tree-switcher-noop').exists()).toBe(true);
    w.unmount();
  });
});

describe('Tree · switcher 图标决策树（antd index 矩阵）', () => {
  it('switcherIcon 不在叶子节点渲染内容', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true },
      global: globalCfg,
    });
    await nextTick();
    const noop = w.find('.apollo-tree-switcher-noop');
    expect(noop.exists()).toBe(true);
    expect(noop.text()).toBe('');
    w.unmount();
  });

  it('switcherIcon string 形态渲染进 switcher', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true, switcherIcon: 'switcherIcon' },
      global: globalCfg,
    });
    await nextTick();
    expect(w.text()).toContain('switcherIcon');
    w.unmount();
  });

  it('switcherIcon render-prop fn：按 expanded 分支', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        switcherIcon: (node: { expanded?: boolean }) =>
          node.expanded ? 'open-mark' : 'close-mark',
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.text()).toContain('open-mark');
    expect(w.text()).not.toContain('close-mark');
    w.unmount();
  });

  it('showLine：叶子 FileOutlined 分支 + 分支 Plus/MinusSquare 类', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true, showLine: true },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.apollo-tree-switcher-line-icon').exists()).toBe(true);
    expect(w.find('.apollo-tree-switcher-noop').exists()).toBe(true);
    w.unmount();
  });

  it('showLine.showLeafIcon=false ⇒ 叶子是 `-switcher-leaf-line` span', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        showLine: { showLeafIcon: false },
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.apollo-tree-switcher-leaf-line').exists()).toBe(true);
    w.unmount();
  });

  it('showLine.showLeafIcon vnode/fn 定制', async () => {
    const w1 = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        showLine: { showLeafIcon: h('i', { class: 'customLeafIcon' }) },
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w1.findAll('.customLeafIcon').length).toBe(3); // 0-0-0/0-0-1/0-1 三个叶子
    w1.unmount();

    const w2 = mount(Tree, {
      props: {
        treeData,
        defaultExpandAll: true,
        showLine: { showLeafIcon: () => h('i', { class: 'customLeafIconFn' }) },
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w2.findAll('.customLeafIconFn').length).toBe(3);
    w2.unmount();
  });

  it('loadData 进行中 ⇒ switcher 变 loading 图标', async () => {
    const loadData = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
    const w = mount(Tree, {
      props: {
        treeData: [{ key: 'l', title: 'load' }],
        loadData,
        defaultExpandedKeys: ['l'],
      },
      global: globalCfg,
    });
    await nextTick();
    // onNodeLoad 在 TreeNode watch 里触发 ⇒ loadingKeys 含 l ⇒ -icon_loading
    await vi.waitFor(() => {
      expect(w.find('.apollo-tree-icon_loading').exists()).toBe(true);
    });
    w.unmount();
  });

  it('switcherLoadingIcon VNode 定制', async () => {
    const loadData = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
    const w = mount(Tree, {
      props: {
        treeData: [{ key: 'l', title: 'load' }],
        loadData,
        defaultExpandedKeys: ['l'],
        switcherLoadingIcon: h('div', { class: 'loading-mark' }, 'loading...'),
      },
      global: globalCfg,
    });
    await vi.waitFor(() => {
      expect(w.find('.loading-mark').exists()).toBe(true);
    });
    w.unmount();
  });
});

describe('Tree · 选中 / 勾选（事件双发 C11）', () => {
  it('点击选中：update:selectedKeys 与 select 同发 + 类名落地', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    await w.find('.apollo-tree-node-content-wrapper').trigger('click');
    expect(w.emitted('update:selectedKeys')?.[0]).toEqual([['0-0']]);
    expect(w.emitted('select')?.length).toBe(1);
    expect(w.find('.apollo-tree-treenode-selected').exists()).toBe(true);
    w.unmount();
  });

  it('multiple=false：二次点击另一节点 ⇒ 单选切换', async () => {
    const w = mount(Tree, {
      props: { treeData, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    const wrappers = w.findAll('.apollo-tree-node-content-wrapper');
    await wrappers[0]?.trigger('click');
    await wrappers[1]?.trigger('click');
    expect(w.emitted('update:selectedKeys')?.at(-1)).toEqual([['0-0-0']]);
    w.unmount();
  });

  it('勾选级联：勾父 ⇒ 子全选（conductCheck fill）', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    await w.find('.apollo-tree-checkbox').trigger('click');
    const keys = [...((w.emitted('update:checkedKeys')?.[0]?.[0] as string[]) ?? [])];
    expect(keys.sort()).toEqual(['0-0', '0-0-0', '0-0-1']);
    expect(w.find('.apollo-tree-checkbox-checked').exists()).toBe(true);
    w.unmount();
  });

  it('勾子 ⇒ 父半选（-checkbox-indeterminate）', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    await w.findAll('.apollo-tree-checkbox')[1]?.trigger('click');
    expect(w.find('.apollo-tree-checkbox-indeterminate').exists()).toBe(true);
    w.unmount();
  });

  it('checkStrictly：返回对象形态 {checked, halfChecked}', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, checkStrictly: true, expandedKeys: ['0-0'] },
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
});

describe('Tree · 展开事件', () => {
  it('switcher 点击展开 / 收起（listChanging 期间忽略）', async () => {
    const w = mount(Tree, { props: { treeData }, global: globalCfg });
    await nextTick();
    expect(w.text()).not.toContain('leaf-0');
    await w.find('.apollo-tree-switcher').trigger('click');
    expect(w.emitted('update:expandedKeys')?.[0]).toEqual([['0-0']]);
    await nextTick();
    expect(w.text()).toContain('leaf-0');
    // motion 期间 onNodeExpand 直接 return（rc 判据）
    await w.find('.apollo-tree-switcher').trigger('click');
    await nextTick();
    await new Promise((r) => setTimeout(r, 30));
    await w.find('.apollo-tree-switcher').trigger('click');
    expect(w.emitted('update:expandedKeys')?.[1]).toEqual([[]]);
    w.unmount();
  });

  it('async load 成功 ⇒ loadedKeys；失败 ⇒ expandedKeys 回滚', async () => {
    const ok = mount(Tree, {
      props: {
        treeData: [{ key: 'l', title: 'load' }],
        loadData: () => Promise.resolve(),
        defaultExpandedKeys: ['l'],
      },
      global: globalCfg,
    });
    await vi.waitFor(() => {
      expect((ok.emitted('update:loadedKeys')?.[0]?.[0] as string[]) ?? []).toContain('l');
    });
    ok.unmount();

    const fail = mount(Tree, {
      props: {
        treeData: [{ key: 'l', title: 'load' }],
        loadData: () => Promise.reject(new Error('x')),
        defaultExpandedKeys: ['l'],
      },
      global: globalCfg,
    });
    await vi.waitFor(() => {
      // 失败 ⇒ loadingKeys 清除（-icon_loading 消失）且不发 loadedKeys
      expect(fail.find('.apollo-tree-icon_loading').exists()).toBe(false);
      expect(fail.emitted('update:loadedKeys')).toBeUndefined();
    });
    fail.unmount();
  });
});

describe('Tree · draggable（antd draggable 对象/func 矩阵）', () => {
  it('draggable=true ⇒ 节点 draggable 属性 + Holder 把手', async () => {
    const w = mount(Tree, {
      props: { treeData, draggable: true, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('[draggable="true"]').exists()).toBe(true);
    expect(w.find('.apollo-tree-draggable-icon').exists()).toBe(true);
    w.unmount();
  });

  it('draggable 函数形态 ⇒ nodeDraggable 分流', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        draggable: (node: { key: unknown }) => node.key !== '0-0',
        expandedKeys: ['0-0'],
      },
      global: globalCfg,
    });
    await nextTick();
    // 0-0 不可拖（自身），0-0-0 / 0-0-1 / 0-1 可拖 = 3
    expect(w.findAll('[draggable="true"]').length).toBe(3);
    w.unmount();
  });

  it('draggable.icon=false ⇒ 不渲染把手', async () => {
    const w = mount(Tree, {
      props: { treeData, draggable: { icon: false }, expandedKeys: ['0-0'] },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.apollo-tree-draggable-icon').exists()).toBe(false);
    w.unmount();
  });
});

describe('Tree · 语义槽 / 禁用（antd semantic + DisabledContext 矩阵）', () => {
  it('classNames/styles 落点（root/item/title/switcher）', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        expandedKeys: ['0-0'],
        classNames: {
          root: 'custom-root',
          item: 'custom-item',
          itemTitle: 'custom-title',
          itemSwitcher: 'custom-switcher',
        },
        styles: { itemTitle: { color: 'red' } },
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.custom-root').exists()).toBe(true);
    expect(w.find('.custom-item').exists()).toBe(true);
    expect(w.find('.custom-title').exists()).toBe(true);
    expect(w.find('.custom-switcher').exists()).toBe(true);
    expect(w.find('.custom-title').attributes('style')).toContain('color: red');
    w.unmount();
  });

  it('classNames 函数形态（语义化裁决 empty-semantic-fn = B）', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        classNames: () => ({ root: 'fn-root' }),
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.fn-root').exists()).toBe(true);
    w.unmount();
  });

  it('disabled ⇒ -treenode-disabled + aria-disabled + 点击不选中', async () => {
    const w = mount(Tree, {
      props: {
        treeData: [{ key: 'd', title: 'disabled', disabled: true }],
        selectable: true,
      },
      global: globalCfg,
    });
    await nextTick();
    await w.find('.apollo-tree-node-content-wrapper').trigger('click');
    expect(w.find('.apollo-tree-treenode-disabled').exists()).toBe(true);
    expect(w.find('[aria-disabled="true"]').exists()).toBe(true);
    expect(w.emitted('select')).toBeUndefined();
    w.unmount();
  });

  it('filterTreeNode 命中 ⇒ -filter-node 类', async () => {
    const w = mount(Tree, {
      props: {
        treeData,
        filterTreeNode: (node: { key: unknown }) => node.key === '0-0',
      },
      global: globalCfg,
    });
    await nextTick();
    expect(w.find('.filter-node').exists()).toBe(true);
    w.unmount();
  });
});
