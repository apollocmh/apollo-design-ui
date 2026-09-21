/**
 * L5 · 无障碍测试 —— Grid 是纯布局容器，不输出 ARIA（上游语义）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Col, Row } from '../index';

a11yDemoTest('Grid', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});

describe('Grid · 无 ARIA 契约', () => {
  it('Row/Col 根元素不输出 role / aria-*', () => {
    const row = mount(Row, { slots: { default: () => 'x' } });
    const col = mount(Col);
    for (const w of [row, col]) {
      const attrs = Object.keys(w.attributes());
      expect(attrs.some((a) => a === 'role' || a.startsWith('aria-'))).toBe(false);
    }
  });

  it('Row/Col 自身不可聚焦（键盘路径架构上不适用；demo 内的可聚焦元素是内容）', () => {
    const row = mount(Row, { slots: { default: () => 'x' } });
    expect(row.element.matches('[tabindex]')).toBe(false);
  });
});
