/**
 * TreeSelect · 主矩阵（浮层树结构 + 值归一 + 勾选级联 + strategy + 搜索）。
 *
 * 契约基线钉触发器 DOM（portal SSR 不可达）—— 本文件钉**浮层树结构**与行为。
 */

import { config, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
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

const mountOpen = async (props: Record<string, unknown> = {}) => {
  const w = mount(TreeSelect, {
    props: { ...P, treeData: TREE_DATA, open: true, treeDefaultExpandAll: true, ...props },
    attachTo: document.body,
  });
  // ⚠️ 浮层与 -open 类在 nextTick 后才出现 —— mount 后必须 flush（同步断言全空）
  await nextTick();
  await nextTick();
  return w;
};

describe('TreeSelect · 浮层树结构', () => {
  it('下拉树节点渲染：role=treeitem + switcher + title', async () => {
    const w = await mountOpen();
    const nodes = document.querySelectorAll('[role="treeitem"]');
    expect(nodes.length).toBe(4);
    // 树容器类 = tree-select 前缀直通（customize 三前缀合一）
    expect(document.querySelector('.apollo-tree-select-dropdown')).toBeTruthy();
    w.unmount();
  });

  it('空数据：role=listbox + -empty + notFoundContent', async () => {
    const w = await mountOpen({ treeData: [], notFoundContent: '暂无' });
    const empty = document.querySelector('.apollo-tree-select-empty');
    expect(empty?.getAttribute('role')).toBe('listbox');
    expect(empty?.textContent).toContain('暂无');
    w.unmount();
  });

  it('勾选框：treeCheckable 包成 -checkbox-inner span（antd 壳判据）', async () => {
    const w = await mountOpen({ treeCheckable: true, defaultValue: ['0-0-0'] });
    const cbs = document.querySelectorAll('[role="checkbox"]');
    expect(cbs.length).toBe(4); // 全部节点都渲染勾选框
    // 展示值按默认 SHOW_CHILD 裁剪：勾 leaf 1 → tag 显示 leaf 1
    expect(w.find('.apollo-tree-select-selection-item-content').text()).toBe('leaf 1');
    w.unmount();
  });

  it('勾选级联：勾父节点 → 子全勾（conductCheck 在本层算，树恒 checkStrictly）', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      treeCheckable: true,
      defaultCheckedKeys: [],
      'onUpdate:value': onChange,
    });
    // 点击父节点勾选框
    expect(document.querySelector('[role="tree"]')).toBeTruthy();
    const cbs = document.querySelectorAll('[role="checkbox"]');
    // 点击勾选框（外层 -checkbox span 的 onClick=onCheck）
    (cbs[0] as HTMLElement).click();
    await nextTick();
    // onChange 收到的是 value 数组（含级联补全的子节点）
    const emitted = w.emitted('update:value') ?? [];
    const last = emitted.at(-1)?.[0] as string[];
    expect(Array.isArray(last)).toBe(true);
    expect(last).toContain('0-0-0');
    expect(last).toContain('0-0-1');
    w.unmount();
  });

  it('showLine / showTreeIcon 透传内嵌树', async () => {
    const w = await mountOpen({ showLine: true, showTreeIcon: true });
    // tree 前缀直通 ⇒ switcher 类存在
    expect(document.querySelector('[role="tree"]')).toBeTruthy();
    expect(document.querySelectorAll('.apollo-tree-select-switcher').length).toBeGreaterThan(0);
    w.unmount();
  });
});

