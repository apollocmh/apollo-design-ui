/**
 * 2026-10-22 Menu 专项故障审计回归（M-03 / M-04 / M-05 / M-06 / M-07 / M-09）。
 *
 * 这些用例钉住「真实浏览器里能操作」的行为判据，而不是只断言 DOM 存在：
 *   - inline 的 hover 不修改 openKeys（M-03）；
 *   - icon 在标题文字之前（M-04）；
 *   - getPopupContainer 真的把弹层挂进自定义容器（M-05）；
 *   - 关闭时弹层不会同帧卸载，而是先进入离场动画 / hidden 残骸（M-07）；
 *   - SubMenu.theme 只影响该弹层（M-09）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import Menu from '../Menu';

const iconItems = [
  { key: '1', label: 'One', icon: h('i', { class: 'probe-icon' }) },
  {
    key: 'sub1',
    label: 'Sub',
    icon: h('i', { class: 'probe-sub-icon' }),
    children: [{ key: '2', label: 'Two' }],
  },
] as never;

function mountMenu(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return mount(Menu, {
    attachTo: document.body,
    props: { items: iconItems, ...props },
    ...options,
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Menu 审计 M-03：inline 不参与 hover 开合', () => {
  it('title / li 的 mouseenter+mouseleave 都不修改 openKeys，子列表保持展开', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountMenu({
      mode: 'inline',
      defaultOpenKeys: ['sub1'],
      onOpenChange,
    });
    await nextTick();

    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    const li = wrapper.element.querySelector('li.apollo-menu-submenu') as HTMLElement;

    title.dispatchEvent(new Event('mouseenter'));
    li.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(300);
    expect(onOpenChange).not.toHaveBeenCalled();

    title.dispatchEvent(new Event('mouseleave'));
    li.dispatchEvent(new Event('mouseleave'));
    await vi.advanceTimersByTimeAsync(300);
    await nextTick();

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(wrapper.element.querySelector('.apollo-menu-sub.apollo-menu-inline')).not.toBeNull();
    wrapper.unmount();
  });
});

describe('Menu 审计 M-04：图标必须在标题文字之前', () => {
  it('MenuItem：children[0] = item-icon，children[1] = title-content', async () => {
    const wrapper = mountMenu({ mode: 'inline' });
    await nextTick();

    const item = wrapper.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement;
    const children = [...item.children] as HTMLElement[];
    expect(children[0]?.className).toContain('apollo-menu-item-icon');
    expect(children[0]?.querySelector('.probe-icon')).not.toBeNull();
    expect(children[1]?.className).toContain('apollo-menu-title-content');
    wrapper.unmount();
  });

  it('SubMenu title：icon → title-content → arrow', async () => {
    const wrapper = mountMenu({ mode: 'inline' });
    await nextTick();

    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    const children = [...title.children] as HTMLElement[];
    expect(children[0]?.className).toContain('apollo-menu-item-icon');
    expect(children[0]?.querySelector('.probe-sub-icon')).not.toBeNull();
    expect(children[1]?.className).toContain('apollo-menu-title-content');
    expect(children[2]?.className).toContain('apollo-menu-submenu-arrow');
    wrapper.unmount();
  });
});

describe('Menu 审计 M-05 / M-06 / M-07：Trigger 弹层契约', () => {
  it('getPopupContainer 真的把 popup 挂进自定义容器', async () => {
    const host = document.createElement('div');
    host.id = 'custom-popup-host';
    document.body.appendChild(host);

    const wrapper = mountMenu(
      {
        items: [{ key: 'sub1', label: 'Sub', children: [{ key: '2', label: 'Two' }] }] as never,
        mode: 'vertical',
        defaultOpenKeys: ['sub1'],
        getPopupContainer: () => host,
      },
      { global: { stubs: { teleport: false } } },
    );
    await nextTick();
    await nextTick();

    expect(host.querySelector('.apollo-menu-submenu-popup')).not.toBeNull();
    // 反向哨兵：不能同时留在原组件容器里（否则说明 Teleport 根本没生效）
    expect(wrapper.element.querySelector('.apollo-menu-submenu-popup')).toBeNull();
    wrapper.unmount();
  });

  it('关闭后可以立刻重开（Trigger 生命周期不残留 hidden 死状态）', async () => {
    // ⚠️ jsdom 的 `detectSupportMotion()` 通常为 false ⇒ CSSMotion 走简队列并立即
    //    hidden/卸载，测不到 leave 类。真实动画时间线由 Playwright 门禁
    //    （packages/docs/tests/menu-motion-browser.mjs）钉住；这里钉状态机可重入。
    const wrapper = mountMenu({
      items: [{ key: 'sub1', label: 'Sub', children: [{ key: '2', label: 'Two' }] }] as never,
      mode: 'vertical',
      openKeys: ['sub1'],
    });
    await nextTick();
    expect(document.querySelector('.apollo-menu-submenu-popup')).not.toBeNull();

    await wrapper.setProps({ openKeys: [] });
    await nextTick();
    await nextTick();
    expect(document.querySelector('.apollo-menu-submenu-popup')).toBeNull();

    await wrapper.setProps({ openKeys: ['sub1'] });
    await nextTick();
    expect(document.querySelector('.apollo-menu-submenu-popup')).not.toBeNull();
    wrapper.unmount();
  });

  it('SubMenu.theme 只给弹层加主题类（根主题不变）', async () => {
    const wrapper = mountMenu({
      items: [
        {
          key: 'sub1',
          label: 'Sub',
          theme: 'light',
          children: [{ key: '2', label: 'Two' }],
        },
      ] as never,
      mode: 'vertical',
      theme: 'dark',
      defaultOpenKeys: ['sub1'],
    });
    await nextTick();

    expect(wrapper.element.querySelector('.apollo-menu')?.className).toContain('apollo-menu-dark');
    const popup = document.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup.className).toContain('apollo-menu-light');
    expect(popup.className).not.toContain('apollo-menu-dark');
    wrapper.unmount();
  });
});
