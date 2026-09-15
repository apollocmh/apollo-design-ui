import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, effectScope, h, nextTick, ref } from 'vue';
import type { MockMutationObserver, MockResizeObserver } from '../../../../vitest.setup';
import {
  DEFAULT_MUTATION_OPTIONS,
  observeMutation,
  observeResize,
  type ResizeObserverSize,
  resetMutationObserver,
  resetResizeObserver,
  useMutationObserver,
  useResizeObserver,
} from '../observers';

/**
 * 两个 observer 的**核心契约是同一条**：
 *   「全局单例 + 元素 → 回调集合」，而不是「每次调用创建一个 observer」。
 *
 * 这条契约是可观测的（`instances.size`），也是我们拒绝用 `@vueuse/core` 的唯一理由
 * （VueUse 的 useResizeObserver 是"每次调用一个实例"）。
 * 所以这一组测试的第一要务就是把 `instances.size` 钉死。
 *
 * 桩类来自 vitest.setup.ts。这里用**类型**导入 + 从 `globalThis` 取实例，
 * 避免值导入导致的模块重复加载（setup 文件是按绝对路径注册的）。
 */

interface ObserverCtor<T> {
  instances: Set<T>;
}

function resizeInstances(): MockResizeObserver[] {
  return [...(globalThis.ResizeObserver as unknown as ObserverCtor<MockResizeObserver>).instances];
}

function mutationInstances(): MockMutationObserver[] {
  return [
    ...(globalThis.MutationObserver as unknown as ObserverCtor<MockMutationObserver>).instances,
  ];
}

/**
 * 取「唯一那个」observer 实例。
 *
 * 单例契约的断言总是「先断言长度 1，再用它」——`noUncheckedIndexedAccess` 下
 * `list[0]` 是 `T | undefined`，所以这里显式收窄。用辅助函数而不是 `!`：
 * 万一长度断言被删掉，这里会抛出可读错误，而不是让后续断言对 `undefined` 静默求值。
 */
function onlyOne<T>(list: readonly T[], what: string): T {
  const [first] = list;
  if (!first) {
    throw new Error(`断言前提不成立：期望存在 1 个 ${what}，实际 ${list.length} 个`);
  }
  return first;
}

const firstResize = (): MockResizeObserver => onlyOne(resizeInstances(), 'ResizeObserver');
const firstMutation = (): MockMutationObserver => onlyOne(mutationInstances(), 'MutationObserver');

function makeEntry(
  target: Element,
  width: number,
  height: number,
  box?: { inlineSize: number; blockSize: number },
): ResizeObserverEntry {
  return {
    target,
    contentRect: { width, height } as DOMRectReadOnly,
    contentBoxSize: box ? [box] : [],
    borderBoxSize: [],
    devicePixelContentBoxSize: [],
  } as unknown as ResizeObserverEntry;
}

function el(): HTMLElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  return node;
}

// ---------------------------------------------------------------------------
// observeResize
// ---------------------------------------------------------------------------

describe('observeResize —— 单例契约', () => {
  it('★ 多个元素共用同一个 ResizeObserver 实例', () => {
    const stopA = observeResize(el(), vi.fn());
    const stopB = observeResize(el(), vi.fn());
    const stopC = observeResize(el(), vi.fn());

    expect(resizeInstances()).toHaveLength(1);

    stopA();
    stopB();
    stopC();
  });

  it('★ 同一元素 + 同一回调引用只注册一次（Set 去重）', () => {
    const target = el();
    const cb = vi.fn();
    const stop1 = observeResize(target, cb);
    const stop2 = observeResize(target, cb);

    firstResize().trigger([makeEntry(target, 10, 10)]);
    expect(cb).toHaveBeenCalledTimes(1);

    stop1();
    stop2();
  });

  it('同一元素 + 不同回调 → 都收到通知', () => {
    const target = el();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = observeResize(target, a);
    const stopB = observeResize(target, b);

    expect(resizeInstances()).toHaveLength(1);
    firstResize().trigger([makeEntry(target, 10, 10)]);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    stopA();
    stopB();
  });

  it('注销其中一个回调后，另一个仍收到通知', () => {
    const target = el();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = observeResize(target, a);
    const stopB = observeResize(target, b);

    stopA();
    firstResize().trigger([makeEntry(target, 10, 10)]);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);

    stopB();
  });

  it('★ 最后一个回调注销时才 unobserve（元素不再被观察）', () => {
    const target = el();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = observeResize(target, a);
    const stopB = observeResize(target, b);

    const instance = firstResize();
    expect(instance.targets.has(target)).toBe(true);

    stopA();
    // 还有人监听 → 不能 unobserve
    expect(instance.targets.has(target)).toBe(true);

    stopB();
    expect(instance.targets.has(target)).toBe(false);
  });

  it('注销函数幂等，重复调用不抛错', () => {
    const stop = observeResize(el(), vi.fn());
    stop();
    expect(() => stop()).not.toThrow();
    expect(() => stop()).not.toThrow();
  });

  it('元素上已无回调后再触发不抛错', () => {
    const target = el();
    const stop = observeResize(target, vi.fn());
    const instance = firstResize();
    stop();
    expect(() => instance.trigger([makeEntry(target, 1, 1)])).not.toThrow();
  });
});

