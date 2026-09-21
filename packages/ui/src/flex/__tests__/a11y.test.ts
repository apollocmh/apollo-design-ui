/**
 * L5 · 无障碍测试
 *
 * ── Flex 的无障碍面刻意是「无」───────────────────────────────────────────────
 *
 * antd 的 Flex **不输出任何 ARIA 属性**：它是纯布局容器，不承载语义
 * （布局信息对屏幕阅读器本就无意义 —— 这不是缺陷，是正确的「什么都不做」）。
 * 因此这一层的落点是：
 *   1. axe 自动扫描（对全部 6 个 demo，0 violation）
 *   2. 断言根元素**没有** role / aria-* 输出（防止将来有人「顺手」加语义）
 *   3. 没有可聚焦元素 —— 键盘路径在架构上不适用（写进 layerNotes，不是「没测」）
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Flex } from '../index';

a11yDemoTest('Flex', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});

describe('Flex · 无 ARIA 契约', () => {
  it('根元素不输出 role / aria-*', () => {
    const w = mount(Flex, { slots: { default: () => 'x' } });
    const attrs = Object.keys(w.attributes());
    expect(attrs.some((a) => a === 'role' || a.startsWith('aria-'))).toBe(false);
  });

  it('没有可聚焦元素（键盘路径架构上不适用）', () => {
    const w = mount(Flex, { slots: { default: () => 'x' } });
    expect(w.element.matches('button, a, input, select, textarea, [tabindex]')).toBe(false);
  });
});
