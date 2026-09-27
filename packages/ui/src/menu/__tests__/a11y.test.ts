/**
 * L5 · 无障碍 —— role=menu/menuitem/group/separator + roving tabindex +
 * aria-expanded/haspopup/controls（子菜单）+ aria-describedby（折叠态标题
 * Tooltip 由 tooltip 组件承担，本层断言 menu 自身的 aria 面）。
 * axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Menu from '../Menu';

a11yDemoTest('Menu', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
  global: { stubs: { teleport: false } },
});

describe('Menu · 语义断言', () => {
  it('root=menu、item=menuitem（tabindex roving）、divider=separator、group=group', async () => {
    const wrapper = mount(Menu, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        items: [
          { key: '1', label: 'One' },
          { key: '2', label: 'Two' },
          { type: 'divider', key: 'd' },
          { type: 'group', key: 'g', label: 'G', children: [{ key: '3', label: 'Three' }] },
        ] as never,
      },
    });
    await nextTick();
    const ul = wrapper.element.querySelector('ul[data-menu-list]')!;
    expect(ul.getAttribute('role')).toBe('menu');
    const items = ul.querySelectorAll(':scope > li[role="menuitem"]');
    expect(items.length).toBe(2);
    // roving tabindex：全部 -1（active 由 focus 驱动）
    for (const i of Array.from(items) as Element[]) {
      expect(i.getAttribute('tabindex')).toBe('-1');
    }
    expect(ul.querySelector('li[role="separator"]')).not.toBeNull();
    expect(ul.querySelector('ul[role="group"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('展开的子菜单：title aria-expanded + aria-haspopup + 子列表 aria-controls 对应', async () => {
    const wrapper = mount(Menu, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        mode: 'inline',
        openKeys: ['sub1'],
        items: [{ key: 'sub1', label: 'Sub', children: [{ key: '1', label: 'One' }] }] as never,
      },
    });
    await nextTick();
    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    expect(title.getAttribute('aria-expanded')).toBe('true');
    expect(title.getAttribute('aria-haspopup')).toBe('true');
    const controls = title.getAttribute('aria-controls');
    expect(controls).not.toBeNull();
    const sub = wrapper.element.querySelector(`ul[id='${controls}']`);
    expect(sub).not.toBeNull();
    expect(sub?.getAttribute('role')).toBe('menu');
    wrapper.unmount();
  });

  it('disabled item：aria-disabled=true', async () => {
    const wrapper = mount(Menu, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { items: [{ key: '1', label: 'One', disabled: true }] as never },
    });
    await nextTick();
    const li = wrapper.element.querySelector('li[role="menuitem"]')!;
    expect(li.getAttribute('aria-disabled')).toBe('true');
    wrapper.unmount();
  });
});
