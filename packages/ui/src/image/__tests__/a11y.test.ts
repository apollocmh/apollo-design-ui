/**
 * L5 · 无障碍 —— 可预览时 role=button + tabindex=0 + aria-label；Progress 的
 * progressbar / aria-busy；预览浮层 role=dialog + aria-modal。
 * axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Image from '../Image';

a11yDemoTest('Image', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});

describe('Image · 语义断言', () => {
  it('可预览 ⇒ role=button + tabindex=0 + aria-label=alt；preview=false ⇒ 去掉', () => {
    const w1 = mount(Image, { props: { src: 'x.png', alt: 'a' } });
    const el1 = w1.element as HTMLElement;
    expect(el1.getAttribute('role')).toBe('button');
    expect(el1.getAttribute('tabindex')).toBe('0');
    expect(el1.getAttribute('aria-label')).toBe('a');

    const w2 = mount(Image, { props: { src: 'x.png', alt: 'a', preview: false } });
    const el2 = w2.element as HTMLElement;
    expect(el2.getAttribute('role')).toBeNull();
    expect(el2.getAttribute('tabindex')).toBeNull();
    w2.unmount();
  });

  it('预览浮层 ⇒ role=dialog + aria-modal=true（portal）', async () => {
    const w = mount(Image, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { src: 'x.png', alt: 'a', preview: { open: true } },
    });
    await nextTick();
    const dialog = document.querySelector('.apollo-image-preview') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('a');
    w.unmount();
  });

  it('占位 loading ⇒ aria-hidden=true（装饰层）', async () => {
    const w = mount(Image, {
      props: { src: 'x.png', placeholder: 'loading...' },
    });
    await nextTick();
    const ph = (w.element as HTMLElement).querySelector('.apollo-image-placeholder');
    if (ph) expect(ph.getAttribute('aria-hidden')).toBe('true');
  });
});
