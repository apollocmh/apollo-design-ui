/**
 * L1 —— Esc 层级栈。
 *
 * 契约来源：`@rc-component/portal@2.2.1/es/useEscKeyDown.js`。
 * ⚠️ 期望值是从那段源码逐行读出来的，不是照着实现写的。
 *
 * 三个必须钉住的点：
 * 1. 入栈顺序 = 开启顺序 ⇒ 栈顶 = 最后开的浮层
 * 2. **栈内每个成员都收到回调**，靠 `top` 区分 —— 不是"只通知栈顶"
 * 3. IME 锁：compositionend 后 200ms 内的 Esc 被丢弃
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEscStack, IME_LOCK_DURATION } from '../esc-stack';

function pressEsc(isComposing = false) {
  return { key: 'Escape', isComposing };
}

describe('createEscStack · 入栈与出栈', () => {
  it('入栈顺序即"开启顺序"，栈顶是最后入的', () => {
    const stack = createEscStack();
    const seen: boolean[] = [];
    stack.push({ id: 'a', onEsc: ({ top }) => seen.push(top) });
    stack.push({ id: 'b', onEsc: ({ top }) => seen.push(top) });

    stack.dispatch(pressEsc());

    // 先通知栈顶（b），再通知 a；只有 b 的 top 为 true
    expect(seen).toEqual([true, false]);
  });

  it('⭐ 不是"只通知栈顶" —— 栈内每个成员都会收到', () => {
    const stack = createEscStack();
    const calls: string[] = [];
    stack.push({ id: 'a', onEsc: () => calls.push('a') });
    stack.push({ id: 'b', onEsc: () => calls.push('b') });
    stack.push({ id: 'c', onEsc: () => calls.push('c') });

    stack.dispatch(pressEsc());

    expect(calls).toEqual(['c', 'b', 'a']);
  });

  it('同 id 重复 push 是幂等的（rc 的 ensure）', () => {
    const stack = createEscStack();
    stack.push({ id: 'a', onEsc: () => {} });
    stack.push({ id: 'a', onEsc: () => {} });
    expect(stack.size).toBe(1);
  });

  it('remove 后不再收到通知', () => {
    const stack = createEscStack();
    const calls: string[] = [];
    stack.push({ id: 'a', onEsc: () => calls.push('a') });
    stack.push({ id: 'b', onEsc: () => calls.push('b') });
    stack.remove('b');

    stack.dispatch(pressEsc());

    expect(calls).toEqual(['a']);
    expect(stack.size).toBe(1);
  });

  it('reset 清空（用例隔离用）', () => {
    const stack = createEscStack();
    stack.push({ id: 'a', onEsc: () => {} });
    stack.reset();
    expect(stack.size).toBe(0);
  });
});

describe('createEscStack · 事件的过滤', () => {
  it('非 Escape 不派发', () => {
    const stack = createEscStack();
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.dispatch({ key: 'Enter' });
    expect(onEsc).not.toHaveBeenCalled();
  });

  it('⭐ isComposing 为 true 时不派发（输入法组合中的 Esc）', () => {
    const stack = createEscStack();
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.dispatch({ key: 'Escape', isComposing: true });
    expect(onEsc).not.toHaveBeenCalled();
  });
});

describe('createEscStack · IME 锁', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('⭐ compositionend 之后 200ms 内的 Esc 被丢弃，200ms 整点恢复', () => {
    let now = 1_000_000;
    // win 用真实 window（compositionend 只能靠真实事件触发），时间用注入值（精确控边界）
    const stack = createEscStack({ win: window, now: () => now });
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.attach();

    window.dispatchEvent(new Event('compositionend'));

    now += IME_LOCK_DURATION - 1; // 差 1ms 解锁
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(0);

    now += 1; // 正好 200ms
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1);

    stack.detach();
  });

  it('compositionend 真实事件后，锁内的 Esc 被丢弃、锁外恢复', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const stack = createEscStack({ win: window });
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.attach();

    window.dispatchEvent(new Event('compositionend'));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(0); // 锁内

    vi.setSystemTime(IME_LOCK_DURATION);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1); // 锁外恢复

    stack.detach();
    vi.useRealTimers();
  });
});

describe('createEscStack · 全局监听的挂摘', () => {
  it('attach 后 window 的 keydown 能派发', () => {
    const stack = createEscStack({ win: window });
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.attach();
    expect(stack.attached).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1);

    stack.detach();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1); // 摘掉后不再收到
  });

  it('⭐ win 为 null（SSR）时 attach 是空操作，不抛错', () => {
    const stack = createEscStack({ win: null });
    expect(() => stack.attach()).not.toThrow();
    expect(stack.attached).toBe(false);
    expect(() => stack.detach()).not.toThrow();
  });

  it('重复 attach 不会挂两次监听', () => {
    const stack = createEscStack({ win: window });
    const onEsc = vi.fn();
    stack.push({ id: 'a', onEsc });
    stack.attach();
    stack.attach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1);

    stack.detach();
  });
});
