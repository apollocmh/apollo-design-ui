/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/masonry/demo/` 的**用户可见** demo 一一对应
 * （basic / responsive / dynamic / fresh / image / style-class），共 **6** 个。
 * antd 的 demo 依赖 `Card` / `Flex` / `Divider` / `Typography` / `antd-style`，
 * 其中未落地的用**原生元素等价替换**（缺口登记在 `README.md` §5）；
 * 「不产生告警」对替换后的 demo 依然是硬约束。
 */

import { demoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import StyleClassDemo from '../demo/style-class.vue';

demoTest('Masonry', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});

it('keeps both semantic style Demo roots and items at valid CSS lengths', async () => {
  const wrapper = mount(StyleClassDemo);
  try {
    const roots = wrapper.findAll<HTMLElement>('.masonry-demo-root');
    expect(roots.map((root) => root.element.style.height)).toEqual(['260px', '280px']);
    expect(roots.map((root) => root.element.style.padding)).toEqual(['20px', '20px']);
    expect(roots[0]?.element.style.borderRadius).toBe('12px');
    await vi.waitFor(() => expect(wrapper.findAll('.masonry-demo-item')).toHaveLength(16));
    const items = wrapper.findAll<HTMLElement>('.masonry-demo-item');
    expect(items).toHaveLength(16);
    for (const item of items) expect(item.element.style.borderRadius).toBe('12px');
  } finally {
    wrapper.unmount();
  }
});
