/**
 * Issue #13 批量修复的回归（tree-select）。
 *
 * 与 #12（cascader）是**同一族**：把 React「每次渲染 / 单键语义」搬进 Vue 时，
 * 在无编译期保护的键合并（对象展开）与 getter 上踩坑。
 *
 * 1. [#13.1] 末尾 `...attrs` 覆盖内部持有的 BaseSelect 事件；
 * 2. [#13.2] `allCheckedNodes` 的二次 getter 读自己 ⇒ 访问即栈溢出；
 * 3. [#13.3] 单选 + `labelInValue` 的 `update:value` 发出**数组**而不是单值；
 * 4. [#13.4] size / direction / getPopupContainer 不回退 ConfigProvider。
 */

import { config, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { TreeSelect } from '../index';

config.global.stubs = { ...config.global.stubs, teleport: false };

const TREE_DATA = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1' },
    ],
  },
  { title: 'parent 2', value: '0-1' },
];

const P = { prefixCls: 'apollo-tree-select' };

const mountOpen = async (
  props: Record<string, unknown> = {},
  attrs: Record<string, unknown> = {},
) => {
  const w = mount(TreeSelect, {
    props: { ...P, treeData: TREE_DATA, open: true, treeDefaultExpandAll: true, ...props },
    attrs,
    attachTo: document.body,
  });
  await nextTick();
  await nextTick();
  return w;
};

const nodeWrappers = () => document.querySelectorAll('.apollo-tree-select-node-content-wrapper');

/** 勾选框（与既有 `tree-select.test.ts` 同判：外层 -checkbox span 的 onClick=onCheck）。 */
const checkboxes = () => document.querySelectorAll('[role="checkbox"]');

describe('Issue #13.1 · 内部事件不被 attrs 覆盖', () => {
  it('★ attrs 传 `onOpenChange`：内部开合仍然跑 + 用户回调调一次', async () => {
    const onOpenChange = vi.fn();
    const w = mount(TreeSelect, {
      props: { ...P, treeData: TREE_DATA },
      attrs: { onOpenChange },
      attachTo: document.body,
    });
    await nextTick();

    // ⚠️ 触发点击挂在**根**上（与既有 `tree-select.test.ts` / cascader 测试同判）
    await w.find('.apollo-tree-select').trigger('click');
    await nextTick();
    await nextTick();

    expect(
      document.querySelectorAll('.apollo-tree-select-dropdown').length,
      '内部 setOpen 必须仍然生效',
    ).toBeGreaterThan(0);
    expect(onOpenChange, '用户回调不能重复调用').toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ attrs 传 `onSearch`：内部 searchValue 仍然更新（不是只调用户的）', async () => {
    const onSearch = vi.fn();
    const w = await mountOpen({ showSearch: true }, { onSearch });

    await w.find('input').setValue('leaf');
    await nextTick();

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(w.emitted('update:searchValue')?.at(-1)?.[0], '内部 setSearchValue 必须仍然跑').toBe(
      'leaf',
    );
    w.unmount();
  });
});

describe('Issue #13.2 · allCheckedNodes 不递归', () => {
  it('★ 访问 `extra.allCheckedNodes` 不抛 RangeError', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      multiple: true,
      treeCheckable: true,
      // `treeCheckStrictly` ⇒ `showPosition = false` ⇒ 走「纯节点」分支（原递归点）
      treeCheckStrictly: true,
      onChange,
    });

    (checkboxes()[0] as HTMLElement).click();
    await nextTick();

    const extra = onChange.mock.calls.at(-1)?.[2] as { allCheckedNodes?: unknown };
    let nodes: unknown;
    expect(() => {
      nodes = extra.allCheckedNodes;
    }, '此前是 self-referential getter ⇒ RangeError').not.toThrow();
    expect(Array.isArray(nodes)).toBe(true);
    w.unmount();
  });

  it('★ `treeCheckStrictly` 分支返回**纯节点**（不带 `pos`）', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      multiple: true,
      treeCheckable: true,
      treeCheckStrictly: true,
      onChange,
    });
    (checkboxes()[0] as HTMLElement).click();
    await nextTick();

    const extra = onChange.mock.calls.at(-1)?.[2] as {
      allCheckedNodes?: { pos?: string; value?: string }[];
    };
    const nodes = extra.allCheckedNodes ?? [];
    expect(nodes.length).toBeGreaterThan(0);
    expect(
      nodes.every((n) => !('pos' in n)),
      'showPosition=false ⇒ 剥掉 pos',
    ).toBe(true);
    w.unmount();
  });

  it('★ 反向哨兵：默认分支（带位置）仍然返回带 `pos` 的节点', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({ treeCheckable: true, onChange });
    (checkboxes()[0] as HTMLElement).click();
    await nextTick();

    const extra = onChange.mock.calls.at(-1)?.[2] as {
      allCheckedNodes?: { pos?: string }[];
    };
    expect((extra.allCheckedNodes ?? []).some((n) => 'pos' in n)).toBe(true);
    w.unmount();
  });
});

