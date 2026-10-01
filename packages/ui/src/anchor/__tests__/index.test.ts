/**
 * Anchor · L1/L2（jsdom）。
 *
 * ── 为什么这里只能钉「接线」──────────────────────────────────────────────────
 *
 * jsdom **没有布局也没有滚动**：`getBoundingClientRect()` 全 0、`getClientRects()` 空
 * ⇒ `getOffsetTop` 恒 0 ⇒ **`getInternalCurrentAnchor` 的判定必须靠 mock rect +
 * 手动派发 `scroll`**。真实滚动行为归 **L6**（真浏览器）。
 *
 * 上游 `Anchor.test.tsx` 有 **49** 条；本文件钉的是**最容易写错的那批**：
 * 类名判据（`-fixed` / `-wrapper-horizontal` / `-ink-visible`）、注册顺序、
 * 点击的三段（onClick → scrollTo → history）、`onChange` 的载荷（**原始 link**）、
 * `getCurrentAnchor` 只改高亮不改载荷、affix 两分支、水平不渲染嵌套 children。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Anchor } from '../Anchor';
import { AnchorLink } from '../AnchorLink';

const P = 'apollo-anchor';

/** 造一个带 id 的目标元素（`document.getElementById` 要能取到）；返回它以便改 mock。 */
const mountTarget = (id: string, top = 0): HTMLElement => {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  mockRect(el, top);
  return el;
};

