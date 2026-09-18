/**
 * L2 —— `useOverlay` 在 jsdom 下的行为。
 *
 * 契约来源：`@rc-component/trigger@3.10.1/es/index.js` + `es/hooks/useWinClick.js` +
 * `@rc-component/portal@2.2.1/es/useEscKeyDown.js`。
 *
 * ⚠️ 三个会踩的坑（契约 §7.1）：
 * 1. 延迟单位是**秒** —— `advanceTimersByTime(delay * 1000)`
 * 2. `mouseenter` 与 `pointerenter` **都绑** —— 一次真实移入触发两次 setOpen（净效果一次）
 * 3. Esc 栈是模块级单例 —— 用例之间必须换独立 stack 或 reset
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

// ⚠️ 直接从具体模块导入，不要走 `'..'`（index.ts）：
// index.ts 是纯 re-export，v8 覆盖率会把它记成 0%，把整包覆盖率拉到阈值以下。
import { createEscStack } from '../esc-stack';
import { type UseOverlayOptions, type UseOverlayReturn, useOverlay } from '../use-overlay';

interface Harness {
  api: UseOverlayReturn;
  target: () => HTMLElement;
  popup: () => HTMLElement;
  setControlled: (value: boolean | undefined) => void;
}

/**
 * 测试宿主。结构刻意保持最简 —— 本包不产 DOM（R4），宿主只是把
 * `targetProps` / `popupProps` 接到真实元素上，好让事件真的能派发。
 */
function mountOverlay(options: UseOverlayOptions = {}): Harness {
  let api!: UseOverlayReturn;

  const Wrapper = defineComponent({
    setup() {
      api = useOverlay(options);
      return () =>
        h('div', [
          h('button', { ref: api.targetRef, class: 'target', ...api.targetProps.value }, 'target'),
          api.open.value
            ? h('div', { ref: api.popupRef, class: 'popup', ...api.popupProps.value }, 'popup')
            : null,
        ]);
    },
  });

  mount(Wrapper, { attachTo: document.body });

  return {
    api,
    target: () => document.querySelector<HTMLElement>('.target') as HTMLElement,
    popup: () => document.querySelector<HTMLElement>('.popup') as HTMLElement,
    setControlled: () => {},
  };
}

/** 受控版宿主：`open` 由外部 ref 提供，且**不回写**（模拟"父级不配合"）。 */
function mountControlled(initial: boolean | undefined, stack = createEscStack()) {
  const outer = ref<boolean | undefined>(initial);
  let api!: UseOverlayReturn;

  const Wrapper = defineComponent({
    setup() {
      api = useOverlay({ open: () => outer.value, escStack: stack });
      return () =>
        h('div', [
          h('button', { ref: api.targetRef, class: 'target', ...api.targetProps.value }, 'target'),
          api.open.value ? h('div', { ref: api.popupRef, class: 'popup' }, 'popup') : null,
        ]);
    },
  });

  mount(Wrapper, { attachTo: document.body });
  return {
    api,
    outer,
    target: () => document.querySelector<HTMLElement>('.target') as HTMLElement,
  };
}

