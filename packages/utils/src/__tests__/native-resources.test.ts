import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { MockMutationObserver, MockResizeObserver } from '../../../../vitest.setup';
import { useDelayState } from '../hooks/use-delay-state';
import { observeMutation, observeResize } from '../observers';
import raf from '../raf';

afterEach(() => {
  for (const id of raf.ids?.().keys() ?? []) raf.cancel(id);
  vi.useRealTimers();
});

describe('native observer subscription ownership', () => {
  it('keeps a duplicate Resize callback subscribed until its last independent owner releases', () => {
    const target = document.createElement('div');
    const callback = vi.fn();
    const first = observeResize(target, callback);
    const second = observeResize(target, callback);
    const observer = [...MockResizeObserver.instances][0];
    if (!observer) throw new Error('ResizeObserver must be registered');
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(1);
    first();
    first();
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(observer.targets.has(target)).toBe(true);
    second();
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(observer.targets.has(target)).toBe(false);
  });

  it('keeps a duplicate Mutation callback subscribed until its last independent owner releases', () => {
    const target = document.createElement('div');
    const callback = vi.fn();
    const first = observeMutation(target, callback);
    const second = observeMutation(target, callback);
    const observer = [...MockMutationObserver.instances][0];
    if (!observer) throw new Error('MutationObserver must be registered');
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(1);
    first();
    first();
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(observer.targets.has(target)).toBe(true);
    second();
    observer.trigger();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(observer.targets.has(target)).toBe(false);
  });

  it('does not keep a failed native Resize registration as a silently unobserved subscription', () => {
    const target = document.createElement('div');
    const callback = vi.fn();
    vi.spyOn(MockResizeObserver.prototype, 'observe').mockImplementationOnce(() => {
      throw new TypeError('Native observation rejected the target');
    });
    expect(() => observeResize(target, callback)).toThrow('Native observation rejected');
    const stop = observeResize(target, callback);
    expect([...MockResizeObserver.instances].some((observer) => observer.targets.has(target))).toBe(
      true,
    );
    stop();
  });

  it('does not keep a failed native Mutation registration or prevent a valid retry', () => {
    const target = document.createElement('div');
    const callback = vi.fn();
    vi.spyOn(MockMutationObserver.prototype, 'observe').mockImplementationOnce(() => {
      throw new TypeError('Native observation rejected the options');
    });
    expect(() => observeMutation(target, callback)).toThrow('Native observation rejected');
    const stop = observeMutation(target, callback);
    expect(
      [...MockMutationObserver.instances].some((observer) => observer.targets.has(target)),
    ).toBe(true);
    stop();
  });
});

describe('native delayed state resources', () => {
  it('uses the ordinary next frame when the declared immediate flag is explicitly false', () => {
    vi.useFakeTimers();
    const [value, set] = useDelayState(0);
    expect(() => set(1, false)).not.toThrow();
    expect(value.value).toBe(0);
    vi.advanceTimersByTime(20);
    expect(value.value).toBe(1);
  });

  it('cannot allocate a new frame or timer through a setter whose owning scope has stopped', () => {
    vi.useFakeTimers();
    const scope = effectScope();
    const state = scope.run(() => useDelayState(0));
    if (!state) throw new Error('Scope must produce its actual delayed state');
    scope.stop();
    state[1](1);
    state[1](2, { ms: 30 });
    expect(vi.getTimerCount()).toBe(0);
    expect(raf.ids?.().size ?? 0).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects non-terminating frame counts before allocating: %s',
    (frames) => {
      vi.useFakeTimers();
      expect(() => raf(() => {}, frames)).toThrow(RangeError);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});