describe('observeResize —— 尺寸快照', () => {
  it('字段与 rc-resize-observer 对齐', () => {
    const target = el();
    Object.defineProperty(target, 'offsetWidth', { value: 120, configurable: true });
    Object.defineProperty(target, 'offsetHeight', { value: 60, configurable: true });

    let received: ResizeObserverSize | undefined;
    const stop = observeResize(target, (size) => {
      received = size;
    });

    firstResize().trigger([makeEntry(target, 100, 50, { inlineSize: 80, blockSize: 40 })]);

    expect(received).toEqual({
      width: 100,
      height: 50,
      offsetWidth: 120,
      offsetHeight: 60,
      contentWidth: 80,
      contentHeight: 40,
    });

    stop();
  });

  it('★ 没有 contentBoxSize 时内容尺寸回落到 contentRect（Safari 老版本路径）', () => {
    const target = el();
    let received: ResizeObserverSize | undefined;
    const stop = observeResize(target, (size) => {
      received = size;
    });

    firstResize().trigger([makeEntry(target, 100, 50)]);

    expect(received?.contentWidth).toBe(100);
    expect(received?.contentHeight).toBe(50);

    stop();
  });

  it('entry 也被传给回调（需要 observationTarget 等原始字段时用）', () => {
    const target = el();
    const cb = vi.fn();
    const stop = observeResize(target, cb);
    const entry = makeEntry(target, 10, 10);

    firstResize().trigger([entry]);
    expect(cb).toHaveBeenCalledWith(expect.anything(), entry);

    stop();
  });

  it('★ 回调里注销自己不会影响本轮其它回调（遍历的是快照）', () => {
    const target = el();
    const calls: string[] = [];

    const stopA = observeResize(target, () => {
      calls.push('a');
      stopA();
    });
    const stopB = observeResize(target, () => {
      calls.push('b');
    });

    expect(() => firstResize().trigger([makeEntry(target, 1, 1)])).not.toThrow();
    expect(calls).toEqual(['a', 'b']);

    stopB();
  });

  it('未注册回调的元素被 entry 命中时静默跳过', () => {
    const registered = el();
    const stranger = el();
    const cb = vi.fn();
    const stop = observeResize(registered, cb);

    expect(() => firstResize().trigger([makeEntry(stranger, 1, 1)])).not.toThrow();
    expect(cb).not.toHaveBeenCalled();

    stop();
  });
});

describe('resetResizeObserver', () => {
  it('断开单例并清空注册表，下一次注册会新建实例', () => {
    const stop = observeResize(el(), vi.fn());
    const first = firstResize();

    resetResizeObserver();
    expect(resizeInstances()).toHaveLength(0);

    observeResize(el(), vi.fn());
    expect(resizeInstances()).toHaveLength(1);
    expect(firstResize()).not.toBe(first);

    stop();
  });

  it('重置后旧的注销函数不抛错（注册表已空）', () => {
    const stop = observeResize(el(), vi.fn());
    resetResizeObserver();
    expect(() => stop()).not.toThrow();
  });
});

