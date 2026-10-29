/** Separator semantics and all nine real Demo axe scans. A vertical separator declares its actual axis; native slotted controls retain their own keyboard/focus behavior. */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Divider } from '../index';

const P = 'apollo-divider';

a11yDemoTest('Divider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Divider · 分隔线语义', () => {
  it('垂直轴显式声明并在切回水平时移除', async () => {
    const wrapper = mount(Divider, { props: { orientation: 'vertical' } });
    expect(wrapper.attributes('aria-orientation')).toBe('vertical');
    await wrapper.setProps({ orientation: 'horizontal' });
    expect(wrapper.attributes('aria-orientation')).toBeUndefined();
  });
  it('默认（无 children）：根元素带 role="separator"', () => {
    expect(mount(Divider).attributes('role')).toBe('separator');
  });

  it('DIV-08 标题内容留在 group，空 rail 独立承担 separator', () => {
    const w = mount(Divider, { slots: { default: () => 'Text' } });
    expect(w.attributes('role')).toBe('group');
    expect(w.find(`.${P}-rail-start`).attributes('role')).toBe('separator');
    expect(w.find(`.${P}-rail-end`).attributes('aria-hidden')).toBe('true');
    expect(w.find(`.${P}-inner-text`).attributes('role')).toBeUndefined();
  });

  it('各种形态下 role 都不丢', () => {
    const variants: Array<Record<string, unknown>> = [
      {},
      { orientation: 'vertical' },
      { dashed: true },
      { variant: 'dotted' },
      { plain: true },
      { size: 'small' },
      { titlePlacement: 'start' },
    ];
    for (const props of variants) {
      expect(mount(Divider, { props }).attributes('role'), JSON.stringify(props)).toBe('separator');
    }
  });

  it('根元素是 div 且不假装承担 landmark —— 除 role 外不输出任何 aria-*', () => {
    const w = mount(Divider, { slots: { default: () => 'Text' } });
    expect(w.element.tagName).toBe('DIV');
    // 「没有」也是断言：凭空加 `aria-label` / `aria-hidden` 会污染屏幕阅读器的结构导航，
    // 而 Divider 的文字标题本身就已经是内容。
    expect(Object.keys(w.attributes()).filter((name) => name.startsWith('aria-'))).toEqual([]);
  });

  it('★ 用户传的 role 会被覆盖成 separator（与 antd 的展开顺序一致）', () => {
    expect(mount(Divider, { props: { role: 'presentation' } }).attributes('role')).toBe(
      'separator',
    );
  });
});
