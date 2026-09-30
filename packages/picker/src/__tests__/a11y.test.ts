/**
 * L5 无障碍 —— picker 面板层的 axe 扫描与 role/ARIA 契约。
 *
 * ── 判据（`@rc-component/picker@1.12.2`）──────────────────────────────────────
 *
 * | 项 | 判据 |
 * |---|---|
 * | 根 | `div[tabindex]`（**没有 role**；`tabIndex` 默认 0，可由 prop 覆盖） |
 * | 四个方向键 | `button[type=button]` + `aria-label`（`locale.previousYear` 等） + **`tabIndex=-1`** |
 * | 方向键禁用 | 越界时 `disabled` + 类名 `-disabled` |
 * | 三个标题按钮 | `button[aria-label]`（`yearSelect` / `monthSelect` / `decadeSelect`） + `tabIndex=-1` |
 * | 格子 | `td[title]`（日期面板给 `fieldDateFormat` 的值）；**没有** `role` / `aria-*` |
 * | 时间列 | `ul[data-type]` + `li[data-value]`；**没有** `role` / `aria-*` |
 * | 周号格 | `td.-cell-week` + 列头里一个 `visibility:hidden` 的 `span`（文案 `locale.week`） |
 *
 * ⚠️ **本层的判据与「组件库」那类不同**：面板上游**完全不用 ARIA role**
 * （没有 `role=grid` / `role=listbox` / `aria-selected`），可访问名全靠
 * `locale` 文案 + `title`。所以这里钉的是「**别自作主张加 role**」——
 * 加了会让 L4 的 37 条 DOM 契约同时红，而那条更早发现。本层补的是：
 * ① axe 无 violation；② 可访问名**都在**（`aria-label` 非空）；③ 方向键**不参与 Tab 序**。
 *
 * ── 关于 axe 的说明 ─────────────────────────────────────────────────────────
 *
 * 与 tabs 同判：面板**没有** `<main>` / `<h1>` 之类的页面结构，单测里只挂一个面板，
 * 所以 `region` / `landmark-*` 这类「页面级」规则本来就不适用 —— 用 `TAGS` 只跑
 * WCAG A/AA，且**逐条豁免必须可自证**（`allow` 项要真的出现，否则算失败）。
 */

import { mount } from '@vue/test-utils';
import axe from 'axe-core';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { dayjsGenerateConfig } from '../generate/dayjs';
import type { PanelDateType } from '../panel-context';
import { PickerPanel } from '../picker-panel';
import type { GenerateConfig, PickerLocale } from '../types';

/** 与 `semantic.test.ts` 逐字相同的一份（细节见那里的文件头）。 */
const locale: PickerLocale = {
  locale: 'en_US',
  yearFormat: 'YYYY',
  dayFormat: 'D',
  cellMeridiemFormat: 'A',
  monthBeforeYear: true,
  week: 'Week',
  monthSelect: 'Choose a month',
  yearSelect: 'Choose a year',
  decadeSelect: 'Choose a decade',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Last year',
  nextYear: 'Next year',
};

const generateConfig: GenerateConfig<PanelDateType> = {
  ...dayjsGenerateConfig,
  getNow: () => dayjs('2026-09-30 10:20:30') as unknown as PanelDateType,
};
const now = generateConfig.getNow();

const P = 'apollo-picker';