/** jsdom 无布局 ⇒ mock：有 rect（宽高非 0 ⇒ 走容器分支）+ 指定 top。 */
const mockRect = (el: HTMLElement, top: number): void => {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom: top + 100,
    height: 100,
    width: 100,
    left: 0,
    right: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
  vi.spyOn(el, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
};

const buildItems = (...hrefs: string[]) =>
  hrefs.map((href, i) => ({ key: href, href, title: `T${i}` }));

const mountAnchor = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Anchor, {
    props: { items: buildItems('#a', '#b'), affix: false, ...props },
    slots,
    attachTo: document.body,
  });

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Anchor · 结构（L2）', () => {
  it('渲染 `-wrapper` > `.{p}` > 链接；`affix: false` ⇒ 根上有 `-fixed`', () => {
    const w = mountAnchor({ affix: false });
    const wrapper = w.find(`.${P}-wrapper`);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find(`.${P}`).exists()).toBe(true);
    expect(wrapper.find(`.${P}`).classes()).toContain(`${P}-fixed`);
    expect(w.findAll(`.${P}-link`)).toHaveLength(2);
    expect(w.findAll(`.${P}-link-title`)).toHaveLength(2);
    w.unmount();
  });

  it('🚨 `-fixed` 的判据是 `!affix && !showInkInFixed`（两个都假才加）', () => {
    const w = mountAnchor({ affix: false, showInkInFixed: true });
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-fixed`);
    w.unmount();
  });

  it('`affix` 默认 **true** ⇒ 外面包一层 Affix（jsdom 无布局 ⇒ 不固钉、无 `apollo-affix` 类）', () => {
    const w = mount(Anchor, { props: { items: buildItems('#a') }, attachTo: document.body });
    const root = w.element as HTMLElement;

    // Affix 的根是**外层无类名的 div**（`apollo-affix` 只在内层「已固钉」时出现，antd 同款）
    expect(root.classList.contains(`${P}-wrapper`)).toBe(false);
    expect(root.querySelector(`.${P}-wrapper`)).not.toBeNull();
    w.unmount();
  });

  it('`direction: horizontal` ⇒ wrapper 带 `-wrapper-horizontal`', () => {
    const w = mountAnchor({ direction: 'horizontal' });
    expect(w.find(`.${P}-wrapper`).classes()).toContain(`${P}-wrapper-horizontal`);
    w.unmount();
  });

  it('RTL：`-rtl` 落在 **wrapper** 上（不是 `.{p}`）', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Anchor, { items: buildItems('#a'), affix: false }) },
      attachTo: document.body,
    });
    await nextTick();

    expect(w.find(`.${P}-wrapper`).classes()).toContain(`${P}-rtl`);
    expect(w.find(`.${P}`).classes()).not.toContain(`${P}-rtl`);
    w.unmount();
  });

  it('没传 `items` 但传了默认插槽 ⇒ 走 children 分支（废弃路径仍可用）', () => {
    const w = mount(Anchor, {
      props: { affix: false },
      slots: { default: () => h('div', { class: 'legacy-child' }, 'legacy') },
      attachTo: document.body,
    });

    expect(w.find('.legacy-child').exists()).toBe(true);
    w.unmount();
  });

  it('嵌套 `items` ⇒ 逐层展开（垂直时两层都渲染）', () => {
    const w = mountAnchor({
      items: [
        { key: 'a', href: '#a', title: 'A', children: [{ key: 'a1', href: '#a1', title: 'A1' }] },
      ],
    });

    expect(w.findAll(`.${P}-link`)).toHaveLength(2);
    w.unmount();
  });

  it('水平方向**不渲染**嵌套 children（上游判据是 direction 不等于 horizontal）', () => {
    const w = mountAnchor({
      direction: 'horizontal',
      items: [
        { key: 'a', href: '#a', title: 'A', children: [{ key: 'a1', href: '#a1', title: 'A1' }] },
      ],
    });

    expect(w.findAll(`.${P}-link`)).toHaveLength(1);
    w.unmount();
  });
});

describe('Anchor · 点击（L2）', () => {
  it('🚨 内链：`onClick` → `scrollTo` → `preventDefault` + `history.pushState`', async () => {
    const onClick = vi.fn();
    const pushState = vi.spyOn(window.history, 'pushState');
    mountTarget('a');
    const w = mountAnchor({ items: buildItems('#a'), onClick });

    await w.find(`.${P}-link-title`).trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
    const [event, link] = onClick.mock.calls[0] as [MouseEvent, { href: string; title: unknown }];
    expect(link.href).toBe('#a');
    expect(event.defaultPrevented).toBe(true);
    expect(pushState).toHaveBeenCalledWith(null, '', '#a');
    w.unmount();
  });

  it('`replace: true` ⇒ 走 `history.replaceState`', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mountTarget('a');
    const w = mountAnchor({ items: buildItems('#a'), replace: true });

    await w.find(`.${P}-link-title`).trigger('click');

    expect(replaceState).toHaveBeenCalledWith(null, '', '#a');
    w.unmount();
  });

  it('🚨 用户在 `onClick` 里 `preventDefault` ⇒ **不接管历史**', async () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    mountTarget('a');
    const w = mountAnchor({
      items: buildItems('#a'),
      onClick: (e: MouseEvent) => e.preventDefault(),
    });

    await w.find(`.${P}-link-title`).trigger('click');

    expect(pushState).not.toHaveBeenCalled();
    w.unmount();
  });

  it('🚨 `onChange` 收到的是**原始 link**（点击后立即发一次）', async () => {
    mountTarget('a');
    const w = mountAnchor({ items: buildItems('#a') });

    await w.find(`.${P}-link-title`).trigger('click');

    const emitted = w.emitted('change');
    /**
     * ⚠️ **只有一条**：挂载时的 `handleScroll()` 已经把当前锚点定为 `#a`（`top: 0` 在阈值内）
     * 并发过一次；点击同一个链接时 `forceTriggerChange` 为假且值相同 ⇒ **不重复发**。
     * 这正是上游 `setCurrentActiveLink` 的「同值短路」判据。
     */
    expect(emitted?.map((call) => call[0])).toEqual(['#a']);
    w.unmount();
  });

  it('`getCurrentAnchor` **改写高亮**，但 `onChange` 仍收到原始 link', async () => {
    mountTarget('a');
    const w = mountAnchor({
      items: buildItems('#a'),
      getCurrentAnchor: () => '#rewritten',
    });

    await w.find(`.${P}-link-title`).trigger('click');

    expect(w.emitted('change')?.at(-1)?.[0]).toBe('#a');
    // 高亮被改写成 `#rewritten` ⇒ 没有任何链接是 active
    expect(w.findAll(`.${P}-link-active`)).toHaveLength(0);
    w.unmount();
  });
});

