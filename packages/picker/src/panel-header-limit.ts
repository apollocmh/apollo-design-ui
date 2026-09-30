/**
 * 面板表头（`PanelHeader`）的**翻页粒度**与**越界判定**。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的 `es/PickerPanel/PanelHeader.js`
 * 与六个面板各自传给它的 `offset` / `superOffset` / `getStart` / `getEnd`。
 * ⚠️ 两面都 `import * as React` ⇒ **不可对拍**，这里是按源码重写的纯函数，
 * 由 `src/__tests__/panel-header-limit.test.ts` 覆盖。
 *
 * ── 为什么单独抽出来 ─────────────────────────────────────────────────────────
 *
 * 这四件事在组件里是**四段几乎一样、但方向与粒度都不对称**的逻辑：
 *  - `prev` / `next` 用 `offset`（一格），`superPrev` / `superNext` 用 `superOffset`（一屏）；
 *  - `prev` 的越界基准是 `getEnd(...)` 对 `minDate`，`next` 的越界基准是
 *    `maxDate` 对 `getStart(...)` —— **`isSameOrAfter` 的实参顺序相反**，
 *    且起点判据用 `getEnd`、终点判据用 `getStart`（不是同一个函数）。
 * 组件里这段逻辑被 `useMemo` 拆成 4 段，肉眼看不出对称性，抽成纯函数才能穷举。
 */

import { isSameOrAfter } from './date-util';
import type { GenerateConfig, PanelMode, PickerLocale } from './types';

/** 十年面板的起始年粒度。 */
const DECADE_BLOCK = 10;
/** 世纪面板的起始年粒度。 */
const CENTURY_BLOCK = 100;

/** `floor(year / block) * block` 对应的日期。 */
function startOfBlock<DateType>(
  generateConfig: GenerateConfig<DateType>,
  value: DateType,
  block: number,
): DateType {
  return generateConfig.setYear(value, Math.floor(generateConfig.getYear(value) / block) * block);
}

/** 一个面板的翻页粒度与区间边界。四个字段**都可缺席**（判据见 `getHeaderDisabled`）。 */
export interface PanelHeaderLimits<DateType> {
  /**
   * 翻「一格」的粒度。
   *
   * ⚠️ `month` / `quarter` 面板**没有**这个（它们的上一级已经是年），
   * 于是表头少两个按钮、只剩 `superPrev` / `superNext`。这是上游用
   * `offset && …` 条件渲染表达的东西，这里用「`undefined` 即没有」表达。
   */
  offset?: (distance: number, base: DateType) => DateType;
  /** 翻「一屏」的粒度（日/周/月/季 ⇒ 年；年 ⇒ 十年；十年 ⇒ 世纪） */
  superOffset?: (distance: number, base: DateType) => DateType;
  /** 该面板代表区间的**起点**（`minDate` 越界判定的基准之一） */
  getStart?: (date: DateType) => DateType;
  /** 该面板代表区间的**终点**（`minDate` 越界判定的基准之一） */
  getEnd?: (date: DateType) => DateType;
}

/**
 * 取某个面板的表头配置。
 *
 * ⚠️ 三处「粒度乘数」是各面板自己的：
 *  - 年面板一屏 = **10 年**（`superOffset` 乘 10）；
 *  - 十年面板一屏 = **100 年**（乘 100）；
 *  - 日/周/月/季面板一屏 = **1 年**（不乘）。
 *
 * ⚠️ `getEnd` 有两条实现路线，**不能统一**：
 *  - 日/周面板：`下个月 1 号 − 1 天`（处理月份天数差异）；
 *  - 月/季面板：`setMonth(11)`（当年 12 月 —— 注意**不是**「12 月 31 日」，
 *    给它做越界判定时 `type` 是 `'month'`，粒度天然对齐）。
 */
