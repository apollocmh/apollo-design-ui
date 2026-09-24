/**
 * `_internal/trigger` 的 L1 冒烟（G4 内部基建 —— tooltip 的第一消费者之前的钉子）。
 *
 * 判据：rc-trigger@3.10.1 的主流程（开合 / portal / motion 残骸 / placement 类名）。
 * jsdom 无真实布局（所有 rect 为 0）—— 几何断言只钉「对齐跑通 + 定位样式落位」，
 * 逐像素的几何由 L6 + position 包的 oracle 负责。
 *
 * ⚠️ 关闭残骸（-hidden）断言用 `supportMotion: false`：jsdom 里没有 CSS 动画，
 *    supportMotion=true 的离场时间线等不到 transitionend（deadline 0 无兜底）。
 */

import { getPlacements } from '@apollo-design/position';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Trigger } from '../trigger';

const placements = getPlacements({
  arrowPointAtCenter: false,
  autoAdjustOverflow: true,
  arrowWidth: 4,
  borderRadius: 6,
  offset: 4,
  visibleFirst: true,
});

// portal 挂在 document.body —— 断言要在 body 上找
const popup = () => document.querySelector<HTMLElement>('.apollo-trigger');
const triggerEl = () => document.querySelector<HTMLElement>('.trigger-target');

afterEach(() => {
  document.body.innerHTML = '';
});

function mountTrigger(props: Record<string, unknown>) {
  return mount(Trigger, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      prefixCls: 'apollo-trigger',
      builtinPlacements: placements,
      motion: { motionName: 'apollo-zoom-big-fast', supportMotion: false },
      popup: 'TIP',
      ...props,
    },
    slots: { default: () => h('button', { class: 'trigger-target' }, 'target') },
  });
}

describe('Trigger · L1 开合与渲染', () => {
  it('hover 触发：mouseenter ⇒ portal 出现 popup；mouseleave ⇒ 留 -hidden 残骸', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    mountTrigger({ popup: 'TIP', mouseLeaveDelay: 0, onOpenChange });
    expect(popup()).toBeNull();

    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(popup()).not.toBeNull();
    expect(popup()!.textContent).toContain('TIP');
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // 关闭：mouseleave（delay 0 ⇒ 立即）；removeOnLeave=false ⇒ 残骸带 -hidden
    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await vi.runAllTimersAsync();
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(popup()!.className).toContain('apollo-trigger-hidden');
    vi.useRealTimers();
  });

  it('受控 open：false ⇒ 不渲染；true ⇒ 渲染且带 placement 类名 + 定位样式', async () => {
    const wrapper = mountTrigger({ open: false });
    await nextTick();
    expect(popup()).toBeNull();

    await wrapper.setProps({ open: true });
    await vi.waitFor(() => {
      expect(popup()!.className).toContain('apollo-trigger-placement-top');
    });
    // ⚠️ jsdom 无布局（isVisible 恒 false）⇒ 对齐早退 ⇒ ready 恒 false，
    //    定位样式停在屏外占位 —— 几何正确性由 position 包 oracle 与 L6 负责。
  });

  it('arrow：传入 arrow ⇒ 渲染 {p}-arrow 与 content；undefined ⇒ 不渲染', async () => {
    mountTrigger({
      open: true,
      arrow: { content: h('span', { class: 'arrow-content' }) },
    });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    expect(document.querySelector('.apollo-trigger-arrow')).not.toBeNull();
    expect(document.querySelector('.arrow-content')).not.toBeNull();

    document.body.innerHTML = '';
    mountTrigger({ open: true });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    expect(document.querySelector('.apollo-trigger-arrow')).toBeNull();
  });

  it('CSS 变量与 zIndex：--arrow-x/y 恒落位；zIndex 透传', async () => {
    mountTrigger({ open: true, zIndex: 1070 });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    const root = popup()!;
    expect(root.style.getPropertyValue('--arrow-x')).toBe('0px');
    expect(root.style.getPropertyValue('--arrow-y')).toBe('0px');
    expect(root.style.zIndex).toBe('1070');
  });

  it('expose：forceAlign / nativeElement / popupElement', async () => {
    const wrapper = mountTrigger({ open: true });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    const exposed = wrapper.vm as unknown as {
      forceAlign: () => void;
      nativeElement: () => HTMLElement | null;
      popupElement: () => HTMLElement | null;
    };
    expect(exposed.nativeElement()).toBe(triggerEl());
    expect(exposed.popupElement()).toBe(popup());
    expect(() => exposed.forceAlign()).not.toThrow();
  });

  it('destroyOnHidden：关闭后 portal 卸载（对照：默认保留残骸）', async () => {
    const wrapper = mountTrigger({ open: true, destroyOnHidden: true });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    await wrapper.setProps({ open: false });
    await vi.waitFor(() => expect(popup()).toBeNull());
  });

  it('content 缓存：开启时实时更新；关闭中冻结（rc PopupContent 的 memo 协议）', async () => {
    const wrapper = mountTrigger({ open: true });
    await vi.waitFor(() => expect(popup()!.textContent).toContain('TIP'));
    // 开启中：cache=false ⇒ 内容实时更新
    await wrapper.setProps({ popup: 'TIP2' });
    await nextTick();
    expect(popup()!.textContent).toContain('TIP2');
    // 关闭中：cache=true ⇒ 冻结；改内容不生效
    await wrapper.setProps({ open: false });
    await nextTick();
    await wrapper.setProps({ popup: 'TIP3' });
    await nextTick();
    expect(popup()!.textContent).toContain('TIP2');
    expect(popup()!.textContent).not.toContain('TIP3');
    // fresh ⇒ 关闭中也不缓存
    await wrapper.setProps({ fresh: true });
    await nextTick();
    expect(popup()!.textContent).toContain('TIP3');
  });
});
