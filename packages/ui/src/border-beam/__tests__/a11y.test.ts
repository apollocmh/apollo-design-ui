/**
 * L5 · 无障碍 —— BorderBeam 的 Effect 恒带 aria-hidden="true"（纯装饰）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { BorderBeam } from '../index';

a11yDemoTest('BorderBeam', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});

describe('BorderBeam · 无障碍', () => {
  it('Effect 恒为 aria-hidden（装饰性）', async () => {
    const w = mount(
      { setup: () => () => h('div', [h(BorderBeam, {}, { default: () => h('div', 'x') })]) },
      { attachTo: document.body },
    );
    await nextTick();
    await nextTick();
    const effect = w.element.querySelector('.apollo-border-beam');
    expect(effect?.getAttribute('aria-hidden')).toBe('true');
  });
});
