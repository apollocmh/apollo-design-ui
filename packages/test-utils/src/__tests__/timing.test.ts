/**
 * `timing.ts` 的契约测试。
 *
 * ── 这个文件存在的理由 ────────────────────────────────────────────────────────
 * `flushAll()` 是本包**全部** `xxxTest` 的公共地基。它在假定时器下是否可用，
 * 直接决定所有组件测试能不能在 `vi.useFakeTimers()` 里跑。
 * 而 `@vue/test-utils` 的 `flushPromises` 在假定时器下**会死等** ——
 * 这个坑必须由测试本身钉住，不能只写在注释里。
 *
 * 三个「实测事实」在此固化为断言（原先是我用探针脚本测出来的）：
 *   1. 假定时器下 `flushPromises()` 不推进时间就不 resolve
 *   2. 同步 `advanceTimersByTime(0)` 也救不回它
 *   3. 异步 `advanceTimersByTimeAsync(0)` 可以
 * 第 3 条正是 `flushAll()` 分流实现的依据 —— 如果哪天 vitest 改了语义，
 * 第 1/3 条会同时变红，指向明确。
 */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { flushAll, waitFrames } from '../timing';
import { PlainBox } from './fixture';

afterEach(() => {
  vi.useRealTimers();
});

describe('flushAll · 真定时器', () => {
  it('冲刷 Vue 的 job 队列：nextTick 之后的 DOM 更新可见', async () => {
    const count = ref(0);
    const Box = defineComponent({
      name: 'FlushAllProbe',
      setup() {
        return () => h('span', { 'data-count': String(count.value) }, String(count.value));
      },
    });
    const wrapper = mount(Box);
    expect(wrapper.attributes('data-count')).toBe('0');

    count.value = 7;
    // 此刻 DOM 还没更新（Vue 把更新排进了 job 队列）
    expect(wrapper.attributes('data-count')).toBe('0');

    await flushAll();
    expect(wrapper.attributes('data-count')).toBe('7');
    wrapper.unmount();
  });

  it('冲刷 Promise 回调：已 resolve 的 then 链在 flushAll 后已执行', async () => {
    const log: string[] = [];
    void Promise.resolve().then(() => {
      log.push('microtask');
    });
    await flushAll();
    expect(log).toEqual(['microtask']);
  });

  it('连续两次 flushAll 幂等，不抛错', async () => {
    await expect(flushAll()).resolves.toBeUndefined();
    await expect(flushAll()).resolves.toBeUndefined();
  });

  it('不推进时间轴：setTimeout(16) 不会被 flushAll 触发', async () => {
    let fired = false;
    const handle = setTimeout(() => {
      fired = true;
    }, 16);
    await flushAll();
    // 这是 flushAll 的**承诺**：它只冲队列，不推时间。
    expect(fired).toBe(false);
    clearTimeout(handle);
  });
});

describe('flushAll · 假定时器', () => {
  it('不推进时间也不死等（回归：曾直接 await flushPromises 导致挂死）', async () => {
    vi.useFakeTimers();
    // 若实现退化成 `await flushPromises()`，这一行会永久挂起 → 用例超时变红。
    await expect(flushAll()).resolves.toBeUndefined();
  });

  it('假定时器下仍能冲刷 Vue 的 job 队列', async () => {
    vi.useFakeTimers();
    const count = ref(0);
    const Box = defineComponent({
      name: 'FakeFlushAllProbe',
      setup() {
        return () => h('span', { 'data-count': String(count.value) }, String(count.value));
      },
    });
    const wrapper = mount(Box);
    count.value = 3;
    await flushAll();
    expect(wrapper.attributes('data-count')).toBe('3');
    wrapper.unmount();
  });

  it('对照实验：裸 flushPromises 在假定时器下确实不 resolve', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const pending = flushPromises().then(() => {
      resolved = true;
    });

    // 让微任务队列跑干净（用 nextTick 而不是 flushPromises，避免自己踩自己的坑）
    await nextTick();
    await nextTick();
    expect(resolved).toBe(false);

    // 同步推进也救不回来 —— 这是「必须用 Async 版本」的证据
    vi.advanceTimersByTime(0);
    await nextTick();
    expect(resolved).toBe(false);

    // 收尾：放它一条生路，否则 vi.useRealTimers() 之后它才 resolve，
    // 泄漏到下一个用例里造成串扰。
    vi.useRealTimers();
    await pending;
    expect(resolved).toBe(true);
  });

  it('对照实验：advanceTimersByTimeAsync(0) 可以驱动 flushPromises', async () => {
    vi.useFakeTimers();
    let resolved = false;
    const pending = flushPromises().then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(true);
    await pending;
  });
});

describe('waitFrames', () => {
  it('真定时器：默认 2 帧后 resolve，且期间 DOM 更新可见', async () => {
    const count = ref(0);
    const Box = defineComponent({
      name: 'WaitFramesProbe',
      setup() {
        return () => h('span', { 'data-count': String(count.value) }, String(count.value));
      },
    });
    const wrapper = mount(Box);
    count.value = 1;
    await waitFrames();
    expect(wrapper.attributes('data-count')).toBe('1');
    wrapper.unmount();
  });

  it('真定时器：count = 0 时不等待任何帧，立即 resolve', async () => {
    await expect(waitFrames(0)).resolves.toBeUndefined();
  });

  it('假定时器：不死等（回归：rAF 被伪造，直接 await 会挂死）', async () => {
    vi.useFakeTimers();
    await expect(waitFrames()).resolves.toBeUndefined();
  });

  it('假定时器：每帧推进 16ms —— 3 帧累计推进 48ms', async () => {
    vi.useFakeTimers();
    const start = Date.now();
    await waitFrames(3);
    const advanced = Date.now() - start;
    // 每帧 16ms。不断言精确值以免把 FRAME_MS 变成契约，
    // 但要证明它**确实推进了**时间轴（而不是原地空转）。
    expect(advanced).toBe(48);
  });

  it('假定时器：推进过程中到期的定时器会被执行', async () => {
    vi.useFakeTimers();
    const log: string[] = [];
    setTimeout(() => log.push('t10'), 10);
    setTimeout(() => log.push('t40'), 40);
    await waitFrames(1); // 推进 16ms
    expect(log).toEqual(['t10']);
    await waitFrames(2); // 再推进 32ms，累计 48ms
    expect(log).toEqual(['t10', 't40']);
  });
});

describe('flushAll 与真实组件的组合', () => {
  it('挂载一个真实夹具后 flushAll 可用，且不影响断言', async () => {
    const wrapper = mount(PlainBox, { props: { label: 'hello' } });
    await flushAll();
    expect(wrapper.text()).toBe('hello');
    wrapper.unmount();
  });
});
