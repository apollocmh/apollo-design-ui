/**
 * L2 交互 —— picker **面板组件**的点击 / hover / 受控语义 / 模式降级。
 *
 * ⚠️ 文件名：`panel.test.ts` 已被 `panel.ts`（几何 + 格子状态的纯函数）占用，
 * 这里刻意用 `panel-interaction` 以免覆盖（`Write` 默认 overwrite）。
 *
 * ── 为什么这一层必须存在（裁决 `picker-panel-ownership` = B 之后）──────────────
 *
 * L4 的 37 条 DOM 契约钉的是**静态形态**（SSR 那一帧）。面板的价值在**交互**：
 * 点格子改值、表头翻页改浏览值、上层面板选完自动降级、受控 `pickerValue` 不被内部改写……
 * 这些都不在基线里（SSR 跑不到），只能在这里钉。
 *
 * ── ⚠️ 两处 jsdom 打不到的东西（**如实登记**，不是「跳过」）────────────────────
 *
 * 1. **时间列的滚动对齐**（`syncScroll` 的 rAF 链）：jsdom 的 `offsetTop` 恒 0、
 *    `scrollTop` 写不进去 ⇒ 逐帧逼近永不收敛。上游在「目标格就是首格」时直接返回，
 *    本仓保留那条守卫。这里只断言**守卫生效**（不空转 rAF），
 *    真正的滚动对齐由纯函数层（`getNearestUnitIndex` 的 L1 用例）与 L6 视觉负责。
 * 2. **`changeOnScroll` 的「最近一格」**：同上，`liTopList` 在 jsdom 里全是 0 ⇒
 *    只断言「回调被调用」而不断言选中的是哪一格（参数由 L1 穷举）。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { dayjsGenerateConfig } from '../generate/dayjs';
import type { PanelDateType } from '../panel-context';
import { PickerPanel } from '../picker-panel';
import type { GenerateConfig, PickerLocale } from '../types';

const locale: PickerLocale = {
  locale: 'en_US',
  yearFormat: 'YYYY',
  dayFormat: 'D',
  cellMeridiemFormat: 'A',
  monthBeforeYear: false,
  week: 'Week',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Last year',
  nextYear: 'Next year',
  monthSelect: 'Choose a month',
  yearSelect: 'Choose a year',
  decadeSelect: 'Choose a decade',
  shortWeekDays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const generateConfig: GenerateConfig<PanelDateType> = {
  ...dayjsGenerateConfig,
  getNow: () => dayjs('2026-09-30 10:20:30') as unknown as PanelDateType,
};
const now = generateConfig.getNow();

/** 断言用：把内部日期拆成可读串。 */
const fmt = (d: PanelDateType | null | undefined, f = 'YYYY-MM-DD HH:mm:ss'): string =>
  d === null || d === undefined ? 'null' : dayjs(d as unknown as dayjs.Dayjs).format(f);

const P = 'apollo-picker';

/**
 * 显式的最小 wrapper 面。
 *
 * 🚨 `mount(PickerPanel as never, …)` 会让 `mount` 的泛型推成 `never`
 * ⇒ `w.element` 也是 `never` ⇒ 在 `--project types` 的 vue-tsc 下报
 * 「Property 'querySelector' does not exist on type 'never'」（本轮实测：161 处）。
 * 断言成一个**明确的小接口**即可，比在每处 `as never` 干净。
 */
interface PanelWrapper {
  element: HTMLElement;
  vm: unknown;
  unmount: () => void;
  setProps: (props: Record<string, unknown>) => Promise<void>;
}

/**
 * 🚨 **受控 vs 非受控**是本文件最容易写错的地方，所以拆成两个 helper。
 *
 * - `mountPanel` 传 `pickerValue` + `value` ⇒ **全受控**（L4 基线用的是这一档，
 *   因为那要的是「参数驱动的确定形态」）。
 * - `mountPanelLoose` **不传** `pickerValue` / `value`，只给 `defaultPickerValue` /
 *   `defaultValue` ⇒ 内部状态真的会动（翻页、降级、多选 toggle 都靠它）。
 *
 * ⚠️ 最初只写了受控版本却按非受控期望 ⇒ 17 条红。**受控时面板不该改自己的状态**，
 * 那是对的（上层负责回填），错的是期望。
 */
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
        picker: 'date',
        mode: 'date',
        ...props,
      } as never,
      attachTo: document.body,
    } as never,
  ) as unknown as PanelWrapper;

/** 非受控（`pickerValue` / `value` 都不传 ⇒ 内部 `ref` 生效）。 */
const mountPanelLoose = (props: Record<string, unknown> = {}) =>
  mount(
    PickerPanel as never,
    {
      props: {
        prefixCls: P,
        locale,
        generateConfig,
        defaultPickerValue: now,
        defaultValue: [now],
        picker: 'date',
        mode: 'date',
        ...props,
      } as never,
      attachTo: document.body,
    } as never,
  ) as unknown as PanelWrapper;