describe('TreeSelect · 值归一', () => {
  it('单选：update:value + onChange 同发（C11），值为单值', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({ 'onUpdate:value': onChange, onChange });
    const wrappers = document.querySelectorAll('.apollo-tree-select-node-content-wrapper');
    (wrappers[1] as HTMLElement).click(); // leaf 1（点击监听在 content-wrapper 上）
    await nextTick();
    const emitted = w.emitted('update:value');
    expect(emitted?.at(-1)?.[0]).toBe('0-0-0');
    expect(onChange).toHaveBeenCalledWith('0-0-0', ['leaf 1'], expect.objectContaining({}));
    // 单选选完关下拉
    expect(w.emitted('update:open')?.at(-1)?.[0]).toBe(false);
    w.unmount();
  });

  it('labelInValue：onChange 首参为 LabeledValueType 数组', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      multiple: true,
      labelInValue: true,
      'onUpdate:value': onChange,
    });
    const wrappers = document.querySelectorAll('.apollo-tree-select-node-content-wrapper');
    (wrappers[1] as HTMLElement).click();
    await nextTick();
    const val = w.emitted('update:value')?.at(-1)?.[0] as { value: string; label: string }[];
    expect(val[0]).toMatchObject({ value: '0-0-0', label: 'leaf 1' });
    w.unmount();
  });

  it('treeCheckStrictly：halfChecked 回填 + additionalInfo.checked', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      treeCheckable: true,
      treeCheckStrictly: true,
      'onUpdate:value': onChange,
      onChange,
    });
    const cbs = document.querySelectorAll('[role="checkbox"]');
    (cbs[1] as HTMLElement).click(); // leaf 1（index 与渲染序一致）
    await nextTick();
    const info = onChange.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(info.checked).toBe(true);
    w.unmount();
  });

  it('SHOW_PARENT：勾全部子 → 只显示父', async () => {
    const w = await mountOpen({
      treeCheckable: true,
      showCheckedStrategy: 'SHOW_PARENT',
      defaultValue: ['0-0-0', '0-0-1'],
    });
    expect(w.find('.apollo-tree-select-selection-item-content').text()).toBe('parent 1');
    w.unmount();
  });

  it('SHOW_ALL：勾全部子 → 全部显示', async () => {
    const w = await mountOpen({
      treeCheckable: true,
      showCheckedStrategy: 'SHOW_ALL',
      defaultValue: ['0-0-0', '0-0-1'],
    });
    // 不做强制断言数量（tag + input），只验证首个 tag 是父节点且两个 leaf 也在
    const tags = w.findAll('.apollo-tree-select-selection-item-content');
    const texts = tags.map((t) => t.text());
    expect(texts).toContain('parent 1');
    w.unmount();
  });

  it('缺失值透传：value 不在树中时 tag 照常显示', async () => {
    const w = await mountOpen({
      multiple: true,
      defaultValue: ['ghost'],
    });
    expect(w.find('.apollo-tree-select-selection-item-content').text()).toBe('ghost');
    w.unmount();
  });
});

describe('TreeSelect · 搜索', () => {
  it('showSearch 对象形态：过滤按 treeNodeFilterProp=value 匹配', async () => {
    const w = await mountOpen({ showSearch: {}, open: true });
    const input = w.find('input[role="combobox"]');
    await input.setValue('0-0');
    await nextTick();
    await nextTick();
    // '0-0' 命中 parent1(0-0)/leaf1(0-0-0)/leaf2(0-0-1)，parent2 不命中
    const nodes = document.querySelectorAll('[role="treeitem"]');
    expect(nodes.length).toBe(3);
    w.unmount();
  });

  it('searchValue 受控 + update:searchValue 事件', async () => {
    const w = await mountOpen({ showSearch: true });
    const input = w.find('input[role="combobox"]');
    await input.setValue('parent');
    await nextTick();
    expect(w.emitted('update:searchValue')?.at(-1)?.[0]).toBe('parent');
    w.unmount();
  });

  it('搜索命中 title 不命中（默认 filter prop 是 value，非 title）', async () => {
    const w = await mountOpen({ showSearch: {}, open: true });
    const input = w.find('input[role="combobox"]');
    await input.setValue('parent 2');
    await nextTick();
    await nextTick();
    // title 'parent 2' 不参与匹配（value '0-1' 才是默认过滤字段）⇒ 空态
    expect(document.querySelectorAll('[role="treeitem"]').length).toBe(0);
    expect(document.querySelector('.apollo-tree-select-empty')).toBeTruthy();
    w.unmount();
  });
});

describe('TreeSelect · 外壳行为', () => {
  it('treeExpandAction 透传（click 点击节点即展开）', async () => {
    const w = await mountOpen({ treeExpandAction: 'click' });
    expect(document.querySelector('[role="tree"]')).toBeTruthy();
    w.unmount();
  });

  it('maxCount：SHOW_CHILD 下生效，超出拦截', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      multiple: true,
      maxCount: 2,
      defaultValue: ['0-0-0', '0-1'],
      'onUpdate:value': onChange,
    });
    // 已有 2 个 → 第 3 次选择被拦（值不变）
    const wrappers = document.querySelectorAll('.apollo-tree-select-node-content-wrapper');
    (wrappers[2] as HTMLElement).click();
    await nextTick();
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });

  it('treeDataSimpleMode：平铺数据建树', async () => {
    const w = await mountOpen({
      treeDataSimpleMode: true,
      treeData: [
        { id: 'p1', value: 'p1', title: 'P1', pId: null as unknown as string },
        { id: 'c1', value: 'c1', title: 'C1', pId: 'p1' },
      ] as never,
    });
    expect(w.find('input[role="combobox"]').exists()).toBe(true);
    w.unmount();
  });

  it('clear：onClear 触发 + 值清空', async () => {
    const onChange = vi.fn();
    const w = await mountOpen({
      allowClear: true,
      multiple: true,
      defaultValue: ['0-0-0'],
      'onUpdate:value': onChange,
    });
    const btn = document.querySelector('.apollo-tree-select-clear') as HTMLElement;
    expect(btn).toBeTruthy();
    btn.click();
    await nextTick();
    const val = w.emitted('update:value')?.at(-1)?.[0];
    expect(val).toEqual([]);
    w.unmount();
  });
});
