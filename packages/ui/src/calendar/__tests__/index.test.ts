/**
 * Calendar · L1/L2（jsdom）。
 *
 * ── 为什么这里能钉住大部分契约 ────────────────────────────────────────────────
 *
 * Calendar **没有浮层**（面板是内联的 `<CalendarHeader/> + <PickerPanel hideHeader/>`）
 * ⇒ jsdom 里 DOM 是**完整的**（与 date-picker 相反：那边面板在 Portal 里，jsdom 拿不到）。
 * 所以「结构 + 类名 + 事件链」这一层几乎全能钉住，像素归 L6。
 *
 * 上游测试 `components/calendar/__tests__/`（本仓不复用，只作判据）。
 * 本文件钉**最容易写错的那批**：
 *   - 根类名的条件组合（`-full` / `-mini` / `-rtl`）与「**默认全屏**」
 *   - header 的三段与「月下拉**仅** `mode === 'month'` 时渲染」
 *   - `triggerChange` 的三条顺序判据（**同一天什么都不发** / 跨月年才补发 `panelChange`）
 *   - `triggerModeChange` 传的是**当前值**
 *   - 面板那一支的 `source` 是 **`panelMode`**
 *   - 单元格渲染的三级回退与**两处不同判据**（`isFunction` vs 真值）
 *   - 6 个语义槽的两段式归属（`root`/`header` 归自己，其余转交面板）
 *   - 4 个废弃 prop 的告警
 */
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Calendar } from '../index';

const P = 'apollo-picker-calendar';

const V = dayjs('2026-09-30');

const mountCal = (props: Record<string, unknown> = {}) =>
  mount(Calendar, { props: { value: V, ...props }, attachTo: document.body });

const emitted = (w: ReturnType<typeof mountCal>, name: string) => w.emitted(name) ?? [];

/** 点一个「在视图内」的日期格子（按两位补零的文本找）。 */
const clickDate = async (w: ReturnType<typeof mountCal>, day: number) => {
  const cells = w.findAll('.apollo-picker-cell-in-view .apollo-picker-cell-inner');
  const target = cells.find((c) => c.text().trim() === String(day).padStart(2, '0'));
  expect(target, `找不到 ${day} 号格子`).toBeTruthy();
  await target?.trigger('click');
};

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 根元素
// ---------------------------------------------------------------------------

