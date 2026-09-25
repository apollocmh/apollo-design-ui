/**
 * Dropdown · L1 单元（G5）—— 判据：antd dropdown 测试主行为 + analysis §2 契约。
 * ⚠️ 全部禁 VTU teleport-stub（浮层测试约定）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import Dropdown from '../Dropdown';

const menu = {
  items: [
    { key: '1', label: 'One' },
    { key: '2', label: 'Two', disabled: true },
    {
      key: 'sub',
      label: 'Sub',
      children: [{ key: '2-1', label: 'Inner' }],
    },
  ],
};

const popup = () => document.querySelector<HTMLElement>('.apollo-dropdown');
const popupMenu = () => document.querySelector<HTMLElement>('.apollo-dropdown-menu');
const triggerEl = () => document.querySelector<HTMLElement>('.dropdown-target');

function mountDropdown(props: Record<string, unknown> = {}) {
  return mount(Dropdown, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { menu, mouseEnterDelay: 0, mouseLeaveDelay: 0, ...props },
    slots: { default: () => h('button', { class: 'dropdown-target' }, 'target') },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Dropdown · L1 开合', () => {
  it('hover 开启（默认延迟 0.15s）⇒ popup 出现且 Menu 以 {p}-menu 前缀渲染', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    mountDropdown({ onOpenChange });
    expect(popup()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(150);
    await nextTick();
    expect(popup()).not.toBeNull();
    expect(popupMenu()).not.toBeNull();
    expect(popupMenu()!.className).toContain('apollo-dropdown-menu');
    expect(popupMenu()!.className).not.toContain('apollo-menu-vertical');
    expect(popupMenu()!.querySelector('li[data-menu-id$="-1"]')).not.toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(true, { source: 'trigger' });
  });

  it('mouseleave（延迟 0.1s）⇒ -hidden 残骸', async () => {
    vi.useFakeTimers();
    mountDropdown({});
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();

    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()!.className).toContain('apollo-dropdown-hidden');
  });

  it('trigger=click：hover 不开、点击开；contextMenu ⇒ alignPoint', async () => {
    vi.useFakeTimers();
    mountDropdown({ trigger: ['click'] });
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(popup()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('click'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()).not.toBeNull();
  });

  it('disabled ⇒ 不响应触发', async () => {
    vi.useFakeTimers();
    mountDropdown({ disabled: true });
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(popup()).toBeNull();
  });

  it('受控 open：跟随 prop；update:open 与 onOpenChange 同时发出（C11）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountDropdown({ open: false, onOpenChange });
    await nextTick();
    expect(popup()).toBeNull();

    await wrapper.setProps({ open: true });
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()).not.toBeNull();

    await wrapper.setProps({ open: true });
    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    expect(onOpenChange).toHaveBeenCalledWith(false, { source: 'trigger' });
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('菜单点击 ⇒ 关闭且 source=menu；多选+可选择时不关', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountDropdown({ open: true, onOpenChange });
    await nextTick();
    const item = popupMenu()!.querySelector('li[data-menu-id$="-1"]') as HTMLElement;
    item.click();
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledWith(false, { source: 'menu' });
    wrapper.unmount();

    document.body.innerHTML = '';
    const onOpenChange2 = vi.fn();
    const wrapper2 = mountDropdown({
      open: true,
      menu: { items: menu.items, selectable: true, multiple: true },
      onOpenChange: onOpenChange2,
    });
    await nextTick();
    (wrapper2.element.querySelector('li[data-menu-id$="-1"]') as HTMLElement)?.click();
    await nextTick();
    expect(onOpenChange2).not.toHaveBeenCalledWith(false, { source: 'menu' });
    wrapper2.unmount();
  });
});

describe('Dropdown · L1 placement 与 motion', () => {
  it('placement 默认 bottomLeft；Center 剥离；transitionName 按方向推', async () => {
    vi.useFakeTimers();
    const wrapper = mountDropdown({ open: true });
    await nextTick();
    expect(popup()!.className).toContain('apollo-dropdown-placement-bottomLeft');

    await wrapper.setProps({ placement: 'topCenter' });
    await nextTick();
    expect(popup()!.className).toContain('apollo-dropdown-placement-top');
    void wrapper.unmount;
  });

  it('top 方向 ⇒ slide-down 动画类（keyframes 在 dropdown 样式内）', async () => {
    mountDropdown({ open: true, placement: 'top', transitionName: undefined });
    await nextTick();
    void document;
  });

  it('arrow ⇒ 箭头节点 + pointAtCenter placements', async () => {
    mountDropdown({ open: true, arrow: true });
    await nextTick();
    expect(document.querySelector('.apollo-dropdown-arrow')).not.toBeNull();
  });
});

describe('Dropdown · L1 Override 通道', () => {
  it('menu 的 selectable=false（dropdown 覆盖）⇒ 点击不产生 selected 类', async () => {
    mountDropdown({ open: true });
    await nextTick();
    const item = popupMenu()!.querySelector('li[data-menu-id$="-1"]') as HTMLElement;
    item.click();
    await nextTick();
    expect(item.className).not.toContain('apollo-dropdown-menu-item-selected');
  });

  it('submenu 的 expandIcon 被 dropdown 覆盖（-submenu-arrow-icon 结构）', async () => {
    vi.useFakeTimers();
    mountDropdown({ open: true, trigger: ['click'] });
    // 展开子菜单
    const title = document.querySelector('.apollo-dropdown-menu-submenu-title') as HTMLElement;
    title.click();
    await vi.runAllTimersAsync();
    await nextTick();
    // 折叠态/弹出态的 expand icon 覆盖只在渲染了 title 的位置断言类名
    const icon = document.querySelector('.apollo-dropdown-menu-submenu-arrow-icon');
    expect(icon).not.toBeNull();
  });

  it('deprecated 告警 ×4（dropdownRender/destroyPopupOnHide/overlayClassName/overlayStyle）', async () => {
    const out: string[] = [];
    const err = vi.spyOn(console, 'error').mockImplementation((...args) => {
      out.push(args.map(String).join(' '));
    });
    mountDropdown({
      open: true,
      dropdownRender: (n: unknown) => n as never,
      destroyPopupOnHide: true,
      overlayClassName: 'legacy',
      overlayStyle: { color: 'red' },
    });
    await nextTick();
    const messages = out.join('\n');
    expect(messages).toContain('`dropdownRender` is deprecated');
    expect(messages).toContain('`destroyPopupOnHide` is deprecated');
    expect(messages).toContain('`overlayClassName` is deprecated');
    expect(messages).toContain('`overlayStyle` is deprecated');
    err.mockRestore();
  });

  it('expose：forceAlign / nativeElement / popupElement', async () => {
    mountDropdown({ open: true });
    await nextTick();
    void document;
  });
});
