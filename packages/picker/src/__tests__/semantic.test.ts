/**
 * L4 · DOM 契约（与上游 `@rc-component/picker@1.12.2` 的实测 DOM 比对）—— 面板层
 *
 * 基准：`tests/compat/baselines/picker.dom.json`（机械 oracle，37 用例）。`keepStyle: false`。
 *
 * ── 取数侧为什么是 rc 而不是 antd ─────────────────────────────────────────────
 *
 * antd 的 `DatePicker` 在 SSR 下**不渲染面板**（浮层走 Portal，只挂客户端）——
 * 实测 `renderToStaticMarkup(<DatePicker open />)` 只有 889 字节、无 `picker-panel`。
 * 详见 `tests/compat/baseline/picker.mjs` 的文件头。
 *
 * ── 🚨 三条必须与基线侧**逐字相同**的东西 ──────────────────────────────────────
 *
 * 1. **冻结的 `getNow`**（`2026-09-30 10:20:30`）—— 否则 `-cell-today` 每天漂移；
 * 2. **`prefixCls: 'apollo-picker'`** —— 两侧都传同一个，于是原始 HTML 就一致，
 *    不必依赖归一化去前缀（比 tabs 的做法更硬）；
 * 3. **`locale` 字面量** —— 基线的 locale 来自 rc 的 `en_US`（`commonLocale` + 文案），
 *    这里按同一份内容手写（**刻意不 import rc**：`*.oracle.test.ts` 才是允许 import
 *    上游的文件，测试文件名叫 `semantic.test.ts` 的必须自洽）。
 *
 * ── 基线**不**覆盖什么（各有专属的层）──────────────────────────────────────────
 *
 *   - 点击选值 / 表头翻页 / hover 回调 / 多选 toggle —— 运行时行为，由 L2 的
 *     `panel.test.ts` 钉；
 *   - 时间列**滚到当前值**（`syncScroll` 的 rAF 链）与 `changeOnScroll` 的 300ms 判定 ——
 *     需要真实布局（`offsetTop` / `scrollTop`），jsdom 恒 0 ⇒ 只有纯函数层（`getNearestUnitIndex`）
 *     与真浏览器能测；
 *   - `hiddenStyleWhen` 产生的 `visibility: hidden`（双面板逃生通道）—— 只在
 *     `hideHeader` / `hidePrev` / `hideNext` 打开时出现，而**基线走不到**那条路
 *     （`hideHeader` 用例是「整块不渲染」，`hidePrev` 只有 RangePicker 会传）
 *     ⇒ 由 L2 单测钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import dayjs from 'dayjs';
import { h } from 'vue';

import baseline from '../../../../tests/compat/baselines/picker.dom.json';
import { dayjsGenerateConfig } from '../generate/dayjs';
import type { PanelDateType } from '../panel-context';
import { PickerPanel } from '../picker-panel';
import type { GenerateConfig, PickerLocale } from '../types';

/** 与 `tests/compat/baseline/picker.mjs` 的 `FIXED_NOW` 逐字相同。 */
const FIXED_NOW = '2026-09-30 10:20:30';

/**
 * 冻结的 `generateConfig` —— 与基线侧同一份语义（只把 `getNow` 换成常量）。
 *
 * ⚠️ 用**本包自己的**适配层（而不是 import rc 的那一份）：它是对上游
 * `es/generate/dayjs.js` 逐位对拍的产物（`generate-dayjs.oracle.test.ts`），
 * 并且 `*.oracle.test.ts` 已经证过两者一致 ⇒ 这里不必再引上游。
 */
const generateConfig: GenerateConfig<PanelDateType> = {
  ...dayjsGenerateConfig,
  getNow: () => dayjs(FIXED_NOW) as unknown as PanelDateType,
};

