/**
 * Issue #22 回归（menu）：键盘导航候选集、RTL 方向来源。
 *
 * 判据（rc-menu `hooks/useAccessibility.js`）：
 *   `getFocusableElements(container, elements)` = `getFocusNodeList(container, true)`
 *   ⇒ `focusable(node, includePositive = true)` ⇒ **tabindex 为负也要收**（roving tabindex
 *   -1 正是菜单项的常态）。本仓写成了 `[tabindex]:not([tabindex="-1"])` ⇒ 一个都选不到。
 *   RTL：`isRtl = direction === 'rtl'`（rc `Menu.js:104`），根类加 `{p}-rtl`、`dir` 属性。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import Menu from '../Menu';

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two' },
  { key: '3', label: 'Three' },
] as never;

const mounted: Array<{ unmount: () => void }> = [];

/** 焦点是在 rAF 里落的 ⇒ 断言前要等一帧 + 一次 tick。 */
const raf = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
  await nextTick();
};

function mountMenu(props: Record<string, unknown> = {}) {
  const w = mount(Menu, { attachTo: document.body, props: { items, ...props } as never });
  mounted.push(w);
  return w;
}

const itemEl = (key: string): HTMLElement | null =>
  document.querySelector(`[data-menu-id$="-${key}"]`) as HTMLElement | null;

const activeId = (): string | null => document.activeElement?.getAttribute('data-menu-id') ?? null;

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

