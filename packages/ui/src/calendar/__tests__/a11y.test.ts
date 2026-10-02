/**
 * L5 无障碍 —— Calendar 的 role/ARIA 契约与 axe 扫描。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * **Calendar 的语义几乎全部来自 `@apollo-design/picker`**（面板）与
 * `select` / `radio`（header 的两个下拉与模式切换）—— 本组件自己只负责：
 *
 * 1. **把面板内联渲染**（没有浮层）⇒ 与 date-picker 相反，面板的 ARIA **在 jsdom 里
 *    完全可达** ⇒ 本文件能直接断言面板的语义（date-picker 那条只能靠 picker 的 L5）。
 * 2. **`hideHeader`** ⇒ 面板自带的 4 个导航按钮（prev/next/super-prev/super-next）
 *    与它们的 `aria-label` **不存在** —— 这是「本组件刻意少掉的一批语义」，
 *    必须断言**确实不在**（否则以后误开 header 会静默多出一批可 Tab 到的按钮）。
 * 3. **根节点不加 `role`**（上游如此）—— 日历不是一个 ARIA landmark。
 *
 * ⚠️ **`axe.run()` 不能与 `vi.useFakeTimers()` 共存**（PITFALLS 268）—— 本文件不用假时钟。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Calendar } from '../index';

const P = 'apollo-picker-calendar';
const PANEL = 'apollo-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const V = dayjs('2026-09-30');

/**
 * 🚨 **豁免 `label` 规则**（与 `select/__tests__/a11y.test.ts` 同一条放行）：
 *
 * header 里的年 / 月下拉是 `Select` 的 combobox，其可访问名由
 * `role="combobox"` + `aria-*` 状态承担 —— **antd 同款不绑 `<label>`**
 * （`components/select/__tests__/a11y.test.ts` 自己就这么放行的），
 * 上游 `Calendar/Header.tsx` 也没给这两个 `Select` 传 `aria-label`。
 * R13 的判据是「**不低于 antd**」，所以这里照放。
 *
 * ⚠️ 这是**唯一**的豁免；其余规则必须 0 violation。
 */
const ALLOW = { label: { enabled: false } } as const;

async function runAxe(): Promise<axe.Result[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: TAGS },
    rules: ALLOW,
  });
  return results.violations;
}

const mountCal = async (props: Record<string, unknown> = {}) => {
  const w = mount(Calendar, { props: { value: V, ...props }, attachTo: document.body });
  await nextTick();
  return w;
};

/** 某个元素的全部属性（按名排序），便于「逐项相同 / 逐项不存在」类断言。 */
const attrsOf = (selector: string): Record<string, string> => {
  const el = document.querySelector(selector);
  if (!el) return {};
  return Object.fromEntries(
    Array.from(el.attributes)
      .map((a) => [a.name, a.value] as const)
      .sort((a, b) => a[0].localeCompare(b[0])),
  );
};

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 结构语义
// ---------------------------------------------------------------------------

describe('Calendar · 结构语义（根 / 面板 / header）', () => {
  it('🚨 根节点**不加 `role`**（上游如此 —— 日历不是 ARIA landmark）', async () => {
    await mountCal();
    const root = document.querySelector(`.${P}`) as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.hasAttribute('role')).toBe(false);
    expect(root.hasAttribute('aria-label')).toBe(false);
  });

  it('面板根有 `tabindex="0"`（来自 `PickerPanel` 的 `tabIndex` 默认值）', async () => {
    await mountCal();
    const panel = document.querySelector(`.${PANEL}-panel`) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('tabindex')).toBe('0');
  });

  it('🚨 `hideHeader` ⇒ 面板的 4 个导航按钮**不存在**（它们的 `aria-label` 也没有）', async () => {
    await mountCal();
    expect(document.querySelector(`.${PANEL}-header`)).toBeNull();
    for (const label of ['Last year', 'Previous month', 'Next month', 'Next year']) {
      expect(document.querySelector(`[aria-label="${label}"]`), `${label} 不该存在`).toBeNull();
    }
  });

  it('header 三个控件的语义来自 select / radio（本组件不自造）', async () => {
    await mountCal();
    // 年 / 月下拉是 Select 的 combobox
    const selects = document.querySelectorAll(`.${P}-header .apollo-select-input`);
    expect(selects.length).toBe(2);
    for (const s of selects) {
      expect(s.getAttribute('role')).toBe('combobox');
      expect(s.getAttribute('aria-haspopup')).toBe('listbox');
      expect(s.getAttribute('aria-expanded')).toBe('false');
    }
    // 模式切换是 Radio.Group
    const group = document.querySelector(`.${P}-mode-switch`) as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.querySelectorAll('input[type="radio"]').length).toBe(2);
  });

  it('`mode="year"` ⇒ 只剩一个下拉（月下拉与它的 combobox 一起消失）', async () => {
    await mountCal({ mode: 'year' });
    expect(document.querySelector(`.${P}-month-select`)).toBeNull();
    expect(document.querySelectorAll(`.${P}-header .apollo-select-input`).length).toBe(1);
  });

  it('`fullscreen: false` 只改尺寸类，**不改任何 ARIA**（逐项相同）', async () => {
    await mountCal();
    const fullAttrs = attrsOf(`.${PANEL}-panel`);
    document.body.innerHTML = '';
    await mountCal({ fullscreen: false });
    const miniAttrs = attrsOf(`.${PANEL}-panel`);
    expect(miniAttrs).toEqual(fullAttrs);
  });
});

// ---------------------------------------------------------------------------
// axe（0 violation）
// ---------------------------------------------------------------------------

describe('Calendar · axe（WCAG 2.0/2.1/2.2 A+AA，0 violation）', () => {
  it('默认（全屏 + 月模式）', async () => {
    await mountCal();
    expect(await runAxe()).toEqual([]);
  });

  it('迷你（`fullscreen: false`）', async () => {
    await mountCal({ fullscreen: false });
    expect(await runAxe()).toEqual([]);
  });

  it('年模式（`mode: "year"`）', async () => {
    await mountCal({ mode: 'year' });
    expect(await runAxe()).toEqual([]);
  });

  it('周号（`showWeek`）', async () => {
    await mountCal({ showWeek: true });
    expect(await runAxe()).toEqual([]);
  });

  it('`validRange`（一批格子被禁用）', async () => {
    await mountCal({ validRange: [dayjs('2026-09-10'), dayjs('2026-09-20')] });
    expect(await runAxe()).toEqual([]);
  });

  it('三个渲染 prop 都传（`headerRender` + `cellRender` + `fullCellRender`）', async () => {
    await mountCal({
      headerRender: () => h('div', null, 'HEADER'),
      cellRender: () => h('span', null, 'c'),
      fullCellRender: () => h('span', null, 'f'),
    });
    expect(await runAxe()).toEqual([]);
  });

  it('中文语言包（`ConfigProvider` 的 `locale`）', async () => {
    const zhCN = (await import('@apollo-design/locale/locales/zh_CN')).default as unknown;
    const w = mount(ConfigProvider, {
      props: { locale: zhCN, prefixCls: 'apollo' },
      slots: { default: () => h(Calendar, { value: V }) },
      attachTo: document.body,
    });
    await nextTick();
    expect(await runAxe()).toEqual([]);
    w.unmount();
  });

  it('RTL（`direction: "rtl"`）', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Calendar, { value: V }) },
      attachTo: document.body,
    });
    await nextTick();
    expect(await runAxe()).toEqual([]);
    w.unmount();
  });
});
