/**
 * L5 · 无障碍 —— notice 的 `role`（alert / status）、关闭按钮的可访问名
 * （locale 的 `global.close`）、图标 `aria-hidden`；axe 扫全部 demo（0 violation）。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PurePanel from '../PurePanel';

a11yDemoTest('Notification', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});

describe('Notification · 语义断言', () => {
  it('notice 根默认 role=alert，可切 status', () => {
    const w1 = mount(PurePanel, { props: { title: 'x' } });
    expect(w1.find('.apollo-notification-notice').attributes('role')).toBe('alert');
    w1.unmount();

    const w2 = mount(PurePanel, { props: { title: 'x', role: 'status' } });
    expect(w2.find('.apollo-notification-notice').attributes('role')).toBe('status');
    w2.unmount();
  });

  it('关闭按钮有可访问名（aria-label = locale 的 close）', () => {
    const wrapper = mount(PurePanel, { props: { title: 'x' } });
    const close = wrapper.find('.apollo-notification-notice-close');
    expect(close.exists()).toBe(true);
    expect(close.attributes('aria-label')).toBe('Close');
    wrapper.unmount();
  });

  it('closable=false ⇒ 无关闭按钮（不留无名按钮）', () => {
    const wrapper = mount(PurePanel, { props: { title: 'x', closable: false } });
    expect(wrapper.find('.apollo-notification-notice-close').exists()).toBe(false);
    wrapper.unmount();
  });

  it('类型图标带 aria-hidden（装饰性）', () => {
    const wrapper = mount(PurePanel, { props: { title: 'x', type: 'warning' } });
    const svg = wrapper.find('.apollo-notification-notice-icon svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
    wrapper.unmount();
  });
});