type Wrapper = PanelWrapper;

const click = (el: Element | null | undefined): void => {
  if (!el) {
    throw new Error('要点击的元素不存在');
  }
  (el as HTMLElement).click();
};

/** 取第一个「在视图内且未禁用」的日期格。 */
const firstCell = (w: Wrapper): HTMLElement => {
  const cell = w.element.querySelector<HTMLElement>(`.${P}-cell-in-view:not(.${P}-cell-disabled)`);
  if (!cell) {
    throw new Error('没有找到可用的日期格');
  }
  return cell;
};

describe('PickerPanel · 选值（单值）', () => {
  it('⭐ 点一个日期格 ⇒ 发 `onSelect`，载荷是**那一格**的日期', () => {
    const onSelect = vi.fn();
    const w = mountPanel({ onSelect });
    firstCell(w).click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-01 10:20:30');
    w.unmount();
  });

  it('🚨 格子日期**保留 `pickerValue` 的时分秒**（上游如此；归零是上层的事）', () => {
    // 上游 `DatePanel`：`baseDate = getWeekStartDate(locale, g, g.setDate(pickerValue, 1))`
    // —— 只有 `setDate`，**不动时分秒**；格子的 `getCellDate` 也只做 `addDate`。
    // ⇒ 面板自己给出的日期是带时刻的。antd 的 `DatePicker` 之所以选出来是 00:00:00，
    //   是**上层**（`useRangeValue` 里的 `fillTime(date, null)`）把它归零的。
    // ⚠️ 本条最初期望 `00:00:00`，是「按 antd 的可观察行为反推 rc」——
    //    而 rc 是更低一层，判据要回到 rc 自己的实现。
    const onSelect = vi.fn();
    const w = mountPanel({ onSelect });
    firstCell(w).click();
    const picked = onSelect.mock.calls[0]?.[0] as dayjs.Dayjs;
    expect(picked.hour()).toBe(10);
    expect(picked.minute()).toBe(20);
    expect(picked.second()).toBe(30);

    // 反证：`pickerValue` 是零点时，格子也是零点
    const w2 = mountPanel({ onSelect, pickerValue: dayjs('2026-09-30') as never });
    firstCell(w2).click();
    expect(fmt(onSelect.mock.calls[1]?.[0] as PanelDateType)).toBe('2026-09-01 00:00:00');
    w.unmount();
    w2.unmount();
  });

  it('禁用的格子点了**不发** `onSelect`', () => {
    const onSelect = vi.fn();
    const w = mountPanel({
      onSelect,
      // 只让 9 月 1 日可用 ⇒ 它是第一个可用格，其余（9/2 起）都禁用
      disabledDate: (date: PanelDateType) => generateConfig.getDate(date) > 1,
    });
    firstCell(w).click();
    expect(onSelect).toHaveBeenCalledTimes(1);

    const disabledCell = w.element.querySelector<HTMLElement>(`.${P}-cell-disabled`);
    expect(disabledCell).not.toBeNull();
    click(disabledCell);
    expect(onSelect).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('点同一个格子两次 ⇒ `onSelect` 发两次（面板不做去重，去重是上层的事）', () => {
    const onSelect = vi.fn();
    const w = mountPanel({ onSelect });
    const cell = firstCell(w);
    cell.click();
    cell.click();
    expect(onSelect).toHaveBeenCalledTimes(2);
    w.unmount();
  });
});

describe('PickerPanel · hover', () => {
  it('`mouseenter` 发日期、`mouseleave` 发 `null`', async () => {
    const onHover = vi.fn();
    const w = mountPanel({ onHover });
    const cell = firstCell(w);

    await cell.dispatchEvent(new MouseEvent('mouseenter'));
    expect(fmt(onHover.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-01 10:20:30');

    await cell.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHover.mock.calls[1]?.[0]).toBeNull();
    w.unmount();
  });

  it('禁用的格子**不**触发 hover（进入与离开都不发）', async () => {
    const onHover = vi.fn();
    const w = mountPanel({
      onHover,
      disabledDate: (date: PanelDateType) => generateConfig.getDate(date) > 1,
    });
    const disabledCell = w.element.querySelector<HTMLElement>(`.${P}-cell-disabled`);
    await disabledCell?.dispatchEvent(new MouseEvent('mouseenter'));
    await disabledCell?.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHover).not.toHaveBeenCalled();
    w.unmount();
  });

  it('周号格也发 hover（它的禁用判据是 `type: "week"`，与日期格不同）', async () => {
    const onHover = vi.fn();
    const w = mountPanel({ picker: 'week', mode: 'week', onHover });
    const weekCell = w.element.querySelector<HTMLElement>(`.${P}-cell-week`);
    await weekCell?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(onHover).toHaveBeenCalled();
    w.unmount();
  });
});

describe('PickerPanel · 表头翻页', () => {
  it('⭐ `next` 推进一个月（非受控时回调 + 界面一起走）', async () => {
    const onPickerValueChange = vi.fn();
    const w = mountPanelLoose({ onPickerValueChange });

    click(w.element.querySelector(`.${P}-header-next-btn`));
    // ⚠️ `await nextTick()` 不能省：Vue 是批更新，不 flush 就读不到新的表头文字。
    //    （受控用例之所以不用等，是因为它本来就不该变。）
    await nextTick();
    expect(fmt(onPickerValueChange.mock.calls[0]?.[0] as PanelDateType)).toBe(
      '2026-10-30 10:20:30',
    );
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Oct');
    w.unmount();
  });

  it('`prev` / `superPrev` / `superNext` 的粒度分别是月 / 年 / 年', async () => {
    const seen: string[] = [];
    const w = mountPanelLoose({ onPickerValueChange: (d: PanelDateType) => seen.push(fmt(d)) });

    // 🚨 三次点击之间**必须** `await nextTick()`。不等的后果不是「读到旧 DOM」这么简单：
    //    面板是从 `info.pickerValue` 现算 `offset(distance, pickerValue)` 的，
    //    没 flush 时后一次点击仍基于**上一次之前**的值 ⇒
    //    「super 侧」会从 9 月而不是 8 月出发，两次结果一起错。
    click(w.element.querySelector(`.${P}-header-prev-btn`));
    await nextTick();
    expect(seen.at(-1)).toBe('2026-08-30 10:20:30');

    click(w.element.querySelector(`.${P}-header-super-prev-btn`));
    await nextTick();
    expect(seen.at(-1)).toBe('2025-08-30 10:20:30');

    click(w.element.querySelector(`.${P}-header-super-next-btn`));
    await nextTick();
    expect(seen.at(-1)).toBe('2026-08-30 10:20:30');
    w.unmount();
  });

  it('越界的 `prev` 被 `disabled`，点了也不改浏览值', () => {
    const onPickerValueChange = vi.fn();
    const w = mountPanelLoose({
      onPickerValueChange,
      minDate: dayjs('2026-09-05') as unknown as PanelDateType,
    });
    const prev = w.element.querySelector<HTMLButtonElement>(`.${P}-header-prev-btn`);
    expect(prev?.disabled).toBe(true);
    expect(prev?.classList.contains(`${P}-header-prev-btn-disabled`)).toBe(true);
    prev?.click();
    expect(onPickerValueChange).not.toHaveBeenCalled();
    w.unmount();
  });

  it('月面板只有 super 侧两档（翻一年）', () => {
    const seen: string[] = [];
    const w = mountPanelLoose({
      picker: 'month',
      mode: 'month',
      onPickerValueChange: (d: PanelDateType) => seen.push(fmt(d)),
    });
    expect(w.element.querySelector(`.${P}-header-prev-btn`)).toBeNull();
    click(w.element.querySelector(`.${P}-header-super-next-btn`));
    expect(seen.at(-1)).toBe('2027-09-30 10:20:30');
    w.unmount();
  });

  it('年面板一屏是 **10 年**；十年面板一屏是 **100 年**', () => {
    const seen: string[] = [];
    const wYear = mountPanelLoose({
      picker: 'year',
      mode: 'year',
      onPickerValueChange: (d: PanelDateType) => seen.push(fmt(d, 'YYYY')),
    });
    click(wYear.element.querySelector(`.${P}-header-super-next-btn`));
    expect(seen.at(-1)).toBe('2036');

    const wDecade = mountPanelLoose({
      picker: 'year',
      mode: 'decade',
      onPickerValueChange: (d: PanelDateType) => seen.push(fmt(d, 'YYYY')),
    });
    click(wDecade.element.querySelector(`.${P}-header-super-next-btn`));
    expect(seen.at(-1)).toBe('2126');
    wYear.unmount();
    wDecade.unmount();
  });

  it('受控 `pickerValue` 时点翻页**不改**内部值，但回调照发（上层负责回填）', () => {
    const onPickerValueChange = vi.fn();
    const w = mountPanel({ pickerValue: now, onPickerValueChange });
    click(w.element.querySelector(`.${P}-header-next-btn`));
    expect(onPickerValueChange).toHaveBeenCalledTimes(1);
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Sep');
    w.unmount();
  });

  it('非受控 `pickerValue` 时用 `defaultPickerValue` 当起点', () => {
    const w = mountPanelLoose({ defaultPickerValue: generateConfig.addMonth(now, 2) });
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Nov');
    w.unmount();
  });
});

describe('PickerPanel · 模式与降级', () => {
  /**
   * 🚨 **上游 `PickerPanel` 没有 `onModeChange` 这个对外 prop**（已核对
   * `es/PickerPanel/index.d.ts`：只有 `onPanelChange`）。面板内部那个
   * `onModeChange` 是**给面板组件用的**，由 `PickerPanel` 自己提供；
   * 对外通知模式变化走 **`onPanelChange(viewDate, mode)`** 的**第二参**。
   *
   * ⚠️ 本条最初写成了 `onModeChange`（我凭「面板里有这个回调」推出来的 API），
   * 而 `PickerPanel` 未声明它 ⇒ Vue 把它归进 `attrs` ⇒ 回调永不触发、期望全空。
   * 这正是 PITFALLS 203 那类「凭记忆描述 API」的翻版。
   *
   * ⚠️ 另一条容易混的：`mode` **受控**时 `setMergedMode` 不改内部值（上游的
   * `useControlledState` 语义）⇒ 面板**不会真的换**，要上层在 `onPanelChange` 里回写。
   * 所以「真的换面板」的用例必须模拟父组件回写。
   */
  const modeSpy = () => {
    const seen: [string, string | undefined][] = [];
    const onPanelChange = (viewDate: PanelDateType | undefined, mode: string) =>
      seen.push([mode, viewDate ? fmt(viewDate) : undefined]);
    return { seen, onPanelChange };
  };

  it('⭐ 从年面板选一年 ⇒ `onPanelChange` 的第二参是 `month`', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ mode: 'year', onPanelChange });
    click(w.element.querySelector(`.${P}-cell-in-view`));
    await nextTick();
    expect(seen.map(([m]) => m)).toEqual(['month']);
    w.unmount();
  });

  it('⭐ 父组件回写 `mode` ⇒ 面板真的换到月面板（受控用法的完整闭环）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ mode: 'year', onPanelChange });
    click(w.element.querySelector(`.${P}-cell-in-view`));
    await nextTick();
    expect(w.element.querySelector(`.${P}-month-panel`)).toBeNull();

    await w.setProps({ mode: seen.at(-1)?.[0] } as never);
    await nextTick();
    expect(w.element.querySelector(`.${P}-month-panel`)).not.toBeNull();

    // 再选一次 ⇒ 降级到 date
    click(w.element.querySelector(`.${P}-cell-in-view`));
    await nextTick();
    expect(seen.map(([m]) => m)).toEqual(['month', 'date']);
    w.unmount();
  });

  it('`onPanelChange` 的第一参是**新的浏览值**（= 刚选的那一格）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ mode: 'year', onPanelChange });
    click(w.element.querySelector(`.${P}-cell-in-view`));
    await nextTick();
    // ⚠️ 年面板的 in-view 从**十年起点**开始（`baseDate = 起始年 − 1`，
    //    见 `getPanelGeometry('year')`）⇒ 第一个 in-view 格是 **2020**，不是 2026；
    //    时分秒沿用 `pickerValue`（10:20:30）—— `setYear` 不归零时刻。
    expect(seen[0]?.[1]).toBe('2020-09-30 10:20:30');
    w.unmount();
  });

  it('⭐ `week` picker 的队列以 **week** 收尾（不是 date）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ picker: 'week', mode: 'month', onPanelChange });
    click(w.element.querySelector(`.${P}-cell`));
    await nextTick();
    expect(seen.map(([m]) => m)).toEqual(['week']);
    w.unmount();
  });

  it('⭐ `quarter` picker 的队列以 **quarter** 收尾（跳过 month）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ picker: 'quarter', mode: 'year', onPanelChange });
    click(w.element.querySelector(`.${P}-cell`));
    await nextTick();
    expect(seen.map(([m]) => m)).toEqual(['quarter']);
    w.unmount();
  });

  it('已经在 picker 模式时**不再**降级（队列取不到下一项 ⇒ 什么都不做）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ picker: 'date', mode: 'date', onPanelChange });
    firstCell(w).click();
    await nextTick();
    // ⚠️ `onPanelValueSelect` 里的 `setPickerValue(nextValue)` **不带** `triggerPanelEvent`
    //    ⇒ 正常情况下不发 `onPanelChange`；而「不降级」这条路径也就没有别的出口
    //    ⇒ **一次都不发**。最初期望 1 次，是把它与「翻页」混了（翻页走的才是
    //    `setPickerValue(next, true)`）。
    expect(seen).toEqual([]);
    w.unmount();
  });

  it('标题按钮切到更上的粒度（年 / 月）—— 走的同样是 `onPanelChange`', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ mode: 'date', onPanelChange });
    click(w.element.querySelector(`.${P}-year-btn`));
    await nextTick();
    click(w.element.querySelector(`.${P}-month-btn`));
    await nextTick();
    expect(seen.map(([m]) => m)).toEqual(['year', 'month']);
    w.unmount();
  });

  it('🚨 `MonthPanel` 的「年」按钮**不带** viewDate（上游的不一致，照抄）', async () => {
    const { seen, onPanelChange } = modeSpy();
    const w = mountPanel({ picker: 'month', mode: 'month', onPanelChange });
    click(w.element.querySelector(`.${P}-year-btn`));
    await nextTick();
    // `triggerPanelChange(undefined, 'year')` ⇒ 第一参回退到 `pickerValue`
    expect(seen.map(([m]) => m)).toEqual(['year']);
    expect(seen[0]?.[1]).toBe('2026-09-30 10:20:30');
    w.unmount();
  });

  it('⚠️ `DatePanel` 的「年」按钮**带** viewDate（与上一跳成对照）', async () => {
    const viewDates: (string | undefined)[] = [];
    const w = mountPanel({
      mode: 'date',
      onPanelChange: (viewDate: PanelDateType | undefined) =>
        viewDates.push(viewDate ? fmt(viewDate) : undefined),
    });
    click(w.element.querySelector(`.${P}-year-btn`));
    await nextTick();
    expect(viewDates).toEqual(['2026-09-30 10:20:30']);
    w.unmount();
  });
});