export function getPanelHeaderLimits<DateType>(
  mode: PanelMode,
  generateConfig: GenerateConfig<DateType>,
): PanelHeaderLimits<DateType> {
  const g = generateConfig;

  switch (mode) {
    case 'date':
    case 'week':
      return {
        offset: (distance, base) => g.addMonth(base, distance),
        superOffset: (distance, base) => g.addYear(base, distance),
        getStart: (date) => g.setDate(date, 1),
        getEnd: (date) => g.addDate(g.addMonth(g.setDate(date, 1), 1), -1),
      };

    case 'month':
    case 'quarter':
      return {
        superOffset: (distance, base) => g.addYear(base, distance),
        getStart: (date) => g.setMonth(date, 0),
        getEnd: (date) => g.setMonth(date, 11),
      };

    case 'year':
      return {
        superOffset: (distance, base) => g.addYear(base, distance * DECADE_BLOCK),
        getStart: (date) => startOfBlock(g, date, DECADE_BLOCK),
        getEnd: (date) => g.addYear(startOfBlock(g, date, DECADE_BLOCK), 9),
      };

    case 'decade':
      return {
        superOffset: (distance, base) => g.addYear(base, distance * CENTURY_BLOCK),
        getStart: (date) => startOfBlock(g, date, CENTURY_BLOCK),
        getEnd: (date) => g.addYear(startOfBlock(g, date, CENTURY_BLOCK), 99),
      };

    default:
      // `time` / `datetime` 不走表头（时间面板的表头只有一行文字）。
      throw new Error(`[picker] getPanelHeaderLimits: 面板 ${String(mode)} 没有表头配置`);
  }
}

export interface PanelHeaderDisabled {
  /** 前一格（`offset(-1)`）是否越界 */
  prev: boolean;
  /** 前一屏（`superOffset(-1)`）是否越界 */
  superPrev: boolean;
  /** 后一格（`offset(+1)`）是否越界 */
  next: boolean;
  /** 后一屏（`superOffset(+1)`）是否越界 */
  superNext: boolean;
}

export interface PanelHeaderLimitContext<DateType> {
  generateConfig: GenerateConfig<DateType>;
  locale: PickerLocale;
  /** 面板粒度 —— `isSameOrAfter` 的第三个参数，**不是**取值域 */
  panelType: PanelMode;
  pickerValue: DateType;
  minDate?: DateType;
  maxDate?: DateType;
}

/**
 * 四个方向键的禁用态。
 *
 * ⚠️ **`isSameOrAfter` 的实参顺序两侧相反**（照抄上游，不是笔误）：
 *  - `prev` / `superPrev`：`isSameOrAfter(前一个面板的 getEnd(...), minDate)` —— 区间终点还没到下限
 *  - `next` / `superNext`：`isSameOrAfter(maxDate, 后一个面板的 getStart(...))` —— 上限还没到区间起点
 *
 * 只给 `minDate` 时后两个恒 `false`，只给 `maxDate` 时前两个恒 `false` —— 因为
 * 上游的守卫是 `!minDate || !offset || !getEnd ⇒ false` 这种**按方向读对方那个日期**的写法。
 */
export function getHeaderDisabled<DateType>(
  ctx: PanelHeaderLimitContext<DateType>,
  limits: PanelHeaderLimits<DateType>,
): PanelHeaderDisabled {
  const { generateConfig: g, locale, panelType: type, pickerValue, minDate, maxDate } = ctx;
  const { offset, superOffset, getStart, getEnd } = limits;

  const disabledOffsetPrev =
    !minDate || !offset || !getEnd
      ? false
      : !isSameOrAfter(g, locale, getEnd(offset(-1, pickerValue)), minDate, type);
  const disabledSuperOffsetPrev =
    !minDate || !superOffset || !getEnd
      ? false
      : !isSameOrAfter(g, locale, getEnd(superOffset(-1, pickerValue)), minDate, type);
  const disabledOffsetNext =
    !maxDate || !offset || !getStart
      ? false
      : !isSameOrAfter(g, locale, maxDate, getStart(offset(1, pickerValue)), type);
  const disabledSuperOffsetNext =
    !maxDate || !superOffset || !getStart
      ? false
      : !isSameOrAfter(g, locale, maxDate, getStart(superOffset(1, pickerValue)), type);

  return {
    prev: disabledOffsetPrev,
    superPrev: disabledSuperOffsetPrev,
    next: disabledOffsetNext,
    superNext: disabledSuperOffsetNext,
  };
}
