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

// ---------------------------------------------------------------------------
// #22.6 语义通道：classNames / styles 必须真的落到 DOM
//
// 症状：`interface.ts` 里声明了 `MenuSemanticType`（root / list / item / itemTitle /
// itemIcon / itemContent + popup / subMenu），文档也写了，但 `Menu.ts` 运行时**零消费**
// —— 组件 `inheritAttrs: false`，传进来的 `classNames` 被静默丢弃（类型合法、运行不生效）。
//
// 判据：antd menu.tsx 的槽位落点
//   root        → 根 <ul>
//   list        → 同一个根 <ul>（antd 6 的 Menu 根就是 ul，没有额外包裹层）
//   item        → MenuItem 的 <li> / SubMenu 的 <li>
//   itemTitle   → SubMenu 的 div.{p}-submenu-title
//   itemContent → span.{p}-title-content
//   itemIcon    → span.{p}-item-icon / span.{p}-submenu-expand-icon
//   popup.root  → div.{p}-submenu-popup
// ---------------------------------------------------------------------------

describe('#22.6 语义通道（classNames / styles 落到 DOM）', () => {
  const semItems = [
    { key: '1', label: 'One', icon: h('i', { class: 'ico' }) },
    { key: 'sub1', label: 'Sub', children: [{ key: '2', label: 'Two' }] },
  ] as never;

  it('⭐ classNames 的 root / list / item / itemContent / itemIcon 都落到对应元素', async () => {
    mountMenu({
      items: semItems,
      mode: 'inline',
      defaultOpenKeys: ['sub1'],
      classNames: {
        root: 'sem-root',
        list: 'sem-list',
        item: 'sem-item',
        itemContent: 'sem-content',
        itemIcon: 'sem-icon',
      },
    });
    await nextTick();

    const root = document.querySelector('ul[data-menu-list]') as HTMLElement;
    expect(root.classList.contains('sem-root')).toBe(true);
    expect(root.classList.contains('sem-list')).toBe(true);

    const item = document.querySelector('[data-menu-id$="-1"]')?.closest('li') as HTMLElement;
    expect(item.classList.contains('sem-item')).toBe(true);
    expect(item.querySelector('.sem-content')).not.toBeNull();
    expect(item.querySelector('.sem-icon')).not.toBeNull();
  });

  it('SubMenu 的 itemTitle / popup.root 槽生效（popup 走 Teleport）', async () => {
    mountMenu({
      items: semItems,
      mode: 'vertical',
      defaultOpenKeys: ['sub1'],
      classNames: { itemTitle: 'sem-title', popup: { root: 'sem-popup' } },
    });
    await nextTick();

    const title = document.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    expect(title.classList.contains('sem-title')).toBe(true);

    const popup = document.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup).not.toBeNull();
    expect(popup.classList.contains('sem-popup')).toBe(true);
  });

  it('⭐ 字符串形态的嵌套槽 `popup: "x"` 走 schema 落到 popup.root', async () => {
    mountMenu({
      items: semItems,
      mode: 'vertical',
      defaultOpenKeys: ['sub1'],
      classNames: { popup: 'string-popup' },
    });
    await nextTick();

    const popup = document.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup.classList.contains('string-popup')).toBe(true);
  });

  it('styles 逐槽落到元素（root / item）', async () => {
    mountMenu({
      items: semItems,
      mode: 'inline',
      styles: { root: { backgroundColor: 'rgb(1, 2, 3)' }, item: { color: 'rgb(4, 5, 6)' } },
    });
    await nextTick();

    const root = document.querySelector('ul[data-menu-list]') as HTMLElement;
    expect(root.style.backgroundColor).toBe('rgb(1, 2, 3)');

    const item = document.querySelector('[data-menu-id$="-1"]')?.closest('li') as HTMLElement;
    expect(item.style.color).toBe('rgb(4, 5, 6)');
  });

  it('不传 classNames 时不产生多余 class（基线不受影响）', async () => {
    mountMenu({ items: semItems, mode: 'inline' });
    await nextTick();
    const root = document.querySelector('ul[data-menu-list]') as HTMLElement;
    expect(root.className).toBe(
      'apollo-menu apollo-menu-root apollo-menu-inline apollo-menu-light',
    );
  });
});

// ---------------------------------------------------------------------------
// #22.1 SubMenu popup 恒为 visibility:hidden
//
// 原实现写死 `style: { position: 'absolute', visibility: 'hidden' }` —— 非 inline
// 子菜单打开后**永远看不见**（P0，默认交互直接不可用）。
//
// 修：popup 挂载后按 title 的 rect 定位并置 visible（vertical 贴右侧 / horizontal 贴下方；
// RTL 贴左侧）。关闭时节点本就不渲染，所以不需要「再藏回去」的分支。
//
// ⚠️ jsdom 里 getBoundingClientRect 恒为 0 ⇒ 只能钉「可见 + 有定位声明」，
//    真实位置靠浏览器（本地 preview / 线上）复核。
// ---------------------------------------------------------------------------

describe('#22.1 SubMenu popup 可见性与定位', () => {
  const subItems = [
    { key: 'sub1', label: 'Sub', children: [{ key: 'c1', label: 'Child' }] },
  ] as never;

  it('⭐ vertical：打开后 popup 必须 visible 且带 top/left', async () => {
    mountMenu({ items: subItems, mode: 'vertical', defaultOpenKeys: ['sub1'] });
    await nextTick();
    // 定位是「rAF 双帧」后才写入的（首帧布局未稳定）⇒ 等两帧
    await raf();
    await raf();

    const popup = document.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup).not.toBeNull();
    expect(popup.style.visibility).toBe('visible');
    expect(popup.style.position).toBe('absolute');
    expect(popup.style.top).not.toBe('');
    expect(popup.style.left).not.toBe('');
  });

  it('horizontal：popup 贴在 title 下方（同样 visible）', async () => {
    mountMenu({ items: subItems, mode: 'horizontal', defaultOpenKeys: ['sub1'] });
    await nextTick();
    await raf();
    await raf();

    const popup = document.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup).not.toBeNull();
    expect(popup.style.visibility).toBe('visible');
    expect(popup.style.top).not.toBe('');
  });

  it('未展开时不产出 popup（不是靠 hidden 藏起来）', async () => {
    mountMenu({ items: subItems, mode: 'vertical' });
    await nextTick();
    expect(document.querySelector('.apollo-menu-submenu-popup')).toBeNull();
  });

  it('inline 模式走内联列表，不产出 popup', async () => {
    mountMenu({ items: subItems, mode: 'inline', defaultOpenKeys: ['sub1'] });
    await nextTick();
    expect(document.querySelector('.apollo-menu-submenu-popup')).toBeNull();
    expect(document.querySelector('.apollo-menu-sub.apollo-menu-inline')).not.toBeNull();
  });
});
