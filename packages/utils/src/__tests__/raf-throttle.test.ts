import { afterEach, describe, expect, it, vi } from 'vitest';
import raf, { cancelRaf } from '../raf';
import { debounce, throttle } from '../throttle';
import throttleByAnimationFrame from '../throttle-by-animation-frame';

/**
 * `raf` 的测试重点：
 *   - 返回的是**包装 id**，不是真实 handle
 *   - `times = 0` 同步立即执行
 *   - `cancel` 对任何 id 幂等且不抛错（包括已执行完的 id）
 *
 * 测试环境里 `requestAnimationFrame` 由 vitest.setup.ts 提供（setTimeout 0 的退化实现），
 * 所以统一用 `vi.useFakeTimers()` 驱动。
 */

describe('raf', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('返回自增的包装 id（不是真实 rAF handle）', () => {
    vi.useFakeTimers();
    const id1 = raf(() => {});
    const id2 = raf(() => {});
    expect(typeof id1).toBe('number');
    expect(id2).toBe(id1 + 1);
  });

  it('times 默认 1：下一帧执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    raf(fn);
    expect(fn).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('★ times = 0 同步立即执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    raf(fn, 0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('times = 2：需要两帧', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    raf(fn, 2);
    vi.advanceTimersByTime(1);
    expect(fn).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel 阻止执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const id = raf(fn);
    cancelRaf(id);
    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
  });

  it('★ cancel 对未知 id 幂等且不抛错', () => {
    vi.useFakeTimers();
    expect(() => raf.cancel(99999)).not.toThrow();
    expect(() => cancelRaf(99999)).not.toThrow();
  });

  it('★ 执行完之后再 cancel 不抛错（回调执行前已从 map 清理自己）', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const id = raf(fn);
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(() => raf.cancel(id)).not.toThrow();
    // 再跑一轮不会重复执行
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel 后 id 从 ids() 中移除', () => {
    vi.useFakeTimers();
    const ids = raf.ids?.();
    if (!ids) throw new Error('dev 环境应存在 raf.ids');

    const before = ids.size;
    const id = raf(() => {});
    expect(ids.has(id)).toBe(true);
    raf.cancel(id);
    expect(ids.has(id)).toBe(false);
    expect(ids.size).toBe(before);
  });

  it('执行完成后 id 从 ids() 中移除（没有泄漏的待执行帧）', () => {
    vi.useFakeTimers();
    const ids = raf.ids?.();
    if (!ids) throw new Error('dev 环境应存在 raf.ids');

    const id = raf(() => {});
    vi.runAllTimers();
    expect(ids.has(id)).toBe(false);
  });
});

describe('throttleByAnimationFrame', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('首次调用不立即执行，而是排到下一帧', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);

    throttled('a');
    expect(fn).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('★ 同一帧内的多次调用只执行一次，且用**第一次**的实参', () => {
    // 与"合并参数用最后一次"的直觉相反：`later(args)` 在第一帧就被捕获了。
    // antd 的调用方（back-top / affix）传的都是常量实参，所以这个细节不影响它们。
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);

    throttled('a');
    throttled('b');
    throttled('c');

    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('跨帧可以再次执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);

    throttled('a');
    vi.runAllTimers();
    throttled('b');
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cancel 取消待执行的调用', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);

    throttled('a');
    throttled.cancel();
    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel 之后可以继续使用', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);

    throttled('a');
    throttled.cancel();
    throttled('b');
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('未调度时 cancel 不抛错', () => {
    const throttled = throttleByAnimationFrame(() => {});
    expect(() => throttled.cancel()).not.toThrow();
  });
});

describe('throttle / debounce（复刻 throttle-debounce@5 语义）', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounce 默认后缘：静默 delay 后执行一次', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('debounce 每次调用都重置计时', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(100, fn);

    debounced();
    vi.advanceTimersByTime(90);
    debounced();
    vi.advanceTimersByTime(90);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('debounce atBegin：前缘执行一次，随后静默', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(100, fn, { atBegin: true });

    debounced();
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('debounce atBegin：静默期过后可以再次前缘执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(100, fn, { atBegin: true });

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throttle：窗口内首次立即执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn);

    throttled('a');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('throttle：窗口内后续调用走尾随', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn);

    throttled('a');
    vi.advanceTimersByTime(10);
    throttled('b');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(90);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('throttle noTrailing：不执行尾随调用', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn, { noTrailing: true });

    throttled('a');
    vi.advanceTimersByTime(10);
    throttled('b');
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throttle noLeading：窗口内首次不执行，只走尾随', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn, { noLeading: true });

    throttled('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('★ noLeading + noTrailing 同时为 true 时 callback 永不执行', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn, { noLeading: true, noTrailing: true });

    throttled();
    vi.runAllTimers();
    expect(fn).not.toHaveBeenCalled();
  });

  it('★ cancel() 使 wrapper 永久失效（前缘已执行的那次不受影响）', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn);

    throttled('a'); // 前缘：立即执行
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10);
    throttled('b'); // 排入尾随
    throttled.cancel();

    vi.runAllTimers();
    // 尾随被取消 → 仍是 1 次
    expect(fn).toHaveBeenCalledTimes(1);

    // wrapper 已作废：后续调用完全不执行
    vi.advanceTimersByTime(1000);
    throttled('c');
    vi.runAllTimers();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('★ cancel({ upcomingOnly: true }) 只取消待执行的，wrapper 仍可用', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = throttle(100, fn);

    throttled('a');
    vi.advanceTimersByTime(10);
    throttled('b');
    throttled.cancel({ upcomingOnly: true });
    vi.runAllTimers();
    // 尾随被取消，只有首次执行
    expect(fn).toHaveBeenCalledTimes(1);

    // 仍可继续使用
    vi.advanceTimersByTime(200);
    throttled('c');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('透传 this 与全部实参', () => {
    vi.useFakeTimers();
    const receiver = { tag: 'ctx' };
    const received: unknown[] = [];
    const fn = function (this: unknown, ...args: unknown[]) {
      received.push([this, ...args]);
    };
    const throttled = throttle(100, fn as unknown as (...args: never[]) => void);
    (throttled as unknown as (...a: unknown[]) => void).call(receiver, 1, 2);

    vi.runAllTimers();
    expect(received[0]).toEqual([receiver, 1, 2]);
  });
});