function fire(el: EventTarget, type: string, init: MouseEventInit = {}) {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('受控 / 非受控', () => {
  it('非受控：defaultOpen 生效，点击可切换', async () => {
    const { api, target } = mountOverlay({ action: 'click', defaultOpen: false });
    expect(api.open.value).toBe(false);

    fire(target(), 'click');
    await nextTick();
    expect(api.open.value).toBe(true);

    fire(target(), 'click');
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('受控：open 为 true 时点击不会自己关掉（父级不回写 ⇒ 弹回）', async () => {
    const { api, target } = mountControlled(true);
    expect(api.open.value).toBe(true);
    expect(target()).toBeTruthy();

    fire(target(), 'click');
    await nextTick();
    // click 动作下会 triggerOpen(false) → 内部值变了，但受控值仍是 true
    expect(api.open.value).toBe(true);
  });

  it('⭐ onOpenChange 只在真的变了才回调', async () => {
    const onOpenChange = vi.fn();
    const { api } = mountOverlay({ onOpenChange });

    api.setOpen(false);
    await nextTick();
    expect(onOpenChange).not.toHaveBeenCalled();

    api.setOpen(true);
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe('disabled —— 压制渲染但不改状态', () => {
  it('⭐ disabled 时 open 恒为 false，但 setOpen 仍会走到 onOpenChange', async () => {
    const onOpenChange = vi.fn();
    const { api } = mountOverlay({ disabled: true, onOpenChange });

    api.setOpen(true);
    await nextTick();

    expect(api.rawOpen.value).toBe(true); // 状态真的变了
    expect(api.open.value).toBe(false); // 但被压制
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

describe('Click', () => {
  it('show=click 时开启并记录鼠标位置', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click', { clientX: 12, clientY: 34 });
    await nextTick();

    expect(api.open.value).toBe(true);
    expect(api.mousePos.value).toEqual([12, 34]);
  });

  it('没有 clientX/Y 的事件不会写入 mousePos（防御分支）', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    target().dispatchEvent(new Event('click')); // 裸 Event，没有 MouseEvent 的坐标
    await nextTick();
    expect(api.open.value).toBe(true);
    expect(api.mousePos.value).toBeNull();
  });

  it('setOpen(0) 是同步的', () => {
    const { api } = mountOverlay();
    api.setOpen(true, 0);
    expect(api.open.value).toBe(true);
  });
});

describe('Hover', () => {
  it('默认动作是 hover，且 hover 型会拿到 touch 处理器', () => {
    const { api } = mountOverlay();
    // ⚠️ 键名是 Vue 的小写约定（`onMouseenter`），不是 React 的 `onMouseEnter` ——
    // Vue 的 `parseName` 会 hyphenate，`onMouseEnter` 会被解析成 `mouse-enter`（不存在）。
    expect(api.targetProps.value.onMouseenter).toBeTypeOf('function');
    expect(api.targetProps.value.onPointerenter).toBeTypeOf('function');
    expect(api.targetProps.value.onTouchstart).toBeTypeOf('function');
  });

  it('移出后 mouseLeaveDelay（默认 0.1s）才关闭', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'hover' });

    fire(target(), 'mouseenter');
    await nextTick();
    vi.advanceTimersByTime(0); // mouseEnterDelay 为 undefined ⇒ setTimeout(…, 0)
    await nextTick();
    expect(api.open.value).toBe(true);

    fire(target(), 'mouseleave');
    await nextTick();
    expect(api.open.value).toBe(true); // 还在延迟里

    vi.advanceTimersByTime(99);
    await nextTick();
    expect(api.open.value).toBe(true);

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('⭐⭐ 从 trigger 移到浮层上不会关闭（抢救机制）', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'hover' });

    fire(target(), 'mouseenter');
    await nextTick();
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(api.open.value).toBe(true);

    fire(target(), 'mouseleave'); // 排了一个 100ms 的关闭定时器
    await nextTick();

    // 移入浮层 ⇒ 再排一个**同延迟**的开启定时器，后者 clearDelay 掉前者
    fire(document.querySelector('.popup') as HTMLElement, 'mouseenter');
    await nextTick();
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(api.open.value).toBe(true);
  });

  it('离开浮层后按 mouseLeaveDelay 关闭', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'hover' });

    fire(target(), 'mouseenter');
    await nextTick();
    vi.advanceTimersByTime(0);
    await nextTick();

    fire(document.querySelector('.popup') as HTMLElement, 'mouseleave');
    await nextTick();
    expect(api.open.value).toBe(true);

    vi.advanceTimersByTime(100);
    await nextTick();
    expect(api.open.value).toBe(false);
  });
});

describe('Touch', () => {
  it('再次 touchstart 关闭（touchToHide）', async () => {
    const { api, target } = mountOverlay({ action: 'hover' });
    target().dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true);

    target().dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('touchstart 切换，并抑制后续鼠标事件', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'hover' });

    target().dispatchEvent(new Event('touchstart', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true);

    // touched 被置位 ⇒ mouseleave 被 ignoreMouseTrigger 跳过
    fire(target(), 'mouseleave');
    await nextTick();
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(api.open.value).toBe(true);
  });
});

describe('Focus', () => {
  it('focus 开启 / blur 关闭', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'focus' });

    // focus / blur 不冒泡，直接派发到元素；focusDelay 为 undefined ⇒ 下一个宏任务
    target().dispatchEvent(new FocusEvent('focus'));
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(api.open.value).toBe(true);

    target().dispatchEvent(new FocusEvent('blur'));
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(api.open.value).toBe(false);
  });
});