describe('Calendar · 根元素与条件类名', () => {
  it('🚨 根类是 `apollo-picker-calendar`（`getPrefixCls("picker")`，**不是** `apollo-calendar`）', () => {
    const w = mountCal();
    expect(w.classes()).toContain(P);
    expect(w.classes()).not.toContain('apollo-calendar');
  });

  it('默认**全屏**（`-full`）；`fullscreen: false` ⇒ `-mini`（两者互斥）', () => {
    const full = mountCal();
    expect(full.classes()).toContain(`${P}-full`);
    expect(full.classes()).not.toContain(`${P}-mini`);

    const mini = mountCal({ fullscreen: false });
    expect(mini.classes()).toContain(`${P}-mini`);
    expect(mini.classes()).not.toContain(`${P}-full`);
  });

  it('`direction="rtl"`（经 ConfigProvider）⇒ `-rtl`', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Calendar, { value: V }) },
      attachTo: document.body,
    });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-rtl`);
  });

  it('`-css-var` 类挂在「calendarPrefixCls + -css-var」上（与 `genCalendarStyle` 对应）', () => {
    const w = mountCal();
    expect(w.classes()).toContain(`${P}-css-var`);
    expect(w.classes()).toContain('css-var-root');
  });

  it('原生 `class`（字符串/数组）落根元素', () => {
    const w = mountCal({ class: ['c1', 'c2'] });
    expect(w.classes()).toContain('c1');
    expect(w.classes()).toContain('c2');
  });

  it('面板是 `.apollo-picker-panel`，且 `hideHeader` ⇒ 里面**没有** `.apollo-picker-header`', () => {
    const w = mountCal();
    expect(w.find('.apollo-picker-panel').exists()).toBe(true);
    expect(w.find('.apollo-picker-header').exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// header 三段
// ---------------------------------------------------------------------------

describe('Calendar · header（三段）', () => {
  it('年下拉 + 模式切换恒在；**月下拉仅 `mode === "month"`**', () => {
    const month = mountCal();
    expect(month.find(`.${P}-year-select`).exists()).toBe(true);
    expect(month.find(`.${P}-month-select`).exists()).toBe(true);
    expect(month.find(`.${P}-mode-switch`).exists()).toBe(true);

    const year = mountCal({ mode: 'year' });
    expect(year.find(`.${P}-year-select`).exists()).toBe(true);
    expect(year.find(`.${P}-month-select`).exists()).toBe(false);
    expect(year.find(`.${P}-mode-switch`).exists()).toBe(true);
  });

  it('模式切换是 `Radio.Group` + 两个 `Radio.Button`（month / year）', () => {
    const w = mountCal();
    const group = w.find(`.${P}-mode-switch`);
    expect(group.attributes('role')).toBe('radiogroup');
    const inputs = group.findAll('input[type="radio"]');
    expect(inputs.map((i) => i.attributes('value'))).toEqual(['month', 'year']);
    expect(inputs[0]?.attributes('checked')).toBeDefined();
  });

  it('enUS 下年下拉**不带「年」后缀**（判据是 `locale.year === "年"`）', () => {
    const w = mountCal();
    expect(w.find(`.${P}-year-select`).text()).toContain('2026');
    expect(w.find(`.${P}-year-select`).text()).not.toContain('年');
  });
});

// ---------------------------------------------------------------------------
// 事件链（三条顺序判据）
// ---------------------------------------------------------------------------

describe('Calendar · 事件链（顺序即语义）', () => {
  it('🚨 **同一天：`change` / `update:value` / `panelChange` 都不发**，但 `select` 照发', async () => {
    const w = mountCal();
    await clickDate(w, 30); // 当前值就是 9-30
    expect(emitted(w, 'change')).toHaveLength(0);
    expect(emitted(w, 'panelChange')).toHaveLength(0);
    // `update:value` 与 `change` **同时**发（C11），同一天时两者都静默
    expect(emitted(w, 'update:value')).toHaveLength(0);
    expect(emitted(w, 'select')).toHaveLength(1);
  });

  it('同月内换日 ⇒ 发 `change` + `update:value` + `select`，**不**发 `panelChange`', async () => {
    const w = mountCal();
    await clickDate(w, 15);
    expect(emitted(w, 'change')).toHaveLength(1);
    expect(emitted(w, 'update:value')).toHaveLength(1);
    expect(emitted(w, 'panelChange')).toHaveLength(0);
    expect(emitted(w, 'select')).toHaveLength(1);
  });

  it('🚨 面板那一支的 `source` 是 **`panelMode`**（`"date"` / `"month"`），不是字面量', async () => {
    const month = mountCal();
    await clickDate(month, 15);
    expect(emitted(month, 'select')[0]?.[1]).toEqual({ source: 'date' });

    const year = mountCal({ mode: 'year' });
    const cells = year.findAll('.apollo-picker-cell-in-view .apollo-picker-cell-inner');
    expect(cells.length).toBeGreaterThan(0);
    await cells[0]?.trigger('click');
    expect(emitted(year, 'select')[0]?.[1]).toEqual({ source: 'month' });
  });

  it('模式切换 ⇒ `update:mode` + `panelChange(当前值, 新模式)`（传的是**当前值**）', async () => {
    const w = mountCal();
    const inputs = w.findAll(`.${P}-mode-switch input[type="radio"]`);
    await inputs[1]?.setValue();

    expect(emitted(w, 'update:mode')[0]?.[0]).toBe('year');
    const panel = emitted(w, 'panelChange')[0];
    expect(panel?.[1]).toBe('year');
    // ⚠️ 第一个参数是**当前值**（不是新日期）
    const panelValue = panel?.[0] as dayjs.Dayjs | undefined;
    expect(panelValue?.format('YYYY-MM-DD')).toBe('2026-09-30');
  });

  it('🚨 非受控：`defaultValue` 起手，点击后 `change` **要发**（先取快照的哨兵）', async () => {
    // 这条钉 PITFALLS 13 / 207：`triggerChange` 里若「先写 `innerValue` 再比较」，
    // `mergedValue` 立刻变成新值 ⇒ `isSameDate` 恒真 ⇒ **`change` 永远不发**。
    // 受控用例抓不到它（受控时 `innerValue` 不被写）。
    const w = mountCal({ value: undefined, defaultValue: V });
    await clickDate(w, 15);
    expect(emitted(w, 'change')).toHaveLength(1);
    expect(emitted(w, 'update:value')).toHaveLength(1);
    expect(w.find(`.${P}-year-select`).text()).toContain('2026');
  });
});

// ---------------------------------------------------------------------------
// 单元格渲染（三级回退 + 两处不同判据）
// ---------------------------------------------------------------------------

describe('Calendar · 单元格渲染', () => {
  it('默认 `dateRender`：`-date-value` 是**两位补零**的日期', () => {
    const w = mountCal();
    const values = w.findAll(`.${P}-date-value`).map((e) => e.text());
    expect(values).toContain('30');
    // 1 号必须是 `01` 而不是 `1`
    expect(values).toContain('01');
    expect(values).not.toContain('1');
  });

  it('默认 `dateRender` 的 `-date-today` 恰好落在「今天」那一格', () => {
    const today = dayjs();
    const w = mountCal({ value: today });
    const marked = w.findAll(`.${P}-date-today`);
    expect(marked.length).toBe(1);
    expect(marked[0]?.text()).toContain(String(today.date()).padStart(2, '0'));
  });

  it('`fullCellRender` 换掉**整个**格子（`-date-value` 不再产出）', () => {
    const w = mountCal({
      fullCellRender: (date: dayjs.Dayjs) => h('span', { class: 'mine' }, date.format('D')),
    });
    expect(w.findAll('.mine').length).toBeGreaterThan(0);
    expect(w.findAll(`.${P}-date-value`)).toHaveLength(0);
  });

  it('`cellRender` 只换**内容**（`-date-value` 仍在）', () => {
    const w = mountCal({ cellRender: () => h('i', { class: 'inner' }) });
    expect(w.findAll('.inner').length).toBeGreaterThan(0);
    expect(w.findAll(`.${P}-date-value`).length).toBeGreaterThan(0);
  });

  it('🚨 废弃的 `dateFullCellRender` **仍然生效**（三级回退的中间一级）', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const w = mountCal({
      dateFullCellRender: (date: dayjs.Dayjs) => h('span', { class: 'legacy' }, date.format('D')),
    });
    expect(w.findAll('.legacy').length).toBeGreaterThan(0);
  });

  it('`headerRender` 换掉整块 header（函数 prop）', () => {
    const w = mountCal({ headerRender: () => h('div', { class: 'my-header' }, 'H') });
    expect(w.find('.my-header').exists()).toBe(true);
    expect(w.find(`.${P}-year-select`).exists()).toBe(false);
  });

  it('`headerRender` 的 config 恰好带 value / type / onChange / onTypeChange', () => {
    let seen: Record<string, unknown> | null = null;
    mountCal({
      headerRender: (cfg: Record<string, unknown>) => {
        seen = cfg;
        return h('div');
      },
    });
    expect(seen).not.toBeNull();
    expect(Object.keys(seen ?? {}).sort()).toEqual(['onChange', 'onTypeChange', 'type', 'value']);
    expect((seen as unknown as { type: string }).type).toBe('month');
  });
});

// ---------------------------------------------------------------------------
// 禁用
// ---------------------------------------------------------------------------

describe('Calendar · 禁用判定', () => {
  it('`validRange` 越界 ⇒ 格子带 `-cell-disabled`（`isAfter` 不含端点）', () => {
    const w = mountCal({
      value: dayjs('2026-09-15'),
      validRange: [dayjs('2026-09-10'), dayjs('2026-09-20')],
    });
    // ⚠️ 只数**在视图内**的格子：面板同时渲染上/下月的格子，
    //    它们的 `10` / `20` 会污染断言（本轮实测踩到）
    const disabled = w.findAll('.apollo-picker-cell-in-view.apollo-picker-cell-disabled');
    expect(disabled.length).toBeGreaterThan(0);
    // 10 / 20 是端点 ⇒ **不**禁用（`isAfter` 不含端点）
    const texts = disabled.map((d) => d.text().trim());
    expect(texts).not.toContain('10');
    expect(texts).not.toContain('20');
  });

  it('`disabledDate` 与 `validRange` 是**「或」**', () => {
    const w = mountCal({
      value: dayjs('2026-09-15'),
      validRange: [dayjs('2026-09-10'), dayjs('2026-09-20')],
      disabledDate: (d: dayjs.Dayjs) => d.date() === 15,
    });
    const texts = w
      .findAll('.apollo-picker-cell-in-view.apollo-picker-cell-disabled')
      .map((d) => d.text().trim());
    expect(texts).toContain('15');
  });
});

// ---------------------------------------------------------------------------
// 语义槽
// ---------------------------------------------------------------------------

describe('Calendar · 语义槽（6 槽两段式归属）', () => {
  it('`root` 落根、`header` 落 header；`body`/`content`/`itemContent` 转交面板', () => {
    const w = mountCal({
      classNames: {
        root: 's-root',
        header: 's-header',
        body: 's-body',
        content: 's-content',
        itemContent: 's-item-content',
      },
    });
    expect(w.classes()).toContain('s-root');
    expect(w.find(`.${P}-header`).classes()).toContain('s-header');
    expect(w.find('.apollo-picker-body').classes()).toContain('s-body');
    expect(w.find('.apollo-picker-content').classes()).toContain('s-content');
    // `itemContent` **同时**落在日历自绘的 `-date-content` 上
    expect(w.find(`.${P}-date-content`).classes()).toContain('s-item-content');
  });

  it('`styles.root` 落根元素的内联样式', () => {
    const w = mountCal({ styles: { root: { color: 'rgb(255, 0, 0)' } } });
    expect(w.attributes('style')).toContain('color: rgb(255, 0, 0)');
  });

  it('函数形态的 `classNames` 收到解析后的 `mode`', () => {
    const w = mountCal({
      mode: 'year',
      classNames: (info: { props: { mode?: string } }) => ({ root: `m-${info.props.mode}` }),
    });
    expect(w.classes()).toContain('m-year');
  });
});

// ---------------------------------------------------------------------------
// 告警
// ---------------------------------------------------------------------------

describe('Calendar · 废弃告警（判据是 `!== undefined`）', () => {
  // ⚠️ 本仓的废弃告警走 **`console.error`**（`[apollo: Calendar] \`x\` is deprecated…`），
  //    不是 `console.warn`（本轮实测踩到）。
  const deprecations = (err: { mock: { calls: unknown[][] } }) =>
    err.mock.calls.map((c) => String(c[0])).filter((t) => t.includes('[apollo: Calendar]'));

  it('不传 ⇒ 不告警；传了 ⇒ 告警', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mountCal();
    expect(deprecations(err)).toHaveLength(0);

    mountCal({ dateCellRender: () => null });
    const calls = deprecations(err);
    expect(calls.some((c) => c.includes('dateCellRender'))).toBe(true);
  });

  it('🚨 显式传 `undefined` **不**告警（Vue 没有「键存在」）', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mountCal({ dateCellRender: undefined });
    expect(deprecations(err)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// expose
// ---------------------------------------------------------------------------

describe('Calendar · expose', () => {
  it('只暴露 `nativeElement`（上游 `CalendarRef` 没有 focus/blur）', () => {
    const w = mountCal();
    const vm = w.vm as unknown as Record<string, unknown>;
    expect(vm.nativeElement).toBe(w.element);
    expect(vm.focus).toBeUndefined();
    expect(vm.blur).toBeUndefined();
  });
});
