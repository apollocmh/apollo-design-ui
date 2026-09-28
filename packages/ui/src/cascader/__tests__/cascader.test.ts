/**
 * S4 · 薄壳冒烟测试（BaseSelect + OptionList 组装层）。
 * 完整七层测试在 S5（DOM 基线 / a11y / theme / visual）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Cascader from '../Cascader';

const OPTIONS = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];

const findInput = (w: ReturnType<typeof mount>) => w.find('input');
const menus = () => document.querySelectorAll('.apollo-cascader-menu');

const mountCascader = (props: Record<string, unknown> = {}) =>
  mount(Cascader, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { options: OPTIONS, ...props },
  });

describe('Cascader · 薄壳组装', () => {
  it('根元素 + 输入框渲染（BaseSelect 外壳）', () => {
    const w = mountCascader();
    expect(w.find('.apollo-cascader').exists()).toBe(true);
    expect(findInput(w).exists()).toBe(true);
    w.unmount();
  });

  it('受控 open ⇒ 浮层出现且第一列渲染 options', async () => {
    const w = mountCascader({ open: true });
    await nextTick();
    await vi.waitUntil(() => menus().length > 0, { timeout: 2000 }).catch(() => {});
    expect(menus().length).toBe(1);
    expect(document.querySelector('.apollo-cascader-menu-item')?.textContent).toContain('浙江');
    w.unmount();
  });

  it('默认 trigger=click；value 展示（displayRender 的 ` / ` 连接）', async () => {
    const w = mountCascader({ value: ['zj', 'hz', 'xh'] });
    await nextTick();
    expect(w.text()).toContain('浙江 / 杭州 / 西湖');
    w.unmount();
  });

  it('defaultValue 展示', () => {
    const w = mountCascader({ defaultValue: ['js', 'nj'] });
    expect(w.text()).toContain('江苏 / 南京');
    w.unmount();
  });

  it('点击触发 ⇒ 打开（openOnTriggerClick）；popup 类名链', async () => {
    const w = mountCascader();
    await w.find('.apollo-cascader').trigger('click');
    await nextTick();
    expect(menus().length).toBe(1);
    w.unmount();
  });

  it('popup 类名：`-dropdown` + 自定义 popupClassName', async () => {
    const w = mountCascader({ open: true, popupClassName: 'my-popup' });
    await nextTick();
    await vi.waitUntil(() => menus().length > 0, { timeout: 2000 }).catch(() => {});
    expect(document.querySelector('.apollo-cascader-dropdown')?.className).toContain('my-popup');
    w.unmount();
  });

  it('disabled：不打开', async () => {
    const w = mountCascader({ disabled: true });
    await w.find('.apollo-cascader').trigger('click');
    await nextTick();
    expect(menus().length).toBe(0);
    w.unmount();
  });

  it('changeOnSelect + multiple 透传', async () => {
    const w = mountCascader({ multiple: true, value: [['zj', 'hz']] });
    await nextTick();
    expect(w.text()).toContain('杭州');
    w.unmount();
  });
});