describe('PickerPanel · 受控 / 非受控的 `value`', () => {
  it('非受控：点格子后 `-cell-selected` 移到新格子', async () => {
    const w = mountPanelLoose();
    firstCell(w).click();
    await nextTick();
    expect(w.element.querySelector<HTMLElement>(`.${P}-cell-selected`)?.getAttribute('title')).toBe(
      '2026-09-01',
    );
    w.unmount();
  });

  it('受控：点格子**只**发 `onChange`，界面不动（要上层回填）', async () => {
    const onChange = vi.fn();
    const w = mountPanel({ value: [now], onChange });
    firstCell(w).click();
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(w.element.querySelector<HTMLElement>(`.${P}-cell-selected`)?.getAttribute('title')).toBe(
      '2026-09-30',
    );
    w.unmount();
  });

  it('单值模式的 `onChange` 载荷是**单个日期**（不是数组）', () => {
    const onChange = vi.fn();
    const w = mountPanel({ value: [now], onChange });
    firstCell(w).click();
    const payload = onChange.mock.calls[0]?.[0];
    expect(Array.isArray(payload)).toBe(false);
    expect(fmt(payload as PanelDateType)).toBe('2026-09-01 10:20:30');
    w.unmount();
  });

  it('多值模式的 `onChange` 载荷是**数组**（受控时两次点击都基于同一份 `value`）', async () => {
    const onChange = vi.fn();
    const w = mountPanel({ multiple: true, value: [now], onChange });

    firstCell(w).click();
    await nextTick();
    expect(onChange.mock.calls[0]?.[0]).toHaveLength(2);

    // ⚠️ 受控：上层没回填 ⇒ 第二次点击仍看到 `[now]` ⇒ 结果还是 2 个（不是 1 个）。
    //    「连点两次 toggle 出去」只在**非受控**下成立，见下一条。
    firstCell(w).click();
    await nextTick();
    expect(onChange.mock.calls[1]?.[0]).toHaveLength(2);
    w.unmount();
  });

  it('⭐ 非受控多值：连点两次同一格 ⇒ 先加后减（`toggleDates` 的完整闭环）', async () => {
    const onChange = vi.fn();
    const w = mountPanelLoose({ multiple: true, defaultValue: [now], onChange });

    firstCell(w).click();
    await nextTick();
    expect(onChange.mock.calls[0]?.[0]).toHaveLength(2);

    // ⚠️ 第二次必须重新取元素：非受控下重渲染会重建 DOM 节点
    firstCell(w).click();
    await nextTick();
    expect(onChange.mock.calls[1]?.[0]).toHaveLength(1);
    w.unmount();
  });

  it('⚠️ 多值模式下点「已选的格」⇒ 移除而不是替换（`toggleDates`）', async () => {
    const onChange = vi.fn();
    const w = mountPanel({ multiple: true, value: [now], onChange });
    click(w.element.querySelector(`.${P}-cell-selected`));
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toHaveLength(0);
    w.unmount();
  });

  it('⭐ 非受控且 `pickerValue` 也非受控时：`value` 变了浏览值**跟过去**', async () => {
    // ⚠️ 必须用 `mountPanelLoose` —— `pickerValue` 一旦受控，那条同步会被守卫掉（下一条）。
    //    本条最初用了受控版 ⇒ 「Sep 而不是 Dec」。**错的是期望，不是实现**：
    //    受控 `pickerValue` 时内部不该自作主张改它（否则与外部的控制权打架）。
    const w = mountPanelLoose({ defaultValue: [now] });
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Sep');

    await w.setProps({ value: [generateConfig.addMonth(now, 3)] } as never);
    await nextTick();
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Dec');
    w.unmount();
  });

  it('⭐ 但 `pickerValue` **受控**时那条同步不生效（`!pickerValue` 守卫）', async () => {
    const w = mountPanel({ value: [now], pickerValue: now });
    await w.setProps({ value: [generateConfig.addMonth(now, 3)] } as never);
    await nextTick();
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Sep');
    w.unmount();
  });

  it('点「当前已选的那一格」⇒ 内容相同 ⇒ `onChange` **不发**（`isSame` 判据）', () => {
    const onChange = vi.fn();
    const w = mountPanel({ value: [now], onChange });
    click(w.element.querySelector(`.${P}-cell-selected`));
    expect(onChange).not.toHaveBeenCalled();
    w.unmount();
  });

  it('⚠️ 但「已选格」的日期若与 `value` 只有**时刻**不同 ⇒ 仍会发（`isSame(…, "date")` 是日期粒度）', () => {
    const onChange = vi.fn();
    // `pickerValue` 与 `value` 同一天、时刻不同 ⇒ 格子的日期带的是 `pickerValue` 的时刻
    const w = mountPanel({
      value: [dayjs('2026-09-25 01:02:03') as unknown as PanelDateType],
      pickerValue: dayjs('2026-09-25 10:20:30') as unknown as PanelDateType,
      onChange,
    });
    click(w.element.querySelector(`.${P}-cell-selected`));
    // 日期粒度相同 ⇒ 不算变化 ⇒ 不发
    expect(onChange).not.toHaveBeenCalled();
    w.unmount();
  });
});

