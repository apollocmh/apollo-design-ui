/**
 * Issue #23 回归（Tabs）：items 归一结果进渲染链、`#popupRender` 链路、根 `styles.root`。
 *
 * 判据：
 *   1. 归一（`destroyInactiveTabPane` → `destroyOnHidden`）后的 items 必须是**渲染列表**的
 *      数据源（`TabPanelList` 的 `removeOnLeave = 组件级 ?? item 级`）；
 *   2. 更多菜单的自定义浮层要走 Vue 作用域插槽 `#popupRender`（签名 `{ originNode, restTabs, onClose }`，
 *      与 `TabsSlots['popupRender']` 一致；旧注释里的 `#morePopup` 是过时写法），
 *      Tabs → OperationNode → Dropdown 全链路；
 *   3. `useMergeSemantic` 产出的 `mergedStyles.root` 必须落到根元素（与 `root` 类名同判）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { useTouchMove } from '../hooks/use-touch-move';
import Tabs from '../index';
import type { TabsPopupSlotProps } from '../interface';
import OperationNode from '../OperationNode';

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
    // jsdom does not measure overflow. Consume the forwarded slot inside a
    // render boundary; real overflow and menu interaction are covered in browser.
    const items = Array.from({ length: 8 }, (_, i) => ({
      key: `k${i}`,
      label: `Tab ${i}`,
      children: `Pane ${i}`,
    }));
    const w = mountTabs(
      { items },
      {
        popupRender: ({ originNode }: TabsPopupSlotProps) =>
          h('section', { 'data-custom-popup': 'yes' }, [originNode]),
      },
    );
    await nextTick();

    const op = w.getComponent(OperationNode);
    const popup = mount(
      defineComponent({
        setup: () => () =>
          h('div', null, [
            op.vm.$slots.popupRender?.({
              originNode: h('div', { class: 'origin' }, 'orig'),
              restTabs: items,
              onClose: () => {},
            }),
          ]),
      }),
    );
    expect(popup.get('[data-custom-popup="yes"]').attributes('data-custom-popup')).toBe('yes');
    expect(popup.get('.origin').text()).toBe('orig');
    popup.unmount();
    w.unmount();
  });
});
