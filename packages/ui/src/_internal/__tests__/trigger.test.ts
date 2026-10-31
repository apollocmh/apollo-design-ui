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
import { defineComponent, h, nextTick } from 'vue';
import { isTargetOutsideArea, Trigger } from '../trigger';

/** 组件形态的触发器 —— Vue 的 ref 在这上面给的是**实例**，不是元素。 */
const CompTrigger = defineComponent({
  name: 'CompTrigger',
  setup: () => () => h('button', { class: 'trigger-target' }, 'target'),
});

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

  /**
   * ⭐ 回归：浮层元素必须接到 `overlay.popupRef`（`setPopupEle` 是唯一写入口）。
   *
   * 漏接线的表现是"鼠标一移向浮层它就消失"—— `onMouseleave` 排的关闭定时器
   * 没人顶掉，因为保活分支的 `popupRef.value.contains(...)` 恒为 `null` 判据失败。
   * 这条用例就是那个可见行为的钉子：离开触发元素 ⇒ 移进浮层 ⇒ 推过 leave 延迟。
   */
  it('hover 保活：鼠标移进浮层 ⇒ 顶掉 mouseleave 排的关闭定时器', async () => {
    vi.useFakeTimers();
    mountTrigger({ mouseLeaveDelay: 0.1 });

    await triggerEl()!.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(0);
    await nextTick();
    expect(popup()).not.toBeNull();

    // 离开触发元素：此刻只是**排**了 0.1s 的关闭定时器，浮层还开着
    await triggerEl()!.dispatchEvent(new Event('mouseleave'));
    await nextTick();
    expect(popup()!.className).not.toContain('apollo-trigger-hidden');

    // 还没到 0.1s 就移进浮层 ⇒ 保活；再把时钟推过 leave 延迟也不能关
    await popup()!.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(1000);
    await nextTick();
    expect(popup()!.className).not.toContain('apollo-trigger-hidden');

    // 对照：不进浮层，同样的等待必须关掉（证明上面的"没关"确实是保活生效）
    await popup()!.dispatchEvent(new Event('mouseleave'));
    await vi.advanceTimersByTimeAsync(1000);
    await nextTick();
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

  it('关闭时沿用最后 offset，不回落到屏外占位（rc useOffsetStyle: ready || !open）', async () => {
    const wrapper = mountTrigger({ open: true });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    await wrapper.setProps({ open: false });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    const root = popup();
    if (!root) throw new Error('popup residue not rendered');
    // 修复前：close 时 ready=false ⇒ left/top 被改成 -1000vw/-1000vh，
    // 离场动画在屏幕外播放。修复后：关闭但 !ready 仍使用最后一次 offset。
    expect(root.style.left).not.toBe('-1000vw');
    expect(root.style.top).not.toBe('-1000vh');
  });

  it('routes current popup attrs to the actual popup without replacing it', async () => {
    const firstClick = vi.fn();
    const secondClick = vi.fn();
    const once = vi.fn();
    const replacement = vi.fn();
    const wrapper = mountTrigger({
      open: true,
      popupClassName: 'owned-popup',
      popupStyle: { paddingTop: '4px' },
      popupAttrs: {
        id: 'tour-popup',
        'aria-label': 'Current tour',
        'data-current': 'first',
        class: ['native-popup', { 'native-active': true }],
        style: [{ color: 'rgb(10, 20, 30)' }, { borderTopWidth: '2px' }],
        onClick: [firstClick, secondClick],
        onClickOnce: once,
      },
    });
    try {
      await vi.waitFor(() => expect(popup()).not.toBeNull());
      const root = popup();
      if (!root) throw new Error('Missing actual popup');
      expect(root.id).toBe('tour-popup');
      expect(root.getAttribute('aria-label')).toBe('Current tour');
      expect(root.dataset.current).toBe('first');
      expect(root.classList.contains('owned-popup')).toBe(true);
      expect(root.classList.contains('native-popup')).toBe(true);
      expect(root.classList.contains('native-active')).toBe(true);
      expect(root.style.color).toBe('rgb(10, 20, 30)');
      expect(root.style.borderTopWidth).toBe('2px');
      expect(root.style.paddingTop).toBe('4px');
      expect(triggerEl()?.id).toBe('');
      expect(triggerEl()?.hasAttribute('data-current')).toBe(false);
      const click = new MouseEvent('click', { bubbles: true });
      root.dispatchEvent(click);
      root.click();
      expect(firstClick).toHaveBeenCalledTimes(2);
      expect(secondClick).toHaveBeenCalledTimes(2);
      expect(firstClick).toHaveBeenNthCalledWith(1, click);
      expect(once).toHaveBeenCalledTimes(1);

      await wrapper.setProps({
        popupAttrs: { id: 'tour-popup-later', 'data-current': 'next', onClick: replacement },
      });
      expect(popup()).toBe(root);
      expect(root.id).toBe('tour-popup-later');
      expect(root.dataset.current).toBe('next');
      expect(root.hasAttribute('aria-label')).toBe(false);
      expect(root.classList.contains('native-popup')).toBe(false);
      expect(root.style.color).toBe('');
      expect(root.style.paddingTop).toBe('4px');
      root.click();
      expect(replacement).toHaveBeenCalledTimes(1);
      expect(firstClick).toHaveBeenCalledTimes(2);
      expect(once).toHaveBeenCalledTimes(1);

      await wrapper.setProps({ popupAttrs: undefined });
      expect(popup()).toBe(root);
      expect(root.id).toBe('');
      expect(root.hasAttribute('data-current')).toBe(false);
      expect(root.classList.contains('owned-popup')).toBe(true);
    } finally {
      wrapper.unmount();
    }
  });

  it('merges popup native listeners with overlay hover retention', async () => {
    vi.useFakeTimers();
    const firstEnter = vi.fn();
    const secondEnter = vi.fn();
    const leave = vi.fn();
    const wrapper = mountTrigger({
      mouseLeaveDelay: 0.1,
      popupAttrs: { onMouseenter: [firstEnter, secondEnter], onMouseleave: leave },
    });
    try {
      const target = triggerEl();
      if (!target) throw new Error('Missing actual trigger');
      target.dispatchEvent(new Event('mouseenter'));
      await vi.advanceTimersByTimeAsync(0);
      await nextTick();
      const root = popup();
      if (!root) throw new Error('Missing actual popup');
      target.dispatchEvent(new Event('mouseleave'));
      await nextTick();
      const enter = new Event('mouseenter');
      root.dispatchEvent(enter);
      await vi.advanceTimersByTimeAsync(1000);
      await nextTick();
      expect(firstEnter).toHaveBeenCalledExactlyOnceWith(enter);
      expect(secondEnter).toHaveBeenCalledExactlyOnceWith(enter);
      expect(root.classList.contains('apollo-trigger-hidden')).toBe(false);
      root.dispatchEvent(new Event('mouseleave'));
      await vi.advanceTimersByTimeAsync(1000);
      await nextTick();
      expect(leave).toHaveBeenCalledTimes(1);
      expect(root.classList.contains('apollo-trigger-hidden')).toBe(true);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
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
    const root = popup();
    if (!root) throw new Error('popup not rendered');
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

  /**
   * ⭐ 回归：**触发器是组件 vnode** 时，点浮层外面必须关闭。
   *
   * Vue 的 ref 在**组件** vnode 上给的是**组件实例**，而 `overlay.targetRef` 的契约
   * 是 `Ref<HTMLElement | null>`（`use-overlay.ts` 头注「绑到触发元素上」）。把实例
   * 原样塞进去 ⇒ overlay 的 `inPopupOrChild()` 里 `containsOrIs(target, ele)` 走到
   * `host.contains(...)` 抛 **TypeError** ⇒ 外部点击处理器整体崩掉 ⇒ 表现为
   * 「点浮层外面不关闭」。`ColorPicker` 的 `ColorTrigger`、`<Button>` 触发器
   * 全是这种形态（2026-10-16 实测）。
   *
   * ⚠️ 断言 `nativeElement()` 是**元素**：只断言「点外面会关」会**假绿** ——
   *    targetRef 恒 null 时一切都算外部点击，同样"会关"（但点浮层内部也会关）。
   */
  it('组件触发器：点外部 ⇒ 关闭（targetRef 必须是元素，不能是组件实例）', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(Trigger, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        prefixCls: 'apollo-trigger',
        builtinPlacements: placements,
        motion: { motionName: 'apollo-zoom-big-fast', supportMotion: false },
        popup: 'TIP',
        action: 'click',
        onOpenChange,
        ...{},
      },
      slots: { default: () => h(CompTrigger) },
    });
    await nextTick();

    // 归一后的触发元素就是组件渲染出来的那个 button
    const exposed = wrapper.vm as unknown as { nativeElement: () => HTMLElement | null };
    expect(exposed.nativeElement()).toBe(triggerEl());
    expect(triggerEl()).toBeInstanceOf(HTMLElement);

    await triggerEl()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // 对照：点浮层**内部**不关（证明 target/popup 都真拿到了元素）
    await popup()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    // 点外部 ⇒ 关
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(popup()!.className).toContain('apollo-trigger-hidden');
    wrapper.unmount();
  });
});

