/**
 * L5 · 无障碍 —— role=tooltip 容器 + aria-describedby 关联（WCAG 1.3.1/4.1.2）；
 * axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Popover from '../Popover';

a11yDemoTest('Popover', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
  global: { stubs: { teleport: false } },
});

describe('Popover · 语义断言', () => {
  it('开启时容器 role=tooltip 且 id 与触发元素的 aria-describedby 对应', async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, id: 'pop-a11y', title: 't', content: 'c' },
      slots: { default: () => h('button', { class: 'tgt' }, 't') },
    });
    await nextTick();
    const container = document.querySelector('.apollo-popover-container');
    expect(container).not.toBeNull();
    expect(container!.getAttribute('role')).toBe('tooltip');
    expect(container!.id).toBe('pop-a11y');
    const described = document.querySelector('.tgt')?.getAttribute('aria-describedby');
    expect(described).toBe('pop-a11y');
    void wrapper;
  });
});
