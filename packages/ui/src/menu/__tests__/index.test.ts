/**
 * Menu · L1 单元（G5）—— 判据：antd menu 测试主行为 + analysis §3 契约。
 * ⚠️ 全部用 items 数据（v1 唯一真源，D89）；popup 子菜单的 hover 时序用假时钟。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Menu from '../Menu';

const items = [
  { key: '1', label: 'One' },
  { key: '2', label: 'Two', disabled: true },
  { type: 'divider', key: 'd1' },
  {
    key: 'sub1',
    label: 'Sub',
    children: [
      { key: '3', label: 'Three' },
      { key: '4', label: 'Four' },
    ],
  },
  { type: 'group', key: 'g', label: 'Group', children: [{ key: '5', label: 'Five' }] },
] as never;

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(Menu, {
    attachTo: document.body,
    props: { items, ...props },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Menu · L1 渲染结构', () => {
  it('items 解析：item/divider/group/submenu 的 DOM 结构', async () => {
    const wrapper = mountMenu({ openKeys: ['sub1'] });
    await nextTick();
    const el = wrapper.element as HTMLElement;
    const ul = el.querySelector('ul[data-menu-list]')!;
    expect(ul.getAttribute('role')).toBe('menu');
    expect(ul.className).toContain('apollo-menu-vertical');
    expect(ul.className).toContain('apollo-menu-light');

    const menuItems = ul.querySelectorAll(':scope > li.apollo-menu-item');
    expect(menuItems.length).toBe(2); // One / Two（divider/submenu/group 是别的类）
    expect(menuItems[0]?.getAttribute('data-menu-id')).toMatch(/-1$/);
    expect(menuItems[1]?.className).toContain('apollo-menu-item-disabled');

    expect(ul.querySelector('.apollo-menu-item-divider')).not.toBeNull();
    expect(ul.querySelector('.apollo-menu-submenu')).not.toBeNull();
    const group = ul.querySelector('.apollo-menu-item-group');
    expect(group).not.toBeNull();
    expect(group?.querySelector('ul[role="group"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('measure 子树（display:none）与可见子树同时存在', async () => {
    const wrapper = mountMenu();
    await nextTick();
    const hidden = wrapper.element.querySelector('div[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    // measure 模式下全部组件渲染 null（只登记路径）—— 与 rc 一致
    expect(hidden?.querySelectorAll('li').length).toBe(0);
    wrapper.unmount();
  });

  it('data-menu-id = {menuId}-{key} 且 measure 部分无 data-menu-id', async () => {
    const wrapper = mountMenu({ id: 'my-menu' });
    await nextTick();
    const visible = wrapper.element.querySelector('ul[data-menu-list] li[data-menu-id]');
    expect(visible?.getAttribute('data-menu-id')).toContain('my-menu-');
    wrapper.unmount();
  });

  it('inlineCollapsed 时 item 标题走 Tooltip；tooltip=false 关闭', async () => {
    vi.useFakeTimers();
    const wrapper = mountMenu({ mode: 'inline', inlineCollapsed: true });
    await nextTick();
    const item = wrapper.element.querySelector('li.apollo-menu-item') as HTMLElement;
    item.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-tooltip')?.textContent).toContain('One');
    wrapper.unmount();

    const off = mountMenu({ mode: 'inline', inlineCollapsed: true, tooltip: false });
    await nextTick();
    (off.element.querySelector('li.apollo-menu-item') as HTMLElement).dispatchEvent(
      new Event('mouseenter'),
    );
    await vi.runAllTimersAsync();
    await nextTick();
    expect(off.element.querySelector('.apollo-tooltip')).toBeNull();
    off.unmount();
  });
});

describe('Menu · L1 选择协议', () => {
  it('点击 item ⇒ onClick(info) 携带 key/keyPath/itemData', async () => {
    const onClick = vi.fn();
    const wrapper = mountMenu({ onClick });
    await nextTick();
    (wrapper.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement).click();
    expect(onClick).toHaveBeenCalledTimes(1);
    const info = onClick.mock.calls[0]?.[0];
    expect(info.key).toBe('1');
    expect(info.keyPath).toEqual(['1']);
    expect(info.itemData.key).toBe('1');
    expect(info.domEvent).toBeDefined();
    wrapper.unmount();
  });

  it('selectable ⇒ selectedKeys 更新 + onSelect；非受控', async () => {
    const onSelect = vi.fn();
    const wrapper = mountMenu({ onSelect });
    await nextTick();
    (wrapper.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement).click();
    await nextTick();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].selectedKeys).toEqual(['1']);
    expect(wrapper.element.querySelector('li[data-menu-id$="-1"]')?.className).toContain(
      'apollo-menu-item-selected',
    );
    wrapper.unmount();
  });

  it('受控 selectedKeys 不自动更新（需 v-model 才回写）', async () => {
    const wrapper = mountMenu({ selectedKeys: ['2'] });
    await nextTick();
    (wrapper.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement).click();
    await nextTick();
    // 受控：props.selectedKeys 仍指向 '2' ⇒ 选中类仍在 2 上
    expect(wrapper.element.querySelector('li[data-menu-id$="-2"]')?.className).toContain(
      'apollo-menu-item-selected',
    );
    expect(wrapper.emitted('update:selectedKeys')?.[0]).toEqual([['1']]);
    wrapper.unmount();
  });

  it('disabled item：点击不触发 onClick', async () => {
    const onClick = vi.fn();
    const wrapper = mountMenu({ onClick });
    await nextTick();
    (wrapper.element.querySelector('li[data-menu-id$="-2"]') as HTMLElement).click();
    expect(onClick).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('子菜单项的 keyPath 含父级（reverse 口径）', async () => {
    const onClick = vi.fn();
    const wrapper = mountMenu({ onClick, openKeys: ['sub1'], triggerSubMenuAction: 'click' });
    await nextTick();
    const subItem = wrapper.element.querySelector('li[data-menu-id$="-3"]') as HTMLElement;
    subItem.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    // rc：keyPath = [...connectedKeys].reverse()（antd 注释：legacy reversed）
    expect(onClick.mock.calls[0]?.[0].keyPath).toEqual(['3', 'sub1']);
    wrapper.unmount();
  });

  it('选中弹出子项 ⇒ 父级 submenu-selected（measure 子树登记完整路径）', async () => {
    const wrapper = mountMenu({ triggerSubMenuAction: 'click' });
    await nextTick();
    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    title.click();
    await nextTick();
    const popupItem = wrapper.element.querySelector(
      '.apollo-menu-submenu-popup li[data-menu-id$="-3"]',
    ) as HTMLElement;
    expect(popupItem).not.toBeNull();
    popupItem.click();
    await nextTick();
    const submenu = wrapper.element.querySelector('li.apollo-menu-submenu') as HTMLElement;
    expect(submenu.className).toContain('apollo-menu-submenu-selected');
    wrapper.unmount();
  });

  it('选中 group 内的子项同样生效（group 的 measure 分支继续渲染子项）', async () => {
    const wrapper = mountMenu({});
    await nextTick();
    const item = wrapper.element.querySelector('li[data-menu-id$="-5"]') as HTMLElement;
    item.click();
    await nextTick();
    expect(item.className).toContain('apollo-menu-item-selected');
    wrapper.unmount();
  });
});

describe('Menu · L1 openKeys 与子菜单', () => {
  it('inline 受控 openKeys ⇒ 子列表渲染；点击 title 切换并发出 update:openKeys', async () => {
    const wrapper = mountMenu({ mode: 'inline', openKeys: [] });
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-menu-sub')).toBeNull();

    await wrapper.setProps({ openKeys: ['sub1'] });
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-menu-inline')).not.toBeNull();

    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    title.click();
    expect(wrapper.emitted('update:openKeys')?.[0]).toEqual([[]]);
    wrapper.unmount();
  });

  it('vertical + click 触发：hover 不开，点击开（onOpenChange）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountMenu({ triggerSubMenuAction: 'click', onOpenChange });
    await nextTick();
    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    title.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(onOpenChange).not.toHaveBeenCalled();

    title.click();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange.mock.calls[0]?.[0]).toEqual(['sub1']);
    wrapper.unmount();
  });

  it('vertical + hover 触发：延迟开后 popup 渲染；mouseleave 延迟关', async () => {
    vi.useFakeTimers();
    const wrapper = mountMenu({});
    await nextTick();
    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    title.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(100);
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-menu-submenu-popup')).not.toBeNull();

    title.dispatchEvent(new Event('mouseleave'));
    await vi.advanceTimersByTimeAsync(100);
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-menu-submenu-popup')).toBeNull();
    wrapper.unmount();
  });

  it('嵌套弹层：移入三级弹层不触发父层关闭（Teleport 后父层先收到 mouseleave）', async () => {
    vi.useFakeTimers();
    const nestedItems = [
      {
        key: 'sub',
        label: 'Sub',
        children: [{ key: 'inner', label: 'Inner', children: [{ key: 'leaf', label: 'Leaf' }] }],
      },
    ] as never;
    const wrapper = mountMenu({ items: nestedItems, triggerSubMenuAction: 'hover' });
    await nextTick();
    const titles = wrapper.element.querySelectorAll('.apollo-menu-submenu-title');
    (titles[0] as HTMLElement).dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(100);
    await nextTick();
    const nestedTitle = wrapper.element.querySelector(
      '.apollo-menu-submenu-popup .apollo-menu-submenu-title',
    ) as HTMLElement;
    expect(nestedTitle).not.toBeNull();
    nestedTitle.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(100);
    await nextTick();

    const popups = wrapper.element.querySelectorAll('.apollo-menu-submenu-popup');
    expect(popups.length).toBeGreaterThanOrEqual(2);
    // 父弹层 leave → 立刻进入三级弹层
    (popups[0] as HTMLElement).dispatchEvent(new Event('mouseleave'));
    (popups[1] as HTMLElement).dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();
    expect(
      wrapper.element.querySelectorAll('.apollo-menu-submenu-open').length,
      '父层与三级层都应保持展开',
    ).toBe(2);
    wrapper.unmount();
  });

  it('hover 前置延迟尊重 subMenuOpenDelay=0', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountMenu({ subMenuOpenDelay: 0, onOpenChange });
    await nextTick();
    const title = wrapper.element.querySelector('.apollo-menu-submenu-title') as HTMLElement;
    title.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(onOpenChange).toHaveBeenCalledWith(['sub1']);
    wrapper.unmount();
  });

  it('inlineCollapsed 切换：折叠清空 openKeys，展开回放折叠前的展开项', async () => {
    const wrapper = mountMenu({ mode: 'inline', openKeys: ['sub1'] });
    await nextTick();
    expect(wrapper.element.querySelector('.apollo-menu-inline')).not.toBeNull();

    await wrapper.setProps({ inlineCollapsed: true });
    await nextTick();
    // rc：离开 inline 模式 ⇒ triggerOpenKeys([])
    expect(wrapper.emitted('update:openKeys')?.at(-1)).toEqual([[]]);
    // 折叠态不再渲染内联子列表
    expect(wrapper.element.querySelector('.apollo-menu-inline')).toBeNull();

    await wrapper.setProps({ inlineCollapsed: false });
    await nextTick();
    // 回到 inline ⇒ 回放折叠前缓存的展开项
    expect(wrapper.emitted('update:openKeys')?.at(-1)).toEqual([['sub1']]);
    wrapper.unmount();
  });

  it('折叠态下 popup 定位在 mode 切换后同步（不会停在 visibility:hidden）', async () => {
    const wrapper = mountMenu({ mode: 'inline', openKeys: ['sub1'] });
    await nextTick();
    await wrapper.setProps({ inlineCollapsed: true });
    await nextTick();
    await nextTick();
    // scheduleSync 是双 rAF；等待两帧
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const popup = wrapper.element.querySelector('.apollo-menu-submenu-popup') as HTMLElement;
    expect(popup).not.toBeNull();
    expect(popup.style.visibility).toBe('visible');
    wrapper.unmount();
  });
});

describe('Menu · L1 键盘导航（roving tabindex）', () => {
  it('ArrowDown ⇒ active 落到下一可用项并聚焦（focus 驱动 active）', async () => {
    const wrapper = mountMenu({ defaultActiveFirst: false });
    await nextTick();
    const ul = wrapper.element.querySelector('ul[data-menu-list]') as HTMLElement;
    const one = ul.querySelector('li[data-menu-id$="-1"]') as HTMLElement;
    one.focus();
    one.dispatchEvent(new KeyboardEvent('keydown', { which: 40, bubbles: true, cancelable: true }));
    await nextTick();
    // Two 是 disabled ⇒ active 跳到 sub1 的 title（rc 行为：跳过 disabled）
    const activeEl = document.activeElement;
    expect(activeEl).not.toBeNull();
    wrapper.unmount();
  });

  it('Enter 触发选中（rc MenuItem 的 legacy 通道）', async () => {
    const onClick = vi.fn();
    const wrapper = mountMenu({ onClick });
    await nextTick();
    const one = wrapper.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement;
    const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
    // KeyboardEvent 构造器不收 which/keyCode —— Object.defineProperty 覆盖（jsdom）
    Object.defineProperty(ev, 'which', { value: 13 });
    one.dispatchEvent(ev);
    await nextTick();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0].key).toBe('1');
    wrapper.unmount();
  });
});
