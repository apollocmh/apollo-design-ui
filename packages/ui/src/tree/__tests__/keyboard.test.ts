/**
 * Tree · L2 键盘（G6）。
 *
 * 判据：rc Tree.js :1014-1129 键盘 switch 全套（docs/analysis/tree.md §2.4）：
 * ↑↓ 移动 active、Home/End 首/尾、← 收起/回父、→ 展开/进首子、
 * Enter 展开优先（可勾选⇒勾选）、Space 勾/选对称；disabled 整段 return。
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

/** 挂载一棵全展开树并触发 keydown。 */
async function setup(props: Record<string, unknown> = {}) {
  const w = mount(Tree, {
    props: { treeData, defaultExpandAll: true, ...props },
    attachTo: document.body,
  });
  await nextTick();
  return w;
}

// ⚠️ 用原生 KeyboardEvent 派发 —— vue-test-utils 的 trigger 会把 `key: ' '`
//    规范成 'Space'，而 rc 的键盘判据是 `case ' '`（浏览器真实行为也是 ' '）。
//    另：本环境 jsdom 探测为「支持 CSS 动画」，展开动效等不到 animationend ⇒
//    active 节点会困在哨兵动画容器内（rc 同判：容器内节点不带 active）——
//    断言 DOM 前需手动派发 animationend 收尾动效。
function endExpandMotion(): void {
  document
    .querySelectorAll('.apollo-tree-treenode-motion')
    .forEach((el) => {
      el.dispatchEvent(new Event('animationend', { bubbles: true }));
    });
}
const press = async (
  w: ReturnType<typeof mount>,
  key: string,
  opts: Record<string, unknown> = {},
) => {
  w.find('[role="tree"]').element.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...opts }),
  );
  await nextTick();
};
const activeKey = (w: ReturnType<typeof mount>) => w.find('.apollo-tree-treenode-active').text();

describe('Tree · 键盘导航', () => {
  it('↓ ⇒ active 到首个节点；再 ↓ ⇒ 第二个', async () => {
    const w = await setup();
    await press(w, 'ArrowDown');
    expect(activeKey(w)).toBe('parent');
    await press(w, 'ArrowDown');
    expect(activeKey(w)).toBe('leaf-0');
    w.unmount();
  });

  it('↑ 在末尾回绕（offsetActiveKey 取模）', async () => {
    const w = await setup();
    await press(w, 'End');
    expect(activeKey(w)).toBe('standalone');
    await press(w, 'ArrowUp');
    expect(activeKey(w)).toBe('leaf-1');
    w.unmount();
  });

  it('Home / End ⇒ 首 / 尾', async () => {
    const w = await setup();
    await press(w, 'End');
    expect(activeKey(w)).toBe('standalone');
    await press(w, 'Home');
    expect(activeKey(w)).toBe('parent');
    w.unmount();
  });

  it('←：已展开 ⇒ 收起；叶子 ⇒ active 回父', async () => {
    const w = await setup();
    await press(w, 'ArrowDown');
    await press(w, 'ArrowDown');
    expect(activeKey(w)).toBe('leaf-0');
    await press(w, 'ArrowLeft');
    expect(activeKey(w)).toBe('parent');
    // 再 ←：parent 已展开 ⇒ 收起
    await press(w, 'ArrowLeft');
    expect(w.emitted('update:expandedKeys')?.at(-1)).toEqual([[]]);
    w.unmount();
  });

  it('→：未展开 ⇒ 展开；已展开 ⇒ active 进首子', async () => {
    const w = await setup({ defaultExpandAll: false });
    await press(w, 'ArrowDown');
    await press(w, 'ArrowRight');
    expect(w.emitted('update:expandedKeys')?.[0]).toEqual([['0-0']]);
    // 展开后 → 进首子（motion 期间 active 节点在哨兵动画容器内 —— rc 同判，
    // 手动收尾动效后再断言）
    endExpandMotion();
    await nextTick();
    await press(w, 'ArrowRight');
    // 展开后 → 进首子。⚠️ 断言走事件契约：jsdom 探测为「支持 CSS 动画」但
    //    动画事件永不派发 ⇒ active 节点滞留在哨兵动画容器内（rc 同判：容器内
    //    节点不带 active 类）—— DOM 类名断言在无头环境不可行，事件面已完整
    //    覆盖状态机（activeChange 序列 ['0-0'] → ['0-0-0']）。
    expect(w.emitted('activeChange')?.at(-1)).toEqual(['0-0-0']);
    expect(w.emitted('update:activeKey')?.at(-1)).toEqual(['0-0-0']);
    w.unmount();
  });

  it('Enter：叶子且 checkable ⇒ 勾选；selectable ⇒ 选中', async () => {
    const w1 = await setup({ checkable: true });
    await press(w1, 'ArrowDown');
    await press(w1, 'ArrowDown');
    await press(w1, 'Enter');
    expect(w1.emitted('update:checkedKeys')?.[0]).toEqual([['0-0-0']]);
    w1.unmount();

    const w2 = await setup();
    await press(w2, 'ArrowDown');
    await press(w2, 'ArrowDown');
    await press(w2, 'Enter');
    expect(w2.emitted('update:selectedKeys')?.[0]).toEqual([['0-0-0']]);
    w2.unmount();
  });

  it('Space：checkable ⇒ 翻转勾选（勾父走级联，再 Space 全清）', async () => {
    const w = await setup({ checkable: true });
    await press(w, 'ArrowDown');
    await press(w, 'Space');
    const first = [...((w.emitted('update:checkedKeys')?.[0]?.[0] as string[]) ?? [])].sort();
    expect(first).toEqual(['0-0', '0-0-0', '0-0-1']);
    await press(w, 'Space');
    expect(w.emitted('update:checkedKeys')?.[1]).toEqual([[]]);
    w.unmount();
  });

  it('disabled ⇒ 整段键盘失效', async () => {
    const w = await setup({ disabled: true });
    await press(w, 'ArrowDown');
    expect(w.find('.apollo-tree-treenode-active').exists()).toBe(false);
    w.unmount();
  });

  it('checkable 时 Enter/Space 不做选中（canSelect = !checkable）', async () => {
    const w = await setup({ checkable: true });
    await press(w, 'ArrowDown');
    await press(w, 'Space');
    expect(w.emitted('update:selectedKeys')).toBeUndefined();
    w.unmount();
  });
});
