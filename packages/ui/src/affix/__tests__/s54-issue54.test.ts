/**
 * Issue #54 · [Affix] 固钉状态变更触发原生监听重绑（运行时量化 → 已修复）
 *
 * ── 上游判据（antd 6.6.4 `es/affix/index.js:168-171`）───────────────────────
 * ```js
 * React.useEffect(() => { addListeners(); return () => removeListeners(); },
 *   [target, affixStyle, lastAffix, offsetTop, offsetBottom]);
 * ```
 * 依赖里混了三类东西：**绑定目标**（`target`）、**固钉状态**（`affixStyle` /
 * `lastAffix`）、**位置计算参数**（`offsetTop` / `offsetBottom`）。后两类都不影响
 * 「绑到哪个 target、绑哪个 listener」。
 *
 * ⇒ 而 `affixStyle` 每次 `measure()` 都是**新对象**（React `setState` / 本仓
 *   `shallowRef` 同为引用比较）⇒ **滚动期间每一帧**都重跑一轮
 *   `removeListeners()` + `addListeners()` = 14 次无谓 DOM 调用（7 事件 × remove + add）。
 *
 * 本仓此前**逐字照抄**了这个依赖集。Issue 说「不把冗余重绑定误认成内存泄漏」——
 * 这句话没错（净绑定确实有界、不泄漏），但**有界 ≠ 无代价**：按「对齐 Ant Design
 * ≠ 复制 Ant Design 的缺陷」，这是上游依赖数组写宽了，本仓收窄。
 *
 * ── 修复（三条配套）────────────────────────────────────────────────────────
 * 1. **`addListeners` 幂等短路**：目标未变 + listener 未变 ⇒ 直接 return。
 *    （`lazyUpdatePosition` 是 `throttleByAnimationFrame` 的产物，**引用稳定** ⇒
 *    这个判据可靠；也是它让「每次重绑」在功能上完全多余。）
 * 2. **依赖收窄**为解析出的当前 target（含 Provider 配置，flush:'post'）；位置和固钉状态不触发重绑。
 * 3. **`prepareMeasure` 收尾补挂**：上游靠「`affixStyle` 每次变都重绑」**无意中**
 *    获得了「target 未就绪 ⇒ 后续重试」的能力。收窄依赖后必须显式保留它，
 *    否则「首次绑定时 target 还没出现」就再也没有重绑时机了。
 *    ⇒ 用**一次引用比较**换 14 次 DOM 调用：[D] 用例钉住这个能力没丢。
 *
 * ── 有意保留的边界 ─────────────────────────────────────────────────────────
 * 「target 元素晚于 Affix 挂载、且期间没有任何测量发生」⇒ 仍然绑不上。
 * 覆盖它需要 MutationObserver 或轮询，与「避免高频无效测量」冲突；上游同样不支持。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import Affix from '../Affix.vue';

const TRIGGER_EVENTS = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load',
] as const;

/** 记录某个目标上每个事件名的 add / remove 次数。 */
function instrument(target: EventTarget) {
  const adds = new Map<string, number>();
  const removes = new Map<string, number>();
  const bump = (map: Map<string, number>, type: string) => map.set(type, (map.get(type) ?? 0) + 1);

  // ⚠️ 用 `spyOn` + `mockImplementation`：**只统计、不真绑**
  //    （真绑了之后 jsdom 会在窗口事件上跑 Affix 的节流回调，计数会抖）
  const addSpy = vi.spyOn(target, 'addEventListener').mockImplementation(((type: string) => {
    bump(adds, type);
  }) as never);
  const removeSpy = vi.spyOn(target, 'removeEventListener').mockImplementation(((type: string) => {
    bump(removes, type);
  }) as never);

  return {
    adds,
    removes,
    /** 净绑定数（add - remove），恒应 ≤ 1。 */
    net: (type: string) => (adds.get(type) ?? 0) - (removes.get(type) ?? 0),
    restore: () => {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    },
  };
}

