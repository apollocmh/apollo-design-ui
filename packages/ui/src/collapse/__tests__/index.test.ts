/**
 * L1/L2 · 单元与交互 —— Collapse
 *
 * 判据：rc `@rc-component/collapse@1.2.0` 的 Collapse 状态机 / useItems /
 * Panel / PanelContent + antd 薄壳的告警与默认值。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { getActiveKeysArray } from '../engine';
import { Collapse } from '../index';

const ITEMS = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
];

const makeCollapse = (props: Record<string, unknown> = {}) =>
  mount(Collapse, { props: { items: ITEMS, ...props } });

describe('Collapse · engine', () => {
  it('getActiveKeysArray：数组/单值/undefined 三态（全部 string 化）', () => {
    expect(getActiveKeysArray(['a', 2])).toEqual(['a', '2']);
    expect(getActiveKeysArray('1')).toEqual(['1']);
    expect(getActiveKeysArray(3)).toEqual(['3']);
    expect(getActiveKeysArray(undefined)).toEqual([]);
  });
});

describe('Collapse · 状态机', () => {
  it('非受控：点击 header 切换展开；onChange/change 收到 string[]', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ onChange });
    const headers = w.findAll('.apollo-collapse-header');
    await headers[0]!.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalledWith(['1']);
    expect(w.findAll('.apollo-collapse-item-active')).toHaveLength(1);
    // 再点收起
    await headers[0]!.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('受控 activeKey：不随点击改变内部展示（受控语义）', async () => {
    const w = makeCollapse({ activeKey: ['2'] });
    expect(w.findAll('.apollo-collapse-item-active')).toHaveLength(1);
    await w.findAll('.apollo-collapse-header')[0]!.trigger('click');
    await nextTick();
    // 受控：activeKey 未变 ⇒ 仍然是 key 2 展开
    expect(w.findAll('.apollo-collapse-item-active')).toHaveLength(1);
    expect(w.text()).toContain('Content 2');
  });

  it('accordion：同时只展开一个', async () => {
    const w = makeCollapse({ accordion: true, defaultActiveKey: '1' });
    const headers = w.findAll('.apollo-collapse-header');
    expect(w.findAll('.apollo-collapse-item-active')).toHaveLength(1);
    await headers[1]!.trigger('click');
    await nextTick();
    // ⚠️ motion 离场是异步的 ⇒ 立即断言 aria-expanded 即时态（卸载时间线由 motion 包覆盖）
    const expanded = w.findAll('.apollo-collapse-header').map((n) => n.attributes('aria-expanded'));
    expect(expanded).toEqual(['false', 'true']);
  });

  it('key 数字/string 混合（string 化匹配）', () => {
    const w = mount(Collapse, {
      props: {
        items: [
          { key: 1, label: 'H1', children: 'C1' },
          { key: 2, label: 'H2', children: 'C2' },
        ],
        defaultActiveKey: 1,
      },
    });
    expect(w.text()).toContain('C1');
  });

  it('collapsible=disabled：点击被吞、aria-disabled、tabindex=-1', async () => {
    const onChange = vi.fn();
    const w = makeCollapse({ collapsible: 'disabled', onChange, defaultActiveKey: '1' });
    const header = w.findAll('.apollo-collapse-header')[0]!;
    // antd 语义：aria-disabled = (collapsible==='disabled')，与是否展开无关
    expect(header.attributes('aria-disabled')).toBe('true');
    await header.trigger('click');
    await nextTick();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('collapsible=header：可交互 props 落在 title 上', () => {
    const w = makeCollapse({ collapsible: 'header' });
    const title = w.find('.apollo-collapse-title');
    expect(title.attributes('role')).toBe('button');
    const header = w.find('.apollo-collapse-header');
    expect(header.attributes('role')).toBeUndefined();
  });

  it('collapsible=icon：可交互 props 落在 expand-icon 上', () => {
    const w = makeCollapse({ collapsible: 'icon' });
    expect(w.find('.apollo-collapse-expand-icon').attributes('role')).toBe('button');
    expect(w.find('.apollo-collapse-header').attributes('role')).toBeUndefined();
  });

  it('PanelContent 惰性渲染：展开过就保留（收起后内容仍在 DOM）', async () => {
    const w = makeCollapse({ defaultActiveKey: '1' });
    expect(w.text()).toContain('Content 1');
    await w.findAll('.apollo-collapse-header')[0]!.trigger('click');
    await nextTick();
    // 收起后 forceRender=false 但 rendered 已固化 ⇒ 内容仍渲染（motion 收起）
    expect(w.text()).toContain('Content 1');
  });

  it('destroyOnHidden ⇒ CSSMotion removeOnLeave（aria 即时态；卸载时序由 motion 包覆盖）', async () => {
    const w = makeCollapse({ defaultActiveKey: '1', destroyOnHidden: true });
    await w.findAll('.apollo-collapse-header')[0]!.trigger('click');
    await nextTick();
    expect(w.findAll('.apollo-collapse-header')[0]!.attributes('aria-expanded')).toBe('false');
  });

  it('items 覆盖链：item.collapsible 优先于 Collapse.collapsible', () => {
    const w = makeCollapse({
      collapsible: 'disabled',
      items: [
        { key: '1', label: 'H1', children: 'C1', collapsible: 'header' },
        { key: '2', label: 'H2', children: 'C2' },
      ],
    });
    // item1 覆盖为 header ⇒ title 可交互；item2 继承 disabled
    expect(w.find('.apollo-collapse-title').attributes('role')).toBe('button');
  });

  it('expandIcon 定制：函数回调收到 panelProps', () => {
    const expandIcon = vi.fn(
      (_p: { isActive?: boolean; prefixCls?: string; collapsible?: string }) =>
        h('span', { class: 'my-icon' }, 'ICON'),
    );
    const w = makeCollapse({ expandIcon, defaultActiveKey: '1' });
    expect(expandIcon).toHaveBeenCalled();
    expect(expandIcon.mock.calls[0]?.[0]?.isActive).toBe(true);
    void 0;
    // -arrow 类由 cloneVNode 追加（antd cloneElement 同义）
    expect(w.find('.my-icon').classes()).toContain('apollo-collapse-arrow');
  });

  it('deprecated 告警：destroyInactivePanel / expandIconPosition', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    makeCollapse({ destroyInactivePanel: true, expandIconPosition: 'end' });
    expect(warn.mock.calls.length + error.mock.calls.length).toBeGreaterThan(0);
    warn.mockRestore();
    error.mockRestore();
  });

  it('attrs 透传（aria/data）到根节点', () => {
    const w = mount(Collapse, {
      props: { items: ITEMS },
      attrs: { 'data-x': '1', 'aria-label': 'faq' },
    });
    const root = w.find('.apollo-collapse');
    expect(root.attributes('data-x')).toBe('1');
    expect(root.attributes('aria-label')).toBe('faq');
  });

  it('ref.nativeElement 指向根元素', () => {
    const w = makeCollapse();
    const exposed = (w.vm as unknown as { nativeElement?: HTMLElement | null }).nativeElement;
    expect(exposed).toBeInstanceOf(HTMLElement);
  });

  it('size 类名映射（small/large）', () => {
    expect(makeCollapse({ size: 'small' }).find('.apollo-collapse-small').exists()).toBe(true);
    expect(makeCollapse({ size: 'large' }).find('.apollo-collapse-large').exists()).toBe(true);
  });
});
