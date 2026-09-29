/**
 * L5 无障碍 —— Pagination 的 role/ARIA 契约、键盘可达性与 axe 扫描。
 *
 * ── 判据（antd 6.6.4 = rc-pagination@1.4.0）────────────────────────────────────
 *
 * | 项 | 判据 |
 * |---|---|
 * | 根 | `<ul>`；`role` 可被 props 覆盖（默认不写，宿主可提供 nav 语义） |
 * | 页码 | `li[tabindex=0]` + `title={page}`，`-item-active` 标当前页 |
 * | prev/next | 可用时 `tabindex=0`、不可用时 **移除 tabindex** 且 `aria-disabled=true` |
 * | 跳页项 | `li[tabindex=0]` + `title`（「Previous 5 Pages」/「Next 5 Pages」） |
 * | 快速跳转 | `input[aria-label={locale.page}]`；`goButton` 是 `<button type=button>` |
 * | 简化模式 | `input[aria-label={locale.jump_to}]` |
 * | 键盘 | **Enter** 触发 prev/next/跳页/页码/快速跳转（rc 的 `runIfEnter`） |
 *
 * ── 关于 axe 的适用范围 ───────────────────────────────────────────────────────
 *
 * 两层扫描都在：**demo 维度**用 `a11yDemoTest`（12 个 demo 逐个跑 axe），
 * **真实配置维度**用下面的 `cases` 表（含 demo 未必碰到的参数组合，如 `align` / `disabled`
 * / `showLessItems` / 快速跳转的 `goButton`）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Pagination from '../Pagination.vue';

const P = 'apollo-pagination';

a11yDemoTest('Pagination', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  // 本轮**没有豁免**：demo 里的页码/跳页项都有 title，尺寸切换器的 Select 有
  // `aria-label={locale.page_size}`（为此修了 Select 的可访问名丢失，见 COMPATIBILITY **U14**），
  // 快速跳转的 input 有 `aria-label={locale.page}` —— 全部 0 violation。
  allow: [],
});

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** 挂到真实文档（axe 与 `.focus()` 都要求元素在文档里）。 */
const mountA11y = (props: Record<string, unknown> = {}) =>
  mount(h(Pagination as never, { total: 500, ...props } as never), { attachTo: document.body });

/** jsdom 的 `keyCode` 是只读 getter ⇒ 必须 defineProperty（组件按 rc 读 `e.keyCode`）。 */
const fireKey = (el: Element, keyCode: number, type: 'keydown' | 'keyup' = 'keydown'): void => {
  const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { value: keyCode });
  Object.defineProperty(ev, 'which', { value: keyCode });
  el.dispatchEvent(ev);
};

