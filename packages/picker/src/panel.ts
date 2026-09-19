/**
 * 面板几何 + 单元格状态。
 *
 * ⚠️ **没有 Oracle**：上游 `es/PickerPanel/PanelBody.js` 与六个 Panel 组件都
 * `import * as React`，绑 React 生命周期 ⇒ 只能读源码作规格（契约 §3.4），
 * 这里是按那份规格重写的纯函数版本，由**行为测试**覆盖。
 *
 * 本模块只产出**状态位**，不产出 class 名、不产出 DOM（R4：引擎无视觉）。
 * class 拼接规则见契约 §3.4.3，由 `ui` 层完成。
 */

import {
  formatValue,
  getWeekStartDate,
  isInRange,
  isSame,
  isSameDate,
  isSameDecade,
  isSameMonth,
  isSameYear,
  WEEK_DAY_COUNT,
} from './date-util';
import type { DisabledDate, GenerateConfig, PanelCell, PanelMode, PickerLocale } from './types';

/** 一个面板的几何参数。六个面板各有一份，见契约 §3.4.2。 */
export interface PanelGeometry<DateType> {
  /** 行数 */
  rowNum: number;
  /** 列数 */
  colNum: number;
  /** 左上角那格的日期 */
  baseDate: DateType;
  /** ⚠️ `offset` 是**线性下标** `row * colNum + col`，不是「本行第 col 个」 */
  getCellDate: (base: DateType, offset: number) => DateType;
  getCellText: (date: DateType) => string;
  /**
   * 面板自定义的两个状态位（date: in-view + today；year: in-view；month/quarter: 恒 in-view）。
   *
   * 必填 —— 六个面板全都提供，做成可选只会在 `buildPanelCells` 里留下一条
   * 永远走不到的 `?? false` 兜底分支。
   */
  getCellState: (date: DateType) => { inView: boolean; today?: boolean };
  /** week 面板是整行选择 ⇒ 单元格不参与选择 */
  cellSelection: boolean;
  /** 单元格 `title` 属性的格式串 */
  titleFormat?: string;
}

export interface PanelGeometryContext<DateType> {
  generateConfig: GenerateConfig<DateType>;
  locale: PickerLocale;
  pickerValue: DateType;
  /** `now` 只被 date 面板用于 `cell-today` */
  now: DateType;
}

/** 十年/百年面板的起始年：`floor(year / N) * N`。 */
function startOfBlock<DateType>(
  generateConfig: GenerateConfig<DateType>,
  value: DateType,
  block: number,
): DateType {
  const startYear = Math.floor(generateConfig.getYear(value) / block) * block;
  return generateConfig.setYear(value, startYear);
}

/**
 * 取某个面板的几何参数。
 *
 * ⚠️ 三处「看起来像 bug、其实是契约」的参数（契约 §3.4.2）：
 *   - year 面板的 `baseDate` 是**起始年 − 1**；
 *   - decade 面板的 `baseDate` 是**起始世纪 − 10 年**；
 *   - week 面板与 date 面板几何完全相同，只是 `cellSelection: false`。
 */
export function getPanelGeometry<DateType>(
  mode: PanelMode,
  ctx: PanelGeometryContext<DateType>,
): PanelGeometry<DateType> {
  const { generateConfig: g, locale, pickerValue } = ctx;

  switch (mode) {
    case 'date':
    case 'week': {
      const baseDate = getWeekStartDate(locale.locale, g, g.setDate(pickerValue, 1));
      return {
        rowNum: 6,
        colNum: WEEK_DAY_COUNT,
        baseDate,
        getCellDate: (base, offset) => g.addDate(base, offset),
        getCellText: (date) =>
          formatValue(date, {
            generateConfig: g,
            locale,
            format: locale.cellDateFormat ?? '',
          }),
        getCellState: (date) => ({
          inView: isSameMonth(g, date, pickerValue),
          today: isSameDate(g, date, ctx.now),
        }),
        cellSelection: mode !== 'week',
        titleFormat: locale.fieldDateFormat,
      };
    }

    case 'month': {
      const monthsLocale = locale.shortMonths ?? g.locale.getShortMonths?.(locale.locale) ?? [];
      return {
        rowNum: 4,
        colNum: 3,
        baseDate: g.setMonth(pickerValue, 0),
        getCellDate: (base, offset) => g.addMonth(base, offset),
        getCellText: (date) =>
          locale.monthFormat
            ? formatValue(date, { generateConfig: g, locale, format: locale.monthFormat })
            : (monthsLocale[g.getMonth(date)] ?? ''),
        getCellState: () => ({ inView: true }),
        cellSelection: true,
        titleFormat: locale.fieldMonthFormat,
      };
    }

    case 'quarter': {
      return {
        rowNum: 1,
        colNum: 4,
        baseDate: g.setMonth(pickerValue, 0),
        getCellDate: (base, offset) => g.addMonth(base, offset * 3),
        getCellText: (date) =>
          formatValue(date, {
            generateConfig: g,
            locale,
            format: locale.cellQuarterFormat ?? '',
          }),
        getCellState: () => ({ inView: true }),
        cellSelection: true,
        titleFormat: locale.fieldQuarterFormat,
      };
    }

    case 'year': {
      const startYearDate = startOfBlock(g, pickerValue, 10);
      const endYearDate = g.addYear(startYearDate, 9);
      return {
        rowNum: 4,
        colNum: 3,
        baseDate: g.addYear(startYearDate, -1),
        getCellDate: (base, offset) => g.addYear(base, offset),
        getCellText: (date) =>
          formatValue(date, {
            generateConfig: g,
            locale,
            format: locale.cellYearFormat ?? '',
          }),
        getCellState: (date) => ({
          inView:
            isSameYear(g, date, startYearDate) ||
            isSameYear(g, date, endYearDate) ||
            isInRange(g, startYearDate, endYearDate, date),
        }),
        cellSelection: true,
        titleFormat: locale.fieldYearFormat,
      };
    }

    case 'decade': {
      const startYearDate = startOfBlock(g, pickerValue, 100);
      const endYearDate = g.addYear(startYearDate, 99);
      return {
        rowNum: 4,
        colNum: 3,
        baseDate: g.addYear(startYearDate, -10),
        getCellDate: (base, offset) => g.addYear(base, offset * 10),
        getCellText: (date) => {
          const cellYearFormat = locale.cellYearFormat ?? '';
          const startYearStr = formatValue(date, {
            generateConfig: g,
            locale,
            format: cellYearFormat,
          });
          const endYearStr = formatValue(g.addYear(date, 9), {
            generateConfig: g,
            locale,
            format: cellYearFormat,
          });
          return `${startYearStr}-${endYearStr}`;
        },
        getCellState: (date) => ({
          inView:
            isSameDecade(g, date, startYearDate) ||
            isSameDecade(g, date, endYearDate) ||
            isInRange(g, startYearDate, endYearDate, date),
        }),
        cellSelection: true,
      };
    }

    default:
      // `time` 面板不走格子系统（它是时间列），这里不该被调用。
      throw new Error(`[picker] getPanelGeometry: 不支持的面板模式 ${String(mode)}`);
  }
}

