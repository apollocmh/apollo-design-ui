/**
 * L5 · 无障碍 —— Segmented
 *
 * 可达性来源（rc 内核）：
 *   - 根：role="radiogroup" + aria-label="segmented control" + aria-orientation
 *   - 每项：原生 `<label>` 包 `<input type="radio">`（label 包裹 ⇒ 文本即可访问名）
 *   - 禁用项：input disabled（原生不可达语义）
 * axe 扫全部 14 个 demo + 键盘导航断言。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Segmented } from '../index';

a11yDemoTest('Segmented', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});

describe('Segmented · ARIA 契约', () => {
  it('根元素：radiogroup + 硬编码 aria-label + orientation', () => {
    const w = mount(Segmented, { props: { options: ['A', 'B'] } });
    const root = w.find('.apollo-segmented');
    expect(root.attributes('role')).toBe('radiogroup');
    expect(root.attributes('aria-label')).toBe('segmented control');
    expect(root.attributes('aria-orientation')).toBe('horizontal');
    expect(root.attributes('tabindex')).toBe('0');
  });

  it('vertical 时 aria-orientation=vertical', () => {
    const w = mount(Segmented, { props: { options: ['A', 'B'], vertical: true } });
    expect(w.find('.apollo-segmented').attributes('aria-orientation')).toBe('vertical');
  });

  it('整组禁用：根元素不接收焦点（tabindex 移除）', () => {
    const w = mount(Segmented, { props: { options: ['A', 'B'], disabled: true } });
    expect(w.find('.apollo-segmented').attributes('tabindex')).toBeUndefined();
  });

  it('label 包 input：文本即可访问名', () => {
    const w = mount(Segmented, {
      props: { options: [{ label: 'Monday', value: 'mon' }] },
    });
    const label = w.find('label');
    expect(label.find('input').exists()).toBe(true);
    expect(label.text()).toContain('Monday');
  });
});
