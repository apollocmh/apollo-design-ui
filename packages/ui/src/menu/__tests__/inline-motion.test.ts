import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import Menu from '../Menu';

vi.mock('../../../../../motion/src/support', () => ({
  detectSupportMotion: () => true,
  detectMotionSupport: () => ({
    supported: true,
    animationEndName: 'animationend',
    transitionEndName: 'transitionend',
  }),
}));

const items = [
  {
    key: 'outer',
    label: 'Outer',
    children: [
      { key: 'one', label: 'One' },
      { key: 'inner', label: 'Inner', children: [{ key: 'two', label: 'Two' }] },
    ],
  },
];
const listSelector = '.apollo-menu-sub.apollo-menu-inline';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(96);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(96);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function advance() {
  await vi.advanceTimersByTimeAsync(100);
  await nextTick();
}
async function endHeight(node: Element) {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: 'height' });
  node.dispatchEvent(event);
  await nextTick();
}

describe('002 复审：Inline 子菜单完整高度生命周期', () => {
  it('切入 inline 时取消之前 popup hover 留下的关闭计时器', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(Menu, {
      props: { mode: 'vertical', items, openKeys: ['outer'], onOpenChange },
    });
    await wrapper.find('.apollo-menu-submenu-title').trigger('mouseleave');
    await wrapper.setProps({ mode: 'inline' });
    onOpenChange.mockClear();
    await vi.advanceTimersByTimeAsync(300);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(wrapper.find('.apollo-menu-submenu-title').attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('已收起的 hidden 列表在切出 inline 时释放，不等待重复的 false 通知', async () => {
    const wrapper = mount(Menu, {
      props: { mode: 'inline', items, defaultOpenKeys: ['outer'] },
    });
    await wrapper.find('.apollo-menu-submenu-title').trigger('click');
    await advance();
    await endHeight(wrapper.get(listSelector).element);
    expect(wrapper.get(listSelector).classes()).toContain('apollo-menu-hidden');
    await wrapper.setProps({ mode: 'vertical' });
    expect(wrapper.find(listSelector).exists()).toBe(false);
    wrapper.unmount();
  });

  it('enter 从 0 到实测高度；leave 结束前保留，结束后 hidden；可重新展开', async () => {
    const wrapper = mount(Menu, { props: { mode: 'inline', items } });
    expect(wrapper.find(listSelector).exists()).toBe(false);
    await wrapper.find('.apollo-menu-submenu-title').trigger('click');
    const list = wrapper.get(listSelector);
    expect(list.classes()).toContain('apollo-motion-collapse-enter-start');
    expect((list.element as HTMLElement).style.height).toBe('0px');
    await advance();
    expect((list.element as HTMLElement).style.height).toBe('96px');
    await endHeight(list.element);
    expect((list.element as HTMLElement).style.height).toBe('');

    await wrapper.find('.apollo-menu-submenu-title').trigger('click');
    expect(wrapper.get(listSelector).element).toBe(list.element);
    expect(list.classes()).toContain('apollo-motion-collapse-leave-start');
    await advance();
    expect((list.element as HTMLElement).style.height).toBe('0px');
    expect(list.classes()).not.toContain('apollo-menu-hidden');
    await endHeight(list.element);
    expect(list.classes()).toContain('apollo-menu-hidden');
    await wrapper.find('.apollo-menu-submenu-title').trigger('click');
    await advance();
    expect(list.classes()).not.toContain('apollo-menu-hidden');
    expect((list.element as HTMLElement).style.height).toBe('96px');
    wrapper.unmount();
  });

  it('嵌套初次随父展开时无 appear；后续收起/展开各自有 leave/enter', async () => {
    const wrapper = mount(Menu, {
      props: { mode: 'inline', items, defaultOpenKeys: ['inner'] },
    });
    await wrapper.find('.apollo-menu-submenu-title').trigger('click');
    await nextTick();
    await nextTick();
    const lists = wrapper.findAll(listSelector);
    expect(lists).toHaveLength(2);
    const [outer, inner] = lists;
    const innerTitle = wrapper.findAll('.apollo-menu-submenu-title')[1];
    if (!outer || !inner || !innerTitle) throw new Error('Expected both inline submenu levels');
    expect(outer.classes()).toContain('apollo-motion-collapse-enter-start');
    expect(inner.classes().join(' ')).not.toContain('motion-collapse');
    await advance();
    await endHeight(outer.element);
    await innerTitle.trigger('click');
    expect(inner.classes()).toContain('apollo-motion-collapse-leave-start');
    await advance();
    await endHeight(inner.element);
    await innerTitle.trigger('click');
    expect(inner.classes()).toContain('apollo-motion-collapse-enter-start');
    wrapper.unmount();
  });

  it('快速 enter/leave/enter 不被旧 deadline 或结束事件错误隐藏', async () => {
    const wrapper = mount(Menu, { props: { mode: 'inline', items } });
    const title = wrapper.find('.apollo-menu-submenu-title');
    await title.trigger('click');
    await advance();
    await title.trigger('click');
    await title.trigger('click');
    await advance();
    const list = wrapper.get(listSelector);
    await endHeight(list.element);
    await vi.advanceTimersByTimeAsync(600);
    expect(list.classes()).not.toContain('apollo-menu-hidden');
    expect(title.attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it.each(['mode', 'inlineCollapsed'] as const)(
    '%s 切换保留 inline 离场至高度结束，返回后可用',
    async (prop) => {
      const wrapper = mount(Menu, {
        props: { mode: 'inline', items, defaultOpenKeys: ['outer', 'inner'] },
      });
      await advance();
      const original = wrapper.get(listSelector).element;
      await endHeight(original);
      await wrapper.setProps(prop === 'mode' ? { mode: 'vertical' } : { inlineCollapsed: true });
      expect(wrapper.get(listSelector).element).toBe(original);
      expect(original.className).toContain('collapse-leave');
      // 离场过程中嵌套节点仍是 inline，没有转成 popup。
      expect(original.querySelector('.apollo-menu-submenu-inline')).not.toBeNull();
      await advance();
      await endHeight(original);
      expect(wrapper.find(listSelector).exists()).toBe(false);
      await wrapper.setProps(prop === 'mode' ? { mode: 'inline' } : { inlineCollapsed: false });
      await advance();
      expect(wrapper.find(listSelector).exists()).toBe(true);
      wrapper.unmount();
    },
  );
});
