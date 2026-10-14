/**
 * Issue #21 回归：DropdownButton 的 split 两钮结构、`#popupRender` 转发、RTL 箭头。
 *
 * 判据（antd `dropdown/dropdown-button.js`）：
 *   `leftButton` 在 Dropdown **外面**（split 语义：主钮只发 onClick），`rightButton`
 *   才是 `<Dropdown>` 的 trigger；`popupRender` 在 antd 是 prop，本仓按 C8-R2 改成
 *   `#popupRender="{ originNode }"` **作用域插槽**（Dropdown 只读 slot，不读 prop）；
 *   子菜单箭头 antd 是 `direction === 'rtl' ? LeftOutlined : RightOutlined`。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { resetGlobalConfig } from '../../config-provider/global-config';
import Dropdown from '../Dropdown';
import DropdownButton from '../DropdownButton';

const menu = {
  items: [
    { key: '1', label: 'One' },
    { key: 'sub', label: 'Sub', children: [{ key: '2-1', label: 'Inner' }] },
  ],
};

const mounted: Array<{ unmount: () => void }> = [];

const mountButton = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => {
  const w = mount(DropdownButton, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { menu, trigger: ['click'], ...props } as never,
    slots: { default: () => 'Main', ...slots } as never,
  });
  mounted.push(w);
  return w;
};

const buttons = () => Array.from(document.querySelectorAll<HTMLElement>('.apollo-btn'));
const popupMenu = () => document.querySelector<HTMLElement>('.apollo-dropdown-menu');

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

describe('DropdownButton · Issue #21', () => {
  describe('#21.1 split 的两钮应各自独立', () => {
    it('[A] split ⇒ DOM 里主钮 + 箭头钮都存在', async () => {
      mountButton({ split: true });
      await nextTick();
      await nextTick();
      expect(buttons().length).toBe(2);
    });

    it('[B] 点主钮：只发 onClick，下拉不打开', async () => {
      const onClick = vi.fn();
      mountButton({ split: true, onClick });
      await nextTick();
      await nextTick();
      const [left] = buttons();
      await left!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(popupMenu()).toBeNull();
    });

    it('[C] 点箭头钮：打开下拉，且不吃 onClick', async () => {
      const onClick = vi.fn();
      mountButton({ split: true, onClick });
      await nextTick();
      await nextTick();
      const right = buttons()[1]!;
      await right.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(onClick).not.toHaveBeenCalled();
      expect(popupMenu()).not.toBeNull();
    });

    it('[D] 非 split ⇒ 只有一个钮、整体是触发器', async () => {
      mountButton();
      await nextTick();
      await nextTick();
      expect(buttons().length).toBe(1);
      await buttons()[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(popupMenu()).not.toBeNull();
    });
  });

  describe('#21.2 #popupRender 需转发到 Dropdown', () => {
    it('[A] DropdownButton 的 #popupRender 生效（自定义浮层外壳出现）', async () => {
      mountButton(
        { split: true },
        {
          popupRender: (p: { originNode: unknown }) =>
            h('section', { 'data-popup-custom': 'yes' }, [p.originNode as never]),
        },
      );
      await nextTick();
      await nextTick();
      await buttons()[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(document.querySelector('[data-popup-custom="yes"]')).not.toBeNull();
      expect(popupMenu()).not.toBeNull();
    });

    it('[B] Dropdown 自身的 #popupRender 仍生效（不回归）', async () => {
      const w = mount(Dropdown, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
        props: { menu, trigger: ['click'], open: true } as never,
        slots: {
          default: () => h('button', { class: 'dropdown-target' }, 'target'),
          popupRender: (p: { originNode: unknown }) =>
            h('section', { 'data-popup-custom': 'yes' }, [p.originNode as never]),
        } as never,
      });
      mounted.push(w);
      await nextTick();
      await nextTick();
      expect(document.querySelector('[data-popup-custom="yes"]')).not.toBeNull();
    });
  });

  describe('#21.3 声明的 Dropdown 配置应落到浮层', () => {
    it('[A] getPopupContainer 生效（浮层挂到指定容器）', async () => {
      const container = document.createElement('div');
      container.className = 'my-container';
      document.body.appendChild(container);
      mountButton({
        split: true,
        getPopupContainer: () => container,
      });
      await nextTick();
      await nextTick();
      await buttons()[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      await nextTick();
      expect(container.querySelector('.apollo-dropdown-menu')).not.toBeNull();
      container.remove();
    });
  });

  describe('#21.4 RTL 子菜单箭头方向', () => {
    it('[A] rtl ⇒ 箭头是 left（默认 right）', async () => {
      const w = mount(Dropdown, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
        props: { menu, open: true } as never,
        slots: { default: () => h('button', { class: 'dropdown-target' }, 'target') } as never,
      });
      mounted.push(w);
      await nextTick();
      await nextTick();
      const arrow = document.querySelector('.apollo-dropdown-menu-submenu-arrow-icon');
      expect(arrow).not.toBeNull();
      expect(arrow!.getAttribute('aria-label')).toBe('right');
      w.unmount();

      const { ConfigProvider } = await import('../../config-provider');
      const rtl = mount(
        {
          setup: () => () =>
            h(ConfigProvider as never, { direction: 'rtl' } as never, {
              default: () =>
                h(
                  Dropdown as never,
                  { menu, open: true } as never,
                  { default: () => h('button', { class: 'dropdown-target' }, 'target') } as never,
                ),
            }),
        },
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      );
      mounted.push(rtl);
      await nextTick();
      await nextTick();
      const rtlArrow = document.querySelector('.apollo-dropdown-menu-submenu-arrow-icon');
      expect(rtlArrow).not.toBeNull();
      expect(rtlArrow!.getAttribute('aria-label')).toBe('left');
      resetGlobalConfig();
    });
  });
});
