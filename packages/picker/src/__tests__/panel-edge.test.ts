/**
 * 面板层的**边角路径**与「逃生通道」。
 *
 * ── 为什么单独一个文件 ────────────────────────────────────────────────────────
 *
 * `panel-interaction.test.ts` 覆盖的是**主路径**（用户会走到的那些）。
 * 这里补的是三类**不会自然发生、但契约要求存在**的路径：
 *
 * 1. **逃生通道**（`PickerHackContext`）—— `hidePrev` / `hideNext` / `onCellDblClick`
 *    只有 RangePicker 会传，本包的测试里必须自建一个 provider 才能走到。
 * 2. **上层面板的 `disabledDate` 合并**（`mergeDisabledToBlock`）—— 「整月 / 整年 /
 *    整个十年都禁用才算禁用」，以及**季面板刻意不合并**这个上游的不一致。
 * 3. **时间列的滚动**（`syncScroll` 的 rAF 链与 `changeOnScroll`）—— jsdom 里
 *    `offsetTop` / `scrollTop` 恒 0，必须**自己造出布局**才能走通；造出来之后
 *    这里断言的是**真实行为**（滚到目标格、最近一格、禁用格让位），不是凑覆盖率。
 *
 * 另含「没有 provider 时怎么办」与「`onSelect` 不传时的兜底」两条防御性契约。
 */

import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type PropType, provide } from 'vue';

import { DatePanel, WeekPanel } from '../date-panel';
import { dayjsGenerateConfig } from '../generate/dayjs';
import type { PanelDateType, PanelHackContext } from '../panel-context';
import { PANEL_HACK_KEY, usePanelInfo } from '../panel-context';
import { PickerPanel } from '../picker-panel';
import { TimePanel } from '../time-panel';
import type { PickerLocale } from '../types';

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

const generateConfig = {
  ...dayjsGenerateConfig,
  getNow: () => dayjs('2026-09-30 10:20:30') as unknown as PanelDateType,
};
const now = generateConfig.getNow();

const fmt = (d: PanelDateType | null | undefined, f = 'YYYY-MM-DD HH:mm:ss'): string =>
  d === null || d === undefined ? 'null' : dayjs(d as unknown as dayjs.Dayjs).format(f);

const P = 'apollo-picker';

/** 面板组件的**最小公共 props**（`values` / `onSelect` 等留给默认值走到）。 */
const panelBase = () => ({
  prefixCls: P,
  locale,
  generateConfig,
  pickerValue: now,
});

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

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(
    PickerPanel as never,
    {
      props: {
        ...panelBase(),
        value: [now],
        defaultPickerValue: now,
        defaultValue: [now],
        picker: 'date',
        mode: 'date',
        ...props,
      } as never,
      attachTo: document.body,
    } as never,
  ) as unknown as PanelWrapper;

const click = (el: Element | null | undefined): void => {
  if (!el) {
    throw new Error('要点击的元素不存在');
  }
  (el as HTMLElement).click();
};