describe('Anchor · 滚动侦测（L2，mock rect）', () => {
  it('命中「top ≤ offsetTop + bounds」里 top **最大**的那个链接', async () => {
    mountTarget('a', 0);
    mountTarget('b', 200);
    const w = mountAnchor({
      items: buildItems('#a', '#b'),
      offsetTop: 300,
      bounds: 5,
      getContainer: () => window,
    });

    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    // 两个都在阈值内（0 与 200 都 ≤ 305）⇒ 取 top 最大的 `#b`
    expect(w.emitted('change')?.at(-1)?.[0]).toBe('#b');
    expect(w.find(`.${P}-link-active`).exists()).toBe(true);
    w.unmount();
  });

  it('都超出阈值 ⇒ 没有 active', async () => {
    mountTarget('a', 500);
    const w = mountAnchor({
      items: buildItems('#a'),
      offsetTop: 10,
      bounds: 5,
      getContainer: () => window,
    });

    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect(w.find(`.${P}-link-active`).exists()).toBe(false);
    w.unmount();
  });

  it('`getContainer` 返回的元素上挂 scroll 监听（挂一次、卸载时摘一次）', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const addSpy = vi.spyOn(container, 'addEventListener');
    const removeSpy = vi.spyOn(container, 'removeEventListener');

    const w = mountAnchor({ items: buildItems('#a'), getContainer: () => container });

    expect(addSpy.mock.calls.filter(([t]) => t === 'scroll')).toHaveLength(1);

    w.unmount();
    expect(removeSpy.mock.calls.filter(([t]) => t === 'scroll')).toHaveLength(1);
  });
});

describe('Anchor · ink（L2，mock 几何）', () => {
  it('垂直：切换 active 后把该链接的几何写进 ink 的**内联样式**，并加 `-ink-visible`', async () => {
    const elA = mountTarget('a', 0);
    mountTarget('b', 999);
    const w = mountAnchor({
      items: buildItems('#a', '#b'),
      offsetTop: 10,
      getContainer: () => window,
    });

    // 挂载期的 `handleScroll()` 在 `onMounted` 里改 `activeLink` ⇒ **下一拍**才落到 DOM
    await nextTick();
    // 挂载时 `#a`（top 0 ≤ 15）就是 active
    expect(w.find(`.${P}-link-title-active`).text()).toBe('T0');

    // 🚨 让 `#a` 出界、`#b` 进界 ⇒ 派发 scroll 触发一次**真正的状态切换**
    //    （否则「值没变 ⇒ 不重渲染 ⇒ 不写 ink」，测的是空转）
    mockRect(elA, 999);
    mockRect(document.getElementById('b') as HTMLElement, 0);
    window.dispatchEvent(new Event('scroll'));
    await nextTick();
    await nextTick();

    expect(w.find(`.${P}-link-title-active`).text()).toBe('T1');

    const ink = w.find(`.${P}-ink`);
    expect(ink.classes()).toContain(`${P}-ink-visible`);
    // jsdom 的 offsetTop / clientHeight 恒 0 ⇒ 断言「写进去了」而不是具体数值
    expect((ink.element as HTMLElement).style.top).toBe('0px');
    expect((ink.element as HTMLElement).style.height).toBe('0px');
    w.unmount();
  });
});

describe('Anchor.Link（独立使用）', () => {
  it('脱离 Anchor 也能渲染（context 为 undefined ⇒ 不注册、不 active）', () => {
    const w = mount(AnchorLink, {
      props: { href: '#x', title: 'X' },
      attachTo: document.body,
    });

    expect(w.find(`.${P}-link`).exists()).toBe(true);
    expect(w.find(`.${P}-link-active`).exists()).toBe(false);
    w.unmount();
  });
});
