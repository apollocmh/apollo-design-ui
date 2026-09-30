/**
 * 日期面板（`mode: 'date' | 'week'` 共用一套几何）。
 *
 * 上游：`es/PickerPanel/DatePanel/index.js`（175 行）与
 * `es/PickerPanel/WeekPanel/index.js`（44 行，只是给 `DatePanel` 传 `mode="week"` +
 * 一个行级 class 计算器）。
 *
 * ── 本组件里最容易写错的三处 ──────────────────────────────────────────────────
 *
 * 1. **周号列（`prefixColumn`）的开关是 `showWeek ?? isWeek`** —— 也就是说
 *    `mode="week"` 时默认显示，`mode="date"` 时默认不显示，而 `showWeek` 显式给值
 *    可以覆盖两个方向（`date` 面板也能带周号列）。
 * 2. **列头文字是「按周首日旋转」的**：`weekDaysLocale[(i + weekFirstDay) % 7]` ——
 *    不是从数组第 0 个开始，`locale` 里的 `shortWeekDays` 永远以「周日」开头。
 * 3. **月份格的文字有两条路线**：`locale.monthFormat` 给了就 `formatValue`，
 *    否则取 `shortMonths[month]`。⚠️ 月面板（`MonthPanel`）也是同一条判据，
 *    但**日面板的标题按钮**走的是同一个分支 —— 忘了会得到「Jan 而不是 1月」。
 */

import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { formatValue, getWeekStartDate, isInRange, isSameWeek, WEEK_DAY_COUNT } from './date-util';
import { getPanelGeometry, getRowStartDate } from './panel';
import { PanelBody } from './panel-body';
import { type PanelDateType, usePanelInfo } from './panel-context';
import { PanelHeader } from './panel-header';
import { getPanelHeaderLimits } from './panel-header-limit';
import { formatWith, providePanelInfoFromProps, sharedPanelProps } from './panel-props';

/** 行级 class 的计算器（week 面板用）。 */
type RowClassNameFn = (rowStartDate: PanelDateType) => string | undefined;

const datePanelProps = {
  ...sharedPanelProps,
  /** `date` / `week` 决定几何与选择粒度 */
  mode: { type: String as PropType<'date' | 'week'>, default: 'date' },
  /** class 名里的面板名（`${prefixCls}-${panelName}-panel`） */
  panelName: { type: String, default: 'date' },
  /** 周号列开关；`undefined` ⇒ 跟随 `mode` */
  showWeek: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 行级 class（week 面板的整行选中与区间） */
  rowClassName: {
    type: Function as PropType<RowClassNameFn | undefined>,
    default: undefined,
  },
};

export const DatePanel = defineComponent({
  name: 'ApolloPickerDatePanel',
  props: datePanelProps,
  setup(props) {
    // ⚠️ 用返回值而不是 `usePanelInfo()`：面板自己 provide 的东西自己 inject 不到
    //    （`inject` 读 `parent.provides`）。见 `panel-props.ts` 的说明。
    const info = providePanelInfoFromProps(props, props.mode);

    return () => {
      const ctx = info.value;
      const { prefixCls, locale, generateConfig: g, pickerValue } = ctx;

      const isWeek = props.mode === 'week';
      const panelPrefixCls = `${prefixCls}-${props.panelName}-panel`;
      const cellPrefixCls = `${prefixCls}-cell`;

      const geometry = getPanelGeometry(props.mode, {
        generateConfig: g,
        locale,
        pickerValue,
        now: ctx.now,
      });

      // ==================== 周号列 ====================
      const showPrefixColumn = props.showWeek === undefined ? isWeek : props.showWeek;
      const prefixColumn = showPrefixColumn
        ? (date: PanelDateType): VNodeChild => {
            // ⚠️ 周号格自己再判一次 disabled（`type: 'week'`），与格子里的判据**不同**
            //    （格子用面板粒度），所以不能复用 `buildPanelCells` 的结果
            const disabled = ctx.disabledDate?.(date, { type: 'week' }) ?? false;
            return h(
              'td',
              {
                key: 'week',
                class: [
                  cellPrefixCls,
                  `${cellPrefixCls}-week`,
                  disabled ? `${cellPrefixCls}-disabled` : undefined,
                ],
                onClick: () => {
                  if (!disabled) {
                    ctx.onSelect(date);
                  }
                },
                onMouseenter: () => {
                  if (!disabled) {
                    ctx.onHover?.(date);
                  }
                },
                onMouseleave: () => {
                  if (!disabled) {
                    ctx.onHover?.(null);
                  }
                },
              },
              h('div', { class: `${cellPrefixCls}-inner` }, g.locale.getWeek(locale.locale, date)),
            );
          }
        : undefined;

      // ==================== 列头 ====================
      const weekFirstDay = g.locale.getWeekFirstDay(locale.locale);
      const weekDaysLocale =
        locale.shortWeekDays ?? g.locale.getShortWeekDays?.(locale.locale) ?? [];
      const headerCells: VNodeChild[] = [];
      if (prefixColumn) {
        headerCells.push(
          h(
            'th',
            { key: 'empty' },
            h(
              'span',
              {
                // ⚠️ 与 `TabNode` 的 `aria-live` 同坑：React 会把裸 `0` 序列化成 `0px`，
                //    Vue 原样写 `0` ⇒ 逐字不同（PITFALLS 8 / D94 的单位族问题）。
                style: {
                  width: '0px',
                  height: '0px',
                  position: 'absolute',
                  overflow: 'hidden',
                  opacity: '0',
                },
              },
              locale.week,
            ),
          ),
        );
      }
      for (let i = 0; i < WEEK_DAY_COUNT; i += 1) {
        headerCells.push(h('th', { key: i }, weekDaysLocale[(i + weekFirstDay) % WEEK_DAY_COUNT]));
      }

      // ==================== 表头标题 ====================
      const monthsLocale = locale.shortMonths ?? g.locale.getShortMonths?.(locale.locale) ?? [];
      const month = g.getMonth(pickerValue);

      const yearNode = h(
        'button',
        {
          type: 'button',
          'aria-label': locale.yearSelect,
          key: 'year',
          onClick: () => props.onModeChange?.('year', pickerValue),
          tabIndex: -1,
          class: `${prefixCls}-year-btn`,
        },
        formatWith(g, locale, locale.yearFormat, pickerValue),
      );
      const monthNode = h(
        'button',
        {
          type: 'button',
          'aria-label': locale.monthSelect,
          key: 'month',
          onClick: () => props.onModeChange?.('month', pickerValue),
          tabIndex: -1,
          class: `${prefixCls}-month-btn`,
        },
        locale.monthFormat
          ? formatWith(g, locale, locale.monthFormat, pickerValue)
          : monthsLocale[month],
      );
      const monthYearNodes = locale.monthBeforeYear ? [monthNode, yearNode] : [yearNode, monthNode];

      // ==================== 表头翻页 ====================
      const limits = getPanelHeaderLimits(props.mode, g);

      return h(
        'div',
        {
          // 🚨 类名的开关是**原始的 `showWeek`**，不是 `showPrefixColumn`（照抄上游）。
          //    两者的差别只在 `mode="week"` 且**未传** `showWeek` 时：
          //      showPrefixColumn = true（周号列要渲染）
          //      showWeek         = undefined（**不加** `-show-week` 类）
          //    ⇒ 周面板默认有周号列、但没有那个类名。本条由 L4 的 `picker:week` 用例抓到
          //    （初版两处都写了 `showPrefixColumn` ⇒ 多出一个类名）。
          class: [panelPrefixCls, props.showWeek ? `${panelPrefixCls}-show-week` : undefined],
        },
        [
          h(
            PanelHeader,
            {
              offset: limits.offset,
              superOffset: limits.superOffset,
              getStart: limits.getStart,
              getEnd: limits.getEnd,
              onChange: props.onPickerValueChange,
            },
            { default: () => monthYearNodes },
          ),
          h(PanelBody, {
            geometry,
            prefixColumn,
            rowClassName: props.rowClassName,
            headerCells,
          }),
        ],
      );
    };
  },
});

