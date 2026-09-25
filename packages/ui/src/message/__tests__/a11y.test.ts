/**
 * L5 · 无障碍 —— notice 的 `role="alert"`、无关闭按钮（message 形态）、
 * 图标 `aria-hidden`；axe 扫全部 demo（0 violation）。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PurePanel from '../PurePanel';

a11yDemoTest('Message', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
  global: { stubs: { teleport: false } },
});

describe('Message · 语义断言', () => {
  it('notice 根是 role=alert（rc 的默认角色）', () => {
    const wrapper = mount(PurePanel, { props: { type: 'success', content: 'x' } });
    expect(wrapper.find('.apollo-message-notice').attributes('role')).toBe('alert');
    wrapper.unmount();
  });

  it('message 形态**没有**关闭按钮（closable=false）', () => {
    const wrapper = mount(PurePanel, { props: { type: 'info', content: 'x' } });
    expect(wrapper.find('.apollo-message-notice-close').exists()).toBe(false);
    wrapper.unmount();
  });

  it('无类型无图标时不渲染 -notice-wrapper（纯文本形态）', () => {
    const wrapper = mount(PurePanel, { props: { content: 'plain' } });
    expect(wrapper.find('.apollo-message-notice-wrapper').exists()).toBe(false);
    expect(wrapper.text()).toContain('plain');
    wrapper.unmount();
  });

  it('类型图标带 aria-hidden（装饰性，不参与可访问名）', () => {
    const wrapper = mount(PurePanel, { props: { type: 'error', content: 'boom' } });
    const svg = wrapper.find('.apollo-message-notice-icon svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
    wrapper.unmount();
  });
});