/** 与 test-utils 的 `DEFAULT_TAGS` 同源：WCAG 2.0/2.1/2.2 的 A + AA。 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(
    PickerPanel as never,
    {
      props: {
        prefixCls: P,
        locale,
        generateConfig,
        pickerValue: now,
        value: [now],
        ...props,
      } as never,
      attachTo: document.body,
    } as never,
  );

describe('PickerPanel · axe 扫描（真实配置）', () => {
  /**
   * ⚠️ `allow` 里的每一条都必须**可自证**（原因 + 复现路径），且要真的出现。
   * 目前**没有需要豁免的项** —— 上游面板零 ARIA role，反而没有可违规的东西。
   */
  const cases: Record<string, { props: Record<string, unknown>; allow?: string[] }> = {
    日面板: { props: { picker: 'date', mode: 'date' } },
    日面板无值: { props: { picker: 'date', mode: 'date', value: [] } },
    日面板带周号: { props: { picker: 'date', mode: 'date', showWeek: true } },
    周面板: { props: { picker: 'week', mode: 'week' } },
    月面板: { props: { picker: 'month', mode: 'month' } },
    季面板: { props: { picker: 'quarter', mode: 'quarter' } },
    年面板: { props: { picker: 'year', mode: 'year' } },
    十年面板: { props: { picker: 'year', mode: 'decade' } },
    时间面板: { props: { picker: 'time', mode: 'time' } },
    时间面板12小时制: { props: { picker: 'time', mode: 'time', use12Hours: true } },
    时间面板带毫秒: {
      props: { picker: 'time', mode: 'time', showMillisecond: true, millisecondStep: 250 },
    },
    时间面板全禁用: {
      props: {
        picker: 'time',
        mode: 'time',
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
      },
    },
    日期时间面板: { props: { picker: 'date', mode: 'date', showTime: true } },
    隐藏表头: { props: { picker: 'date', mode: 'date', hideHeader: true } },
    RTL: { props: { picker: 'date', mode: 'date', direction: 'rtl' } },
    不可Tab到达: { props: { picker: 'date', mode: 'date', tabIndex: -1 } },
    自定义格子: {
      props: {
        picker: 'date',
        mode: 'date',
        cellRender: () => null,
      },
    },
    多选: { props: { picker: 'date', mode: 'date', multiple: true, value: [now] } },
  };

  for (const [name, { props, allow = [] }] of Object.entries(cases)) {
    it(`${name}：${allow.length ? `仅豁免 ${allow.join(', ')}` : '无 axe violation'}`, async () => {
      const w = mountPanel(props);
      await nextTick();
      const results = await axe.run(w.element as Element, {
        runOnly: { type: 'tag', values: TAGS },
      });
      const violations = results.violations.map((v) => v.id).filter((id) => !allow.includes(id));
      expect(violations).toEqual([]);
      // 豁免项要**真的出现**（否则豁免会变成永久的假绿灯）
      for (const id of allow) {
        expect(results.violations.map((v) => v.id)).toContain(id);
      }
      w.unmount();
    });
  }
});

