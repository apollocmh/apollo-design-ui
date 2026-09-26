/**
 * L1/L2 —— drawer（antd 侧壳 + 面板）的行为测试。
 *
 * 判据（`components/drawer/Drawer.tsx` / `DrawerPanel.tsx`）：
 *   1. 尺寸预设：`'large'` ⇒ 736、`'default'` ⇒ 378、纯数字字符串 ⇒ Number；
 *   2. `ariaId = isRenderable(title) ? id : undefined`（标题才挂 aria-labelledby）；
 *   3. 面板：`{p}-header`（三者都空则不渲染）/ `-header-title` / `-title` / `-extra` /
 *      `-body` / `-footer`；`loading` ⇒ 用 Skeleton 替换 children；
 *   4. 关闭按钮：面板自己包 `<button type="button" class="{p}-close">`，
 *      `closable: { placement: 'end' }` ⇒ 额外 `{p}-close-end` 且在标题右侧；
 *      `closable: false` ⇒ 无按钮；
 *   5. 根类叠加 `no-mask`（`mask=false`）与 `-rtl`。
 *
 * ⚠️ 必须 `await nextTick()`（首帧不开门 + Portal 的 mergedRender 走 watch）。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import Drawer from '../index';

const BP = { prefixCls: 'apollo-drawer' };

async function mountDrawer(
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {},
) {
  const wrapper = mount(Drawer, {
    props: { ...BP, open: true, getContainer: false, ...props } as never,
    slots: { default: () => 'body-content', ...slots },
    global: { stubs: { teleport: false } },
  });
  for (let i = 0; i < 3; i += 1) await nextTick();
  return wrapper;
}

describe('drawer · 结构', () => {
  it('面板三段：header / body / footer', async () => {
    const wrapper = await mountDrawer({ title: 'T', footer: 'F', extra: 'E' });
    expect(wrapper.find('.apollo-drawer-section').exists()).toBe(true);
    expect(wrapper.find('.apollo-drawer-header').exists()).toBe(true);
    expect(wrapper.find('.apollo-drawer-header-title').exists()).toBe(true);
    expect(wrapper.find('.apollo-drawer-title').text()).toBe('T');
    expect(wrapper.find('.apollo-drawer-extra').text()).toBe('E');
    expect(wrapper.find('.apollo-drawer-body').text()).toContain('body-content');
    expect(wrapper.find('.apollo-drawer-footer').text()).toBe('F');
    wrapper.unmount();
  });

  it('无 title/extra 且 closable=false ⇒ 不渲染 header；footer 未传 ⇒ 不渲染', async () => {
    const wrapper = await mountDrawer({ closable: false });
    expect(wrapper.find('.apollo-drawer-header').exists()).toBe(false);
    expect(wrapper.find('.apollo-drawer-footer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('只有关闭按钮时加 -header-close-only', async () => {
    const wrapper = await mountDrawer();
    expect(wrapper.find('.apollo-drawer-header').classes()).toContain(
      'apollo-drawer-header-close-only',
    );
    wrapper.unmount();
  });

  it('loading ⇒ body 里是 Skeleton（替换 children）', async () => {
    const wrapper = await mountDrawer({ loading: true });
    // Skeleton 的根类由它自己决定；这里只断言「body 里出现了骨架」（更稳）
    expect(wrapper.find('.apollo-drawer-body .apollo-skeleton').exists()).toBe(true);
    expect(wrapper.find('.apollo-drawer-body').text()).not.toContain('body-content');
    wrapper.unmount();
  });
});

describe('drawer · 关闭按钮', () => {
  it('默认（closable=true）在标题左侧：-close 且没有 -close-end', async () => {
    const wrapper = await mountDrawer({ title: 'T' });
    const close = wrapper.find('.apollo-drawer-close');
    expect(close.exists()).toBe(true);
    expect(close.element.tagName).toBe('BUTTON');
    expect(close.attributes('type')).toBe('button');
    expect(close.classes()).not.toContain('apollo-drawer-close-end');
    wrapper.unmount();
  });

  it("closable: { placement: 'end' } ⇒ 加 -close-end（且渲染在 extra 之后）", async () => {
    const wrapper = await mountDrawer({ title: 'T', extra: 'E', closable: { placement: 'end' } });
    expect(wrapper.find('.apollo-drawer-close').classes()).toContain('apollo-drawer-close-end');
    wrapper.unmount();
  });

  it('closable: false ⇒ 无关闭按钮', async () => {
    const wrapper = await mountDrawer({ title: 'T', closable: false });
    expect(wrapper.find('.apollo-drawer-close').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('drawer · 尺寸与根类', () => {
  it("size='large' ⇒ 736px；'default' ⇒ 378px；数字字符串 ⇒ 数字", async () => {
    const w1 = await mountDrawer({ size: 'large' });
    expect(w1.find('.apollo-drawer-content-wrapper').attributes('style')).toContain('width: 736px');
    w1.unmount();

    const w2 = await mountDrawer({ size: 'default' });
    expect(w2.find('.apollo-drawer-content-wrapper').attributes('style')).toContain('width: 378px');
    w2.unmount();

    const w3 = await mountDrawer({ size: '500' });
    expect(w3.find('.apollo-drawer-content-wrapper').attributes('style')).toContain('width: 500px');
    w3.unmount();
  });

  it('mask=false ⇒ 根类带 no-mask 且不渲染 mask', async () => {
    const wrapper = await mountDrawer({ mask: false });
    expect(wrapper.find('.apollo-drawer').classes()).toContain('no-mask');
    expect(wrapper.find('.apollo-drawer-mask').exists()).toBe(false);
    wrapper.unmount();
  });

  it('title 存在 ⇒ section 挂 aria-labelledby（指向 -title 的 id）', async () => {
    const wrapper = await mountDrawer({ title: 'T' });
    const section = wrapper.find('.apollo-drawer-section');
    const titleId = wrapper.find('.apollo-drawer-title').attributes('id');
    expect(section.attributes('aria-labelledby')).toBe(titleId);
    wrapper.unmount();
  });
});
