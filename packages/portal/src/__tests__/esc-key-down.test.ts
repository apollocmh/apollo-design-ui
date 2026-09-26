/**
 * `useEscKeyDown` —— ESC 层栈。
 *
 * 契约（`@rc-component/portal@2.2.1` `es/useEscKeyDown.js`）：
 *   1. 从**栈顶往下**依次调用每一层的 `onEsc`，`top` 只在最后一项为真；
 *   2. 只有 `open` 的层在栈里；`open=false` 出栈；
 *   3. `compositionend` 后 200ms 内的 Escape 被忽略（IME 保护）；
 *   4. `event.isComposing` 为真时忽略；
 *   5. 非 Escape 键不触发。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

import { escKeyDownTest, useEscKeyDown } from '../use-esc-key-down';

/** 在独立作用域里跑 hook（`onScopeDispose` 需要 scope）。 */
function runHook(open: () => boolean, onEsc: (info: { top: boolean }) => void) {
  const scope = effectScope();
  scope.run(() => useEscKeyDown(open, onEsc));
  return scope;
}

function pressEscape(init: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', ...init }));
}

beforeEach(() => {
  escKeyDownTest?.reset();
});

afterEach(() => {
  // 清掉可能残留的栈项（每个用例自己 stop 作用域，这里是兜底）
  for (const item of [...(escKeyDownTest?.getStack() ?? [])]) void item;
});

describe('useEscKeyDown · 层栈', () => {
  it('单层：open 时按 ESC 触发，top 为 true', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => true, onEsc);

    pressEscape();
    expect(onEsc).toHaveBeenCalledTimes(1);
    expect(onEsc.mock.calls[0]![0]).toMatchObject({ top: true });

    scope.stop();
  });

  it('open=false ⇒ 不入栈，ESC 不触发', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => false, onEsc);

    pressEscape();
    expect(onEsc).not.toHaveBeenCalled();
    expect(escKeyDownTest?.getStack()).toHaveLength(0);

    scope.stop();
  });

  it('两层：**两层都被调**，只有后入栈的那层 top=true', () => {
    const first = vi.fn();
    const second = vi.fn();
    const s1 = runHook(() => true, first);
    const s2 = runHook(() => true, second);

    pressEscape();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first.mock.calls[0]![0]).toMatchObject({ top: false });
    expect(second.mock.calls[0]![0]).toMatchObject({ top: true });

    s1.stop();
    s2.stop();
  });

  it('作用域销毁 ⇒ 出栈（不再触发）', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => true, onEsc);
    pressEscape();
    expect(onEsc).toHaveBeenCalledTimes(1);

    scope.stop();
    pressEscape();
    expect(onEsc).toHaveBeenCalledTimes(1);
  });

  it('非 Escape 键不触发', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => true, onEsc);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onEsc).not.toHaveBeenCalled();

    scope.stop();
  });

  it('event.isComposing 为真 ⇒ 忽略（输入法组合中）', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => true, onEsc);

    pressEscape({ isComposing: true });
    expect(onEsc).not.toHaveBeenCalled();

    scope.stop();
  });

  it('compositionend 后 200ms 内的 ESC 被忽略，之后恢复（IME 保护）', () => {
    const onEsc = vi.fn();
    const scope = runHook(() => true, onEsc);

    vi.useFakeTimers();
    window.dispatchEvent(new Event('compositionend'));

    pressEscape();
    expect(onEsc).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    pressEscape();
    expect(onEsc).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    scope.stop();
  });
});
