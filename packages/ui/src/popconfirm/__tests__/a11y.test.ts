/**
 * L5 · 无障碍 —— Popconfirm
 *
 * 可达性来源：`Popover`（底层 Tooltip）的 `role="tooltip"` 容器 +
 * `aria-describedby` 关联；按钮是原生 `<button>`（文本即可访问名）。
 * axe 扫全部 10 个 demo + 关键 ARIA 断言。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Popconfirm from '../Popconfirm';

a11yDemoTest('Popconfirm', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
});

describe('Popconfirm · ARIA 契约', () => {
  it('浮层容器是 role=tooltip（继承自 Popover / Tooltip）', async () => {
    mount(Popconfirm, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, title: 'Title' },
      slots: { default: () => h('button', { class: 'target' }, 'target') },
    });
    await new Promise((r) => setTimeout(r, 0));
    const container = document.querySelector<HTMLElement>('.apollo-popover-container');
    expect(container?.getAttribute('role')).toBe('tooltip');
    document.body.innerHTML = '';
  });

  it('确认 / 取消是原生 button（可聚焦、文本可访问名）', async () => {
    mount(Popconfirm, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, title: 'Title', okText: 'Yes', cancelText: 'No' },
      slots: { default: () => h('button', { class: 'target' }, 'target') },
    });
    await new Promise((r) => setTimeout(r, 0));
    const btns = Array.from(
      document.querySelectorAll<HTMLElement>('.apollo-popconfirm-buttons button'),
    );
    expect(btns).toHaveLength(2);
    for (const btn of btns) {
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.textContent?.trim().length).toBeGreaterThan(0);
    }
    document.body.innerHTML = '';
  });
});