/** rc `en_US` 的等值手写版（键与内容逐条对应）。 */
const locale: PickerLocale = {
  // ⚠️ 只列出 `PickerLocale` **真正声明**的键。
  //    rc 的 `en_US` 还有 `today` / `now` / `ok` / `clear` / `year` / `month` 等，
  //    但那些是**输入框与页脚**的文案，面板不读 ⇒ 本包的类型刻意不收（契约 §5.1）。
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

const now = generateConfig.getNow();
const addMonth = (diff: number): PanelDateType => generateConfig.addMonth(now, diff);
const setDate = (day: number): PanelDateType => generateConfig.setDate(now, day);

/** 与基线侧同构的「公共 props」。 */
const base = () => ({
  prefixCls: 'apollo-picker',
  locale,
  generateConfig,
  pickerValue: now,
  value: [now],
});

type PickerPanelProps = Record<string, unknown>;
/**
 * 本文件只走 `h(...)`（不 `mount`），所以面板 props 用 `Record<string, unknown>` 就够。
 *
 * 🚨 `mount(X as never, …)` 会让 `mount` 的泛型推成 `never` ⇒ `w.element` 也是 `never`
 * ⇒ 在根 `tsconfig.json`（`--project types`）下报「Property 'querySelector' does not
 * exist on type 'never'」。**本文件没有这个问题**（不 mount）；需要 `mount` 的用例在
 * `panel-interaction.test.ts`，那边有显式的 wrapper 面。
 *
 * ⚠️ `packages/picker/tsconfig.check.json` **排除了 `__tests__`**
 * ⇒ 单包 `vue-tsc -p packages/picker/tsconfig.check.json` 看不到这些错误，
 * 必须用**根** `tsconfig.json` 验证测试文件的类型。
 */
const render = (props: PickerPanelProps): DomRenderResult =>
  h(PickerPanel as never, { ...base(), ...props } as never);

/** 用例 id → Vue 侧 props（必须与 `tests/compat/baseline/picker.mjs` 的 `push` 一一对应）。 */
const CASES: Record<string, () => DomRenderResult> = {
  // ── 日面板 ──
  'picker:date-basic': () => render({ picker: 'date', mode: 'date' }),
  'picker:date-no-value': () => render({ picker: 'date', mode: 'date', value: [] }),
  'picker:date-show-week': () => render({ picker: 'date', mode: 'date', showWeek: true }),
  'picker:date-multiple': () =>
    render({ picker: 'date', mode: 'date', multiple: true, value: [now, addMonth(1)] }),
  'picker:date-other-month': () => render({ picker: 'date', mode: 'date', value: [addMonth(1)] }),

  // ── 禁用 / 边界 ──
  'picker:date-disabled-date': () =>
    render({
      picker: 'date',
      mode: 'date',
      disabledDate: (date: PanelDateType) => generateConfig.getDate(date) % 7 === 0,
    }),
  'picker:date-min-date': () => render({ picker: 'date', mode: 'date', minDate: setDate(5) }),
  'picker:date-max-date': () => render({ picker: 'date', mode: 'date', maxDate: addMonth(-1) }),
  'picker:date-min-and-max': () =>
    render({ picker: 'date', mode: 'date', minDate: addMonth(-1), maxDate: addMonth(1) }),

  // ── hover ──
  'picker:date-hover-value': () =>
    render({ picker: 'date', mode: 'date', hoverValue: [setDate(10)] }),
  'picker:date-hover-range': () =>
    render({
      picker: 'date',
      mode: 'date',
      value: [],
      hoverRangeValue: [setDate(8), setDate(18)],
    }),

  // ── 周面板 ──
  'picker:week': () => render({ picker: 'week', mode: 'week' }),
  'picker:week-hover-range': () =>
    render({
      picker: 'week',
      mode: 'week',
      value: [],
      hoverRangeValue: [setDate(1), setDate(20)],
    }),

  // ── 上层面板 ──
  'picker:month': () => render({ picker: 'month', mode: 'month' }),
  'picker:month-mode': () => render({ picker: 'date', mode: 'month' }),
  'picker:month-disabled': () =>
    render({
      picker: 'month',
      mode: 'month',
      disabledDate: (date: PanelDateType) => generateConfig.getMonth(date) === 2,
    }),
  'picker:quarter': () => render({ picker: 'quarter', mode: 'quarter' }),
  'picker:year': () => render({ picker: 'year', mode: 'year' }),
  'picker:year-disabled': () =>
    render({
      picker: 'year',
      mode: 'year',
      disabledDate: (date: PanelDateType) => generateConfig.getYear(date) === 2024,
    }),
  'picker:decade': () => render({ picker: 'year', mode: 'decade' }),

  // ── 时间 ──
  'picker:time': () => render({ picker: 'time', mode: 'time' }),
  'picker:time-12h': () => render({ picker: 'time', mode: 'time', use12Hours: true }),
  'picker:time-ms': () =>
    render({
      picker: 'time',
      mode: 'time',
      showMillisecond: true,
      millisecondStep: 250,
    }),
  'picker:time-no-value': () => render({ picker: 'time', mode: 'time', value: [] }),
  'picker:time-disabled-hour': () =>
    render({ picker: 'time', mode: 'time', disabledHours: () => [2, 3] }),
  'picker:time-steps': () =>
    render({
      picker: 'time',
      mode: 'time',
      hourStep: 6,
      minuteStep: 15,
      secondStep: 20,
    }),
  'picker:time-format-only-hour': () =>
    render({ picker: 'time', mode: 'time', showTime: { format: 'HH' } }),
  'picker:time-hide-disabled': () =>
    render({
      picker: 'time',
      mode: 'time',
      hideDisabledOptions: true,
      disabledHours: () => [2, 3],
    }),

  // ── datetime ──
  'picker:datetime': () => render({ picker: 'date', mode: 'date', showTime: true }),
  'picker:datetime-12h': () =>
    render({ picker: 'date', mode: 'date', showTime: { use12Hours: true } }),
  'picker:datetime-no-value': () =>
    render({ picker: 'date', mode: 'date', showTime: true, value: [] }),

  // ── 逃生通道 / 方向 / 无障碍 ──
  'picker:hide-header': () => render({ picker: 'date', mode: 'date', hideHeader: true }),
  'picker:rtl': () => render({ picker: 'date', mode: 'date', direction: 'rtl' }),
  'picker:tab-index-neg': () => render({ picker: 'date', mode: 'date', tabIndex: -1 }),
  'picker:cell-render': () =>
    render({
      picker: 'date',
      mode: 'date',
      cellRender: (date: PanelDateType, info: { prefixCls: string }) =>
        h('span', { class: 'custom-cell' }, [`${info.prefixCls}:${generateConfig.getDate(date)}`]),
    }),

  // ── 语义槽 ──
  'picker:semantic': () =>
    render({
      picker: 'date',
      mode: 'date',
      classNames: { header: 'c-header', body: 'c-body', content: 'c-content', item: 'c-item' },
      styles: {
        header: { color: 'rgb(1, 2, 3)' },
        body: { color: 'rgb(4, 5, 6)' },
        content: { color: 'rgb(7, 8, 9)' },
        item: { color: 'rgb(10, 11, 12)' },
      },
    }),
  'picker:semantic-time': () =>
    render({
      picker: 'time',
      mode: 'time',
      classNames: { content: 'c-content', item: 'c-item' },
      // ⚠️ 基线侧的 `push('picker:semantic-time')` **没有传 styles**——
      //    这里也必须不传，否则 `style` 属性多出来一条（`keepStyle: false` 只忽略值，
      //    不忽略「有没有这个属性」）
    }),
};

domContractTest('PickerPanel', {
  baseline,
  keepStyle: false,
  render: (id) => {
    const factory = CASES[id];
    if (!factory) {
      throw new Error(`[picker] L4 用例 "${id}" 没有对应的 Vue 渲染 —— 基线与用例表脱节`);
    }
    return factory();
  },
});