describe('Menu · Issue #22', () => {
  describe('#22.2 键盘导航候选集需含 roving tabindex=-1', () => {
    it('[A] ArrowDown ⇒ 焦点移到下一项', async () => {
      mountMenu();
      await nextTick();
      const first = itemEl('1');
      expect(first).not.toBeNull();
      first!.focus();
      expect(activeId()).toContain('-1');

      const ul = document.querySelector('ul[data-menu-list]') as HTMLElement;
      ul.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
      );
      await raf();

      expect(activeId()).toContain('-2');
    });

    it('[B] End / Home ⇒ 跳到末项 / 首项', async () => {
      mountMenu();
      await nextTick();
      itemEl('1')!.focus();
      const ul = document.querySelector('ul[data-menu-list]') as HTMLElement;

      ul.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', keyCode: 35, bubbles: true }));
      await raf();
      expect(activeId()).toContain('-3');

      ul.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', keyCode: 36, bubbles: true }));
      await raf();
      expect(activeId()).toContain('-1');
    });

    it('[C] 禁用项不进入候选（disabled 的项被跳过）', async () => {
      mountMenu({
        items: [
          { key: '1', label: 'One' },
          { key: '2', label: 'Two', disabled: true },
          { key: '3', label: 'Three' },
        ] as never,
      });
      await nextTick();
      itemEl('1')!.focus();
      const ul = document.querySelector('ul[data-menu-list]') as HTMLElement;
      ul.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
      );
      await raf();
      expect(activeId()).toContain('-3');
    });
  });

  describe('#22.3 horizontal overflow 余项要真正交给「更多」子菜单', () => {
    it('[A] 溢出后「更多」里能拿到被省略的项', async () => {
      const w = mountMenu({ mode: 'horizontal' });
      await nextTick();
      // ⚠️ jsdom 下 hover/click 的开合走延迟定时器 ⇒ 直接用受控 openKeys 打开
      const w2 = mountMenu({ mode: 'horizontal', openKeys: ['rc-menu-more'] });
      await nextTick();
      const popup = document.querySelector('[id$="-rc-menu-more-popup"]') as HTMLElement | null;
      expect(popup).not.toBeNull();
      const text = popup!.textContent ?? '';
      // 首项仍在可见区 ⇒ 至少要有被省略的 Two / Three
      expect(text).toContain('Two');
      expect(text).toContain('Three');
      w.unmount();
      w2.unmount();
    });
  });

  describe('#22.4 items 的 DOM/ARIA 属性需落到选项', () => {
    it('[A] id / role / aria-controls 透传（Tabs overflow 的 listbox 用法）', async () => {
      const w = mountMenu({
        items: [
          {
            key: '1',
            label: 'One',
            id: 'tab-1',
            role: 'option',
            'aria-controls': 'panel-1',
          },
        ] as never,
      });
      await nextTick();
      const li = document.querySelector('[data-menu-id$="-1"]') as HTMLElement;
      expect(li).not.toBeNull();
      expect(li.getAttribute('id')).toBe('tab-1');
      expect(li.getAttribute('role')).toBe('option');
      expect(li.getAttribute('aria-controls')).toBe('panel-1');
      w.unmount();
    });
  });

  describe('#22.7 内部配置需跟随运行时 Props', () => {
    it('[A] disabled 运行时切换 ⇒ 选项进入禁用态', async () => {
      const w = mountMenu();
      await nextTick();
      // ⚠️ `aria-disabled` 只跟**项自己的** disabled；菜单级 disabled 体现在类名上
      const li = () => document.querySelector('[data-menu-id$="-1"]') as HTMLElement;
      expect(li().className).not.toContain('apollo-menu-item-disabled');

      await w.setProps({ disabled: true });
      await nextTick();
      expect(li().className).toContain('apollo-menu-item-disabled');
      w.unmount();
    });

    it('[B] 受控 activeKey 运行时切换 ⇒ 高亮项同步', async () => {
      const w = mountMenu({ activeKey: '1' });
      await nextTick();
      const li = (key: string) =>
        document.querySelector(`[data-menu-id$="-${key}"]`) as HTMLElement;
      expect(li('1').className).toContain('apollo-menu-item-active');

      await w.setProps({ activeKey: '3' });
      await nextTick();
      expect(li('3').className).toContain('apollo-menu-item-active');
      expect(li('1').className).not.toContain('apollo-menu-item-active');
      w.unmount();
    });

    it('[C] inlineIndent 运行时切换 ⇒ 缩进同步（inline 模式）', async () => {
      // 顶层项：缩进 = level(1) × inlineIndent（避免嵌套层级带来的歧义）
      const w = mountMenu({ mode: 'inline', inlineIndent: 24 });
      await nextTick();
      const li = () => document.querySelector('[data-menu-id$="-1"]') as HTMLElement;
      expect(li().style.paddingLeft).toBe('24px');

      await w.setProps({ inlineIndent: 48 });
      await nextTick();
      expect(li().style.paddingLeft).toBe('48px');
      w.unmount();
    });
  });

  describe('#22.5 RTL 方向需来自 ConfigProvider', () => {
    const mountWithDirection = async (direction: string, mode = 'vertical') => {
      const { ConfigProvider } = await import('../../config-provider');
      const Host = defineComponent({
        setup: () => () =>
          h(ConfigProvider as never, { direction } as never, {
            default: () => h(Menu as never, { items, mode } as never),
          }),
      });
      const w = mount(Host, { attachTo: document.body });
      mounted.push(w);
      await nextTick();
      return w;
    };

    it('[A] direction=rtl ⇒ 根 ul 带 -rtl 类与 dir=rtl', async () => {
      await mountWithDirection('rtl');
      const ul = document.querySelector('ul[data-menu-list]') as HTMLElement;
      expect(ul.className).toContain('apollo-menu-rtl');
      expect(ul.getAttribute('dir')).toBe('rtl');
    });

    it('[B] direction=ltr ⇒ 不带 -rtl', async () => {
      await mountWithDirection('ltr');
      const ul = document.querySelector('ul[data-menu-list]') as HTMLElement;
      expect(ul.className).not.toContain('apollo-menu-rtl');
    });

    it('[C] rtl 下 vertical 的 Left = 打开子菜单（isRtl 真生效）', async () => {
      // ⚠️ horizontal 在 jsdom 里全部溢出（只剩 1 项 + more）⇒ 用 vertical 验证方向语义：
      //    vertical 的 LEFT = isRtl ? children : parent。
      const subItems = [
        { key: 'sub1', label: 'Sub', children: [{ key: '3', label: 'Three' }] },
      ] as never;
      const mountSub = async (direction: string) => {
        const { ConfigProvider } = await import('../../config-provider');
        const Host = defineComponent({
          setup: () => () =>
            h(ConfigProvider as never, { direction } as never, {
              default: () => h(Menu as never, { items: subItems } as never),
            }),
        });
        const w = mount(Host, { attachTo: document.body });
        mounted.push(w);
        await nextTick();
        return w;
      };

      const expanded = () =>
        document.querySelector('[data-menu-id$="-sub1"]')?.getAttribute('aria-expanded');

      // rtl：Left ⇒ children（打开）
      await mountSub('rtl');
      const title = document.querySelector('[data-menu-id$="-sub1"]') as HTMLElement;
      expect(title).not.toBeNull();
      title.focus();
      expect(expanded()).toBe('false');
      (document.querySelector('ul[data-menu-list]') as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Left', keyCode: 37, bubbles: true }),
      );
      await raf();
      expect(expanded()).toBe('true');

      // ltr：Left ⇒ parent（不打开）
      while (mounted.length) mounted.pop()!.unmount();
      document.body.innerHTML = '';
      await mountSub('ltr');
      const title2 = document.querySelector('[data-menu-id$="-sub1"]') as HTMLElement;
      title2.focus();
      (document.querySelector('ul[data-menu-list]') as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Left', keyCode: 37, bubbles: true }),
      );
      await raf();
      expect(expanded()).toBe('false');
    });
  });
});
