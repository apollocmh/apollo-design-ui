/**
 * L5 · 无障碍 —— `role=dialog` + `aria-modal` + `aria-labelledby`、
 * 关闭按钮的可访问名；axe 扫全部 demo（0 violation）。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Drawer from '../index';

a11yDemoTest('Drawer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 18,
  global: { stubs: { teleport: false } },
});

async function mountDrawer(props: Record<string, unknown> = {}) {
  const wrapper = mount(Drawer, {
    props: { prefixCls: 'apollo-drawer', open: true, getContainer: false, ...props } as never,
    slots: { default: () => 'content' },
    global: { stubs: { teleport: false } },
  });
  for (let i = 0; i < 3; i += 1) await nextTick();
  return wrapper;
}

describe('Drawer · 语义断言', () => {
  it('section 是 role=dialog + aria-modal=true', async () => {
    const wrapper = await mountDrawer({ title: 'T' });
    const section = wrapper.find('.apollo-drawer-section');
    expect(section.attributes('role')).toBe('dialog');
    expect(section.attributes('aria-modal')).toBe('true');
    wrapper.unmount();
  });

  it('有 title ⇒ aria-labelledby 指向 -title 的 id；无 title ⇒ 不挂', async () => {
    const w1 = await mountDrawer({ title: 'T' });
    expect(w1.find('.apollo-drawer-section').attributes('aria-labelledby')).toBe(
      w1.find('.apollo-drawer-title').attributes('id'),
    );
    w1.unmount();

    const w2 = await mountDrawer();
    expect(w2.find('.apollo-drawer-section').attributes('aria-labelledby')).toBeUndefined();
    w2.unmount();
  });

  it('关闭按钮是可聚焦的 button 且有可访问名（aria-label）', async () => {
    const wrapper = await mountDrawer({ title: 'T' });
    const close = wrapper.find('.apollo-drawer-close');
    expect(close.element.tagName).toBe('BUTTON');
    expect(close.attributes('aria-label')).toBe('Close');
    wrapper.unmount();
  });

  it('closable=false ⇒ 无关闭按钮', async () => {
    const wrapper = await mountDrawer({ title: 'T', closable: false });
    expect(wrapper.find('.apollo-drawer-close').exists()).toBe(false);
    wrapper.unmount();
  });
});
