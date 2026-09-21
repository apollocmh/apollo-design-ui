/**
 * L5 · 无障碍测试
 *
 * ── Affix 的 a11y 面很窄 ──────────────────────────────────────────────────────
 *
 * 实测 antd 6.6.4 的 `es/affix/index.js`：整个组件**只有一处** ARIA ——
 * 占位层上的 `aria-hidden="true"`（`:186`）。根元素、固钉层都没有任何 `role` / `aria-*`。
 * 没有 `aria-live`、没有 `role="status"`：固钉状态的变化**对读屏器不可见**
 * （这是上游缺口，如实登记，不擅自补）。
 *
 * ⚠️ **jsdom 测不到固钉态**（没有真实布局，`docs/analysis/affix.md` §8）——
 *    所以「占位层渲染出来时带 `aria-hidden`」这条**只能对组件源码/静态形态断言**，
 *    这里断言的是「未固钉时不渲染占位层」+「组件不凭空加 ARIA」。
 *
 * ── 这个文件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明固钉态的可达性（jsdom 无布局）——登记在 README §7
 *   - 没证明对比度（axe 在 jsdom 下跳过 `color-contrast`）
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import Affix from '../Affix.vue';

const P = 'apollo-affix';

// ---------------------------------------------------------------------------
// 1. axe 自动扫描（demo/ 已落地，走标准形态）
// ---------------------------------------------------------------------------

a11yDemoTest('Affix', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
});

// ---------------------------------------------------------------------------
// 2. 不凭空加 ARIA（上游只有占位层的 aria-hidden）
// ---------------------------------------------------------------------------

describe('Affix · 不凭空加 ARIA', () => {
  const ariaAttrs = (el: Element) =>
    el.getAttributeNames().filter((n) => n === 'role' || n.startsWith('aria-'));

  it.each([
    ['默认', {}],
    ['offsetTop', { offsetTop: 64 }],
    ['offsetBottom', { offsetBottom: 64 }],
  ])('%s：根元素与内层都没有 `aria-*` / `role`', (_label, props) => {
    const w = mount(Affix, { props, slots: { default: () => h('span', '内容') } });
    expect(ariaAttrs(w.element)).toEqual([]);
    const fixed = w.find(`.${P}`);
    if (fixed.exists()) expect(ariaAttrs(fixed.element)).toEqual([]);
  });

  it('★ 未固钉时**不渲染**占位层（它只在固钉时出现，且带 aria-hidden）', () => {
    // jsdom 无真实布局 ⇒ getBoundingClientRect 恒 0 ⇒ 永远不固钉 ⇒ 占位层不该出现
    const w = mount(Affix, { props: { offsetTop: 64 }, slots: { default: () => h('span', 'x') } });
    expect(w.element.children.length).toBe(1);
    expect(w.find('[aria-hidden="true"]').exists()).toBe(false);
  });

  it('⚠️ 固钉状态变化不产出 `aria-live` / `role="status"`（上游缺口，登记不补）', () => {
    const w = mount(Affix, { props: { offsetTop: 64 }, slots: { default: () => h('span', 'x') } });
    expect(w.element.getAttribute('aria-live')).toBeNull();
    expect(w.element.getAttribute('role')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. 不产生可聚焦元素（Affix 只是定位容器）
// ---------------------------------------------------------------------------

describe('Affix · 自身不进 Tab 序列', () => {
  it('组件自身不引入任何 `tabindex`（内容是否可聚焦由使用方决定）', () => {
    const w = mount(Affix, { props: { offsetTop: 64 }, slots: { default: () => h('span', 'x') } });
    const self = w.element.querySelectorAll('[tabindex]');
    expect(self.length).toBe(0);
    expect((w.element as Element).getAttribute('tabindex')).toBeNull();
  });
});
