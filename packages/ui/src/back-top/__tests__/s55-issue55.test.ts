/**
 * Issue #55 · [BackTop] visibilityHeight 动态修改后的状态同步（运行时验证）
 *
 * 上游判据（antd 6.6.4 `es/back-top/index.js:30-52`）：
 * ```js
 * const [visible, setVisible] = React.useState(visibilityHeight === 0);
 * const handleScroll = throttleByAnimationFrame(e => { setVisible(getScroll(e.target) >= visibilityHeight); });
 * React.useEffect(() => {
 *   handleScroll({ target: container });
 *   container?.addEventListener('scroll', handleScroll);
 *   return () => { handleScroll.cancel(); container?.removeEventListener('scroll', handleScroll); };
 * }, [target]);          // ⚠️ 依赖里**没有** visibilityHeight
 * ```
 * 上游的两条事实：
 *   1. **改了阈值但不产生新 scroll ⇒ `visible` 不变**（effect 依赖只有 `[target]`）；
 *   2. 上游注册的监听器闭包来自**挂载那一帧** ⇒ 阈值实际上被冻在挂载值；
 *      本仓在 `applyVisible` 里**现读 `props.visibilityHeight`** ⇒ 下一次 scroll 就用新阈值。
 *
 * ⇒ **Issue #55 已按「正确性优先」修复**（不再以「上游也这样」为由保留）：
 *   · 补 `watch(() => props.visibilityHeight, syncVisible)` ⇒ 改阈值**无需滚动事件**立即生效；
 *   · 顺带修掉一个闪烁：初始校准原先走 `handleScroll`（`throttleByAnimationFrame` 的语义是
 *     「第一次调用**排到下一帧**」）⇒ 已滚过阈值的页面会先渲染「不可见」再翻转；
 *     现在初始 / 换容器 / 改阈值都走**同步**的 `syncVisible`，只有滚动事件走节流路径。
 *
 * 保留的守卫：[B]（下一次 scroll 仍用新阈值）、[C]（换 target 重绑并立即校准）。
 * 新增：[D]（挂载时已滚过阈值 ⇒ 首帧即可见）、[E]（卸载摘监听恰好一次、换 target 不重复注册）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import BackTop from '../BackTop';

const P = 'apollo-back-top';

/** mock 滚动容器（`utils/getScroll` 为测试保留的形状）。 */
const makeTarget = (scrollTop: number) =>
  ({
    scrollTop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as HTMLElement & { scrollTop: number };

const nextFrame = () => new Promise((r) => setTimeout(r, 50));

/** 取挂载时注册的 scroll 监听器。 */
const handlerOf = (target: HTMLElement) =>
  (target.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0]![1] as EventListener;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('BackTop · Issue #55 visibilityHeight 动态修改', () => {
  it('[A] 改阈值 ⇒ **无需新 scroll** 立即更新可见状态（Issue #55 修复）', async () => {
    const target = makeTarget(200);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    await nextFrame();
    // 200 < 400 ⇒ 不可见
    expect(w.find(`.${P}-content`).exists()).toBe(false);

    // 阈值降到 100（200 >= 100 ⇒ 应该可见），且**不产生任何 scroll 事件**：
    // 上游 effect 依赖只有 [target] ⇒ 到这一步为止都不会重算；
    // 本仓补了 `watch(visibilityHeight)` ⇒ 下一 tick 就生效。
    await w.setProps({ visibilityHeight: 100 });
    // 🚨 刻意**不**等帧：证明它不依赖 rAF / scroll
    expect(w.find(`.${P}-content`).exists()).toBe(true);

    // 反向：阈值再抬回 400 ⇒ 立即开始退场
    await w.setProps({ visibilityHeight: 400 });
    // ⚠️ 判「已开始 leave」而不是「元素消失」：jsdom 下 CSSMotion 的退场动画
    //    不会真正结束，元素会一直留在 DOM 里（PITFALLS：动效不结束）。
    //    leave 类出现在同一 tick ⇒ 足以证明 visible 已经翻成 false。
    expect(w.find('.apollo-fade-leave').exists()).toBe(true);

    w.unmount();
  });

  it('[B] 改阈值后的**下一次 scroll** 用新阈值（本仓现读 props，比上游更正确）', async () => {
    const target = makeTarget(200);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    await nextFrame();
    const handler = handlerOf(target);
    expect(w.find(`.${P}-content`).exists()).toBe(false);

    await w.setProps({ visibilityHeight: 100 });

    // scrollTop 未变（仍 200），但阈值已是 100 ⇒ 现读 ⇒ 变可见
    handler({ target } as unknown as Event);
    await nextFrame();
    expect(w.find(`.${P}-content`).exists()).toBe(true);

    w.unmount();
  });

  it('[C] 守卫：换 target ⇒ 重绑 + 立即按新容器校准', async () => {
    const low = makeTarget(200);
    const high = makeTarget(1000);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => low },
      attachTo: document.body,
    });
    await nextFrame();
    expect(w.find(`.${P}-content`).exists()).toBe(false);
    expect(low.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

    await w.setProps({ target: () => high });
    await nextFrame();

    // 重绑：旧的摘掉、新的挂上，并按新容器（1000 >= 400）立即校准
    expect(low.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(high.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(w.find(`.${P}-content`).exists()).toBe(true);

    w.unmount();
  });

  it('[D] 挂载时已滚过阈值 ⇒ **首帧**即可见（不经 rAF，不闪烁）', async () => {
    const target = makeTarget(500);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    // 🚨 只等微任务，**不等** rAF：若初始校准走 `throttleByAnimationFrame`
    //    （它的语义是「第一次调用排到下一帧」），这里会是 false
    //    ⇒ 页面先渲染「不可见」再在下一帧翻成「可见」= 闪烁。
    await nextTick();
    expect(w.find(`.${P}-content`).exists()).toBe(true);

    w.unmount();
  });

  it('[E] 卸载 ⇒ 摘监听恰好一次；反复换 target 不重复注册', async () => {
    const a = makeTarget(500);
    const b = makeTarget(0);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => a },
      attachTo: document.body,
    });
    await nextFrame();
    expect(a.addEventListener).toHaveBeenCalledTimes(1);

    await w.setProps({ target: () => b });
    await nextFrame();
    // 切走：旧容器摘一次、新容器挂一次（不多挂）
    expect(a.removeEventListener).toHaveBeenCalledTimes(1);
    expect(b.addEventListener).toHaveBeenCalledTimes(1);

    await w.setProps({ target: () => a });
    await nextFrame();
    expect(a.addEventListener).toHaveBeenCalledTimes(2);
    expect(b.removeEventListener).toHaveBeenCalledTimes(1);

    w.unmount();
    // 卸载只摘**当前**容器，且只摘一次（无残留、无重复）
    expect(a.removeEventListener).toHaveBeenCalledTimes(2);
    expect(b.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