describe('Trigger · 生命周期清理', () => {
  it('尺寸观察仅属于当前打开实例，关闭、重开和卸载均释放旧观察', async () => {
    class ResizeObserverProbe {
      readonly observe = vi.fn<(target: Element, options?: ResizeObserverOptions) => void>();
      readonly unobserve = vi.fn<(target: Element) => void>();
      readonly disconnect = vi.fn();
      constructor() {
        observers.push(this);
      }
    }
    const observers: ResizeObserverProbe[] = [];
    vi.stubGlobal('ResizeObserver', ResizeObserverProbe);
    const wrapper = mountTrigger({ open: true });
    try {
      await vi.waitFor(() => expect(observers.length).toBeGreaterThan(0));
      const current = observers.at(-1);
      if (!current) throw new Error('Missing current size observer');
      expect(current.observe.mock.calls).toEqual([
        [popup(), { box: 'border-box' }],
        [triggerEl(), { box: 'border-box' }],
      ]);
      await wrapper.setProps({ open: false });
      expect(current.disconnect).toHaveBeenCalledTimes(1);
      await wrapper.setProps({ open: true });
      await nextTick();
      const reopened = observers.at(-1);
      expect(reopened).not.toBe(current);
      wrapper.unmount();
      for (const observer of observers) expect(observer.disconnect).toHaveBeenCalledTimes(1);
    } finally {
      if (wrapper.exists()) wrapper.unmount();
      vi.unstubAllGlobals();
    }
  });

  /**
   * VNA-TRIGGER-01 回归。
   *
   * Native owner-window listeners are active only while open and are released
   * through the same watcher cleanup on close, reopening and unmount.
   */
  it('★ 卸载时移除 window resize 监听（同一函数引用，否则静默泄漏）', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const wrapper = mountTrigger({ open: false });
    expect(addSpy.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
    await wrapper.setProps({ open: true });
    await vi.waitFor(() => expect(popup()).not.toBeNull());
    await nextTick();
    const addedResize = addSpy.mock.calls.filter(([type]) => type === 'resize').map(([, fn]) => fn);
    expect(addedResize.length, '挂载时应注册 window resize 监听').toBeGreaterThan(0);

    await wrapper.setProps({ open: false });
    const removedResize = removeSpy.mock.calls
      .filter(([type]) => type === 'resize')
      .map(([, fn]) => fn);
    for (const handler of addedResize) {
      expect(removedResize, '关闭时应移除刚注册的同一个 handler').toContain(handler);
    }

    await wrapper.setProps({ open: true });
    await nextTick();
    const beforeUnmount = removeSpy.mock.calls.length;
    wrapper.unmount();
    const removedOnUnmount = removeSpy.mock.calls
      .slice(beforeUnmount)
      .filter(([type]) => type === 'resize')
      .map(([, fn]) => fn);
    for (const handler of addedResize) {
      expect(removedOnUnmount, '重新打开后卸载仍移除当前 handler').toContain(handler);
    }

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe('Trigger · 滚动跟随与视口外对齐（2026-10-22 Menu 审计 M-06）', () => {
  it('浮层打开时把 window 也注册为滚动源（上游 useWatch 的 mergedList 含 win）', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const wrapper = mountTrigger({ open: true });
    await vi.waitFor(() => {
      expect(popup()).not.toBeNull();
    });

    await nextTick();
    const addedScroll = addSpy.mock.calls
      .filter(([type]) => type === 'scroll')
      .map(([, handler]) => handler);
    expect(addedScroll.length, 'window scroll listener 未挂载').toBeGreaterThan(0);

    // 触发一次滚动不应抛错（真实几何由浏览器门禁断言）
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    wrapper.unmount();
    const removedScroll = removeSpy.mock.calls
      .filter(([type]) => type === 'scroll')
      .map(([, handler]) => handler);
    for (const handler of addedScroll) {
      expect(removedScroll, '卸载时应移除同一个 scroll handler').toContain(handler);
    }
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('isTargetOutsideArea：完全在视口外才跳过对齐，零尺寸不跳', () => {
    const area = { left: 0, top: 0, right: 1000, bottom: 800 };
    const rect = (left: number, top: number, width = 100, height = 40) => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    });

    expect(isTargetOutsideArea(rect(10, 10), area)).toBe(false);
    expect(isTargetOutsideArea(rect(950, 10), area)).toBe(false); // 部分相交
    expect(isTargetOutsideArea(rect(10, 2000), area)).toBe(true); // 下方视口外
    expect(isTargetOutsideArea(rect(10, -200), area)).toBe(true); // 上方视口外
    expect(isTargetOutsideArea(rect(2000, 10), area)).toBe(true); // 右侧视口外
    expect(isTargetOutsideArea(rect(-200, 10), area)).toBe(true); // 左侧视口外
    // jsdom：矩形恒为 0 ⇒ 无法判定 ⇒ 仍然对齐（不改变既有单测行为）
    expect(isTargetOutsideArea(rect(0, 0, 0, 0), area)).toBe(false);
  });
});
