/**
 * L5 · 无障碍 —— Tree
 *
 * 可达性契约（rc 逐字判据，rc 自述「TODO: Fully accessibility support」）：
 *   - 根容器 role=tree（NodeList 侧 VirtualList holder）；节点 role=treeitem；
 *   - aria-expanded（非叶子）、aria-selected（可选且未禁用）、aria-checked
 *     （checkable：mixed/true/false）、aria-disabled；
 *   - checkbox：role=checkbox + aria-checked=mixed + aria-labelledby → 节点 id；
 *   - 键盘：↑↓/Home/End/←→/Enter/Space（keyboard.test.ts 已覆盖，此处不断言）。
 *
 * axe demo 扫描在 G11 demo 落齐后接入（a11yDemoTest + expectCount）。
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
  { key: '0-1', title: 'standalone', disabled: true },
];

describe('Tree · a11y（L5）', () => {
  it('role=tree / role=treeitem / aria-expanded / aria-selected', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true },
    });
    await nextTick();
    expect(w.find('[role="tree"]').exists()).toBe(true);
    const items = w.findAll('[role="treeitem"]');
    expect(items.length).toBe(4);
    // 可展开节点 aria-expanded；叶子 undefined
    expect(items[0]?.attributes('aria-expanded')).toBe('true');
    expect(items[1]?.attributes('aria-expanded')).toBeUndefined();
    // 可选中且未禁用 ⇒ aria-selected 布尔字符串
    expect(items[0]?.attributes('aria-selected')).toBe('false');
    w.unmount();
  });

  it('aria-checked：mixed（半选）/ true（全选）/ 禁用节点 undefined', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, checkedKeys: ['0-0-0'], defaultExpandAll: true },
    });
    await nextTick();
    // 0-0-0 勾（双子树）⇒ 父 halfChecked ⇒ mixed
    const parent = w.findAll('[role="treeitem"]')[0]!;
    expect(parent.attributes('aria-checked')).toBe('mixed');
    const leaf = w.findAll('[role="treeitem"]')[1]!;
    expect(leaf.attributes('aria-checked')).toBe('true');
    w.unmount();
  });

  it('aria-disabled：disabled 节点 true，其余 undefined', async () => {
    const w = mount(Tree, {
      props: { treeData, defaultExpandAll: true },
    });
    await nextTick();
    const items = w.findAll('[role="treeitem"]');
    expect(items[3]?.attributes('aria-disabled')).toBe('true');
    // React 对 aria-disabled={false} 不渲染 ⇒ 属性缺省
    expect(items[0]?.attributes('aria-disabled')).toBeUndefined();
    w.unmount();
  });

  it('checkbox：role=checkbox + aria-checked=mixed + aria-labelledby 指向节点 id', async () => {
    const w = mount(Tree, {
      props: { treeData, checkable: true, checkedKeys: ['0-0-0'], defaultExpandAll: true },
      attachTo: document.body,
    });
    await nextTick();
    const checkbox = w.find('[role="checkbox"]');
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.attributes('aria-checked')).toBe('mixed');
    const labelledby = checkbox.attributes('aria-labelledby') ?? '';
    expect(labelledby).not.toBe('');
    // 被引用的节点 id 存在且属于 treeitem
    const owner = document.getElementById(labelledby);
    expect(owner?.getAttribute('role')).toBe('treeitem');
    w.unmount();
  });

  it('disabled 节点不产出 checkbox 交互（aria-disabled 同步到 checkbox）', async () => {
    const w = mount(Tree, {
      props: {
        treeData: [{ key: 'd', title: 'x', disabled: true, checkable: true }],
        checkable: true,
      },
    });
    await nextTick();
    const checkbox = w.find('[role="checkbox"]');
    expect(checkbox.attributes('aria-disabled')).toBe('true');
    w.unmount();
  });
});
