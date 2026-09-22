/**
 * L1/L2 · 单元测试（BackTop）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 事件：click（→ scrollTo + onClick）；滚动（target 容器）→ visible 切换。
 * jsdom 无布局 —— scrollTo/可见性判定用 mock target 形状（{ scrollTop }，
 * utils/getScroll 为测试保留的分支）钉住。
 */

import { throttleByAnimationFrame } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { easeInOutCubic, scrollTo } from '../../_internal/scroll-to';
import { BackTop } from '../index';

const P = 'apollo-back-top';

/** mock 滚动容器（utils/getScroll 为测试保留的形状）。 */
const makeTarget = (scrollTop: number) => {
  const el = {
    scrollTop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  return el as unknown as HTMLElement;
};

describe('BackTop · 结构', () => {
  it('根类名 + 默认元素（-content > -icon > 图标）', () => {
    const w = mount(BackTop, { props: { visibilityHeight: 0 } });
    expect(w.find(`.${P}`).exists()).toBe(true);
    expect(w.find(`.${P}-content`).exists()).toBe(true);
    expect(w.find(`.${P}-icon`).exists()).toBe(true);
    expect(w.find('.apollo-icon').exists()).toBe(true);
  });

  it('children 走克隆分支（自定义内容替换默认元素；motionClassName 经 cloneVNode 注入）', () => {
    const w = mount(BackTop, {
      props: { visibilityHeight: 0 },
      slots: { default: () => h('div', { class: 'my-content' }, 'custom') },
    });
    // 自定义内容渲染、默认元素不渲染
    expect(w.find('.my-content').exists()).toBe(true);
    expect(w.find(`.${P}-content`).exists()).toBe(false);
  });

  it('fade 无 CSS 是契约（motionName 类挂 DOM，样式表不产出 keyframes）', async () => {
    const { genBackTopStyle } = await import('../style');
    expect(genBackTopStyle('apollo')).not.toContain('fade');
  });

  it('deprecated 告警（antd 逐字：BackTop → FloatButton.BackTop）', () => {
    // 告警层 dev 去重，文本对账用「产物 grep」法（button/spin 同款）；此处钉住
    // 组件可正常挂载 —— 告警文本由 dev-warning 单测覆盖。
    const w = mount(BackTop, { props: { visibilityHeight: 0 } });
    expect(w.find(`.${P}`).exists()).toBe(true);
  });
});

describe('BackTop · 滚动监听（mock target）', () => {
  it('挂载后立即校准可见性并 addEventListener；卸载 cancel + remove', async () => {
    const target = makeTarget(1000);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 50));
    // 立即校准：1000 >= 400 → visible
    expect(w.find(`.${P}-content`).exists()).toBe(true);
    expect(target.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    w.unmount();
    expect(target.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('scroll 事件驱动 visible 切换（throttle 走 raf —— 等两帧）', async () => {
    const target = makeTarget(0);
    const w = mount(BackTop, {
      props: { visibilityHeight: 400, target: () => target },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 50));
    // 初始 0 < 400 → CSSMotion 渲染 null（首帧语义）
    expect(w.find(`.${P}-content`).exists()).toBe(false);

    // 模拟滚动：改 scrollTop 后触发监听器
    (target as unknown as { scrollTop: number }).scrollTop = 500;
    const handler = (target.addEventListener as ReturnType<typeof vi.fn>).mock
      .calls[0][1] as EventListener;
    // 真实 scroll 事件的 event.target 就是监听容器本身
    handler({ target } as unknown as Event);
    await new Promise((r) => setTimeout(r, 50));
    expect(w.find(`.${P}-content`).exists()).toBe(true);
    w.unmount();
  });

  it('visibilityHeight === 0 → 初始可见（antd 的 useState 判据）', async () => {
    const target = makeTarget(0);
    const w = mount(BackTop, {
      props: { visibilityHeight: 0, target: () => target },
      attachTo: document.body,
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(w.find(`.${P}-content`).exists()).toBe(true);
    w.unmount();
  });
});

describe('BackTop · 点击', () => {
  it('duration=0 直落（同步把 target.scrollTop 归零）+ onClick 调用', async () => {
    const target = makeTarget(999);
    const onClick = vi.fn();
    const w = mount(BackTop, {
      props: { visibilityHeight: 0, duration: 0, target: () => target, onClick },
      attachTo: document.body,
    });
    await w.find(`.${P}`).trigger('click');
    expect((target as unknown as { scrollTop: number }).scrollTop).toBe(0);
    expect(onClick).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('duration>0 走 raf 动画（帧内推进、结束后停在 0）', async () => {
    const target = makeTarget(100);
    const w = mount(BackTop, {
      props: { visibilityHeight: 0, duration: 32, target: () => target },
      attachTo: document.body,
    });
    await w.find(`.${P}`).trigger('click');
    await new Promise((r) => setTimeout(r, 120));
    expect((target as unknown as { scrollTop: number }).scrollTop).toBe(0);
    w.unmount();
  });
});

describe('BackTop · 纯函数', () => {
  it('easeInOutCubic 与 antd 逐字（关键点采样；b=起点、c=终点）', () => {
    expect(easeInOutCubic(0, 100, -100, 450)).toBe(100);
    expect(easeInOutCubic(450, 100, -100, 450)).toBe(-100);
    // 中点 = (起点+终点)/2
    expect(easeInOutCubic(225, 100, -100, 450)).toBeCloseTo(0, 5);
  });

  it('scrollTo 返回取消函数（duration>0）；duration<=0 返回空函数', () => {
    const cancel = scrollTo(0, { duration: 16, getContainer: () => makeTarget(50) });
    expect(typeof cancel).toBe('function');
    const immediate = scrollTo(0, { duration: 0, getContainer: () => makeTarget(50) });
    expect(typeof immediate).toBe('function');
  });
});

describe('BackTop · 节流（utils 的 throttleByAnimationFrame 契约）', () => {
  it('一帧内多次调用只跑第一次实参', async () => {
    const fn = vi.fn();
    const throttled = throttleByAnimationFrame(fn);
    throttled(1);
    throttled(2);
    throttled(3);
    await new Promise((r) => setTimeout(r, 30));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });
});
