/**
 * L5 · 无障碍测试
 *
 * ── Divider 的无障碍面很小，但它**不是空的** ─────────────────────────────────
 *
 * antd 给根元素挂了 `role="separator"`，这是 Divider 唯一的显式无障碍语义 ——
 * 它把「一条分隔线」这件事告诉屏幕阅读器，而不是让它读到一个无意义的空 `div`。
 *
 * 所以这一层的落点是：
 *   1. axe 自动扫描（对全部 9 个 demo，0 violation）
 *   2. 断言 `role="separator"` 在**所有形态**下都在（有/无 children、水平/垂直、各种 variant）
 *   3. 断言没有被覆盖成别的 role（antd 的 `{...restProps}` 在 `role="separator"` 之前，
 *      所以用户传的 `role` 会被覆盖 —— 这是上游行为，L1 已单独钉住）
 *
 * ── 一处**上游观察**（不是我们的缺陷，也没有「修」）─────────────────────────────
 *
 * 垂直分割线按 ARIA 规范宜带 `aria-orientation="vertical"`（`separator` 默认是 horizontal）。
 * antd 6.6.4 **没有**输出它，我们**逐字对齐、也不输出** —— 因为 L4 的 DOM 契约是与
 * antd 的机械基线逐字比对，单方面加属性会让契约红。
 * 这条观察登记在 `README.md` §7，属于「上游可改进项」，不是我们的差异。
 * 也正因为它没有输出，axe 才不会报 violation（axe 只检查已有的声明是否自洽）。
 *
 * ⚠️ 这个测试**没有**证明键盘可达性 —— Divider 没有任何可聚焦元素，也就没有键盘路径。
 *    这是「架构上不适用」，不是「没测」。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Divider } from '../index';

const P = 'apollo-divider';

a11yDemoTest('Divider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

describe('Divider · 分隔线语义', () => {
  it('默认（无 children）：根元素带 role="separator"', () => {
    expect(mount(Divider).attributes('role')).toBe('separator');
  });

  it('有 children：role 仍在根元素上（不是在 rail / inner-text 上）', () => {
    const w = mount(Divider, { slots: { default: () => 'Text' } });
    expect(w.attributes('role')).toBe('separator');
    expect(w.find(`.${P}-rail-start`).attributes('role')).toBeUndefined();
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
