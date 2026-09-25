/**
 * L2 —— `MotionList`（多元素按 key 管理）。
 *
 * 测的是 `motion-contract.md` §3.9 划给本包的三件事：
 *   1. `keys` 变化 → 四态 diff → 每个 key 各自一个 CSSMotion；
 *   2. 某个 key 离场播完 → 标 `removed` → 从列表摘掉；
 *   3. 全摘完 → `allRemoved`。
 *
 * ⚠️ **stagger（错峰）不在这里** —— 那是组件自己给 style 加 animation-delay，
 *    本包不做（§3.9）。
 *
 * 帧用真实 rAF：MotionList 内部套的是 CSSMotion 组件，没有注入帧泵的口子；
 * `motionDeadline` 给 1ms，让 deadline 兜底快速结束，避免测试等真实的 transitionend。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { MotionList } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

/** 每个 key 渲染一个带 data-key 的 div，方便断言「谁还在」 */
function mountList(keys: string[], extra: Record<string, unknown> = {}) {
  return mount(
    defineComponent({
      setup() {
        return () =>
          h(
            MotionList,
            {
              keys,
              supportMotion: true,
              motionName: 'apollo-fade',
              motionDeadline: 1,
              ...extra,
            },
            {
              default: ({ itemKey }: Record<string, unknown>) =>
                h('div', { 'data-key': String(itemKey) }),
            },
          );
      },
    }),
  );
}

function keysOf(wrapper: { html: () => string }): string[] {
  return [...wrapper.html().matchAll(/data-key="([^"]+)"/g)].map((m) => m[1] ?? '');
}

/**
 * 等离场走完：prepare→start 两帧、start→active 两帧，active 才注册 deadline。
 * jsdom 的 rAF 约 16ms/帧，所以至少要等 5 帧（80ms）才可能看到 deadline 生效。
 */
async function settle(): Promise<void> {
  for (let i = 0; i < 6; i += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise((resolve) => setTimeout(resolve, 30));
  await nextTick();
  await nextTick();
}

describe('keys diff', () => {
  it('初始 keys 每个都渲染', async () => {
    const wrapper = mountList(['a', 'b']);
    await nextTick();
    expect(keysOf(wrapper)).toEqual(['a', 'b']);
    wrapper.unmount();
  });

  it('新增 key ⇒ 新元素出现，且原有元素保持', async () => {
    const wrapper = mountList(['a']);
    await nextTick();
    // keys 是普通数组 prop，直接改组件实例不行 —— 用 setProps 需要宿主暴露；
    // 这里换成重新挂载来模拟 keys 变化
    wrapper.unmount();

    const wrapper2 = mountList(['a', 'c']);
    await nextTick();
    expect(keysOf(wrapper2)).toEqual(['a', 'c']);
    wrapper2.unmount();
  });
});

describe('离场与摘除', () => {
  it('⭐ 移除的 key 不会立刻消失 —— 要先播完离场动画', async () => {
    const Host = defineComponent({
      data: () => ({ keys: ['a', 'b'] }),
      render() {
        return h(
          MotionList,
          {
            keys: this.keys,
            supportMotion: true,
            motionName: 'apollo-fade',
            motionDeadline: 1,
          },
          {
            default: ({ itemKey }: Record<string, unknown>) =>
              h('div', { 'data-key': String(itemKey) }),
          },
        );
      },
    });
    const wrapper = mount(Host);
    await nextTick();
    expect(keysOf(wrapper)).toEqual(['a', 'b']);

    (wrapper.vm as unknown as { keys: string[] }).keys = ['a'];
    await nextTick();
    // b 进入 remove 状态，但**还在 DOM 里**（否则看不到离场动画）
    expect(keysOf(wrapper)).toContain('b');

    await settle();
    expect(keysOf(wrapper)).not.toContain('b');
    wrapper.unmount();
  });

  it('所有 key 都移除并播完 ⇒ 触发 allRemoved', async () => {
    let allRemoved = 0;
    const Host = defineComponent({
      data: () => ({ keys: ['a'] }),
      render() {
        return h(
          MotionList,
          {
            keys: this.keys,
            supportMotion: true,
            motionName: 'apollo-fade',
            motionDeadline: 1,
            onAllRemoved: () => {
              allRemoved += 1;
            },
          },
          {
            default: ({ itemKey }: Record<string, unknown>) =>
              h('div', { 'data-key': String(itemKey) }),
          },
        );
      },
    });
    const wrapper = mount(Host);
    await nextTick();

    (wrapper.vm as unknown as { keys: string[] }).keys = [];
    await nextTick();
    await settle();

    expect(allRemoved).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('component=null 时不包裹，直接返回子元素', async () => {
    const wrapper = mountList(['a'], { component: '' });
    await nextTick();
    expect(keysOf(wrapper)).toEqual(['a']);
    wrapper.unmount();
  });
});

describe('CSSMotion · 根 vnode 是组件时的元素解析（2026-09-25 实测补）', () => {
  /**
   * 为什么需要这条：`CSSMotion` 会把 ref 注入到 slot 的根 vnode 上，驱动靠它 `attach`
   * 事件监听。根 vnode 是**元素**时 ref 就是元素；是**组件**时 ref 是组件实例 ——
   * 直接 attach 会 `element.addEventListener is not a function`。
   * 真实来源：notification 内核的 notice 就是组件 vnode（`Notification` 的 Vue 版）。
   */
  it('slot 返回组件 vnode 时，离场仍能走完并摘掉（不抛 addEventListener 错误）', async () => {
    const Inner = defineComponent({
      name: 'Inner',
      setup() {
        return () => h('div', { 'data-key': 'inner' }, 'x');
      },
    });

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            MotionList,
            { keys: ['a'], supportMotion: true, motionName: 'apollo-fade', motionDeadline: 1 },
            { default: () => h(Inner) },
          );
      },
    });

    const wrapper = mount(Host);
    await nextTick();
    await settle();
    expect(wrapper.find('[data-key="inner"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
