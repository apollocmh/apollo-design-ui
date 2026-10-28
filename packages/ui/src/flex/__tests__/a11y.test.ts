/** Default layout roots add no role or focus stop. All six demos retain axe coverage; caller-owned native buttons/inputs and dynamic hosts also receive actual browser keyboard/focus coverage. */

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