/** 某一行第一格的日期 —— week 面板的周号列与整行选中都靠它。 */
export function getRowStartDate<DateType>(
  geometry: PanelGeometry<DateType>,
  row: number,
): DateType {
  return geometry.getCellDate(geometry.baseDate, row * geometry.colNum);
}

export interface PanelCellsContext<DateType> {
  generateConfig: GenerateConfig<DateType>;
  locale: PickerLocale;
  mode: PanelMode;
  now: DateType;
  values: readonly (DateType | null | undefined)[];
  hoverValue?: readonly DateType[] | null;
  hoverRangeValue?: readonly [DateType, DateType] | null;
  disabledDate?: DisabledDate<DateType>;
}

/**
 * 把几何 + 值/hover/disabled 折叠成格子矩阵。
 *
 * 返回值是**二维数组** `rows[row][col]`，与 `PanelBody` 的 `rowNum × colNum`
 * 结构一一对应，方便 `ui` 层直接 `v-for`。
 *
 * 两条必须从上游照抄的语义（契约 §3.4.3）：
 *  1. `selected` 只在**没有** `hoverRangeValue` 时才生效 —— hover 预览期间
 *     选中标让位给 range 标；
 *  2. range 的三态用 `isSame(…, type)`，**type 是面板粒度** —— 所以 week 面板下
 *     一整周都算 start/end。
 */
export function buildPanelCells<DateType>(
  geometry: PanelGeometry<DateType>,
  ctx: PanelCellsContext<DateType>,
): PanelCell<DateType>[][] {
  const { generateConfig: g, locale, mode } = ctx;
  const hoverList = ctx.hoverValue ?? [];
  const hoverRange = ctx.hoverRangeValue ?? null;

  const matchValues = (date: DateType): boolean =>
    ctx.values.some((single) => single && isSame(g, locale, date, single, mode));

  const rows: PanelCell<DateType>[][] = [];

  for (let row = 0; row < geometry.rowNum; row += 1) {
    const rowCells: PanelCell<DateType>[] = [];

    for (let col = 0; col < geometry.colNum; col += 1) {
      const offset = row * geometry.colNum + col;
      const currentDate = geometry.getCellDate(geometry.baseDate, offset);

      const disabled = ctx.disabledDate?.(currentDate, { type: mode }) ?? false;

      let inRange = false;
      let rangeStart = false;
      let rangeEnd = false;
      if (geometry.cellSelection && hoverRange) {
        const [hoverStart, hoverEnd] = hoverRange;
        inRange = isInRange(g, hoverStart, hoverEnd, currentDate);
        rangeStart = isSame(g, locale, currentDate, hoverStart, mode);
        rangeEnd = isSame(g, locale, currentDate, hoverEnd, mode);
      }

      const state = geometry.getCellState(currentDate);

      rowCells.push({
        date: currentDate,
        offset,
        row,
        col,
        text: geometry.getCellText(currentDate),
        ...(geometry.titleFormat === undefined
          ? {}
          : {
              title: formatValue(currentDate, {
                generateConfig: g,
                locale,
                format: geometry.titleFormat,
              }),
            }),
        disabled,
        inView: state.inView,
        today: state.today ?? false,
        // ⚠️ 上游的判据是 `!hoverRangeValue && type !== 'week' && matchValues(date)`，
        // **不含** `cellSelection`（week 面板已被 `type !== 'week'` 排除）。照抄。
        selected: !hoverRange && mode !== 'week' ? matchValues(currentDate) : false,
        hovered: hoverList.some((date) => isSame(g, locale, currentDate, date, mode)),
        // `-in-range` 的判据是「在中间且不是端点」
        inRange: inRange && !rangeStart && !rangeEnd,
        rangeStart,
        rangeEnd,
      });
    }

    rows.push(rowCells);
  }

  return rows;
}
