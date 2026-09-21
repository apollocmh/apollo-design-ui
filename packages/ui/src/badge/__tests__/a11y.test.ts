/**
 * L5 · 无障碍测试 —— Badge
 *
 * antd 的 Badge **不输出任何 ARIA 属性**（count 是视觉信息，屏幕阅读器走
 * 页面内容本身）。落点：
 *   1. axe 自动扫描全部 12 个 demo（0 violation）
 *   2. 断言根元素没有 role / aria-* 输出
 *   3. Badge 自身不可聚焦；demo 内的 a / button 是内容（不在断言面里）
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Badge, Ribbon } from '../index';

a11yDemoTest('Badge', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});

describe('Badge · 无 ARIA 契约', () => {
  it('根元素不输出 role / aria-*（wrapper 与 not-a-wrapper 两分支）', () => {
    const wrapper = mount(Badge, { props: { count: 5 }, slots: { default: () => 'x' } });
    const standalone = mount(Badge, { props: { status: 'success' } });
    const ribbon = mount(Ribbon, { props: { text: 't' }, slots: { default: () => 'x' } });
    for (const w of [wrapper, standalone, ribbon]) {
      const attrs = Object.keys(w.attributes());
      expect(attrs.some((a) => a === 'role' || a.startsWith('aria-'))).toBe(false);
    }
  });
});