describe('useResizeObserver', () => {
  it('挂载后立即建立监听（immediate + flush: post）', async () => {
    const target = ref<HTMLElement | null>(null);
    const cb = vi.fn();

    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target, onResize: cb });
        return () => h('div', { ref: target });
      },
    });

    const wrapper = mount(Comp);
    await nextTick();

    expect(resizeInstances()).toHaveLength(1);
    const node = target.value as HTMLElement;
    expect(firstResize().targets.has(node)).toBe(true);

    firstResize().trigger([makeEntry(node, 5, 5)]);
    expect(cb).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('target 为 null 时不注册，也不抛错', async () => {
    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target: () => null, onResize: vi.fn() });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    expect(resizeInstances()).toHaveLength(0);
    wrapper.unmount();
  });

  it('没有 onResize 时不注册', async () => {
    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target: () => document.body });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    expect(resizeInstances()).toHaveLength(0);
    wrapper.unmount();
  });

  it('disabled 为真时不注册', async () => {
    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target: () => document.body, onResize: vi.fn(), disabled: true });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    expect(resizeInstances()).toHaveLength(0);
    wrapper.unmount();
  });

  it('★ disabled 从 true 变 false 后开始监听', async () => {
    const disabled = ref(true);
    const target = ref<HTMLElement | null>(null);

    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target, onResize: vi.fn(), disabled });
        return () => h('div', { ref: target });
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    expect(resizeInstances()).toHaveLength(0);

    disabled.value = false;
    await nextTick();
    await nextTick();
    expect(resizeInstances()).toHaveLength(1);

    wrapper.unmount();
  });

  it('★ disabled 从 false 变 true 后释放监听', async () => {
    const disabled = ref(false);
    const target = ref<HTMLElement | null>(null);

    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target, onResize: vi.fn(), disabled });
        return () => h('div', { ref: target });
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    const instance = firstResize();
    const node = target.value as HTMLElement;
    expect(instance.targets.has(node)).toBe(true);

    disabled.value = true;
    await nextTick();
    await nextTick();
    expect(instance.targets.has(node)).toBe(false);

    wrapper.unmount();
  });

  it('★ target 换成另一个元素时，旧的被 unobserve、新的被 observe', async () => {
    const target = ref<HTMLElement | null>(null);
    const swap = ref(false);

    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target, onResize: vi.fn() });
        return () => h('div', { ref: swap.value ? target : undefined });
      },
    });

    // 手工造两个元素，直接切换 ref（不依赖模板 ref 的复杂性）
    const first = el();
    const second = el();
    target.value = first;

    const wrapper = mount(Comp);
    await nextTick();
    const instance = firstResize();
    expect(instance.targets.has(first)).toBe(true);

    target.value = second;
    await nextTick();
    await nextTick();
    expect(instance.targets.has(first)).toBe(false);
    expect(instance.targets.has(second)).toBe(true);

    wrapper.unmount();
  });

  it('★ 组件卸载后释放监听', async () => {
    const target = ref<HTMLElement | null>(el());
    const Comp = defineComponent({
      setup() {
        useResizeObserver({ target, onResize: vi.fn() });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    const instance = firstResize();
    expect(instance.targets.has(target.value as HTMLElement)).toBe(true);

    wrapper.unmount();
    expect(instance.targets.has(target.value as HTMLElement)).toBe(false);
  });

  it('组件外使用不抛错，且 scope 销毁时释放', async () => {
    const target = el();
    const scope = effectScope();

    scope.run(() => {
      useResizeObserver({ target: () => target, onResize: vi.fn() });
    });

    const instance = firstResize();
    expect(instance.targets.has(target)).toBe(true);

    scope.stop();
    expect(instance.targets.has(target)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// observeMutation
// ---------------------------------------------------------------------------

describe('observeMutation', () => {
  it('★ 同一元素共用一个 MutationObserver 实例', () => {
    const target = el();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = observeMutation(target, a);
    const stopB = observeMutation(target, b);

    expect(mutationInstances()).toHaveLength(1);

    firstMutation().trigger();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    stopA();
    stopB();
  });

  it('不同元素各有一个实例', () => {
    const stopA = observeMutation(el(), vi.fn());
    const stopB = observeMutation(el(), vi.fn());
    expect(mutationInstances()).toHaveLength(2);
    stopA();
    stopB();
  });

  it('同一元素 + 同一回调只注册一次', () => {
    const target = el();
    const cb = vi.fn();
    const stop1 = observeMutation(target, cb);
    const stop2 = observeMutation(target, cb);

    firstMutation().trigger();
    expect(cb).toHaveBeenCalledTimes(1);

    stop1();
    stop2();
  });

  it('★ 默认配置是 rc-mutate-observer 的那一份', () => {
    const target = el();
    const stop = observeMutation(target, vi.fn());
    expect(firstMutation().options).toEqual(DEFAULT_MUTATION_OPTIONS);
    expect(DEFAULT_MUTATION_OPTIONS).toEqual({ attributes: true, childList: true, subtree: true });
    stop();
  });

  it('★ options 取**第一次**注册的值，后续不同配置被忽略', () => {
    const target = el();
    const stop1 = observeMutation(target, vi.fn(), { attributes: true });
    const stop2 = observeMutation(target, vi.fn(), { childList: true });

    // 只调用了一次 observe（第二次没有重新配置实例）
    expect(firstMutation().options).toEqual({ attributes: true });

    stop1();
    stop2();
  });

  it('★ 最后一个回调注销时 disconnect，实例被回收', () => {
    const target = el();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = observeMutation(target, a);
    const stopB = observeMutation(target, b);

    stopA();
    expect(mutationInstances()).toHaveLength(1);

    stopB();
    expect(mutationInstances()).toHaveLength(0);
  });

  it('注销函数幂等', () => {
    const stop = observeMutation(el(), vi.fn());
    stop();
    expect(() => stop()).not.toThrow();
    expect(() => stop()).not.toThrow();
  });

  it('回调收到 mutations 与 observer 两个参数', () => {
    const target = el();
    const cb = vi.fn();
    const stop = observeMutation(target, cb);
    const instance = firstMutation();

    instance.trigger();
    expect(cb).toHaveBeenCalledTimes(1);
    const [mutations, observer] = cb.mock.calls[0] as [MutationRecord[], MutationObserver];
    expect(Array.isArray(mutations)).toBe(true);
    expect(observer).toBe(instance);

    stop();
  });

  it('★ 回调里注销自己不影响本轮其它回调（遍历的是快照）', () => {
    const target = el();
    const calls: string[] = [];

    const stopA = observeMutation(target, () => {
      calls.push('a');
      stopA();
    });
    const stopB = observeMutation(target, () => {
      calls.push('b');
    });

    expect(() => firstMutation().trigger()).not.toThrow();
    expect(calls).toEqual(['a', 'b']);

    stopB();
  });

  it('resetMutationObserver 清空全部实例', () => {
    const stopA = observeMutation(el(), vi.fn());
    const stopB = observeMutation(el(), vi.fn());
    expect(mutationInstances()).toHaveLength(2);

    resetMutationObserver();
    expect(mutationInstances()).toHaveLength(0);

    expect(() => stopA()).not.toThrow();
    expect(() => stopB()).not.toThrow();
  });
});

describe('useMutationObserver', () => {
  it('挂载后建立监听，卸载后释放', async () => {
    const target = ref<HTMLElement | null>(el());
    const cb = vi.fn();

    const Comp = defineComponent({
      setup() {
        useMutationObserver({ target, onMutate: cb });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();

    expect(mutationInstances()).toHaveLength(1);
    firstMutation().trigger();
    expect(cb).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(mutationInstances()).toHaveLength(0);
  });

  it('target 为 null / 无 onMutate / disabled 时都不注册', async () => {
    for (const options of [
      { target: () => null, onMutate: vi.fn() },
      { target: () => document.body },
      { target: () => document.body, onMutate: vi.fn(), disabled: true },
    ]) {
      const Comp = defineComponent({
        setup() {
          useMutationObserver(options);
          return () => h('div');
        },
      });
      const wrapper = mount(Comp);
      await nextTick();
      expect(mutationInstances()).toHaveLength(0);
      wrapper.unmount();
    }
  });

  it('disabled 切换后重新建立 / 释放监听', async () => {
    const disabled = ref(true);
    const target = ref<HTMLElement | null>(el());

    const Comp = defineComponent({
      setup() {
        useMutationObserver({ target, onMutate: vi.fn(), disabled });
        return () => h('div');
      },
    });

    const wrapper = mount(Comp);
    await nextTick();
    expect(mutationInstances()).toHaveLength(0);

    disabled.value = false;
    await nextTick();
    await nextTick();
    const instance = firstMutation();
    expect(instance.targets.has(target.value as HTMLElement)).toBe(true);

    disabled.value = true;
    await nextTick();
    await nextTick();
    expect(instance.targets.has(target.value as HTMLElement)).toBe(false);

    wrapper.unmount();
  });

  it('组件外使用不抛错，scope 销毁时释放', async () => {
    const target = el();
    const scope = effectScope();

    scope.run(() => {
      useMutationObserver({ target: () => target, onMutate: vi.fn() });
    });

    expect(mutationInstances()).toHaveLength(1);
    scope.stop();
    expect(mutationInstances()).toHaveLength(0);
  });
});
