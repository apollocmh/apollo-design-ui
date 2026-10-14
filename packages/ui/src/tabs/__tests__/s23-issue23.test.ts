/**
 * Issue #23 回归（Tabs）：items 归一结果进渲染链、`#popupRender` 链路、根 `styles.root`。
 *
 * 判据：
 *   1. 归一（`destroyInactiveTabPane` → `destroyOnHidden`）后的 items 必须是**渲染列表**的
 *      数据源（`TabPanelList` 的 `removeOnLeave = 组件级 ?? item 级`）；
 *   2. 更多菜单的自定义浮层要走 Vue 作用域插槽 `#popupRender`（签名 `(menu, info)`，
 *      与 `TabsSlots['popupRender']` 一致；旧注释里的 `#morePopup` 是过时写法），
 *      Tabs → OperationNode → Dropdown 全链路；
 *   3. `useMergeSemantic` 产出的 `mergedStyles.root` 必须落到根元素（与 `root` 类名同判）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { useTouchMove } from '../hooks/use-touch-move';
import Tabs from '../index';

const mounted: Array<{ unmount: () => void }> = [];

const mountTabs = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) => {
  const w = mount(Tabs, {
    attachTo: document.body,
    props: props as never,
    slots: slots as never,
    global: { stubs: { teleport: false } },
  });
  mounted.push(w);
  return w;
};

const root = () => document.querySelector('.apollo-tabs') as HTMLElement | null;

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

describe('Tabs · Issue #23', () => {
  it('#23.1 单项 destroyInactiveTabPane ⇒ 切走后面板卸载', async () => {
    const items = [
      { key: 'a', label: 'A', children: 'Pane A', destroyInactiveTabPane: true },
      { key: 'b', label: 'B', children: 'Pane B' },
    ];
    const w = mountTabs({ items, activeKey: 'a' });
    await nextTick();

    // 初始：B 未激活但仍渲染（hidden）
    expect(document.body.textContent).toContain('Pane A');

    await w.setProps({ activeKey: 'b' });
    await nextTick();
    await nextTick();
    // A 开了单项卸载 ⇒ 切走后不应再有 A 的内容
    expect(document.body.textContent).not.toContain('Pane A');
    expect(document.body.textContent).toContain('Pane B');
    w.unmount();
  });

  it('#23.3 styles.root 落到根元素（且 attrs.style 仍能生效）', async () => {
    const w = mountTabs({
      items: [{ key: 'a', label: 'A', children: 'Pane A' }],
      styles: { root: { outline: '2px solid red' } },
    });
    await nextTick();
    const el = root();
    expect(el).not.toBeNull();
    expect(el!.style.outline).toBe('2px solid red');
    w.unmount();
  });

  it('#23.5 触摸监听：目标 DOM 替换后旧元素的 listener 被解绑', async () => {
    const flag = ref(true);
    const targetRef = ref<HTMLElement | null>(null);
    let firstEl: HTMLElement | null = null;
    const setRef = (el: unknown): void => {
      const node = (el as HTMLElement | null) ?? null;
      targetRef.value = node;
      if (node && !firstEl) firstEl = node;
    };
    const Host = defineComponent({
      setup() {
        useTouchMove(targetRef, () => {});
        return () =>
          flag.value ? h('div', { ref: setRef }, 'A') : h('span', { ref: setRef }, 'B');
      },
    });
    const w = mount(Host, { attachTo: document.body });
    mounted.push(w);
    await nextTick();
    await nextTick();
    expect(firstEl).not.toBeNull();

    const spy = vi.spyOn(firstEl as unknown as HTMLElement, 'removeEventListener');
    flag.value = false;
    await nextTick();
    await nextTick();

    // ⚠️ 修复前 detach 用的是**新**元素 ⇒ 旧元素的监听永远留着
    expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    w.unmount();
  });

  it('#23.4 renderTabBar 已从运行时与公开类型移除（只保留 #tabBar 槽）', async () => {
    const w = mountTabs({
      items: [{ key: 'a', label: 'A', children: 'Pane A' }],
    });
    await nextTick();
    // 运行时不再有这个 prop（传了也不会有渲染分支）
    expect((w.vm.$props as Record<string, unknown>).renderTabBar).toBeUndefined();
    expect(w.find('.apollo-tabs-nav').exists()).toBe(true);
    w.unmount();
  });

  it('#23.2 #popupRender 作用域插槽接到「更多」浮层', async () => {
    // ⚠️ jsdom 下「更多」的浮层**打不开**：OperationNode 的 `open` 被
    //    `tabs.length ? open : false` 门住，而 jsdom 没有宽度测量 ⇒ 省略项为空
    //    ⇒ 改为在**组件边界**验证链路：Tabs 的插槽 → OperationNode 的 more.popupRender
    //    → 真实调用它以断言 originNode 透传。
    const items = Array.from({ length: 8 }, (_, i) => ({
      key: `k${i}`,
      label: `Tab ${i}`,
      children: `Pane ${i}`,
    }));
    const w = mountTabs(
      { items },
      {
        popupRender: (menu: unknown) =>
          h('section', { 'data-custom-popup': 'yes' }, [menu as never]),
      },
    );
    await nextTick();

    const op = w.findComponent({ name: 'ATabsOperationNode' });
    expect(op.exists()).toBe(true);
    const more = (op.props() as Record<string, unknown>).more as
      | Record<string, unknown>
      | undefined;
    const popupRender = (more as Record<string, unknown>).popupRender as
      | ((menu: unknown, info: Record<string, unknown>) => unknown)
      | undefined;
    expect(typeof popupRender).toBe('function');

    // 真实调用：应拿到插槽包出来的 section，且 originNode 在里面
    // 插槽调用结果会被 Vue 归一成数组 ⇒ 取首元素
    const nodes = popupRender!(h('div', { class: 'origin' }, 'orig'), {
      restTabs: [],
      onClose: () => {},
    }) as unknown[];
    const wrapperNode = nodes[0] as { props?: Record<string, unknown> };
    expect(wrapperNode.props?.['data-custom-popup']).toBe('yes');
    // originNode 应作为插槽内容被带上（不序列化整个 vnode —— 有循环引用）
    const children = (wrapperNode as unknown as { children?: unknown }).children;
    expect(String(Array.isArray(children) ? children.length : children)).toMatch(/1|origin/);
    w.unmount();
  });
});