describe('Issue #13.3 · 单选 labelInValue 的值形态', () => {
  it('★ 单选 + labelInValue ⇒ `update:value` 是**单个对象**', async () => {
    const w = await mountOpen({ labelInValue: true });
    (nodeWrappers()[1] as HTMLElement).click();
    await nextTick();

    const val = w.emitted('update:value')?.at(-1)?.[0] as
      | { value: string; label: string }
      | { value: string; label: string }[];
    expect(Array.isArray(val), '单选不该是数组').toBe(false);
    expect(val).toMatchObject({ value: '0-0-0', label: 'leaf 1' });
    w.unmount();
  });

  it('★ 多选 + labelInValue ⇒ 仍是数组（不回退）', async () => {
    const w = await mountOpen({ multiple: true, labelInValue: true });
    (nodeWrappers()[1] as HTMLElement).click();
    await nextTick();

    const val = w.emitted('update:value')?.at(-1)?.[0] as { value: string; label: string }[];
    expect(Array.isArray(val)).toBe(true);
    expect(val[0]).toMatchObject({ value: '0-0-0', label: 'leaf 1' });
    w.unmount();
  });

  it('★ 单选 + labelInValue：`onChange` 首参也是单值（两通道一致）', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({ labelInValue: true, onChange });
    (nodeWrappers()[1] as HTMLElement).click();
    await nextTick();
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: '0-0-0', label: 'leaf 1' });
    w.unmount();
  });
});

describe('Issue #13.4 · ConfigProvider 的 size / direction / popup 容器', () => {
  it('★ ConfigProvider `componentSize="small"` ⇒ 根带 `-sm`', () => {
    const w = mount(ConfigProvider, {
      props: { componentSize: 'small' },
      slots: { default: () => h(TreeSelect, { ...P, treeData: TREE_DATA }) },
    });
    expect(w.find('.apollo-tree-select').classes()).toContain('apollo-tree-select-sm');
    w.unmount();
  });

  it('★ ConfigProvider `direction="rtl"` ⇒ 根带 `-rtl`', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(TreeSelect, { ...P, treeData: TREE_DATA }) },
    });
    expect(w.find('.apollo-tree-select').classes()).toContain('apollo-tree-select-rtl');
    w.unmount();
  });

  it('★ 局部 `direction` 覆盖全局（局部优先）', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(TreeSelect, { ...P, treeData: TREE_DATA, direction: 'ltr' }) },
    });
    expect(w.find('.apollo-tree-select').classes()).not.toContain('apollo-tree-select-rtl');
    w.unmount();
  });

  it('★ 不传任何一方 ⇒ 仍是 ltr 默认（零行为变化）', () => {
    const w = mount(TreeSelect, { props: { ...P, treeData: TREE_DATA } });
    expect(w.find('.apollo-tree-select').classes()).not.toContain('apollo-tree-select-rtl');
    w.unmount();
  });

  it('★ ConfigProvider `getPopupContainer` 生效（局部没给时回退全局）', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const w = mount(ConfigProvider, {
      props: { getPopupContainer: () => host },
      slots: {
        default: () => h(TreeSelect, { ...P, treeData: TREE_DATA, open: true }),
      },
      attachTo: document.body,
    });
    await nextTick();
    await nextTick();

    expect(host.querySelector('.apollo-tree-select-dropdown')).not.toBeNull();
    w.unmount();
    host.remove();
  });
});
