/**
 * Issue #16 回归：受控 `checkedKeys` 不随 `treeData` 变化重算勾选级联。
 *
 * 上游判据（rc-tree 1.4.0 `Tree.getDerivedStateFromProps`，Tree.js:205-232）：
 *   needSync('checkedKeys')  → base = parseCheckedKeys(props.checkedKeys) || {}
 *   !prevProps && default…   → base = parseCheckedKeys(props.defaultCheckedKeys)
 *   treeData 变化            → base = parseCheckedKeys(props.checkedKeys) || prevState
 * ⇒ 「受控与否」**不影响** treeData 变化时的重算，差别只在 base 取原值还是取当前派生态。
 *
 * 复现要点：`checkedKeys` 引用保持不变（VTU setProps 不重传同名 prop），只让 treeData 长节点。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Tree } from '../index';
import type { DataNode, SafeKey, TreeCheckedKeys } from '../interface';

const globalCfg = { stubs: { teleport: true } };

const node = (w: ReturnType<typeof mount>, title: string) =>
  w.findAll('.apollo-tree-treenode').find((n) => n.text().includes(title));

const checkbox = (w: ReturnType<typeof mount>, title: string) =>
  node(w, title)?.find('.apollo-tree-checkbox');

const cls = (w: ReturnType<typeof mount>, title: string) => checkbox(w, title)?.classes() ?? [];

const isChecked = (w: ReturnType<typeof mount>, title: string) =>
  cls(w, title).includes('apollo-tree-checkbox-checked');

const isHalf = (w: ReturnType<typeof mount>, title: string) =>
  cls(w, title).includes('apollo-tree-checkbox-indeterminate');

describe('Tree · Issue #16 受控 checkedKeys × 动态 treeData', () => {
  const initialLeafParent: DataNode[] = [{ key: 'p', title: 'parent' }];

  const grownParent: DataNode[] = [
    {
      key: 'p',
      title: 'parent',
      children: [
        { key: 'c1', title: 'child-1' },
        { key: 'c2', title: 'child-2' },
      ],
    },
  ];

  it('#16.1 [A] 受控父节点已勾选 ⇒ 异步挂上子节点后子节点继承勾选', async () => {
    const checkedKeys: SafeKey[] = ['p'];
    const w = mount(Tree, {
      props: {
        treeData: initialLeafParent,
        checkable: true,
        expandedKeys: ['p'],
        checkedKeys,
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'parent')).toBe(true);

    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));

    expect(w.text()).toContain('child-1');
    expect(isChecked(w, 'child-1')).toBe(true);
    expect(isChecked(w, 'child-2')).toBe(true);
    expect(isChecked(w, 'parent')).toBe(true);
    expect(isHalf(w, 'parent')).toBe(false);
    w.unmount();
  });

  it('#16.1 [B] 重算是派生，不得额外 emit update:checkedKeys / check', async () => {
    const checkedKeys: SafeKey[] = ['p'];
    const w = mount(Tree, {
      props: {
        treeData: initialLeafParent,
        checkable: true,
        expandedKeys: ['p'],
        checkedKeys,
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));

    expect(w.emitted('update:checkedKeys')).toBeUndefined();
    expect(w.emitted('check')).toBeUndefined();
    w.unmount();
  });

  it('#16.1 [C] 结构变更清理过期半选：子被移出 ⇒ 父不再 indeterminate', async () => {
    // ⚠️ 只动 treeData（不同步重设 expandedKeys）：rc 变更 expandedKeys 会触发 collapse motion，
    // jsdom 下动画不结束 ⇒ 新结构渲染不出来。这也是本仓既有的 jsdom 限制。
    const checkedKeys: SafeKey[] = ['c1'];
    const w = mount(Tree, {
      props: {
        treeData: [
          {
            key: 'p',
            title: 'parent',
            children: [
              { key: 'c1', title: 'child-1' },
              { key: 'c2', title: 'child-2' },
            ],
          },
        ] as DataNode[],
        checkable: true,
        expandedKeys: ['p'],
        checkedKeys,
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(isHalf(w, 'parent')).toBe(true);
    expect(isChecked(w, 'child-1')).toBe(true);

    // c1 挪到根下 ⇒ base(=['c1']) 重导电后 p 已无勾选子节点
    await w.setProps({
      treeData: [
        { key: 'p', title: 'parent', children: [{ key: 'c2', title: 'child-2' }] },
        { key: 'c1', title: 'child-1' },
      ] as DataNode[],
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(isChecked(w, 'child-1')).toBe(true);
    expect(isHalf(w, 'parent')).toBe(false);
    expect(isChecked(w, 'parent')).toBe(false);
    w.unmount();
  });

  it('#16.1 [C2] 叶子被归入新父 ⇒ 新父 indeterminate', async () => {
    const checkedKeys: SafeKey[] = ['c1'];
    const w = mount(Tree, {
      props: {
        treeData: [{ key: 'c1', title: 'child-1' }] as DataNode[],
        checkable: true,
        expandedKeys: ['p'],
        checkedKeys,
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'child-1')).toBe(true);

    // 'p' 虽然在 expandedKeys 里，但它是「新出现」的 key：rc 的 expandedKeys 只在
    // 自身变化时重算 ⇒ 与上游一致地不展开（不计入本 Issue）⇒ 只断言父的半选态。
    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));

    expect(isHalf(w, 'parent')).toBe(true);
    expect(isChecked(w, 'parent')).toBe(false);
    w.unmount();
  });

  it('#16.1 [D] 对象形态 checkedKeys：base 取 props 原值而非内部派生态', async () => {
    const checkedKeys: TreeCheckedKeys = { checked: ['c1'], halfChecked: ['p'] };
    const w = mount(Tree, {
      props: {
        treeData: [
          {
            key: 'p',
            title: 'parent',
            children: [
              { key: 'c1', title: 'child-1' },
              { key: 'c2', title: 'child-2' },
            ],
          },
        ] as DataNode[],
        checkable: true,
        expandedKeys: ['p', 'c1'],
        checkedKeys,
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'child-1')).toBe(true);
    expect(isHalf(w, 'parent')).toBe(true);

    // c1 变成父节点 ⇒ 勾c1 应传导到它的子节点 g1
    await w.setProps({
      treeData: [
        {
          key: 'p',
          title: 'parent',
          children: [
            { key: 'c1', title: 'child-1', children: [{ key: 'g1', title: 'grand-1' }] },
            { key: 'c2', title: 'child-2' },
          ],
        },
      ] as DataNode[],
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(w.text()).toContain('grand-1');
    expect(isChecked(w, 'grand-1')).toBe(true);
    expect(isHalf(w, 'parent')).toBe(true);
    w.unmount();
  });

  it('#16.1 [E] 受控值后续变更仍然优先生效（不回归）', async () => {
    const w = mount(Tree, {
      props: {
        treeData: initialLeafParent,
        checkable: true,
        expandedKeys: ['p'],
        checkedKeys: ['p'] as SafeKey[],
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'child-1')).toBe(true);

    await w.setProps({ checkedKeys: [] as SafeKey[] });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'parent')).toBe(false);
    expect(isChecked(w, 'child-1')).toBe(false);
    expect(isChecked(w, 'child-2')).toBe(false);
    w.unmount();
  });

  it('#16.1 [F] 非受控 defaultCheckedKeys + treeData 增长仍然级联（既有行为守卫）', async () => {
    const w = mount(Tree, {
      props: {
        treeData: initialLeafParent,
        checkable: true,
        expandedKeys: ['p'],
        defaultCheckedKeys: ['p'],
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'parent')).toBe(true);

    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));
    expect(isChecked(w, 'child-1')).toBe(true);
    expect(isChecked(w, 'child-2')).toBe(true);
    w.unmount();
  });

  it('#16.1 [G] checkStrictly：treeData 增长不做级联导电', async () => {
    const w = mount(Tree, {
      props: {
        treeData: initialLeafParent,
        checkable: true,
        checkStrictly: true,
        expandedKeys: ['p'],
        checkedKeys: ['p'] as SafeKey[],
      },
      global: globalCfg,
    });
    await new Promise((r) => setTimeout(r, 0));
    await w.setProps({ treeData: grownParent });
    await new Promise((r) => setTimeout(r, 0));

    expect(isChecked(w, 'parent')).toBe(true);
    expect(isChecked(w, 'child-1')).toBe(false);
    expect(isChecked(w, 'child-2')).toBe(false);
    expect(isHalf(w, 'parent')).toBe(false);
    w.unmount();
  });
});
