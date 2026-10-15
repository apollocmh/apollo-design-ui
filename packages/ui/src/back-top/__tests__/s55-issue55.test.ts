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
 * 两条结论：
 *   1. **改了阈值但不产生新 scroll ⇒ `visible` 不变** —— 上游也不会重算
 *      （effect 依赖只有 `[target]`；本仓 `watch(() => props.target)` 逐字一致）；
 *   2. 上游注册的监听器闭包来自**挂载那一帧** ⇒ 阈值实际上被冻在挂载值；
 *      本仓在 `handleScroll` 里**现读 `props.visibilityHeight`**（`BackTop.ts:91`）
 *      ⇒ **下一次 scroll 就用新阈值**（Vue 侧超集，比上游更正确）。
 *
 * ⇒ 按 Issue 判据（「对比 React 动态阈值行为；若需实时生效则补订阅」）**判为非缺陷**：
 *   `visibilityHeight` 的生效时点是「下一次 scroll」，与上游一致（且比上游多认了新阈值）。
 *   要「改阈值即刻生效」属于**增强**（上游没有），不在本轮范围。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  it('[A] 只改阈值、不产生新 scroll ⇒ visible 不变（上游同款）', async () => {
    const target = makeTarget(200);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    await nextFrame();
    // 200 < 400 ⇒ 不可见
    expect(w.find(`.${P}-content`).exists()).toBe(false);

    // 阈值降到 100（200 >= 100 ⇒ 「应该」可见），但**没有新 scroll**
    await w.setProps({ visibilityHeight: 100 });
    await nextFrame();

    // 上游同样不重算（effect 依赖只有 [target]）
    expect(w.find(`.${P}-content`).exists()).toBe(false);

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
});
