/**
 * L1/L2 · 单元测试（Tag / CheckableTag / CheckableTagGroup）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 事件：click（Tag/CheckableTag）、close（close-icon）、键盘（CheckableTag 空格）、
 * Group 的 onChange。「prop 更新 → DOM」「事件 → 值变化」都在这里钉死。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { CheckableTag, CheckableTagGroup, Tag } from '../index';

describe('Tag · 结构', () => {
  it('根类名 + variant + 预设色类', () => {
    const w = mount(Tag, { props: { color: 'success' } });
    const cls = w.find('.apollo-tag').classes();
    expect(cls).toContain('apollo-tag-filled');
    expect(cls).toContain('apollo-tag-success');
    const w2 = mount(Tag, { props: { color: 'blue', variant: 'solid' } });
    expect(w2.find('.apollo-tag').classes()).toContain('apollo-tag-blue');
    expect(w2.find('.apollo-tag').classes()).toContain('apollo-tag-solid');
  });

  it('非预设色 → 动态内联色（filled：浅底 hsl.l=0.95 + 原色文字）', () => {
    const w = mount(Tag, { props: { color: '#2db7f5' }, slots: { default: () => 'x' } });
    const style = w.find('.apollo-tag').attributes('style') ?? '';
    // antd 实测产物：backgroundColor:#e7f6fe;color:#2db7f5
    expect(style).toContain('background-color: rgb(231, 246, 254)');
    expect(style).toContain('color: rgb(45, 183, 245)');
    expect(style).not.toContain('border-color');
    // 无预设色类
    expect(w.find('.apollo-tag').classes()).not.toContain('apollo-tag-#2db7f5');
  });

  it('非预设色 solid → backgroundColor 直铺', () => {
    const w = mount(Tag, {
      props: { color: '#2db7f5', variant: 'solid' },
      slots: { default: () => 'x' },
    });
    const style = w.find('.apollo-tag').attributes('style') ?? '';
    expect(style).toContain('background-color: rgb(45, 183, 245)');
    expect(style).not.toContain('e7f6fe');
  });

  it('inverse color：-inverse 后缀 → solid 且去后缀', () => {
    const w = mount(Tag, { props: { color: 'blue-inverse' }, slots: { default: () => 'x' } });
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-solid');
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-blue');
  });

  it('bordered=false → filled（deprecated 路径）', () => {
    const w = mount(Tag, { props: { bordered: false }, slots: { default: () => 'x' } });
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-filled');
  });

  it('href → 渲染 <a>；target 透传', () => {
    const w = mount(Tag, {
      props: { href: 'https://x', target: '_blank' },
      slots: { default: () => 'x' },
    });
    expect(w.find('a.apollo-tag').exists()).toBe(true);
    expect(w.find('a.apollo-tag').attributes('href')).toBe('https://x');
    expect(w.find('a.apollo-tag').attributes('target')).toBe('_blank');
  });

  it('disabled：href 置 undefined + aria-disabled + -disabled 类', () => {
    const w = mount(Tag, {
      props: { href: 'https://x', disabled: true },
      slots: { default: () => 'x' },
    });
    expect(w.find('a.apollo-tag').attributes('href')).toBeUndefined();
    expect(w.find('a.apollo-tag').attributes('aria-disabled')).toBe('true');
    expect(w.find('a.apollo-tag').classes()).toContain('apollo-tag-disabled');
  });

  it('aria/data attrs 透传', () => {
    const w = mount(Tag, { props: { 'aria-label': 't', 'data-x': '1' } as never });
    expect(w.find('.apollo-tag').attributes('aria-label')).toBe('t');
    expect(w.find('.apollo-tag').attributes('data-x')).toBe('1');
  });
});

describe('Tag · closable', () => {
  it('closable → close-icon（role=button + tabindex + aria-label=Close）', () => {
    const w = mount(Tag, { props: { closable: true } });
    const icon = w.find('.apollo-tag-close-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('role')).toBe('button');
    expect(icon.attributes('tabindex')).toBe('0');
    expect(icon.attributes('aria-label')).toBe('Close');
  });

  it('close-icon 自定义 vnode（单层 span 保留文本 —— antd 的 replaceElement 语义）', () => {
    const w = mount(Tag, { props: { closable: true, closeIcon: h('em', null, 'x') } });
    const icon = w.find('.apollo-tag-close-icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('role')).toBe('button');
    expect(icon.text()).toBe('x');
  });

  it('关闭流程：stopPropagation → onClose → visible=false（-hidden，DOM 保留）', async () => {
    const onClose = vi.fn();
    const w = mount(Tag, { props: { closable: true, onClose } });
    const spy = vi.fn();
    await w.find('.apollo-tag-close-icon').trigger('click', { stopPropagation: spy });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalled();
    await nextTick();
    // DOM 保留 + -hidden 类
    expect(w.find('.apollo-tag').exists()).toBe(true);
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-hidden');
  });

  it('onClose 里 preventDefault → 不关闭', async () => {
    const w = mount(Tag, {
      props: { closable: true, onClose: (e: MouseEvent) => e.preventDefault() },
    });
    await w.find('.apollo-tag-close-icon').trigger('click');
    expect(w.find('.apollo-tag').classes()).not.toContain('apollo-tag-hidden');
  });

  it('disabled 时点击关闭无效', async () => {
    const onClose = vi.fn();
    const w = mount(Tag, { props: { closable: true, disabled: true, onClose } });
    await w.find('.apollo-tag-close-icon').trigger('click');
    expect(onClose).not.toHaveBeenCalled();
    expect(w.find('.apollo-tag').classes()).not.toContain('apollo-tag-hidden');
  });

  it('close-icon 键盘（Enter 触发 click → 关闭）', async () => {
    const w = mount(Tag, { props: { closable: true } });
    await w.find('.apollo-tag-close-icon').trigger('keydown', { key: 'Enter' });
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-hidden');
  });
});

describe('Tag · icon 与语义槽位', () => {
  it('icon 存在 → children 包 content 槽 + icon 克隆注入类', () => {
    const w = mount(Tag, {
      props: {
        icon: h('i', { class: 'my-icon' }),
        classNames: { icon: 'user-icon', content: 'user-content' },
      },
      slots: { default: () => 'text' },
    });
    expect(w.find('i.my-icon').classes()).toContain('user-icon');
    expect(w.find('.apollo-tag span').classes()).toContain('user-content');
    expect(w.find('.apollo-tag span').text()).toBe('text');
  });

  it('★ style prop 覆盖 styles.root（动态色在 styles.root 之前）', () => {
    const w = mount(Tag, {
      props: {
        color: '#2db7f5',
        style: { backgroundColor: 'red' },
        styles: { root: { color: 'blue' } },
      },
    });
    const style = w.find('.apollo-tag').attributes('style') ?? '';
    expect(style).toContain('background-color: red');
    expect(style).toContain('color: blue');
  });

  it('disabled 时动态色不生效（只 styles.root）', () => {
    const w = mount(Tag, {
      props: { color: '#2db7f5', disabled: true },
      slots: { default: () => 'x' },
    });
    const style = w.find('.apollo-tag').attributes('style') ?? '';
    expect(style).not.toContain('#2db7f5');
    expect(style).not.toContain('e7f6fe');
  });
});

describe('CheckableTag', () => {
  it('checkbox 语义 + checked 类', () => {
    const w = mount(CheckableTag, { props: { checked: true } });
    expect(w.find('.apollo-tag').attributes('role')).toBe('checkbox');
    expect(w.find('.apollo-tag').attributes('aria-checked')).toBe('true');
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-checkable-checked');
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-checkable');
  });

  it('点击 → onChange(!checked)', async () => {
    const onChange = vi.fn();
    const w = mount(CheckableTag, { props: { checked: false, onChange } });
    await w.find('.apollo-tag').trigger('click');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disabled：点击无效', async () => {
    const onChange = vi.fn();
    const w = mount(CheckableTag, { props: { checked: false, disabled: true, onChange } });
    await w.find('.apollo-tag').trigger('click');
    expect(onChange).not.toHaveBeenCalled();
    expect(w.find('.apollo-tag').attributes('tabindex')).toBe('-1');
  });

  it('空格键触发 onChange（Enter 不触发）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckableTag, { props: { checked: false, onChange } });
    await w.find('.apollo-tag').trigger('keydown', { key: ' ' });
    expect(onChange).toHaveBeenCalledTimes(1);
    await w.find('.apollo-tag').trigger('keydown', { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('CheckableTagGroup', () => {
  it('group 结构 + options 归一（原始值 → {value,label}）', () => {
    const w = mount(CheckableTagGroup, { props: { options: ['a', 'b'] } });
    expect(w.find('.apollo-tag-checkable-group').exists()).toBe(true);
    const items = w.findAll('.apollo-tag-checkable-group-item');
    expect(items.length).toBe(2);
    expect(items.at(0)?.text()).toBe('a');
  });

  it('单选：选中值；再点取消为 null', async () => {
    const onChange = vi.fn();
    const w = mount(CheckableTagGroup, { props: { options: ['a', 'b'], onChange } });
    await w.findAll('.apollo-tag-checkable-group-item').at(0)?.trigger('click');
    expect(onChange).toHaveBeenLastCalledWith('a');
    await w.findAll('.apollo-tag-checkable-group-item').at(0)?.trigger('click');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('multiple：数组增删', async () => {
    const onChange = vi.fn();
    const w = mount(CheckableTagGroup, {
      props: { options: ['a', 'b', 'c'], multiple: true, onChange },
    });
    const items = w.findAll('.apollo-tag-checkable-group-item');
    await items.at(0)?.trigger('click');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
    await items.at(1)?.trigger('click');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b']);
    await items.at(0)?.trigger('click');
    expect(onChange).toHaveBeenLastCalledWith(['b']);
  });

  it('受控 value 驱动 checked', () => {
    const w = mount(CheckableTagGroup, { props: { options: ['a', 'b'], value: 'b' } });
    const items = w.findAll('.apollo-tag-checkable-group-item');
    // item 自身就是 .apollo-tag（类挂根）
    expect(items.at(1)?.classes()).toContain('apollo-tag-checkable-checked');
    expect(items.at(0)?.classes()).not.toContain('apollo-tag-checkable-checked');
  });

  it('disabled 传导到 item', () => {
    const w = mount(CheckableTagGroup, { props: { options: ['a'], disabled: true } });
    expect(w.find('.apollo-tag').classes()).toContain('apollo-tag-checkable-disabled');
  });
});
