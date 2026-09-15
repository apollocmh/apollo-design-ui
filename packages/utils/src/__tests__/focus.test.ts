import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import {
  getFocusNodeList,
  lockFocus,
  resetFocusLock,
  triggerFocus,
  useLockFocus,
} from '../dom/focus';

/**
 * jsdom 不实现布局 → `offsetParent` 恒为 `null` → `isVisible()` 对**所有**元素返回 false
 * → `focusable()` 全为 false。所以这一组测试必须先把「元素可见」这个前提造出来。
 *
 * 打桩语义要尽量贴近真实浏览器，否则测的就不是 `focusable()` 的逻辑了：
 *   真实浏览器里 `offsetParent` 为 `null` 有三种原因 ——
 *     a) `display: none`（自己或祖先）
 *     b) `position: fixed`
 *     c) **元素不在文档里**（游离子树）
 *   这里只近似 (c)：用 `isConnected` 判「是否挂在文档中」。
 *   (a)(b) 需要布局引擎，jsdom 给不了 —— 那部分留给 L6 视觉/真实浏览器层。
 *
 * ⚠️ 第一版写成 `this.parentElement ?? null` 是错的：游离容器的子元素**有** parentElement，
 *    于是游离子树被误判为"可见"，`游离元素不可聚焦` 用例直接失效。
 */
function stubLayout(): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get(this: HTMLElement) {
      if (!this.isConnected) {
        return null;
      }
      return this.parentElement ?? null;
    },
    configurable: true,
  });
}

function restoreLayout(): void {
  // @ts-expect-error 删除测试期打的补丁，回到 jsdom 原生行为
  delete HTMLElement.prototype.offsetParent;
}

/**
 * jsdom 不实现 `isContentEditable` —— 它恒为 `false`，且**不会**由 `contenteditable` 属性反映出来。
 * 真实浏览器里它是沿祖先链计算的活属性，这里只能显式打桩。
 *
 * 这不是"为了通过测试而造假"：`focusable()` 依赖的契约就是「`isContentEditable` 为真即可聚焦」，
 * 打桩是在补齐环境缺失的输入，不是在改期望值。用例里会先断言 jsdom 的原始值确实是 `false`。
 */
function stubContentEditable(element: HTMLElement): void {
  Object.defineProperty(element, 'isContentEditable', { value: true, configurable: true });
}