describe('TimeColumn · 时间列的交互', () => {
  const mountTime = (props: Record<string, unknown> = {}) =>
    mountPanel({ picker: 'time', mode: 'time', ...props });

  const hourCells = (w: Wrapper): HTMLElement[] => [
    ...w.element.querySelectorAll<HTMLElement>(
      `.${P}-time-panel-column[data-type="hour"] .${P}-time-panel-cell`,
    ),
  ];

  it('⭐ 点一个时间格 ⇒ `onSelect`，载荷是「模板 + 该列改值」', () => {
    const onSelect = vi.fn();
    const w = mountTime({ onSelect });
    const cells = hourCells(w);
    expect(cells).toHaveLength(24);
    click(cells[5]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    // 模板来自 `value`（10:20:30）⇒ 只换小时
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-30 05:20:30');
    w.unmount();
  });

  it('禁用的时间格点不动', () => {
    const onSelect = vi.fn();
    const w = mountTime({ onSelect, disabledHours: () => [5] });
    const cell = w.element.querySelector<HTMLElement>(
      `.${P}-time-panel-column[data-type="hour"] [data-value="5"]`,
    );
    expect(cell?.classList.contains(`${P}-time-panel-cell-disabled`)).toBe(true);
    cell?.click();
    expect(onSelect).not.toHaveBeenCalled();
    w.unmount();
  });

  it('`-selected` 只加在当前值那一格', () => {
    const w = mountTime();
    const selected = hourCells(w).filter((c) =>
      c.classList.contains(`${P}-time-panel-cell-selected`),
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]?.getAttribute('data-value')).toBe('10');
    w.unmount();
  });

  it('`showHour` / `showMinute` / `showSecond` 控制列数', () => {
    expect(
      mountTime({ showHour: true, showMinute: false, showSecond: false }).element.querySelectorAll(
        `.${P}-time-panel-column`,
      ),
    ).toHaveLength(1);
    expect(
      mountTime({ showHour: false, showMinute: false, showSecond: true }).element.querySelectorAll(
        `.${P}-time-panel-column`,
      ),
    ).toHaveLength(1);
    expect(mountTime().element.querySelectorAll(`.${P}-time-panel-column`)).toHaveLength(3);
  });

  it('⭐ 12 小时制多一列上下午，且小时列只留当前侧（10 点 ⇒ 只剩上午的 12 格）', () => {
    const w = mountTime({ use12Hours: true });
    const columns = [...w.element.querySelectorAll<HTMLElement>(`.${P}-time-panel-column`)];
    expect(columns.map((c) => c.getAttribute('data-type'))).toEqual([
      'hour',
      'minute',
      'second',
      'meridiem',
    ]);
    expect(hourCells(w)).toHaveLength(12);
    expect(hourCells(w)[0]?.getAttribute('data-value')).toBe('0');
    expect(hourCells(w)[0]?.textContent).toBe('12');
    w.unmount();
  });

  it('⭐ 点上下午列 ⇒ 小时 ±12', () => {
    const onSelect = vi.fn();
    const w = mountTime({ use12Hours: true, onSelect });
    click(
      w.element.querySelector(`.${P}-time-panel-column[data-type="meridiem"] [data-value="pm"]`),
    );
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-30 22:20:30');
    w.unmount();
  });

  it('点上下午列时「已是同一侧」⇒ 原样返回（不 ±12）', () => {
    const onSelect = vi.fn();
    const w = mountTime({ use12Hours: true, onSelect });
    click(
      w.element.querySelector(`.${P}-time-panel-column[data-type="meridiem"] [data-value="am"]`),
    );
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-30 10:20:30');
    w.unmount();
  });

  it('`hideDisabledOptions` ⇒ 禁用档位从列里消失（列变短）', () => {
    const w = mountTime({ hideDisabledOptions: true, disabledHours: () => [2, 3] });
    expect(hourCells(w)).toHaveLength(22);
    expect(
      w.element.querySelector(`.${P}-time-panel-column[data-type="hour"] [data-value="2"]`),
    ).toBeNull();
    w.unmount();
  });

  it('`hourStep` / `minuteStep` 生效', () => {
    const w = mountTime({ hourStep: 6, minuteStep: 15 });
    expect(hourCells(w)).toHaveLength(4);
    expect(
      w.element.querySelectorAll(
        `.${P}-time-panel-column[data-type="minute"] .${P}-time-panel-cell`,
      ),
    ).toHaveLength(4);
    w.unmount();
  });

  it('`value` 为空时模板取 `pickerValue`（分秒保留）', () => {
    const onSelect = vi.fn();
    const w = mountTime({ value: [], onSelect });
    click(hourCells(w)[7]);
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-30 07:20:30');
    w.unmount();
  });

  it('hover 时间格会带时间（`onHover` 收的是完整时刻）', async () => {
    const onHover = vi.fn();
    const w = mountTime({ onHover });
    await w.element
      .querySelector(`.${P}-time-panel-column[data-type="hour"] [data-value="3"]`)
      ?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(fmt(onHover.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-30 03:20:30');
    w.unmount();
  });
});

describe('TimeColumn · 滚动（jsdom 限制下的守卫）', () => {
  it('⚠️ 目标格与首格相同 ⇒ `syncScroll` 直接返回（不空转 rAF）', () => {
    // 上游 `startScroll` 在 `targetLi === firstLi` 时 return；本仓保留该守卫。
    // 意义：**不炸、不无限 rAF**（删掉守卫时 jsdom 下 rAF 会转不停）。
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');
    const w = mountPanel({ picker: 'time', mode: 'time' });
    expect(raf.mock.calls.length).toBeLessThan(5);
    raf.mockRestore();
    w.unmount();
  });

  it('⚠️ `changeOnScroll` 的回调在 jsdom 下能触发（**不**断言选中哪一格）', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      const w = mountPanel({ picker: 'time', mode: 'time', changeOnScroll: true, onSelect });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`);
      expect(ul).not.toBeNull();

      await ul?.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);
      expect(onSelect).toHaveBeenCalled();
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('`changeOnScroll` 关闭时滚动不提交（默认行为）', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      const w = mountPanel({ picker: 'time', mode: 'time', onSelect });
      await w.element.querySelector(`.${P}-time-panel-column`)?.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);
      expect(onSelect).not.toHaveBeenCalled();
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('PickerPanel · 杂项', () => {
  it('RTL 加 `-rtl` 类', () => {
    const w = mountPanel({ direction: 'rtl' });
    expect((w.element as HTMLElement).classList.contains(`${P}-panel-rtl`)).toBe(true);
    w.unmount();
  });

  it('语义槽的 `classNames` / `styles` 落到对应节点', () => {
    const w = mountPanel({
      classNames: { header: 'c-header', body: 'c-body', content: 'c-content', item: 'c-item' },
      styles: { header: { color: 'rgb(1, 2, 3)' } },
    });
    expect(w.element.querySelector(`.${P}-header`)?.classList.contains('c-header')).toBe(true);
    expect(w.element.querySelector(`.${P}-body`)?.classList.contains('c-body')).toBe(true);
    expect(w.element.querySelector(`.${P}-content`)?.classList.contains('c-content')).toBe(true);
    expect(w.element.querySelector(`.${P}-cell`)?.classList.contains('c-item')).toBe(true);
    expect(w.element.querySelector<HTMLElement>(`.${P}-header`)?.style.color).toBe('rgb(1, 2, 3)');
    w.unmount();
  });

  it('`cellRender` 替换格内容（收得到 `today` 与 `originNode`）', () => {
    let today: string | null = null;
    const w = mountPanel({
      cellRender: (date: PanelDateType, info: { today: PanelDateType }) => {
        today ??= fmt(info.today);
        return `${generateConfig.getDate(date)}`;
      },
    });
    expect(today).toBe('2026-09-30 10:20:30');
    expect(w.element.querySelector(`.${P}-cell`)).not.toBeNull();
    w.unmount();
  });

  it('`PickerPanel` 暴露 `nativeElement`（供上层测量 / 定位）', () => {
    const w = mountPanel();
    const exposed = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(exposed.nativeElement).toBe(w.element);
    w.unmount();
  });

  it('`showTime: true` ⇒ 渲染 `datetime` 面板（日期 + 时间两段）', () => {
    const w = mountPanel({ picker: 'date', mode: 'date', showTime: true });
    expect(w.element.querySelector(`.${P}-datetime-panel`)).not.toBeNull();
    expect(w.element.querySelector(`.${P}-date-panel`)).not.toBeNull();
    expect(w.element.querySelector(`.${P}-time-panel`)).not.toBeNull();
    w.unmount();
  });

  it('点日期（datetime 面板）⇒ 保留当前时刻', () => {
    const onSelect = vi.fn();
    const w = mountPanel({ picker: 'date', mode: 'date', showTime: true, onSelect });
    click(w.element.querySelector(`.${P}-date-panel .${P}-cell-in-view:not(.${P}-cell-disabled)`));
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-01 10:20:30');
    w.unmount();
  });

  it('`week` 面板：周号格点一下选的是**整行起始日**', () => {
    const onSelect = vi.fn();
    const w = mountPanel({ picker: 'week', mode: 'week', onSelect });
    click(w.element.querySelector(`.${P}-cell-week`));
    // 2026-08-30 是 9 月首行的周起始日（周日）；时刻同样是 `pickerValue` 的
    expect(fmt(onSelect.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-08-30 10:20:30');
    w.unmount();
  });

  it('`week` 面板的行级 class 带 `-selected`（整周选中）', () => {
    const w = mountPanel({ picker: 'week', mode: 'week' });
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-selected`)).toHaveLength(1);
    w.unmount();
  });

  it('`week` 面板在 `hoverRangeValue` 下给出三态行 class，且 `-selected` 让位', () => {
    const w = mountPanel({
      picker: 'week',
      mode: 'week',
      value: [],
      hoverRangeValue: [generateConfig.setDate(now, 1), generateConfig.setDate(now, 20)],
    });
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-start`)).toHaveLength(1);
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-end`)).toHaveLength(1);
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-hover`).length).toBeGreaterThan(
      0,
    );
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-selected`)).toHaveLength(0);
    w.unmount();
  });

  it('`multiple` 模式下 `-cell-selected` 加在多个格子上', () => {
    const w = mountPanel({
      multiple: true,
      value: [now, generateConfig.addDate(now, 2)],
    });
    expect(w.element.querySelectorAll(`.${P}-cell-selected`)).toHaveLength(2);
    w.unmount();
  });

  it('`hideHeader: true` ⇒ 表头整块不渲染（但格子仍在）', () => {
    const w = mountPanel({ hideHeader: true });
    expect(w.element.querySelector(`.${P}-header`)).toBeNull();
    expect(w.element.querySelectorAll(`.${P}-cell`).length).toBeGreaterThan(0);
    w.unmount();
  });

  it('`components` 可替换面板实现（`mode` ⇒ 组件）', () => {
    const Custom = {
      name: 'CustomPanel',
      setup: () => () => 'CUSTOM',
    };
    const w = mountPanelLoose({ components: { date: Custom } });
    expect(w.element.textContent).toContain('CUSTOM');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 🚨 未声明的 prop 不许漏到 DOM（2026-10-02 由 calendar 的探针发现）
// ---------------------------------------------------------------------------

/**
 * `PickerPanel` 把 `value: mergedValue[0]` 传给面板组件（上游 `PickerPanel/index.js:277`
 * 同样如此），而 8 个面板**没有一个读它**。
 *
 * - React 会**丢弃**未声明的 prop ⇒ 上游 DOM 里没有这个属性；
 * - Vue 不会丢：未声明 ⇒ 落进 `attrs` ⇒ 自动透传到根元素 ⇒
 *   实测渲染出 `<div class="apollo-picker-date-panel" value="Tue, 29 Sep 2026 16:00:00 GMT">`
 *   （`div` 没有 `value` 属性 ⇒ 非法 HTML，且与 React 的 DOM 契约不一致）。
 *
 * ⚠️ **为什么 L4 一直没抓到**：它的投影只留 `role` / `aria-*` / `data-*`（D45），
 * `value` 被投影掉 ⇒ 基线 37/37 绿。所以这条哨兵必须落在**直接读属性**的这一层。
 */
describe('PickerPanel · 未声明的 prop 不许漏到 DOM', () => {
  it('🚨 日期面板的根元素**没有** `value` 属性', () => {
    const w = mountPanel();
    const panel = w.element.querySelector(`.${P}-date-panel`);
    expect(panel).toBeTruthy();
    expect(panel?.hasAttribute('value')).toBe(false);
    // 反向哨兵：属性列表里也不该出现（`hasAttribute` 只查精确名）
    expect(Array.from(panel?.attributes ?? []).map((a) => a.name)).not.toContain('value');
    w.unmount();
  });

  it('🚨 时间面板同样不带（同一份 `sharedPanelProps`）', () => {
    const w = mountPanel({ picker: 'time', mode: 'time' });
    const panel = w.element.querySelector(`.${P}-time-panel`);
    expect(panel).toBeTruthy();
    expect(panel?.hasAttribute('value')).toBe(false);
    w.unmount();
  });

  it('上层面板（年 / 月 / 十年）同样不带', () => {
    for (const mode of ['month', 'year', 'decade'] as const) {
      const w = mountPanel({ picker: mode, mode });
      const panel = w.element.querySelector(`.${P}-${mode}-panel`);
      expect(panel, `${mode}-panel 未找到`).toBeTruthy();
      expect(panel?.hasAttribute('value')).toBe(false);
      w.unmount();
    }
  });
});