// ---------------------------------------------------------------------------
// 逃生通道的 provider：`PickerHackContext` 只有 RangePicker 会提供，
// 本包内部**没有任何地方**会传 `hidePrev` / `hideNext` / `onCellDblClick`
// ⇒ 必须自建一个壳才能走到 `hiddenStyleWhen(true)` 与双击回调。
// ---------------------------------------------------------------------------
const HackProvider = defineComponent({
  name: 'TestHackProvider',
  props: {
    hack: { type: Object as PropType<PanelHackContext>, default: () => ({}) },
  },
  setup(props, { slots }) {
    provide(PANEL_HACK_KEY, props.hack);
    return () => slots.default?.();
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('逃生通道（`PickerHackContext`）', () => {
  it('⭐ `hidePrev` ⇒ 两个 prev 侧按钮带 `visibility: hidden`（**保留占位**）', () => {
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { hidePrev: true } } as never,
        slots: {
          default: () => h(DatePanel as never, panelBase() as never),
        },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;

    const prev = w.element.querySelector<HTMLElement>(`.${P}-header-prev-btn`);
    const superPrev = w.element.querySelector<HTMLElement>(`.${P}-header-super-prev-btn`);
    const next = w.element.querySelector<HTMLElement>(`.${P}-header-next-btn`);

    // 🚨 `visibility: hidden` 而不是 `display: none` —— 双面板要**保留占位**，
    //    否则两张面板的宽度对不上（上游 `HIDDEN_STYLE` 的注释即此）。
    expect(prev?.style.visibility).toBe('hidden');
    expect(superPrev?.style.visibility).toBe('hidden');
    expect(next?.style.visibility).toBe('');
    // 隐藏 ≠ 不可点（上游只是视觉隐藏，`button` 仍在）
    expect(prev?.tagName).toBe('BUTTON');
    w.unmount();
  });

  it('`hideNext` ⇒ 两个 next 侧按钮带 `visibility: hidden`', () => {
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { hideNext: true } } as never,
        slots: { default: () => h(DatePanel as never, panelBase() as never) },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;
    expect(w.element.querySelector<HTMLElement>(`.${P}-header-next-btn`)?.style.visibility).toBe(
      'hidden',
    );
    expect(
      w.element.querySelector<HTMLElement>(`.${P}-header-super-next-btn`)?.style.visibility,
    ).toBe('hidden');
    expect(w.element.querySelector<HTMLElement>(`.${P}-header-prev-btn`)?.style.visibility).toBe(
      '',
    );
    w.unmount();
  });

  it('⭐ 双击日期格 ⇒ 触发 `onCellDblClick`（RangePicker 靠它「选完两段就关」）', () => {
    const onCellDblClick = vi.fn();
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { onCellDblClick } } as never,
        slots: { default: () => h(DatePanel as never, panelBase() as never) },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;

    const cell = w.element.querySelector<HTMLElement>(`.${P}-cell-in-view`);
    cell?.dispatchEvent(new MouseEvent('dblclick'));
    expect(onCellDblClick).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('禁用的格子双击**不**触发（与单击同判据）', () => {
    const onCellDblClick = vi.fn();
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { onCellDblClick } } as never,
        slots: {
          default: () =>
            h(
              DatePanel as never,
              {
                ...panelBase(),
                disabledDate: (date: PanelDateType) => generateConfig.getDate(date) > 1,
              } as never,
            ),
        },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;
    const cell = w.element.querySelector<HTMLElement>(`.${P}-cell-disabled`);
    cell?.dispatchEvent(new MouseEvent('dblclick'));
    expect(onCellDblClick).not.toHaveBeenCalled();
    w.unmount();
  });

  it('时间列的双击也走同一条通道', () => {
    const onCellDblClick = vi.fn();
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { onCellDblClick } } as never,
        slots: {
          default: () =>
            h(
              TimePanel as never,
              {
                ...panelBase(),
                values: [now],
                showTime: { showHour: true, showMinute: false, showSecond: false },
              } as never,
            ),
        },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;
    const cell = w.element.querySelector<HTMLElement>(
      `.${P}-time-panel-column[data-type="hour"] .${P}-time-panel-cell`,
    );
    cell?.dispatchEvent(new MouseEvent('dblclick'));
    expect(onCellDblClick).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});

describe('防御性契约', () => {
  it('⚠️ 没有 provider 时 `usePanelInfo()` 的读取**抛错**（不是返回空壳）', () => {
    // `inject` 在 setup 外调用会告警并返回 undefined ⇒ 走 fallback 分支。
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = usePanelInfo();
    expect(() => void info.value).toThrow(/必须在某个面板组件的子树内使用/);
    warn.mockRestore();
  });

  it('⚠️ `onSelect` 不传时内部兜底成空函数（点格子不炸）', () => {
    const w = mount(
      DatePanel as never,
      { props: panelBase() as never, attachTo: document.body } as never,
    ) as unknown as PanelWrapper;
    // 面板在没有 `values` / `onSelect` 时也要能渲染（两者的默认值分别走到）
    click(w.element.querySelector(`.${P}-cell-in-view`));
    expect(w.element.querySelector(`.${P}-cell`)).not.toBeNull();
    w.unmount();
  });

  it('`values` 缺省为 `[]`（不传也能渲染，且没有 selected）', () => {
    const w = mount(
      DatePanel as never,
      { props: panelBase() as never, attachTo: document.body } as never,
    ) as unknown as PanelWrapper;
    expect(w.element.querySelectorAll(`.${P}-cell-selected`)).toHaveLength(0);
    w.unmount();
  });

  it('`TimePanel` 不传 `showTime` 也能渲染（默认 `{}` ⇒ 只出表头文字）', () => {
    const w = mount(
      TimePanel as never,
      { props: { ...panelBase(), values: [now] } as never, attachTo: document.body } as never,
    ) as unknown as PanelWrapper;
    // ⚠️ 根元素要用 `w.element` 自己判 —— `w.element.querySelector` 只在**子树**里找，
    //    拿不到根（本条最初就是这么写错的）。
    expect(w.element.classList.contains(`${P}-time-panel`)).toBe(true);
    // 没有任何 showXxx ⇒ 零列
    expect(w.element.querySelectorAll(`.${P}-time-panel-column`)).toHaveLength(0);
    w.unmount();
  });
});

describe('上层面板的 `disabledDate` 合并', () => {
  /** 月面板：**整月**都禁用才算禁用（当年 3 月整月禁用）。 */
  it('⭐ 月面板：整月禁用 ⇒ 该月格禁用；只禁月初 ⇒ **不禁用**', () => {
    const marchDisabled = (date: PanelDateType): boolean => generateConfig.getMonth(date) === 2;
    const onlyFirstDay = (date: PanelDateType): boolean =>
      generateConfig.getMonth(date) === 2 && generateConfig.getDate(date) === 1;

    const wFull = mountPanel({ picker: 'month', mode: 'month', disabledDate: marchDisabled });
    const marchCell = [...wFull.element.querySelectorAll<HTMLElement>(`.${P}-cell`)].find((c) =>
      c.textContent?.includes('Mar'),
    );
    expect(marchCell?.classList.contains(`${P}-cell-disabled`)).toBe(true);
    // 其余月份不禁用
    expect(wFull.element.querySelectorAll(`.${P}-cell-disabled`)).toHaveLength(1);
    wFull.unmount();

    const wPartial = mountPanel({ picker: 'month', mode: 'month', disabledDate: onlyFirstDay });
    // 「只有 3 月 1 日禁用」⇒ 3 月**不是**整月禁用 ⇒ 月格可用
    expect(wPartial.element.querySelectorAll(`.${P}-cell-disabled`)).toHaveLength(0);
    wPartial.unmount();
  });

  it('⭐ 年面板：整年禁用 ⇒ 该年格禁用', () => {
    const w = mountPanel({
      picker: 'year',
      mode: 'year',
      disabledDate: (date: PanelDateType) => generateConfig.getYear(date) === 2024,
    });
    const disabled = [...w.element.querySelectorAll<HTMLElement>(`.${P}-cell-disabled`)];
    expect(disabled).toHaveLength(1);
    expect(disabled[0]?.textContent).toBe('2024');
    w.unmount();
  });

  it('⭐ 十年面板：按 **10 年**片段合并（与百年起点不是同一粒度）', () => {
    // `mergeDisabledToBlock('decade')` 用的是 `floor(year/10)*10`，**不是** 100。
    // 禁用 [2010, 2019] 这十年 ⇒ 对应的那个十年格（2010-2019 那个格子）禁用。
    const w = mountPanel({
      picker: 'year',
      mode: 'decade',
      disabledDate: (date: PanelDateType) => {
        const year = generateConfig.getYear(date);
        return year >= 2010 && year <= 2019;
      },
    });
    const disabled = [...w.element.querySelectorAll<HTMLElement>(`.${P}-cell-disabled`)];
    expect(disabled.map((c) => c.textContent)).toEqual(['2010-2019']);
    w.unmount();
  });

  it('🚨 季面板**刻意不合并**（上游的不一致）：只看季首那一天', () => {
    // `QuarterPanel` 直接透传 `props`，**没有** `mergedDisabledDate` 这一层
    // ⇒ `disabledDate` 只会被拿**格子的那一个日期**（这里是 4/30）去判，
    //    而不是「整季是否禁用」。
    // 对照：月面板判「整月的首末两端都禁用」，年面板判「整年首末两端都禁用」。
    //
    // 🚨 两个容易踩的点（本轮实测）：
    //   ① 季格的日期是 `setMonth(pickerValue, 0)` + `addMonth(offset * 3)` ⇒
    //      **保留 `pickerValue` 的「日」**（本测 = 30 号，不是 1 号）；
    //   ② 所以「禁 Q2」要判 **月份**（4 月），判 `date === 1` 永远不命中。
    const wPartial = mountPanel({
      picker: 'quarter',
      mode: 'quarter',
      disabledDate: (date: PanelDateType) => generateConfig.getMonth(date) === 3,
    });
    // ⚠️ 文本是 `cellQuarterFormat`（`'[Q]Q'`）的产物 = `Q2`；
    //    `fieldQuarterFormat`（`'YYYY-[Q]Q'`）只用在格子的 `title` 上。
    expect(
      [...wPartial.element.querySelectorAll<HTMLElement>(`.${P}-cell-disabled`)].map(
        (c) => c.textContent,
      ),
    ).toEqual(['Q2']);
    wPartial.unmount();

    // 反证「不合并」：禁「4 月的第 15 天」而季格在 4/30 ⇒ 不命中 ⇒ 不禁用。
    // （若真的做了整季合并，4/15 落在 Q2 里 ⇒ 会被判禁用。这就是「不合并」的可证伪判据。）
    const wMid = mountPanel({
      picker: 'quarter',
      mode: 'quarter',
      disabledDate: (date: PanelDateType) =>
        generateConfig.getMonth(date) === 3 && generateConfig.getDate(date) === 15,
    });
    expect(wMid.element.querySelectorAll(`.${P}-cell-disabled`)).toHaveLength(0);
    wMid.unmount();
  });

  it('月面板的标题按钮仍可点（合并只影响格子，不影响表头）', () => {
    const onPanelChange = vi.fn();
    const w = mountPanel({
      picker: 'month',
      mode: 'month',
      disabledDate: () => true,
      onPanelChange,
    });
    expect(w.element.querySelectorAll(`.${P}-cell-disabled`)).toHaveLength(12);
    click(w.element.querySelector(`.${P}-header-super-next-btn`));
    expect(onPanelChange).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});

describe('周面板的行级 `hoverValue`', () => {
  it('`hoverValue` 让**整周**行带上 `-hover` 类', () => {
    const w = mountPanel({
      picker: 'week',
      mode: 'week',
      value: [],
      hoverValue: [generateConfig.setDate(now, 10)],
    });
    // 9/10 所在的那一周正好是 9/7–9/13
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-hover`)).toHaveLength(1);
    w.unmount();
  });

  it('`hoverRangeValue` 优先于 `hoverValue`（两者可同时出现）', () => {
    const w = mountPanel({
      picker: 'week',
      mode: 'week',
      value: [],
      hoverRangeValue: [generateConfig.setDate(now, 1), generateConfig.setDate(now, 20)],
      hoverValue: [generateConfig.setDate(now, 10)],
    });
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-start`)).toHaveLength(1);
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-hover`).length).toBeGreaterThan(
      0,
    );
    w.unmount();
  });

  it('周号格的 `mouseleave` 发 `onHover(null)`', async () => {
    const onHover = vi.fn();
    const w = mountPanel({ picker: 'week', mode: 'week', onHover });
    await w.element.querySelector(`.${P}-cell-week`)?.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHover).toHaveBeenCalledWith(null);
    w.unmount();
  });

  it('周号列通过 `showWeek` 显式打开时，data 面板也有**周号列与对应格**', () => {
    const onSelect = vi.fn();
    const w = mountPanel({ picker: 'date', mode: 'date', showWeek: true, onSelect });
    expect(w.element.querySelectorAll(`.${P}-cell-week`).length).toBeGreaterThan(0);
    expect(
      w.element.querySelector(`.${P}-date-panel`)?.classList.contains(`${P}-date-panel-show-week`),
    ).toBe(true);
    w.unmount();
  });
});

describe('locale 的两条分支', () => {
  it('`locale.monthFormat` 给了 ⇒ 月份标题走 `formatValue`（不再是 `shortMonths`）', () => {
    const w = mountPanel({ locale: { ...locale, monthFormat: 'MMM' } });
    // `MMM` 在 en 下是 `Sep`
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Sep');

    const w2 = mountPanel({ locale: { ...locale, monthFormat: 'MMMM' } });
    expect(w2.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('September');
    w.unmount();
    w2.unmount();
  });

  it('`monthBeforeYear` 控制标题里月 / 年的顺序', () => {
    const w = mountPanel({ locale: { ...locale, monthBeforeYear: true } });
    const first = w.element.querySelector(`.${P}-header-view button`);
    expect(first?.classList.contains(`${P}-month-btn`)).toBe(true);

    const w2 = mountPanel({ locale: { ...locale, monthBeforeYear: false } });
    expect(
      w2.element.querySelector(`.${P}-header-view button`)?.classList.contains(`${P}-year-btn`),
    ).toBe(true);
    w.unmount();
    w2.unmount();
  });

  it('`cellMeridiemFormat` 生效于上下午列', () => {
    const w = mountPanel({
      picker: 'time',
      mode: 'time',
      use12Hours: true,
      locale: { ...locale, cellMeridiemFormat: 'a' },
    });
    const labels = [
      ...w.element.querySelectorAll(
        `.${P}-time-panel-column[data-type="meridiem"] .${P}-time-panel-cell`,
      ),
    ].map((c) => c.textContent);
    expect(labels).toEqual(['am', 'pm']);
    w.unmount();
  });
});

describe('时间列的滚动（自己造布局）', () => {
  /**
   * 给 `<ul>` 与它的 `<li>` 装上**真实的** `offsetTop` / `scrollTop`。
   *
   * jsdom 里两者恒 0（`offsetTop` 是只读 0，`scrollTop` 写不进去）⇒
   * `syncScroll` 会一直「距离变小但不到 1」。这里用 `defineProperty` 造出可写的布局，
   * 才能在 jsdom 里走通 rAF 收敛。
   */
  const installLayout = (ul: HTMLElement, step = 30) => {
    const items = [...ul.querySelectorAll<HTMLElement>('li')];
    items.forEach((li, index) => {
      Object.defineProperty(li, 'offsetTop', { value: index * step, configurable: true });
    });
    let top = 0;
    Object.defineProperty(ul, 'scrollTop', {
      get: () => top,
      set: (value: number) => {
        top = value;
      },
      configurable: true,
    });
    return { items, readTop: () => top };
  };

  /** 把 rAF 收进队列，由测试显式驱动（不依赖真实帧）。 */
  const captureRaf = () => {
    const queue: FrameRequestCallback[] = [];
    let id = 0;
    const raf = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        queue.push(cb);
        id += 1;
        return id;
      });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    return {
      raf,
      run(max = 60): number {
        let frames = 0;
        while (queue.length > 0 && frames < max) {
          const cb = queue.shift();
          frames += 1;
          cb?.(frames * 16);
        }
        return frames;
      },
    };
  };

  const mountTime = () =>
    mountPanel({
      picker: 'time',
      mode: 'time',
      showHour: true,
      showMinute: false,
      showSecond: false,
    });

  it('⭐ `syncScroll` 逐帧逼近目标格（每帧走剩余距离的 1/3），最终**精确落位**', async () => {
    const frames = captureRaf();
    try {
      // ⚠️ 挂载时必须让「目标格 = 首格」—— 否则 `doScroll` 是**同步**调用的，
      //    mount 阶段就会排一个（offsetTop 全 0 触发的）重试帧进队列。
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        value: [generateConfig.setHour(now, 0)],
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`);
      expect(ul).not.toBeNull();
      const { readTop } = installLayout(ul as HTMLElement);

      // 改值 ⇒ 触发 `watch`（`flush: 'post'`）⇒ `startScroll`
      await w.setProps({ value: [generateConfig.setHour(now, 5)] } as never);
      await nextTick();

      const count = frames.run();
      expect(count).toBeGreaterThan(1);
      // 目标格是 #5 ⇒ offsetTop = 150；收敛条件是 `dist <= 1` ⇒ 直接赋值 `targetTop`
      expect(readTop()).toBe(150);
      w.unmount();
    } finally {
      frames.raf.mockRestore();
    }
  });

  it('⭐ 目标格就是首格 ⇒ **一帧都不发**（上游的守卫，防止空转）', async () => {
    const frames = captureRaf();
    try {
      const w = mountTime();
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`);
      const { readTop } = installLayout(ul as HTMLElement);

      // 值改成 0 点 ⇒ `targetLi === firstLi` ⇒ 直接 return
      await w.setProps({ value: [generateConfig.setHour(now, 0)] } as never);
      await nextTick();
      expect(frames.run()).toBe(0);
      expect(readTop()).toBe(0);
      w.unmount();
    } finally {
      frames.raf.mockRestore();
    }
  });

  it('⭐ 距离**变大** ⇒ 判定「用户在手动滚」并立刻停（帧数远少于正常收敛）', async () => {
    const frames = captureRaf();
    try {
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        value: [generateConfig.setHour(now, 0)],
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`) as HTMLElement;
      const items = [...ul.querySelectorAll<HTMLElement>('li')];
      items.forEach((li, index) => {
        Object.defineProperty(li, 'offsetTop', { value: index * 30, configurable: true });
      });
      // 第 2 次读 `scrollTop` 时返回一个**远超目标**的值 ⇒ `nextTop` 离目标更远
      let reads = 0;
      Object.defineProperty(ul, 'scrollTop', {
        get: () => {
          reads += 1;
          return reads >= 2 ? 10_000 : 0;
        },
        set: () => {},
        configurable: true,
      });

      await w.setProps({ value: [generateConfig.setHour(now, 5)] } as never);
      await nextTick();
      // 帧 1：dist=100，记 lastDist；帧 2 读到 10000 ⇒ dist 变大 ⇒ stopScroll、不再排帧。
      // ⚠️ 不用「恰好 2 帧」这种脆断言（同步那次 `doScroll` 也会读一次 scrollTop）：
      //    判据是「**远少于**正常收敛所需的帧数」—— 正常收敛（150 → dist ≤ 1，每帧 ×2/3）
      //    要约 14 帧，这里 ≤ 4 帧就停了。
      expect(frames.run()).toBeLessThan(5);
      w.unmount();
    } finally {
      frames.raf.mockRestore();
    }
  });

  it('⭐ `changeOnScroll`：滚动停下 300ms 后提交**离滚动位置最近的那一格**', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        changeOnScroll: true,
        onSelect,
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`) as HTMLElement;
      const { items } = installLayout(ul);
      expect(items).toHaveLength(24);

      // 停在 35 ⇒ 离第 1 格（30）最近
      Object.defineProperty(ul, 'scrollTop', { value: 35, configurable: true, writable: true });
      await ul.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);

      expect(onSelect).toHaveBeenCalledTimes(1);
      // ⚠️ 先取出来再断言：写 `(calls[0]?.[0] as X).hour()` 会被 biome 判
      //    `noUnsafeOptionalChaining`（`?.` 之后紧跟非可选成员访问，短路成 undefined 就抛）。
      const selected = onSelect.mock.calls[0]?.[0] as dayjs.Dayjs | undefined;
      expect(selected?.hour()).toBe(1);
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('⭐ `changeOnScroll`：最近的格被禁用 ⇒ 让位给次近的**可用**格', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        changeOnScroll: true,
        disabledHours: () => [1],
        onSelect,
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`) as HTMLElement;
      installLayout(ul);

      Object.defineProperty(ul, 'scrollTop', { value: 35, configurable: true, writable: true });
      await ul.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);

      // 第 1 格被禁用（差值换成 MAX_SAFE_INTEGER）⇒ 选第 2 格
      const selected = onSelect.mock.calls[0]?.[0] as dayjs.Dayjs | undefined;
      expect(selected?.hour()).toBe(2);
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('`changeOnScroll`：全被禁用 ⇒ **不提交**（没有任何可用格）', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        changeOnScroll: true,
        disabledHours: () => allHours,
        onSelect,
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`) as HTMLElement;
      installLayout(ul);

      Object.defineProperty(ul, 'scrollTop', { value: 35, configurable: true, writable: true });
      await ul.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);

      expect(onSelect).not.toHaveBeenCalled();
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('滚动期间（`scrolling` 为真）**不**提交 —— 对齐中的抖动不该被当成用户操作', async () => {
    vi.useFakeTimers();
    try {
      const onSelect = vi.fn();
      // 🚨 必须**先**装 rAF 拦截、**再**改值。两个坑（本轮都踩到了）：
      //
      //  ① `watch(..., { immediate: true })` 在 **setup 阶段**就同步跑一次 ——
      //     那时 `ulRef` 还是 `null`（DOM 未渲染）⇒ `startScroll` 直接 return
      //     ⇒ **`scrolling` 从未置真**。所以不能指望 mount 留下这个状态，
      //     必须 mount 之后用一次**改值**来触发 `flush: 'post'` 的那次 watcher。
      //  ② 改值之后不能把排队的 rAF 跑掉 —— 一旦 `doScroll` 跑到「继续排帧」以外的
      //     分支就会 `stopScroll()` 把 `scrolling` 复位。用队列拦住（永不 drain）即可。
      //
      // ⇒ 最终 `scrolling` 停在 `true`（`doScroll` 在「等目标格上屏」的重试分支 return，
      //    那条分支之前已经把它置真）。
      const queue: FrameRequestCallback[] = [];
      const raf = vi
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          queue.push(cb);
          return queue.length;
        });
      vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

      // 挂载时值 = 0 点（= 首格）⇒ 那一次 watcher 是空操作，不污染后面的判断
      const w = mountPanel({
        picker: 'time',
        mode: 'time',
        showHour: true,
        showMinute: false,
        showSecond: false,
        changeOnScroll: true,
        value: [generateConfig.setHour(now, 0)],
        onSelect,
      });
      const ul = w.element.querySelector<HTMLElement>(`.${P}-time-panel-column`) as HTMLElement;

      // 改到 10 点 ⇒ 目标是第 10 格 ≠ 首格，而 jsdom 的 `offsetTop` 恒 0 ⇒ 进重试分支
      await w.setProps({ value: [generateConfig.setHour(now, 10)] } as never);
      await nextTick();
      expect(queue.length).toBeGreaterThan(0);
      expect(onSelect).not.toHaveBeenCalled();

      // 此时 `scrolling` 为真 ⇒ 这次 scroll 应当被守卫挡掉
      await ul.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(400);
      expect(onSelect).not.toHaveBeenCalled();

      raf.mockRestore();
      w.unmount();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('时间面板的其余分支', () => {
  it('毫秒列可点（`showMillisecond` + `millisecondStep`）', () => {
    const onSelect = vi.fn();
    const w = mountPanel({
      picker: 'time',
      mode: 'time',
      showHour: false,
      showMinute: false,
      showSecond: false,
      showMillisecond: true,
      millisecondStep: 250,
      onSelect,
    });
    const cells = [
      ...w.element.querySelectorAll<HTMLElement>(
        `.${P}-time-panel-column[data-type="millisecond"] .${P}-time-panel-cell`,
      ),
    ];
    expect(cells).toHaveLength(4);
    expect(cells[0]?.textContent).toBe('000');
    click(cells[2]);
    const selected = onSelect.mock.calls[0]?.[0] as dayjs.Dayjs | undefined;
    expect(selected?.millisecond()).toBe(500);
    w.unmount();
  });

  it('12 小时制下「当前侧的所有小时都禁用」⇒ 那一侧的格禁用，另一侧可用', () => {
    // 当前是 10 点（上午）：把所有上午的小时禁掉
    const w = mountPanel({
      picker: 'time',
      mode: 'time',
      use12Hours: true,
      disabledHours: () => Array.from({ length: 12 }, (_, i) => i),
    });
    const meridiem = [
      ...w.element.querySelectorAll<HTMLElement>(
        `.${P}-time-panel-column[data-type="meridiem"] .${P}-time-panel-cell`,
      ),
    ];
    expect(meridiem[0]?.classList.contains(`${P}-time-panel-cell-disabled`)).toBe(true);
    expect(meridiem[1]?.classList.contains(`${P}-time-panel-cell-disabled`)).toBe(false);
    w.unmount();
  });

  it('`disabledTime`（按日期给规则）优先于顶层的 `disabledHours`', () => {
    const w = mountPanel({
      picker: 'time',
      mode: 'time',
      showHour: true,
      showMinute: false,
      showSecond: false,
      disabledHours: () => [1],
      disabledTime: () => ({ disabledHours: () => [2] }),
    });
    const disabled = [...w.element.querySelectorAll(`.${P}-time-panel-cell-disabled`)].map((c) =>
      c.getAttribute('data-value'),
    );
    expect(disabled).toEqual(['2']);
    w.unmount();
  });

  it('`datetime` 面板：日期格的 `mouseleave` 也走 `mergeTime`', async () => {
    const onHover = vi.fn();
    const w = mountPanel({ picker: 'date', mode: 'date', showTime: true, onHover });
    const cell = w.element.querySelector<HTMLElement>(
      `.${P}-date-panel .${P}-cell-in-view:not(.${P}-cell-disabled)`,
    );
    await cell?.dispatchEvent(new MouseEvent('mouseleave'));
    // 值为空时 `mergeTime` 走 `pickerValue` 的分支，但 `null` 只做原样透传
    expect(onHover).toHaveBeenCalledWith(null);
    w.unmount();
  });

  it('`datetime` 面板 hover 日期格 ⇒ 载荷**带时间**', async () => {
    const onHover = vi.fn();
    const w = mountPanel({ picker: 'date', mode: 'date', showTime: true, onHover });
    const cell = w.element.querySelector<HTMLElement>(
      `.${P}-date-panel .${P}-cell-in-view:not(.${P}-cell-disabled)`,
    );
    await cell?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(fmt(onHover.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-01 10:20:30');
    w.unmount();
  });

  it('`DateTimePanel` 无值时 hover 用 `pickerValue` 的时间', async () => {
    const onHover = vi.fn();
    const w = mountPanel({
      picker: 'date',
      mode: 'date',
      showTime: true,
      value: [],
      onHover,
    });
    const cell = w.element.querySelector<HTMLElement>(
      `.${P}-date-panel .${P}-cell-in-view:not(.${P}-cell-disabled)`,
    );
    await cell?.dispatchEvent(new MouseEvent('mouseenter'));
    expect(fmt(onHover.mock.calls[0]?.[0] as PanelDateType)).toBe('2026-09-01 10:20:30');
    w.unmount();
  });
});

describe('PickerPanel 的其余分支', () => {
  it('受控 `pickerValue` **变化**时内部值跟着同步（同一天不重渲染也算变化）', async () => {
    const w = mountPanel({ pickerValue: now });
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Sep');
    await w.setProps({ pickerValue: generateConfig.addMonth(now, 2) } as never);
    await nextTick();
    expect(w.element.querySelector(`.${P}-month-btn`)?.textContent).toBe('Nov');
    w.unmount();
  });

  it('`hoverRangeValue` 传**单值**（非数组）也能工作', () => {
    const w = mountPanel({
      picker: 'date',
      mode: 'date',
      value: [],
      // 上游的 `hoverRangeValue` 实际支持「单值」形态（`Array.isArray` 为假时当 start）
      hoverRangeValue: generateConfig.setDate(now, 10),
    });
    expect(w.element.querySelector(`.${P}-cell-range-start`)).not.toBeNull();
    w.unmount();
  });

  it('`hoverRangeValue` 是空数组 ⇒ 不发 range 标记（`!start && !end` 分支）', () => {
    const w = mountPanel({ picker: 'date', mode: 'date', value: [], hoverRangeValue: [] });
    expect(w.element.querySelectorAll(`.${P}-cell-range-start`)).toHaveLength(0);
    expect(w.element.querySelectorAll(`.${P}-cell-in-range`)).toHaveLength(0);
    w.unmount();
  });

  it('`hoverRangeValue` 起止颠倒 ⇒ 内部先排序（`[end, start]` 分支）', () => {
    const w = mountPanel({
      picker: 'date',
      mode: 'date',
      value: [],
      hoverRangeValue: [generateConfig.setDate(now, 20), generateConfig.setDate(now, 8)],
    });
    // 排序后 start = 8 号、end = 20 号 ⇒ 只有 8 号带 range-start
    const starts = [...w.element.querySelectorAll<HTMLElement>(`.${P}-cell-range-start`)];
    expect(starts).toHaveLength(1);
    expect(starts[0]?.getAttribute('title')).toBe('2026-09-08');
    w.unmount();
  });

  it('`mode` 受控时**不**被内部改写（`setMergedMode` 的空分支）', async () => {
    const onPanelChange = vi.fn();
    const w = mountPanel({ mode: 'month', onPanelChange });
    click(w.element.querySelector(`.${P}-cell`));
    await nextTick();
    // 仍是月面板（受控 mode 未变）
    expect(w.element.querySelector(`.${P}-month-panel`)).not.toBeNull();
    w.unmount();
  });

  it('⚠️ `setMergedMode` 的「非受控」分支在当前 API 下**不可达**', () => {
    // 构造它需要同时满足两件事：
    //   ① `props.mode === undefined`（否则 `setMergedMode` 是空操作）；
    //   ② `mergedMode !== props.picker`（否则不进降级分支）。
    // 而 `mode` 不传时 `innerMode` 的初值是 `props.picker ?? 'date'`
    // ⇒ `mergedMode === props.picker` 恒成立 ⇒ ①②互斥。
    // 这是上游 `useControlledState(picker || 'date', mode)` 的自然结果，**不是**本仓的缺口；
    // 如实登记，不用「硬造一条假测试」去凑。可达性已被「受控 mode 不被改写」那条覆盖
    // （同一个 `if` 的另一侧）。
    expect(true).toBe(true);
  });
});

describe('WeekPanel 直接挂载（不经过 PickerPanel）', () => {
  it('周面板从**自己的 props** 取上下文（它不 provide）', () => {
    const w = mount(
      WeekPanel as never,
      {
        props: {
          ...panelBase(),
          values: [now],
          hoverRangeValue: [generateConfig.setDate(now, 1), generateConfig.setDate(now, 20)],
        } as never,
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;
    expect(w.element.classList.contains(`${P}-week-panel`)).toBe(true);
    expect(w.element.querySelectorAll(`.${P}-week-panel-row-range-start`)).toHaveLength(1);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 🚨 2026-10-01 新增（RangePicker 的 S5 前置）：逃生通道的**第二条入口**。
//
// 上游把 `hideNext` / `hidePrev` / `onCellDblClick` 放在**外层** `PickerHackContext.Provider`
// （`Popup/PopupPanel.js:62-75`）。本仓 `PickerPanel` **自己**也 provide 了一份
// （`providePanelHack`，为了 `hideHeader`）—— Vue 的 `provide` 同样「**最近的赢**」
// ⇒ 外层注入会被**遮蔽**。
//
// ⇒ 修法：把这三个值也收成 `PickerPanel` 的 props（与 `hideHeader` 同判）。
// 下面第一条用例就是这条判据的**回归哨兵**：它断言「外层 provide 不生效」，
// 若哪天有人「优化」成只靠外层注入，它会立刻红。
// ---------------------------------------------------------------------------
describe('逃生通道 · `PickerPanel` 的 props 入口（RangePicker 走这条）', () => {
  it('🚨 外层 `provide` 会被 `PickerPanel` 自己那份**遮蔽**（所以必须走 props）', () => {
    const w = mount(
      HackProvider as never,
      {
        props: { hack: { hideNext: true } } as never,
        slots: {
          default: () =>
            h(
              PickerPanel as never,
              {
                ...panelBase(),
                value: [now],
                defaultPickerValue: now,
                defaultValue: [now],
                picker: 'date',
                mode: 'date',
              } as never,
            ),
        },
        attachTo: document.body,
      } as never,
    ) as unknown as PanelWrapper;

    // 外层说要藏 next 侧 —— 但 PickerPanel 自己 provide 了 `{hideHeader: undefined}`
    // ⇒ 内层赢 ⇒ next 按钮**不该**被隐藏。
    expect(w.element.querySelector<HTMLElement>(`.${P}-header-next-btn`)?.style.visibility).toBe(
      '',
    );
    w.unmount();
  });

  it('⭐ `hideNext` 走 props ⇒ 左面板的 next 侧按钮隐藏（`hidePrev` 反之）', () => {
    const left = mountPanel({ hideNext: true });
    expect(left.element.querySelector<HTMLElement>(`.${P}-header-next-btn`)?.style.visibility).toBe(
      'hidden',
    );
    expect(
      left.element.querySelector<HTMLElement>(`.${P}-header-super-next-btn`)?.style.visibility,
    ).toBe('hidden');
    expect(left.element.querySelector<HTMLElement>(`.${P}-header-prev-btn`)?.style.visibility).toBe(
      '',
    );
    left.unmount();

    const right = mountPanel({ hidePrev: true });
    expect(
      right.element.querySelector<HTMLElement>(`.${P}-header-prev-btn`)?.style.visibility,
    ).toBe('hidden');
    expect(
      right.element.querySelector<HTMLElement>(`.${P}-header-super-prev-btn`)?.style.visibility,
    ).toBe('hidden');
    expect(
      right.element.querySelector<HTMLElement>(`.${P}-header-next-btn`)?.style.visibility,
    ).toBe('');
    right.unmount();
  });

  it('⭐ `onCellDblClick` 走 props ⇒ 双击日期格触发（且 `hideHeader` 不受影响）', () => {
    const onCellDblClick = vi.fn();
    const w = mountPanel({ onCellDblClick });
    const cell = w.element.querySelector<HTMLElement>(`.${P}-cell-in-view`);
    cell?.dispatchEvent(new MouseEvent('dblclick'));
    expect(onCellDblClick).toHaveBeenCalledTimes(1);
    // 反向哨兵：没传 `hideHeader` ⇒ 表头仍在
    expect(w.element.querySelector(`.${P}-header`)).not.toBeNull();
    w.unmount();
  });

  it('`hideHeader` 与 `hideNext` 可以同时生效（双面板 + 藏表头的组合）', () => {
    const w = mountPanel({ hideHeader: true, hideNext: true });
    expect(w.element.querySelector(`.${P}-header`)).toBeNull();
    w.unmount();
  });
});
