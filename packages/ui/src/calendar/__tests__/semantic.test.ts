/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/calendar.dom.json`，由 `tests/compat/baseline/calendar.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Calendar` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：**根类名的条件组合**（`-full` / `-mini` / `-rtl` / `-css-var`）、
 *    header 三段（年下拉 / 月下拉**仅 `mode="month"`** / 模式切换）、
 *    面板的 `hideHeader`（**没有** `-picker-header`）、周号列、
 *    禁用态（`validRange` / `disabledDate`）、三个渲染 prop 与 **4 个废弃 prop**
 *    的三级回退、6 个语义槽（对象与**函数**形态）、`id` / `data-*` / `aria-*` 的落点、
 *    前缀三态（默认 / 自定义 / 不包 Provider 的 D1）。
 * ❌ 不覆盖：`:hover` 态、键盘交互（L2）、像素（L6）。
 *
 * ── 🚨 三条必须记住的判据 ────────────────────────────────────────────────────
 *
 * 1. **每个用例都要包 `ConfigProvider`**（`bare` 用例除外）：`Calendar` 的
 *    `prefixCls` 默认是 `getPrefixCls('picker')`（**根前缀 + `picker`**），
 *    而内嵌的 `Select` / `Radio` 也各自读根前缀。
 * 2. 🚨 **`prefixCls` 作为 prop 传 `'apollo'` 时，根类是 `apollo-calendar`**
 *    （**不是** `apollo-picker-calendar`）—— `getPrefixCls(suffix, customize)`
 *    里 `customize` **优先**，`'picker'` 被丢弃。只有**不传** prop 时才走
 *    `{根前缀}-picker-calendar`（`calendar:prefix-cls:no-props` 钉的就是它）。
 * 3. **`value` 落在过去**（与 L6 的 `CALENDAR_VALUE` 同值）—— `-date-today` 由
 *    `getNow()` 决定，产物会随运行日漂移。理由见 `tests/compat/baseline/calendar.mjs`。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import dayjs from 'dayjs';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/calendar.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Calendar } from '../index';
import type { CalendarProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/calendar.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 🚨 必须落在**过去**（见文件头判据 3）。 */
const V = dayjs('2025-06-15');

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ACalendarCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const BP = { prefixCls: PREFIX, value: V };

/** 用例规格表：id → Vue 侧的 props / ctx / bare。 */
const specs: Record<
  string,
  {
    props: CalendarProps & Record<string, unknown>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'calendar:basic': { props: { ...BP } },
  'calendar:mini': { props: { ...BP, fullscreen: false } },
  'calendar:year': { props: { ...BP, mode: 'year' } },
  'calendar:year-mini': { props: { ...BP, mode: 'year', fullscreen: false } },
  'calendar:show-week': { props: { ...BP, showWeek: true } },
  'calendar:show-week-false': { props: { ...BP, showWeek: false } },

  'calendar:valid-range': {
    props: { ...BP, validRange: [dayjs('2025-06-10'), dayjs('2025-06-20')] },
  },
  'calendar:disabled-date': { props: { ...BP, disabledDate: (d) => d.date() === 15 } },
  'calendar:valid-range-and-disabled-date': {
    props: {
      ...BP,
      validRange: [dayjs('2025-06-10'), dayjs('2025-06-20')],
      disabledDate: (d) => d.date() === 12,
    },
  },

  'calendar:cell-render': {
    props: { ...BP, cellRender: () => h('span', { class: 'probe-cell' }, 'c') },
  },
  'calendar:full-cell-render': {
    props: {
      ...BP,
      fullCellRender: (d) => h('span', { class: 'probe-full' }, String(d.date())),
    },
  },
  'calendar:header-render': {
    props: {
      ...BP,
      headerRender: ({ value }) =>
        h('div', { class: 'probe-header' }, `H-${value.format('YYYY-MM')}`),
    },
  },
  'calendar:header-render-only': {
    props: { ...BP, headerRender: () => h('div', null, 'H') },
  },

  'calendar:date-full-cell-render': {
    props: {
      ...BP,
      dateFullCellRender: (d) => h('span', { class: 'probe-legacy-full' }, String(d.date())),
    },
  },
  'calendar:date-cell-render': {
    props: { ...BP, dateCellRender: () => h('span', { class: 'probe-legacy-cell' }, 'c') },
  },
  'calendar:month-full-cell-render': {
    props: {
      ...BP,
      mode: 'year',
      monthFullCellRender: (d) => h('span', { class: 'probe-legacy-month-full' }, String(d.date())),
    },
  },
  'calendar:month-cell-render': {
    props: {
      ...BP,
      mode: 'year',
      monthCellRender: () => h('span', { class: 'probe-legacy-month-cell' }, 'c'),
    },
  },

  'calendar:semantic-class-names': {
    props: {
      ...BP,
      classNames: {
        root: 's-root',
        header: 's-header',
        body: 's-body',
        content: 's-content',
        item: 's-item',
        itemContent: 's-item-content',
      },
    },
  },
  'calendar:semantic-styles': {
    props: {
      ...BP,
      styles: { root: { color: 'rgb(1, 2, 3)' }, header: { color: 'rgb(4, 5, 6)' } },
    },
  },
  'calendar:semantic-fn': {
    props: { ...BP, classNames: ({ props }) => ({ root: `m-${props.mode}` }) },
  },

  'calendar:rtl': { props: { ...BP }, ctx: { direction: 'rtl' } },
  'calendar:className': { props: { ...BP, className: 'user-cls', rootClassName: 'root-cls' } },
  'calendar:style': { props: { ...BP, style: { color: 'rgb(7, 8, 9)' } } },
  'calendar:attrs': { props: { ...BP, 'data-testid': 'cal', 'aria-label': '日历' } },

  /**
   * 🚨 **刻意不写 `bare: true` 的用例**（与 card / steps / breadcrumb 不同）：
   * `bare` 下两侧根前缀分别回落成 `ant` / `apollo` ⇒ 日历**每一层带前缀的元素**都不同
   * （实测 **193** 条 diff），那是 D1 的同一个事实重复 193 遍（本组件 DOM 是一整张月历）。
   * D1 已由 card / steps / breadcrumb / anchor / avatar / timeline / list 逐个钉住。
   *
   * 本组件特有的一件事是「默认前缀派生 = `{根前缀}-picker-calendar`」——
   * 下面这条**包 Provider 但不传 `prefixCls` prop**，两侧都算出 `apollo-picker-calendar`
   * ⇒ 0 条 diff，把派生关系钉死，又不制造 193 行噪声。
   */
  'calendar:prefix-cls:default': { props: { value: V } },
  'calendar:prefix-cls:custom': { props: { ...BP, prefixCls: 'custom' } },

  'calendar:default-value': { props: { prefixCls: PREFIX, defaultValue: V } },
  // 🚨 刻意**没有** `calendar:no-value` —— 不传值时上游取 `getNow()`，产物随运行日变化
  //    ⇒ 在字节精确的 L4 里不可测（见 `tests/compat/baseline/calendar.mjs` 的说明与 PITFALLS 334）。
  //    该行为由 `index.test.ts` 用语义断言覆盖。
};

domContractTest('Calendar', {
  baseline,
  // ⚠️ `specs` 是**本文件的局部常量**，不是 `DomContractOptions` 的字段
  //    （harness 只认 `baseline` / `render` / `only` / `allow` / 投影档）
  /** 用例 id → Vue 侧渲染。 */
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Calendar L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Calendar as never, spec.props as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