function buildContainer(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

beforeEach(() => {
  stubLayout();
  resetFocusLock();
});

afterEach(() => {
  resetFocusLock();
  restoreLayout();
});

describe('getFocusNodeList', () => {
  it('返回可聚焦元素，顺序为「容器自身 → 文档顺序」', () => {
    const container = buildContainer('<input id="a" /><button id="b">x</button><div id="c"></div>');
    container.setAttribute('tabindex', '0');

    const list = getFocusNodeList(container);
    expect(list.map((el) => el.id)).toEqual(['', 'a', 'b']);
  });

  it('div 无 tabindex 不可聚焦', () => {
    const container = buildContainer('<div id="c"></div>');
    expect(getFocusNodeList(container)).toHaveLength(0);
  });

  it('tabindex="0" 使普通元素可聚焦', () => {
    const container = buildContainer('<div id="c" tabindex="0"></div>');
    expect(getFocusNodeList(container).map((el) => el.id)).toEqual(['c']);
  });

  it('tabindex="-1" 默认不可聚焦，includePositive 时可', () => {
    const container = buildContainer('<div id="c" tabindex="-1"></div>');
    expect(getFocusNodeList(container)).toHaveLength(0);
    expect(getFocusNodeList(container, true).map((el) => el.id)).toEqual(['c']);
  });

  it('被禁用的 button 不可聚焦', () => {
    const container = buildContainer('<button id="b" disabled>x</button>');
    expect(getFocusNodeList(container)).toHaveLength(0);
  });

  it('a 有 href 才可聚焦', () => {
    const container = buildContainer('<a id="with" href="#x">1</a><a id="without">2</a>');
    expect(getFocusNodeList(container).map((el) => el.id)).toEqual(['with']);
  });

  it('contentEditable 可聚焦', () => {
    const container = buildContainer('<div id="e" contenteditable="true"></div>');
    const editable = container.querySelector('#e') as HTMLElement;

    // 先钉住环境事实：jsdom **完全没有实现** isContentEditable（连 false 都不是，是 undefined），
    // 且 contenteditable 属性不会反映到它。生产代码里 `node.isContentEditable` 在 jsdom 下恒为 undefined。
    expect(editable.isContentEditable).toBeUndefined();

    stubContentEditable(editable);
    expect(getFocusNodeList(container).map((el) => el.id)).toEqual(['e']);
  });

  it('游离元素（不可见）不可聚焦', () => {
    // 刻意不 appendChild：整棵子树 isConnected === false
    const container = document.createElement('div');
    container.innerHTML = '<input id="a" />';
    expect(container.isConnected).toBe(false);
    expect(getFocusNodeList(container)).toHaveLength(0);
  });

  it('textarea / select 可聚焦', () => {
    const container = buildContainer('<textarea id="t"></textarea><select id="s"></select>');
    expect(getFocusNodeList(container).map((el) => el.id)).toEqual(['t', 's']);
  });
});

describe('triggerFocus', () => {
  it('空元素不抛错', () => {
    expect(() => triggerFocus(null)).not.toThrow();
    expect(() => triggerFocus(undefined)).not.toThrow();
  });

  it('聚焦元素', () => {
    const container = buildContainer('<input id="a" value="hello" />');
    const input = container.querySelector('input') as HTMLInputElement;
    triggerFocus(input);
    expect(document.activeElement).toBe(input);
  });

  it('cursor=start 把选区放到开头', () => {
    const container = buildContainer('<input id="a" value="hello" />');
    const input = container.querySelector('input') as HTMLInputElement;
    triggerFocus(input, { cursor: 'start' });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(0);
  });

  it('cursor=end 把选区放到末尾', () => {
    const container = buildContainer('<input id="a" value="hello" />');
    const input = container.querySelector('input') as HTMLInputElement;
    triggerFocus(input, { cursor: 'end' });
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it('cursor=all（或其它值）全选', () => {
    const container = buildContainer('<input id="a" value="hello" />');
    const input = container.querySelector('input') as HTMLInputElement;
    triggerFocus(input, { cursor: 'all' });
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
  });

  it('textarea 同样支持 cursor', () => {
    const container = buildContainer('<textarea id="t">abc</textarea>');
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    triggerFocus(textarea, { cursor: 'end' });
    expect(textarea.selectionStart).toBe(3);
  });

  it('非输入元素忽略 cursor 不抛错', () => {
    const container = buildContainer('<div id="d" tabindex="0"></div>');
    const div = container.querySelector('div') as HTMLElement;
    expect(() => triggerFocus(div, { cursor: 'end' })).not.toThrow();
  });
});

describe('lockFocus', () => {
  it('返回释放函数，且注册/移除全局监听', () => {
    const container = buildContainer('<input id="a" /><input id="b" />');
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const release = lockFocus(container, 'lock-1');

    expect(addSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    release();

    expect(removeSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('锁定时把焦点拉到容器内的第一个可聚焦元素', () => {
    const container = buildContainer('<input id="a" /><input id="b" />');
    const outside = buildContainer('<input id="outside" />');
    (outside.querySelector('#outside') as HTMLInputElement).focus();
    expect(document.activeElement?.id).toBe('outside');

    const release = lockFocus(container, 'lock-1');
    expect(document.activeElement?.id).toBe('a');

    release();
  });

  it('焦点逃逸时被拉回', () => {
    const container = buildContainer('<input id="a" /><input id="b" />');
    const release = lockFocus(container, 'lock-1');

    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    // 手动派发 focusin —— jsdom 的 focus() 是否派发 focusin 不可依赖
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(container.contains(document.activeElement)).toBe(true);
    release();
  });

  it('多个锁定：后锁者生效', () => {
    const first = buildContainer('<input id="f1" />');
    const second = buildContainer('<input id="s1" />');

    const releaseFirst = lockFocus(first, 'lock-1');
    const releaseSecond = lockFocus(second, 'lock-2');

    expect(document.activeElement?.id).toBe('s1');

    // 焦点从第二个逃逸 → 被拉到第二个，而不是第一个
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(document.activeElement?.id).toBe('s1');

    releaseSecond();
    releaseFirst();
  });

  it('释放后不再拦截', () => {
    const container = buildContainer('<input id="a" />');
    const release = lockFocus(container, 'lock-1');
    release();

    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(document.activeElement).toBe(outside);
  });

  it('重复释放不抛错', () => {
    const container = buildContainer('<input id="a" />');
    const release = lockFocus(container, 'lock-1');
    release();
    expect(() => release()).not.toThrow();
  });
});

describe('useLockFocus', () => {
  it('挂载后锁定，卸载后释放', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="inner" />';
    document.body.appendChild(container);

    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const Comp = defineComponent({
      setup() {
        useLockFocus(true, () => container);
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();

    expect(addSpy).toHaveBeenCalledWith('focusin', expect.any(Function));

    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith('focusin', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('lock 为 false 时不注册', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const Comp = defineComponent({
      setup() {
        useLockFocus(false, () => document.body);
        return () => h('div');
      },
    });

    mount(Comp);
    await nextTick();
    expect(addSpy).not.toHaveBeenCalledWith('focusin', expect.any(Function));
    addSpy.mockRestore();
  });

  it('元素延迟就绪时重试一次（对应 React 版的 useRetryEffect）', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="late" />';
    document.body.appendChild(container);

    // 前两次求值返回 null：第 1 次是 watch 收集依赖时的预求值，
    // 第 2 次是 onMounted 的首次尝试。第 3 次就是 nextTick 重试 —— 这次拿到元素。
    let remainingNull = 2;
    const Comp = defineComponent({
      setup() {
        useLockFocus(true, () => {
          if (remainingNull > 0) {
            remainingNull -= 1;
            return null;
          }
          return container;
        });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    await nextTick();

    expect(remainingNull).toBe(0);
    expect(document.activeElement?.id).toBe('late');
    wrapper.unmount();
  });

  it('重试上限为 1 次：始终拿不到元素就放弃，且不注册监听', async () => {
    let calls = 0;
    const addSpy = vi.spyOn(window, 'addEventListener');

    const Comp = defineComponent({
      setup() {
        useLockFocus(true, () => {
          calls += 1;
          return null;
        });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    await nextTick();

    // ⚠️ 3 次而不是 2 次：`watch(() => toValue(getElement))` 会为收集依赖**先求值一次**，
    //    之后才是 onMounted 首次尝试 + 1 次 nextTick 重试。
    //    这条同时是「getElement 必须是纯函数」的约束证据。
    expect(calls).toBe(3);

    // 真正的契约在这里：不会无限重试
    await nextTick();
    await nextTick();
    expect(calls).toBe(3);
    expect(addSpy).not.toHaveBeenCalledWith('focusin', expect.any(Function));

    wrapper.unmount();
    addSpy.mockRestore();
  });

  it('元素来源是 ref 时，晚于 lock 就绪也能自动锁定', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="async" />';
    document.body.appendChild(container);

    const containerRef = ref<HTMLElement | null>(null);

    const Comp = defineComponent({
      setup() {
        // 传 ref 而不是 getter —— Vue 侧的严格超集用法
        useLockFocus(true, containerRef);
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    // 首次为 null，重试也用完 → 未锁定
    expect(document.activeElement?.id).not.toBe('async');

    containerRef.value = container;
    await nextTick();

    expect(document.activeElement?.id).toBe('async');
    wrapper.unmount();
  });

  it('ignoreElement 标记的元素允许逃逸', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="inner" />';
    document.body.appendChild(container);

    let ignore: ((el: HTMLElement) => void) | undefined;
    const Comp = defineComponent({
      setup() {
        [ignore] = useLockFocus(true, () => container);
        return () => h('div');
      },
    });

    mount(Comp);
    await nextTick();

    const popup = document.createElement('input');
    document.body.appendChild(popup);
    ignore?.(popup);
    popup.focus();
    popup.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    // 被忽略 → 焦点留在弹层里，不被拉回
    expect(document.activeElement).toBe(popup);
  });

  it('ignoreElement 传入 falsy 时静默忽略，不抛错', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="inner" />';
    document.body.appendChild(container);

    let ignore: ((el: HTMLElement) => void) | undefined;
    const Comp = defineComponent({
      setup() {
        [ignore] = useLockFocus(true, () => container);
        return () => h('div');
      },
    });

    mount(Comp);
    await nextTick();

    expect(() => ignore?.(undefined as unknown as HTMLElement)).not.toThrow();
    // 没有登记任何忽略项 → 逃逸仍被拉回
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(container.contains(document.activeElement)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tab 循环（onWindowKeyDown）
// ---------------------------------------------------------------------------

/**
 * `onWindowKeyDown` 的职责：在**锁定区域的边界**把 Tab 的落点改掉。
 *
 * 它自己不移动焦点（那是浏览器的活），只改 `lastFocusElement`；
 * 真正的效果体现在**下一次焦点逃逸**时 `syncFocus` 把焦点拉回哪里。
 * 所以这一组测试都是「按 Tab → 制造逃逸 → 断言落点」。
 */
describe('lockFocus 的 Tab 循环', () => {
  /** 造一个容器 + 两个输入框，并加锁。返回 [a, b]。 */
  function setupLock(): {
    container: HTMLElement;
    a: HTMLInputElement;
    b: HTMLInputElement;
    release: () => void;
  } {
    const container = buildContainer('<input id="a" /><input id="b" />');
    const release = lockFocus(container, 'lock-1');
    const [a, b] = container.querySelectorAll('input');
    if (!a || !b) {
      throw new Error('断言前提不成立：容器里应有 2 个 input');
    }
    return { container, a, b, release };
  }

  /** 把焦点移到容器外的元素并派发 focusin，触发 syncFocus 的拉回逻辑。 */
  function escapeFocus(): void {
    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    outside.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  }

  function pressTab(shiftKey = false): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }));
  }

  it('★ 队尾按 Tab → 逃逸后回到队首', () => {
    const { a, b, release } = setupLock();

    b.focus();
    expect(document.activeElement).toBe(b);

    pressTab();
    escapeFocus();

    expect(document.activeElement).toBe(a);
    release();
  });

  it('★ 队首按 Shift+Tab → 逃逸后回到队尾', () => {
    const { a, b, release } = setupLock();

    // lockFocus 时 syncFocus 已经把焦点放到了队首 a
    expect(document.activeElement).toBe(a);

    pressTab(true);
    escapeFocus();

    expect(document.activeElement).toBe(b);
    release();
  });

  it('★ 非 Tab 键不改变循环目标（逃逸后回到"上次待过的"元素）', () => {
    const { b, release } = setupLock();

    // 先让 lastFocusElement 变成 b：在容器内部移动焦点
    b.focus();
    b.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    // 按一个非 Tab 键 —— 不应触发循环
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    escapeFocus();

    // 没有循环 → 回到上次待过的 b，而不是队首
    expect(document.activeElement).toBe(b);
    release();
  });

  it('非队尾位置按 Tab 不改动循环目标', () => {
    const { a, b, release } = setupLock();

    // a 是队首但不是队尾 → 正向 Tab 不应触发循环
    a.focus();
    pressTab();
    escapeFocus();

    // 落到队首（因为没有"上次待过"的记录可用）
    expect(document.activeElement).toBe(a);
    expect(document.activeElement).not.toBe(b);
    release();
  });

  it('队尾按 Shift+Tab 不改动循环目标（只在队首触发反向循环）', () => {
    const { a, b, release } = setupLock();

    b.focus();
    b.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    pressTab(true);
    escapeFocus();

    expect(document.activeElement).toBe(b);
    expect(document.activeElement).not.toBe(a);
    release();
  });

  it('★ 没有锁定时不响应 Tab（不抛错、不记录）', () => {
    buildContainer('<input id="a" />');
    expect(() => pressTab()).not.toThrow();
    expect(() => pressTab(true)).not.toThrow();
  });

  it('★ 锁定容器内没有可聚焦元素时 Tab 不抛错', () => {
    const container = buildContainer('<div id="plain"></div>');
    const release = lockFocus(container, 'lock-1');

    expect(() => pressTab()).not.toThrow();
    expect(() => pressTab(true)).not.toThrow();

    release();
  });

  it('★ 无锁定时收到 focusin 也不抛错（只记录，不做拉回）', () => {
    const node = document.createElement('input');
    document.body.appendChild(node);
    node.focus();

    expect(() => node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))).not.toThrow();
    expect(document.activeElement).toBe(node);
  });
});
