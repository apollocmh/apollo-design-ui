/**
 * L5 · 无障碍测试
 *
 * ── 为什么这一层内容很少（但**不是**没做）────────────────────────────────────
 *
 * `ConfigProvider` 本体**不产 DOM**、没有可聚焦元素、没有任何 `aria-*` ——
 * 它没有自己的无障碍面。antd 的 `config-provider/__tests__/a11y.test.ts` 也只做
 * 通用检查（6 行）。
 *
 * 所以这一层的落点是两条「它不能**破坏**无障碍」的断言：
 *   1. axe 自动扫描全部 demo（0 violation）
 *   2. 它包装下游时**不引入**任何假的语义：不加 `role`、不加 `aria-*`、
 *      不打断下游原有的可访问名
 *
 * ⚠️ 这个测试**没有**证明键盘可达性 —— 本体没有可聚焦元素，也就没有键盘路径。
 *    这是「架构上不适用」，不是「没测」。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { Empty } from '../../empty';
import { ConfigProvider } from '../index';

a11yDemoTest('ConfigProvider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('ConfigProvider · 不破坏下游的无障碍面', () => {
  it('包装后下游的可访问名不变（Empty 插画的 <title> 还在）', () => {
    const w = mount(ConfigProvider, {
      props: { prefixCls: 'apollo' },
      slots: { default: () => h(Empty) },
    });
    expect(w.find('svg title').text()).toBe('No data');
  });

  it('包装后下游仍然能拿到本地化文案（locale 是可访问名的一部分）', () => {
    const w = mount(ConfigProvider, {
      props: { prefixCls: 'apollo' },
      slots: { default: () => h(Empty) },
    });
    expect(w.find('.apollo-empty-description').text()).toBe('No data');
  });

  it('theme 作用域元素不带任何 role / aria-*（它是纯布局容器）', () => {
    const w = mount(ConfigProvider, {
      props: { theme: { token: {} } },
      slots: { default: () => h(Empty) },
    });
    expect(w.attributes('role')).toBeUndefined();
    expect(w.attributes('aria-label')).toBeUndefined();
    expect(w.attributes('aria-hidden')).toBeUndefined();
  });

  it('下游元素上的 aria-* 不被 ConfigProvider 吃掉（attrs 透传仍然有效）', () => {
    const w = mount(ConfigProvider, {
      slots: { default: () => h('button', { 'aria-label': '提交', type: 'button' }, 'ok') },
    });
    const button = w.get('button');
    expect(button.attributes('aria-label')).toBe('提交');
  });
});