/**
 * 占位层的 `top` —— 可变，用来**真实驱动固钉状态翻转**。
 *
 * 判据（`utils.ts`）：`getFixedTop` 要求 `targetRect.top > placeholderRect.top - offsetTop`。
 * target 是 `window` ⇒ `targetRect.top === 0` ⇒ `placeholderTop < offsetTop` 时固钉。
 * ⚠️ 必须给非零 `width`/`height`，否则 `measure` 的「零矩形 ⇒ 放弃本次测量」会短路。
 */
let placeholderTop = 100;

beforeEach(() => {
  vi.useFakeTimers();
  placeholderTop = 100;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      top: placeholderTop,
      bottom: placeholderTop + 60,
      left: 0,
      right: 200,
      width: 200,
      height: 60,
      x: 0,
      y: placeholderTop,
      toJSON: () => ({}),
    } as DOMRect;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

const flushBind = async (): Promise<void> => {
  vi.runOnlyPendingTimers(); // onMounted 的 setTimeout(addListeners)
  await nextTick();
};

/** 推掉 `throttleByAnimationFrame` 的那一帧（rAF 在 fake timers 下被接管）。 */
const flushRaf = async (): Promise<void> => {
  await nextTick();
  vi.advanceTimersByTime(50);
  await nextTick();
};

/** 触发一次完整的「测量」链路（等价于滚动 / resize / ResizeObserver 命中）。 */
const measure = async (wrapper: ReturnType<typeof mount>): Promise<void> => {
  (wrapper.vm as unknown as { updatePosition: () => void }).updatePosition();
  await flushRaf();
};

/** 滚动到指定位置（改占位层矩形）+ 测量。 */
const scrollTo = async (wrapper: ReturnType<typeof mount>, top: number): Promise<void> => {
  placeholderTop = top;
  await measure(wrapper);
};

const isAffixed = (wrapper: ReturnType<typeof mount>): boolean =>
  wrapper.find('.apollo-affix').exists();

describe('Affix · Issue #54 监听重绑', () => {
  it('[A] 固钉状态**真实翻转** 4 轮 ⇒ 监听一次都不重绑（修复前每帧重绑）', async () => {
    const inst = instrument(window);

    const wrapper = mount(Affix, {
      props: { offsetTop: 10 } as never, // target 缺省 ⇒ window
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();

    // 每个事件只绑了一次
    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBe(1);
      expect(inst.adds.get(e)).toBe(1);
    }
    expect(isAffixed(wrapper)).toBe(false);

    // 滚进固钉区 ⇒ `affixStyle` 真的出现（占位层 + `.apollo-affix` 类名）
    await scrollTo(wrapper, 5);
    expect(isAffixed(wrapper)).toBe(true);

    // 再滚出去 ⇒ 真的撤销
    await scrollTo(wrapper, 100);
    expect(isAffixed(wrapper)).toBe(false);

    // 反复翻转两轮
    await scrollTo(wrapper, 3);
    expect(isAffixed(wrapper)).toBe(true);
    await scrollTo(wrapper, 100);
    expect(isAffixed(wrapper)).toBe(false);

    /**
     * 🚨 核心断言：固钉状态真的翻转了 4 次（`affixStyle` 每次都是新对象），
     *    但 `add` 次数**没有增长** —— 修复前这里是 5（1 次 mount + 4 次翻转）。
     */
    for (const e of TRIGGER_EVENTS) {
      expect(inst.adds.get(e)).toBe(1);
      expect(inst.net(e)).toBe(1);
    }

    wrapper.unmount();
    inst.restore();
  });

  it('[A2] 依赖收窄：改 `offsetTop` / `offsetBottom` ⇒ 不重绑（只影响位置计算）', async () => {
    const inst = instrument(window);

    const wrapper = mount(Affix, {
      props: { offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();
    expect(inst.adds.get('scroll')).toBe(1);

    for (const offsetTop of [20, 30, 40, 50]) {
      await wrapper.setProps({ offsetTop } as never);
      await flushBind();
      await flushRaf();
    }

    // 🚨 修复前：`offsetTop` 在依赖里 ⇒ 每改一次就重绑一轮（这里是 5）
    for (const e of TRIGGER_EVENTS) {
      expect(inst.adds.get(e)).toBe(1);
      expect(inst.net(e)).toBe(1);
    }

    wrapper.unmount();
    inst.restore();
  });

  it('[A3] **已固钉时**持续滚动 ⇒ 不重绑（滚动期间每帧 14 次 DOM 调用的来源）', async () => {
    const inst = instrument(window);

    const wrapper = mount(Affix, {
      props: { offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();

    /**
     * ⚠️ 关键是**先滚进固钉区并保持不动**：target 是 `window` ⇒ `fixedTop` 恒为
     * `offsetTop + 0` ⇒ `affixStyle` 的**内容不变**，但 `measure()` 每次都写出
     * **新对象**（`shallowRef` / `setState` 同为引用比较）⇒ 依赖里的 `affixStyle`
     * 每次都「变」。
     *
     * 这才是滚动期间的重绑来源：**浏览器每帧一次**，共 14 次 DOM 调用
     * （7 事件 × remove + add），而绑的目标与 listener 从头到尾是同一个。
     */
    await scrollTo(wrapper, 5);
    expect(isAffixed(wrapper)).toBe(true);
    const baseline = inst.adds.get('scroll') ?? 0;

    for (let i = 0; i < 6; i += 1) {
      await measure(wrapper);
    }

    // 🚨 修复前：`adds` 每次测量 +1（这里是 baseline + 6）
    for (const e of TRIGGER_EVENTS) {
      expect(inst.adds.get(e)).toBe(baseline);
      expect(inst.net(e)).toBe(1);
    }

    wrapper.unmount();
    inst.restore();
  });

  it('[B] 卸载后净绑定归零（不留悬挂监听）', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const inst = instrument(target);

    const wrapper = mount(Affix, {
      props: { target: () => target, offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();
    await measure(wrapper);

    wrapper.unmount();

    // ⚠️ 断言 `<= 0` 而不是 `=== 0`：`removeListeners` 会从 `targetFunc()` 与
    //    `prevTargetRef` **各摘一次**（同一个元素时就是两次 remove）—— 上游同一份实现
    //    （antd `:24-31`）。`removeEventListener` 对不存在的监听是 no-op ⇒ 无害。
    //    真正要保证的不变式是「**不留下正残留**」。
    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBeLessThanOrEqual(0);
    }

    inst.restore();
  });

  it('[C] 换 target ⇒ 旧目标摘干净、只有新目标仍活跃', async () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);
    const instA = instrument(a);
    const instB = instrument(b);

    const wrapper = mount(Affix, {
      props: { target: () => a, offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();
    expect(instA.net('scroll')).toBe(1);

    await wrapper.setProps({ target: () => b } as never);
    await flushBind();

    expect(instA.net('scroll')).toBe(0);
    expect(instB.net('scroll')).toBe(1);
    // 新目标也只绑了一次（不是「换一次绑一次」地累积）
    expect(instB.adds.get('scroll')).toBe(1);

    wrapper.unmount();
    expect(instB.net('scroll')).toBeLessThanOrEqual(0);

    instA.restore();
    instB.restore();
  });

  it('[D] 首次绑定时 target 未就绪 ⇒ 后续任一测量即补挂（重试能力没丢）', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const inst = instrument(el);

    let ready = false;
    const wrapper = mount(Affix, {
      props: { target: () => (ready ? el : null), offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();

    // target 未就绪 ⇒ 一次都没绑
    expect(inst.adds.get('scroll') ?? 0).toBe(0);

    // 元素出现之后，**任何一次测量**（滚动 / resize / ResizeObserver）都会顺带补挂
    ready = true;
    await measure(wrapper);

    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBe(1);
    }

    wrapper.unmount();
    inst.restore();
  });
});
