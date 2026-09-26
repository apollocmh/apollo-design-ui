/**
 * drawer 内核的行为测试（rc-drawer 的 Vue 自建）。
 *
 * 判据全部来自 `@rc-component/drawer@1.4.2` 的 `Drawer.js` / `DrawerPopup.js`：
 *   1. 根类 = `{p} {p}-{placement}` + 打开时 `{p}-open`；
 *   2. mask：`{p}-mask`，`mask=false` 时**不渲染**；
 *   3. 面板：`{p}-content-wrapper` > `{p}-section`（`role=dialog` + `aria-modal=true`）；
 *   4. 尺寸轴：`left/right` 写 `width`，`top/bottom` 写 `height`（默认 378）；
 *   5. push：`push` 为真时按方位 translate（right 负 X / top 正 Y）；
 *   6. 默认 `destroyOnHidden=false` ⇒ 关闭后仍保留；`true` ⇒ 整个卸载。
 *
 * ⚠️ **必须 `await nextTick()`**：`mergedOpen = mounted ? open : false`（首帧不开门）+
 *    Portal 的 `mergedRender` 走的是 watch ⇒ 挂载后还要一个 tick 才真的渲染出来。
 *    这是本轮踩过的坑：同步断言会看到空 DOM，误判成「Portal 坏了」。
 * ⚠️ 用 `getContainer: false`（内联模式）⇒ 内容就在 wrapper 里，`wrapper.find` 可用。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import Drawer from '../engine/Drawer';

const BP = { prefixCls: 'apollo-drawer' };

async function mountDrawer(props: Record<string, unknown> = {}) {
  const wrapper = mount(Drawer, {
    // `getContainer: false`（内联）与 rc 的 prop 类型不同（rc 侧是 React 的联合类型）
    // ⇒ 按仓库惯例整体断言一次，而不是去放宽组件的 prop 类型
    props: { ...BP, open: true, getContainer: false, ...props } as never,
    slots: { default: () => 'content' },
    global: { stubs: { teleport: false } },
  });
  // 见文件头的 ⚠️：首帧不开门 + Portal 的 mergedRender 是 watch
  for (let i = 0; i < 3; i += 1) await nextTick();
  return wrapper;
}

describe('drawer 内核 · 结构', () => {
  it('根类与打开态', async () => {
    const wrapper = await mountDrawer();
    const root = wrapper.find('.apollo-drawer');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('apollo-drawer-right');
    expect(root.classes()).toContain('apollo-drawer-open');
    expect(root.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('mask 渲染 + mask=false 不渲染', async () => {
    const w1 = await mountDrawer();
    expect(w1.find('.apollo-drawer-mask').exists()).toBe(true);
    w1.unmount();

    const w2 = await mountDrawer({ mask: false });
    expect(w2.find('.apollo-drawer-mask').exists()).toBe(false);
    w2.unmount();
  });

  it('面板：content-wrapper > section（role=dialog + aria-modal）', async () => {
    const wrapper = await mountDrawer();
    const section = wrapper.find('.apollo-drawer-section');
    expect(wrapper.find('.apollo-drawer-content-wrapper').exists()).toBe(true);
    expect(section.exists()).toBe(true);
    expect(section.attributes('role')).toBe('dialog');
    expect(section.attributes('aria-modal')).toBe('true');
    expect(wrapper.text()).toContain('content');
    wrapper.unmount();
  });

  it('尺寸轴：right 用 width（默认 378），top 用 height', async () => {
    const w1 = await mountDrawer({ placement: 'right' });
    expect(w1.find('.apollo-drawer-content-wrapper').attributes('style')).toContain('width: 378px');
    w1.unmount();

    // ⚠️ 垂直方位**没有**内置 378 兜底（rc 的 `?? (isHorizontal ? 378 : undefined)`）——
    //    默认值由调用方通过 `defaultSize` 给（antd 的 Drawer 就是这么传的）
    const w2 = await mountDrawer({ placement: 'top', defaultSize: 378 });
    expect(w2.find('.apollo-drawer-content-wrapper').attributes('style')).toContain(
      'height: 378px',
    );
    w2.unmount();
  });

  it('显式 size 覆盖默认值', async () => {
    const wrapper = await mountDrawer({ size: 500 });
    expect(wrapper.find('.apollo-drawer-content-wrapper').attributes('style')).toContain(
      'width: 500px',
    );
    wrapper.unmount();
  });
});

describe('drawer 内核 · push（父推挤链）', () => {
  // ⚠️ 真实契约（rc `DrawerPopup.js`）：`pushed` 只由**子 drawer** 调 `context.push()`
  //    置真 —— **顶层 drawer 自己不会位移**。`push` prop 只决定 `pushDistance`
  //    （`push.distance ?? 父级 ?? 180`）。
  it('顶层 push=true ⇒ 不产生 transform', async () => {
    const wrapper = await mountDrawer({ push: true });
    expect(wrapper.find('.apollo-drawer-content-wrapper').attributes('style') ?? '').not.toContain(
      'transform',
    );
    wrapper.unmount();
  });

  it('push=false ⇒ 同样不产生 transform', async () => {
    const wrapper = await mountDrawer({ push: false });
    expect(wrapper.find('.apollo-drawer-content-wrapper').attributes('style') ?? '').not.toContain(
      'transform',
    );
    wrapper.unmount();
  });
});

describe('drawer 内核 · 开合与 resizable', () => {
  it('关闭后（destroyOnHidden=false）面板仍在，但根类去掉 -open', async () => {
    const wrapper = await mountDrawer();
    await wrapper.setProps({ open: false });
    await nextTick();
    const root = wrapper.find('.apollo-drawer');
    expect(root.exists()).toBe(true);
    expect(root.classes()).not.toContain('apollo-drawer-open');
    wrapper.unmount();
  });

  it('destroyOnHidden=true 且关闭 ⇒ 整个卸载', async () => {
    const wrapper = await mountDrawer({ destroyOnHidden: true });
    await wrapper.setProps({ open: false });
    await nextTick();
    expect(wrapper.find('.apollo-drawer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('resizable ⇒ 渲染拖拽手柄（-resizable-dragger-right）', async () => {
    const wrapper = await mountDrawer({ resizable: true });
    expect(wrapper.find('.apollo-drawer-resizable-dragger-right').exists()).toBe(true);
    wrapper.unmount();
  });
});