describe('PickerPanel · role / ARIA 契约（L5）', () => {
  it('根是 `div[tabindex=0]` 且**没有 role**（与上游一致：面板不自造语义）', () => {
    const w = mountPanel();
    const root = w.element as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('tabindex')).toBe('0');
    expect(root.getAttribute('role')).toBeNull();
    w.unmount();
  });

  it('`tabIndex` 可被覆盖（`-1` = 不参与 Tab 序）', () => {
    const w = mountPanel({ tabIndex: -1 });
    expect((w.element as HTMLElement).getAttribute('tabindex')).toBe('-1');
    w.unmount();
  });

  it('⭐ 四个方向键的可访问名都在，且**都不参与 Tab 序**（`tabIndex=-1`）', () => {
    const w = mountPanel({ picker: 'date', mode: 'date' });
    // ⚠️ 选择器必须是四个方向键的类名 —— `-header button` 会把两个标题按钮也算进来
    //    （它们在 `-header-view` 里，同样在 `-header` 子树内）。本条最初就是这么写错的。
    const buttons = [
      ...w.element.querySelectorAll(
        `.${P}-header-super-prev-btn, .${P}-header-prev-btn, .${P}-header-next-btn, .${P}-header-super-next-btn`,
      ),
    ];
    const labels = buttons.map((b) => b.getAttribute('aria-label'));
    expect(labels).toEqual([
      locale.previousYear,
      locale.previousMonth,
      locale.nextMonth,
      locale.nextYear,
    ]);
    for (const button of buttons) {
      expect(button.getAttribute('tabindex')).toBe('-1');
      // 可访问名非空（axe 的 `button-name` 也覆盖这条，这里显式钉住）
      expect(button.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0);
      expect(button.textContent?.length ?? 0).toBeGreaterThan(0);
    }
    w.unmount();
  });

  it('两个标题按钮的可访问名（`yearSelect` / `monthSelect`）', () => {
    const w = mountPanel({ picker: 'date', mode: 'date' });
    expect(w.element.querySelector(`.${P}-year-btn`)?.getAttribute('aria-label')).toBe(
      locale.yearSelect,
    );
    expect(w.element.querySelector(`.${P}-month-btn`)?.getAttribute('aria-label')).toBe(
      locale.monthSelect,
    );
    w.unmount();
  });

  it('年面板的标题按钮是「十年选择」，可访问名是 `decadeSelect`', () => {
    const w = mountPanel({ picker: 'year', mode: 'year' });
    const button = w.element.querySelector(`.${P}-decade-btn`);
    expect(button?.getAttribute('aria-label')).toBe(locale.decadeSelect);
    expect(button?.textContent).toBe('2020-2029');
    w.unmount();
  });

  it('⚠️ 十年面板的标题是**纯文本**（没有按钮 ⇒ 没有 aria-label）', () => {
    const w = mountPanel({ picker: 'year', mode: 'decade' });
    expect(w.element.querySelector(`.${P}-decade-btn`)).toBeNull();
    expect(w.element.querySelector(`.${P}-header-view`)?.textContent).toBe('2000-2099');
    w.unmount();
  });

  it('月 / 季面板**没有** prev / next 两档（只有 super 侧的 2 个 + 一个标题按钮）', () => {
    for (const mode of ['month', 'quarter'] as const) {
      const w = mountPanel({ picker: mode, mode });
      // 方向键只有 super 侧的两个
      expect(
        [
          ...w.element.querySelectorAll(`.${P}-header-super-prev-btn, .${P}-header-super-next-btn`),
        ].map((b) => b.getAttribute('aria-label')),
      ).toEqual([locale.previousYear, locale.nextYear]);
      expect(w.element.querySelector(`.${P}-header-prev-btn`)).toBeNull();
      expect(w.element.querySelector(`.${P}-header-next-btn`)).toBeNull();
      // 标题按钮仍在（一个「年」）
      const titleButtons = [...w.element.querySelectorAll(`.${P}-header-view button`)];
      expect(titleButtons.map((b) => b.getAttribute('aria-label'))).toEqual([locale.yearSelect]);
      w.unmount();
    }
  });

  it('时间面板的表头只有文本槽（没有按钮）', () => {
    const w = mountPanel({ picker: 'time', mode: 'time' });
    expect(w.element.querySelectorAll(`.${P}-header button`)).toHaveLength(0);
    w.unmount();
  });

  it('禁用格仍带 `title`（`td[title]`），且 `-disabled` 只加类名、不加 `aria-disabled`', () => {
    const w = mountPanel({
      picker: 'date',
      mode: 'date',
      disabledDate: (date: PanelDateType) => generateConfig.getDate(date) % 7 === 0,
    });
    const disabledCells = [...w.element.querySelectorAll(`.${P}-cell-disabled`)];
    expect(disabledCells.length).toBeGreaterThan(0);
    for (const cell of disabledCells) {
      expect(cell.getAttribute('title')).toBeTruthy();
      // ⚠️ 上游**不**给格子加 `aria-disabled`（它们不进 Tab 序，本来就不是可聚焦元素）
      expect(cell.getAttribute('aria-disabled')).toBeNull();
      expect(cell.getAttribute('role')).toBeNull();
    }
    w.unmount();
  });

  it('周号列的列头有一个隐藏的 `span`（文案是 `locale.week`）并带 `key=empty` 的 `th`', () => {
    const w = mountPanel({ picker: 'date', mode: 'date', showWeek: true });
    const th = w.element.querySelector(`.${P}-content thead th`);
    expect(th?.textContent).toBe(locale.week);
    const span = th?.querySelector('span');
    // 🚨 隐藏方式是 `opacity: 0`，**不是** `visibility: hidden`（本条最初记错了）。
    //    四个内联属性都是上游原样：`width:0 / height:0 / position:absolute /
    //    overflow:hidden / opacity:0` —— 目的是「让屏幕阅读器读到 `Week` 但不占位」。
    //    ⚠️ 与双面板的 `-header-btn` 那处**不同**：那里用的是 `visibility: hidden`
    //    （要保留占位）。两处的隐藏手段不可互换。
    expect(span?.getAttribute('style')).toContain('opacity: 0');
    expect(span?.getAttribute('style')).toContain('overflow: hidden');
    w.unmount();
  });

  it('时间列有 `data-type` / `data-value`（键盘与滚动定位靠它，不是靠 ARIA）', () => {
    const w = mountPanel({
      picker: 'time',
      mode: 'time',
      showHour: true,
      showMinute: false,
      showSecond: false,
    });
    const columns = [...w.element.querySelectorAll(`.${P}-time-panel-column`)];
    expect(columns).toHaveLength(1);
    expect(columns[0]?.getAttribute('data-type')).toBe('hour');
    const items = [...w.element.querySelectorAll(`.${P}-time-panel-cell`)];
    expect(items).toHaveLength(24);
    expect(items[0]?.getAttribute('data-value')).toBe('0');
    // ⚠️ 上游**不**给 `ul` / `li` 加 role（不是 listbox）
    expect(columns[0]?.getAttribute('role')).toBeNull();
    expect(items[0]?.getAttribute('role')).toBeNull();
    w.unmount();
  });

  it('`hideHeader` 时整块表头（含所有按钮）都不渲染', () => {
    const w = mountPanel({ picker: 'date', mode: 'date', hideHeader: true });
    expect(w.element.querySelector(`.${P}-header`)).toBeNull();
    expect(w.element.querySelectorAll('button')).toHaveLength(0);
    w.unmount();
  });
});
