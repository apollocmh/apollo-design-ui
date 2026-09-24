/**
 * Popover · L1 单元（G5）。
 *
 * 判据：antd `components/popover/__tests__/popover.test.tsx` 的主行为 +
 * docs/analysis/popover.md §3 的行为契约。
 * ⚠️ 测试必须禁 VTU teleport-stub（翻转 open 会重挂子树，tooltip 期教训）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import Popover from '../Popover';

const popup = () => document.querySelector<HTMLElement>('.apollo-popover');
const container = () => document.querySelector<HTMLElement>('.apollo-popover-container');
const title = () => document.querySelector<HTMLElement>('.apollo-popover-title');
const content = () => document.querySelector<HTMLElement>('.apollo-popover-content');
const triggerEl = () => document.querySelector<HTMLElement>('.popover-target');

function mountPopover(props: Record<string, unknown>, contentText = 'content') {
  return mount(Popover, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      title: 'Title',
      content: contentText,
      mouseEnterDelay: 0,
      mouseLeaveDelay: 0,
      ...props,
    },
    slots: { default: () => h('button', { class: 'popover-target' }, 'target') },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Popover · L1 开合与内容', () => {
  it('hover 开启 ⇒ 浮层出现 title + content 两块（容器由 Tooltip 渲染）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    mountPopover({ onOpenChange });
    expect(popup()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();
    expect(title()!.textContent).toBe('Title');
    expect(content()!.textContent).toBe('content');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('mouseleave ⇒ -hidden 残骸（removeOnLeave=false）', async () => {
    vi.useFakeTimers();
    mountPopover({});
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();

    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()!.className).toContain('apollo-popover-hidden');
  });

  it('非受控 + title/content 均为空 ⇒ 不开启且不发回调（onInternalOpenChange 抑制）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    mountPopover({ title: undefined, content: undefined, onOpenChange }, '');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(container()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('受控 + 无内容 ⇒ 浮层照开（antd 口径：受控不做 noTitle 压制，L4 钉住）', async () => {
    mountPopover({ title: undefined, content: undefined, open: true }, '');
    await nextTick();
    expect(container()).not.toBeNull();
    expect(triggerEl()!.className).toContain('apollo-popover-open');
    expect(triggerEl()!.getAttribute('aria-describedby')).toBe('apollo-tooltip');
  });

  it('title=0 合法（isRenderable 对 0 为真）', async () => {
    vi.useFakeTimers();
    mountPopover({ title: 0 }, 'c');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(title()!.textContent).toBe('0');
  });

  it('title/content 可为惰性函数', async () => {
    vi.useFakeTimers();
    mountPopover({ title: () => 'lazy-title', content: () => 'lazy-content' }, '');
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(title()!.textContent).toBe('lazy-title');
    expect(content()!.textContent).toBe('lazy-content');
  });

  it('受控 open：跟随 prop；update:open 与 onOpenChange 同时发出（C11）', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const wrapper = mountPopover({ open: false, onOpenChange });
    await nextTick();
    expect(container()).toBeNull();

    await wrapper.setProps({ open: true });
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
  });

  it('trigger=click：点击开启', async () => {
    vi.useFakeTimers();
    mountPopover({ trigger: 'click' });
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(container()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('click'));
    await vi.runAllTimersAsync();
    expect(container()).not.toBeNull();
  });

  it('预设色 ⇒ {p}-{color} 类（样式由 popover 样式块消费 arrow-background-color）', async () => {
    vi.useFakeTimers();
    mountPopover({ color: 'blue' });
    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    expect(popup()!.className).toContain('apollo-popover-blue');
  });

  it('expose：forceAlign / nativeElement / popupElement 透传', async () => {
    vi.useFakeTimers();
    const wrapper = mountPopover({ open: true });
    await vi.runAllTimersAsync();
    const exposed = wrapper.vm as unknown as {
      forceAlign: () => void;
      nativeElement: () => HTMLElement | null;
      popupElement: () => HTMLElement | null;
    };
    expect(exposed.nativeElement()).toBe(triggerEl());
    expect(exposed.popupElement()).toBe(popup());
    expect(() => exposed.forceAlign()).not.toThrow();
  });
});
