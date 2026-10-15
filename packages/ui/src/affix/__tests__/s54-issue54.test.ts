/**
 * Issue #54 · [Affix] 固钉状态变更触发原生监听重绑（运行时量化）
 *
 * 上游判据（antd 6.6.4 `es/affix/index.js:168-171`）：
 * ```js
 * React.useEffect(() => { addListeners(); return () => removeListeners(); },
 *   [target, affixStyle, lastAffix, offsetTop, offsetBottom]);
 * ```
 * ⇒ **固钉状态翻转（`affixStyle`/`lastAffix`）本来就会重绑** —— 本仓 `Affix.vue:297-302`
 * 的依赖集与之逐字一致（再多一个 `offsetBottom`，上游也有）。
 *
 * 量化结论：**绑定次数有界，不是泄漏**。
 *   · `ADD` 用同一个 `lazyUpdatePosition` 引用 + 同一 capture ⇒ DOM 对
 *     `(type, listener, capture)` **三元组去重** ⇒ 同一元素上重复 add 不累积；
 *   · `addListeners` 自身在 add 之前先从 `prevTargetRef` 摘掉旧监听 ⇒ 换 target 也不残留；
 *   · 卸载时 `removeListeners()` 把两侧都摘干净（净绑定归零）。
 *
 * ⇒ 按 Issue 判据「不把冗余重绑定误认成内存泄漏」**判为非缺陷**；issue 建议的
 * 「把监听目标切换与位置计算拆开」会**偏离上游依赖集**，故不做。下面的用例把这个
 * **有界性**钉住（净绑定恒 ≤ 1/事件、卸载后归零）。
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

/** 记录某个元素上每个事件名的 add / remove 次数。 */
function instrument(el: HTMLElement) {
  const adds = new Map<string, number>();
  const removes = new Map<string, number>();
  const bump = (map: Map<string, number>, type: string) => map.set(type, (map.get(type) ?? 0) + 1);

  el.addEventListener = vi.fn((type: string) => {
    bump(adds, type);
  }) as never;
  el.removeEventListener = vi.fn((type: string) => {
    bump(removes, type);
  }) as never;

  return {
    adds,
    removes,
    /** 净绑定数（add - remove），恒应 ≤ 1。 */
    net: (type: string) => (adds.get(type) ?? 0) - (removes.get(type) ?? 0),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

const flushBind = async (): Promise<void> => {
  vi.runOnlyPendingTimers(); // onMounted 的 setTimeout(addListeners)
  await nextTick();
};

describe('Affix · Issue #54 监听重绑的有界性', () => {
  it('[A] 多次重绑后净绑定恒为 1/事件（不累积）', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const inst = instrument(target);

    const wrapper = mount(Affix, {
      props: { target: () => target, offsetTop: 10 } as never,
      slots: { default: () => h('span', 'x') },
      attachTo: document.body,
    });
    await flushBind();

    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBe(1);
    }

    // 固钉状态相关依赖连改多次（offsetTop 变化会带动 affixStyle / lastAffix）
    for (const offsetTop of [20, 30, 40, 50]) {
      await wrapper.setProps({ offsetTop } as never);
      await flushBind();
    }

    // 重绑次数 > 1（与上游同依赖集），但**净绑定仍恒为 1**
    expect(inst.adds.get('scroll')).toBeGreaterThan(1);
    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBeLessThanOrEqual(1);
      expect(inst.net(e)).toBe(1);
    }

    wrapper.unmount();
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
    await wrapper.setProps({ offsetTop: 20 } as never);
    await flushBind();

    wrapper.unmount();

    // ⚠️ 断言 `<= 0` 而不是 `=== 0`：`removeListeners` 会从 `targetFunc()` 与
    //    `prevTargetRef` **各摘一次**（同一个元素时就是两次 remove）—— 上游同一份实现
    //    （antd `:24-31`）。`removeEventListener` 对不存在的监听是 no-op ⇒ 无害。
    //    真正要保证的不变式是「**不留下正残留**」。
    for (const e of TRIGGER_EVENTS) {
      expect(inst.net(e)).toBeLessThanOrEqual(0);
    }
  });

  it('[C] 换 target 时旧目标被摘干净（不残留）', async () => {
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

    wrapper.unmount();
    // 同上：卸载路径允许「多摘一次」（上游同款），只需保证不留正残留
    expect(instB.net('scroll')).toBeLessThanOrEqual(0);
  });
});