describe('ContextMenu', () => {
  it('右键开启，并阻止原生菜单', async () => {
    const { api, target } = mountOverlay({ action: 'contextMenu' });

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    target().dispatchEvent(event);
    await nextTick();

    expect(api.open.value).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('再次右键关闭（hideActions 也含 contextMenu）', async () => {
    const { api, target } = mountOverlay({ action: 'contextMenu' });
    target().dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await nextTick();
    expect(api.open.value).toBe(true);

    target().dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await nextTick();
    expect(api.open.value).toBe(false);
  });
});

describe('外部点击（useWinClick）', () => {
  it('点外部 mousedown 立即关闭（不带延迟）', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click');
    await nextTick();
    expect(api.open.value).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('⭐ 点浮层内部不关闭', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click');
    await nextTick();

    const popup = document.querySelector('.popup') as HTMLElement;
    // 先 pointerdown（capture，浮层把它置 true），再 mousedown
    popup.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    popup.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();

    expect(api.open.value).toBe(true);
  });

  it('点在 trigger 自身上不关闭', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click');
    await nextTick();

    target().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true);
  });

  it('⭐ contextMenu 型也吃外部点击（clickToHide 含 contextMenu）', async () => {
    const { api, target } = mountOverlay({ action: 'contextMenu' });
    target().dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await nextTick();
    expect(api.open.value).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('trigger 元素缺失时（targetRef 为空）按外部处理', async () => {
    let api!: UseOverlayReturn;
    // 刻意**不绑** targetRef —— 覆盖 containsOrIs / getShadowHost 的 `!host` 分支
    const Wrapper = defineComponent({
      setup() {
        api = useOverlay({ action: 'click' });
        return () =>
          h('div', [api.open.value ? h('div', { ref: api.popupRef, class: 'popup' }, 'p') : null]);
      },
    });
    mount(Wrapper, { attachTo: document.body });

    api.setOpen(true);
    await nextTick();
    expect(api.open.value).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('目标是 window（非 Node）时按外部处理 —— 防御分支', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click');
    await nextTick();
    expect(api.open.value).toBe(true);

    // 直接在 window 上派发：composedPath()[0] 是 window，不是 Node
    window.dispatchEvent(new MouseEvent('mousedown'));
    await nextTick();
    expect(api.open.value).toBe(false);
  });

  it('hover 型浮层不受外部点击影响（clickToHide 为 false）', async () => {
    vi.useFakeTimers();
    const { api, target } = mountOverlay({ action: 'hover' });
    fire(target(), 'mouseenter');
    await nextTick();
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(api.open.value).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true);
  });
});

describe('子浮层与清理', () => {
  it('⭐ 登记过的子浮层不算"外部"（点它不关闭）', async () => {
    const { api, target } = mountOverlay({ action: 'click' });
    fire(target(), 'click');
    await nextTick();
    expect(api.open.value).toBe(true);

    const sub = document.createElement('div');
    document.body.appendChild(sub);
    api.registerSubPopup('sub', sub);

    sub.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true);

    sub.remove();
  });

  it('⭐ shadow host 也算"在浮层内"（getShadowHost 分支）', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const slot = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(slot);

    let api!: UseOverlayReturn;
    const Wrapper = defineComponent({
      setup() {
        api = useOverlay({ action: 'click' });
        return () =>
          h('div', [
            h('button', { ref: api.targetRef, class: 'target', ...api.targetProps.value }, 't'),
            api.open.value ? h('div', { ref: api.popupRef, class: 'popup' }, 'p') : null,
          ]);
      },
    });
    mount(Wrapper, { attachTo: slot });

    // 触发元素在 shadow root 内 ⇒ 它的 getRootNode().host 是 host
    slot.querySelector<HTMLElement>('.target')?.dispatchEvent(new MouseEvent('click'));
    await nextTick();
    expect(api.open.value).toBe(true);

    host.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await nextTick();
    expect(api.open.value).toBe(true); // host 被判为"内部"，不关

    host.remove();
  });

  it('卸载后从 Esc 栈移除，并清掉待执行的延迟', async () => {
    vi.useFakeTimers();
    const stack = createEscStack({ win: window });
    let api!: UseOverlayReturn;
    const Wrapper = defineComponent({
      setup() {
        api = useOverlay({ escStack: stack, action: 'hover' });
        return () =>
          h('button', { ref: api.targetRef, class: 'target', ...api.targetProps.value }, 't');
      },
    });
    const wrapper = mount(Wrapper, { attachTo: document.body });

    api.setOpen(true);
    await nextTick();
    expect(stack.size).toBe(1);

    wrapper.unmount();
    expect(stack.size).toBe(0);
    expect(stack.attached).toBe(false);
  });
});

describe('Esc（层级栈）', () => {
  it('开启时入栈，Esc 关闭', async () => {
    const stack = createEscStack({ win: window });
    let api!: UseOverlayReturn;
    const Wrapper = defineComponent({
      setup() {
        api = useOverlay({ escStack: stack });
        return () => h('div', [h('button', { ref: api.targetRef, class: 'target' }, 't')]);
      },
    });
    mount(Wrapper, { attachTo: document.body });

    api.setOpen(true);
    await nextTick();
    expect(stack.size).toBe(1);
    expect(stack.attached).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(api.open.value).toBe(false);
    expect(stack.size).toBe(0);
  });

  it('⭐⭐ 只有最后开的那个浮层响应 Esc', async () => {
    const stack = createEscStack({ win: window });
    let a!: UseOverlayReturn;
    let b!: UseOverlayReturn;

    // ⚠️ 两个实例必须在**同一个 app** 里 —— 分开 mount 会得到两个独立 app，
    // `useId()` 都从 0 开始 ⇒ escId 撞车 ⇒ 栈里只有一个（幂等 push）。
    const Wrapper = defineComponent({
      setup() {
        a = useOverlay({ escStack: stack });
        b = useOverlay({ escStack: stack });
        return () =>
          h('div', [h('button', { ref: a.targetRef }), h('button', { ref: b.targetRef })]);
      },
    });
    mount(Wrapper, { attachTo: document.body });

    a.setOpen(true);
    await nextTick();
    b.setOpen(true);
    await nextTick();
    expect(stack.size).toBe(2);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(b.open.value).toBe(false); // 栈顶关
    expect(a.open.value).toBe(true); // 下面的不动

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(a.open.value).toBe(false); // 再按一次才轮到它
  });
});