describe('Pagination · axe 扫描（真实配置，0 violation）', () => {
  const cases: Record<string, Record<string, unknown>> = {
    常规: { defaultCurrent: 3 },
    带总数: { defaultCurrent: 3, showTotal: (t: number) => `共 ${t} 条` },
    简化: { defaultCurrent: 3, simple: true },
    快速跳转: { defaultCurrent: 3, showQuickJumper: true },
    快速跳转带按钮: { defaultCurrent: 3, showQuickJumper: { goButton: true } },
    尺寸切换: { defaultCurrent: 3, showSizeChanger: true },
    禁用: { defaultCurrent: 3, disabled: true },
    大尺寸: { defaultCurrent: 3, size: 'large' },
    居中对齐: { defaultCurrent: 3, align: 'center' },
    隐藏跳页: { defaultCurrent: 20, showPrevNextJumpers: false },
  };

  for (const [name, props] of Object.entries(cases)) {
    it(`${name}：无 axe violation`, async () => {
      const w = mountA11y(props);
      await nextTick();
      const results = await axe.run(w.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      w.unmount();
    });
  }
});

describe('Pagination · role / ARIA 契约（L5）', () => {
  it('根是 <ul>；`role` prop 可覆盖', () => {
    const plain = mountA11y({ defaultCurrent: 1 });
    expect(plain.element.tagName).toBe('UL');
    // 上游默认不写 role（语义由宿主提供）
    expect(plain.attributes('role')).toBeUndefined();
    plain.unmount();

    const withRole = mountA11y({ defaultCurrent: 1, role: 'navigation' });
    expect(withRole.attributes('role')).toBe('navigation');
    withRole.unmount();
  });

  it('页码 li 可聚焦且有 title（当前页带 -active）', () => {
    const w = mountA11y({ defaultCurrent: 3 });
    const page3 = w.find(`.${P}-item-3`);
    expect(page3.attributes('tabindex')).toBe('0');
    expect(page3.attributes('title')).toBe('3');
    expect(page3.classes()).toContain(`${P}-item-active`);
    w.unmount();
  });

  it('prev/next：不可用时移除 tabindex 且 aria-disabled=true', () => {
    const first = mountA11y({ defaultCurrent: 1 });
    expect(first.find(`.${P}-prev`).attributes('tabindex')).toBeUndefined();
    expect(first.find(`.${P}-prev`).attributes('aria-disabled')).toBe('true');
    expect(first.find(`.${P}-next`).attributes('tabindex')).toBe('0');
    expect(first.find(`.${P}-next`).attributes('aria-disabled')).toBe('false');
    first.unmount();

    const last = mountA11y({ defaultCurrent: 50 });
    expect(last.find(`.${P}-next`).attributes('tabindex')).toBeUndefined();
    expect(last.find(`.${P}-next`).attributes('aria-disabled')).toBe('true');
    last.unmount();
  });

  it('跳页项可聚焦且 title 按 showLessItems 变（5 / 3）', () => {
    const w = mountA11y({ defaultCurrent: 10 });
    expect(w.find(`.${P}-jump-prev`).attributes('tabindex')).toBe('0');
    expect(w.find(`.${P}-jump-prev`).attributes('title')).toBe('Previous 5 Pages');
    w.unmount();

    const less = mountA11y({ defaultCurrent: 10, showLessItems: true });
    expect(less.find(`.${P}-jump-prev`).attributes('title')).toBe('Previous 3 Pages');
    less.unmount();
  });

  it('快速跳转的输入框带 aria-label；goButton 是 type=button', () => {
    const w = mountA11y({ defaultCurrent: 3, showQuickJumper: { goButton: true } });
    expect(w.find(`.${P}-options-quick-jumper input`).attributes('aria-label')).toBe('Page');
    expect(w.find(`.${P}-options-quick-jumper-button`).attributes('type')).toBe('button');
    w.unmount();
  });

  it('简化模式的输入框带 aria-label（= locale.jump_to）', () => {
    const w = mountA11y({ defaultCurrent: 3, simple: true });
    expect(w.find(`.${P}-simple-pager input`).attributes('aria-label')).toBe('Go to');
    w.unmount();
  });

  it('禁用态根带 -disabled（可达性信号）', () => {
    const w = mountA11y({ defaultCurrent: 3, disabled: true });
    expect(w.classes()).toContain(`${P}-disabled`);
    w.unmount();
  });

  it('aria-* / data-* 透传到根，不影响可访问名', () => {
    const w = mountA11y({ defaultCurrent: 3, 'aria-label': '分页导航', 'data-testid': 'pg' });
    expect(w.attributes('aria-label')).toBe('分页导航');
    expect(w.attributes('data-testid')).toBe('pg');
    w.unmount();
  });
});

describe('Pagination · 键盘可达性（L5）', () => {
  it('Enter 触发上一页 / 下一页', async () => {
    const w = mountA11y({ defaultCurrent: 3 });
    fireKey(w.find(`.${P}-next`).element, 13, 'keydown');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([4, 10]);
    w.unmount();
  });

  it('Enter 触发跳页项（目标页 = current ∓ 5）', async () => {
    const w = mountA11y({ defaultCurrent: 10 });
    fireKey(w.find(`.${P}-jump-next`).element, 13, 'keydown');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([15, 10]);
    w.unmount();
  });

  it('Enter 触发页码', async () => {
    const w = mountA11y({ defaultCurrent: 3 });
    fireKey(w.find(`.${P}-item-5`).element, 13, 'keydown');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([5, 10]);
    w.unmount();
  });

  it('Enter 触发快速跳转（输入 + Enter）', async () => {
    const w = mountA11y({ defaultCurrent: 3, showQuickJumper: true });
    const input = w.find(`.${P}-options-quick-jumper input`);
    await input.setValue('12');
    fireKey(input.element, 13, 'keyup');
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([12, 10]);
    w.unmount();
  });

  it('非 Enter 键不触发（避免误触）', async () => {
    const w = mountA11y({ defaultCurrent: 3 });
    fireKey(w.find(`.${P}-next`).element, 9, 'keydown'); // Tab
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
    w.unmount();
  });

  it('页码的 tabindex 恒为 0（可 Tab 遍历全部页码）', () => {
    const w = mountA11y({ defaultCurrent: 3 });
    expect(w.findAll(`.${P}-item`).every((li) => li.attributes('tabindex') === '0')).toBe(true);
    w.unmount();
  });
});