/**
 * 周面板：几何与日面板完全相同，差别只有两处。
 *
 * 1. `cellSelection: false`（由 `getPanelGeometry('week')` 表达）；
 * 2. **行级**的选中 / 区间状态（`rowClassName`）—— 因为一周不能被拆开选。
 */
export const WeekPanel = defineComponent({
  name: 'ApolloPickerWeekPanel',
  props: datePanelProps,
  setup(props) {
    // ⚠️ 周面板**不 provide**（它把一切都透传给 `DatePanel`，由后者持有上下文）
    //    ⇒ 它需要的东西一律从**自己的 props** 取（与上游 `WeekPanel` 一致）。
    return () => {
      const { prefixCls, locale, generateConfig: g } = props;
      const localeName = locale.locale;
      const rowPrefixCls = `${prefixCls}-week-panel-row`;
      const value = props.values[0];
      const { hoverRangeValue, hoverValue } = props;

      const rowClassName: RowClassNameFn = (currentDate) => {
        const classes: Record<string, boolean> = {};

        if (hoverRangeValue) {
          const [rangeStart, rangeEnd] = hoverRangeValue;
          const isRangeStart = isSameWeek(g, localeName, rangeStart, currentDate);
          const isRangeEnd = isSameWeek(g, localeName, rangeEnd, currentDate);
          classes[`${rowPrefixCls}-range-start`] = isRangeStart;
          classes[`${rowPrefixCls}-range-end`] = isRangeEnd;
          classes[`${rowPrefixCls}-range-hover`] =
            !isRangeStart && !isRangeEnd && isInRange(g, rangeStart, rangeEnd, currentDate);
        }
        if (hoverValue) {
          classes[`${rowPrefixCls}-hover`] = hoverValue.some((date) =>
            isSameWeek(g, localeName, currentDate, date),
          );
        }
        classes[`${rowPrefixCls}-selected`] =
          !hoverRangeValue && value !== undefined && isSameWeek(g, localeName, value, currentDate);

        const names = [rowPrefixCls];
        for (const [name, on] of Object.entries(classes)) {
          if (on) {
            names.push(name);
          }
        }
        return names.join(' ');
      };

      return h(DatePanel, {
        ...props,
        mode: 'week' as const,
        panelName: 'week',
        rowClassName,
      });
    };
  },
});

/** 面板顶部标题行的 typescript 收口（避免消费方 import 深路径）。 */
export type { PanelDateType };
// 供测试与 `PickerPanel` 复用（`getWeekStartDate` 是 date 面板 `baseDate` 的来源，
// 这里重新导出只是为了让「日期面板依赖了它」这件事在文件里可见）。
export { formatValue, getRowStartDate, getWeekStartDate };
