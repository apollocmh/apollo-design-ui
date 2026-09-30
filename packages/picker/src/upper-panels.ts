/**
 * 月 / 季 / 年 / 十年，四个「上层」面板。
 *
 * 上游对应物：`es/PickerPanel/{Month,Quarter,Year,Decade}Panel/index.js`
 * （89 / 75 / 105 / 102 行）。四者的骨架完全一样
 * （表头标题按钮 + `PanelBody`），差别只在**几何**（`getPanelGeometry` 已覆盖）
 * 与**标题按钮指向哪一级**。
 *
 * ── 四个面板各自的「标题按钮」粒度（照抄，容易记错）────────────────────────────
 *
 * | 面板 | 标题按钮 | 点了切到 | `onModeChange` 的实参 |
 * |---|---|---|---|
 * | month | 年 | `'year'` | ⚠️ **不带 viewDate**（上游只传了 mode） |
 * | quarter | 年 | `'year'` | 同上，不带 |
 * | year | 起止年 `2020-2029` | `'decade'` | 同上，不带 |
 * | decade | 起止年 `2000-2099`（**纯文本**，不可点） | — | — |
 *
 * ⚠️ `month` / `quarter` 的 `onModeChange` 调用**不传第二个参数**，而
 * `DatePanel` 的两处**都传 `pickerValue`** —— 上游就是这么不一致的。
 * 差异的可见后果：`triggerModeChange(nextMode, undefined)` 不会 `setPickerValue`
 * ⇒ 切到年面板时保留原来的浏览值。
 *
 * ── 三个 `baseDate` 的「看起来像 bug、其实是契约」────────────────────────────
 * （已由 `getPanelGeometry` 表达，这里只留索引）
 *  - year：起点年 **− 1**；
 *  - decade：起始世纪 **− 10 年**。
 */

import { defineComponent, h, type PropType } from 'vue';
import { getPanelGeometry } from './panel';
import { PanelBody } from './panel-body';
import { type PanelDateType, usePanelInfo } from './panel-context';
import { PanelHeader } from './panel-header';
import { getPanelHeaderLimits } from './panel-header-limit';
import { formatWith, providePanelInfoFromProps, sharedPanelProps } from './panel-props';
import type { DisabledDate, PanelMode } from './types';

/** 四个面板共用的 props（就是 `sharedPanelProps`，此处别名只为可读性）。 */
const upperPanelProps = { ...sharedPanelProps };

/**
 * 把「某一天禁用」提升为「整块禁用」。
 *
 * 上游三个面板各自内联了一段几乎一样的代码，目的都是**同一个**：
 * 上层面板的一格代表一段时间（一个月 / 一年 / 十年），
 * 只有**整段都**禁用才算这一格禁用。三者的差异只在端点的算法：
 *
 * | 面板 | 起点 | 终点 |
 * |---|---|---|
 * | month | 当月 1 日 | 下月 1 日 − 1 天 |
 * | year | 1/1 | 次年 1/1 − 1 天 |
 * | decade | `floor(year/10)*10` 的 1/1 | 十年后的 1/1 − 1 天 |
 *
 * ⚠️ **季面板不做这件事**（上游 `QuarterPanel` 直接透传 `props`）——
 * 也就是说「一个季度里只有一天可用」时，季格子**不是**禁用态。
 * 这是上游的不一致，照抄，不修（记进 `COMPATIBILITY.md`）。
 */
function mergeDisabledToBlock<DateType>(
  disabledDate: DisabledDate<DateType> | undefined,
  mode: 'month' | 'year' | 'decade',
  g: import('./types').GenerateConfig<DateType>,
): DisabledDate<DateType> | undefined {
  if (!disabledDate) {
    return undefined;
  }

  return (currentDate, disabledInfo) => {
    let startDate: DateType;
    let nextStart: DateType;

    if (mode === 'month') {
      startDate = g.setDate(currentDate, 1);
      nextStart = g.addMonth(startDate, 1);
    } else if (mode === 'year') {
      startDate = g.setDate(g.setMonth(currentDate, 0), 1);
      nextStart = g.addYear(startDate, 1);
    } else {
      // 🚨 片段是 **10 年**而不是 100 年 —— 与 `getPanelGeometry('decade')` 的
      //    百年起点**不是**同一粒度。上游 `DecadePanel` 的禁用合并就是按 10 年算的
      //    （`Math.floor(getYear(…) / 10) * 10`），照抄。
      const baseStartMonth = g.setMonth(g.setDate(currentDate, 1), 0);
      startDate = g.setYear(baseStartMonth, Math.floor(g.getYear(baseStartMonth) / 10) * 10);
      nextStart = g.addYear(startDate, 10);
    }

    const endDate = g.addDate(nextStart, -1);
    return disabledDate(startDate, disabledInfo) && disabledDate(endDate, disabledInfo);
  };
}

/**
 * 四个面板的公共骨架。
 *
 * 抽成工厂而不是四个复制粘贴的文件：它们的差别只有
 * 「panelPrefixCls / 标题槽 / 表头配置」三处，其余（`PanelBody` 的接线）逐字相同。
 * 上游之所以是四份，是因为每份都在 JSX 里现算 `baseDate` 与 `getCellClass`；
 * 那些已经进了 `getPanelGeometry`。
 */
function defineUpperPanel(
  mode: Exclude<PanelMode, 'date' | 'week' | 'time' | 'datetime'>,
  titleKind: 'year' | 'decadeRange' | 'centuryRange',
) {
  return defineComponent({
    name: `ApolloPicker${mode[0]?.toUpperCase()}${mode.slice(1)}Panel`,
    props: {
      ...upperPanelProps,
      /** 覆盖 `prefixCls-${mode}-panel` 的面板名 */
      panelName: { type: String, default: mode },
    },
    setup(props) {
      // ⚠️ 用返回值（面板自己 provide 的东西自己 inject 不到），见 `panel-props.ts`
      const info = providePanelInfoFromProps(props, mode);

      return () => {
        const ctx = info.value;
        const { prefixCls, locale, generateConfig: g, pickerValue } = ctx;
        const panelPrefixCls = `${prefixCls}-${props.panelName}-panel`;

        const geometry = getPanelGeometry(mode, {
          generateConfig: g,
          locale,
          pickerValue,
          now: ctx.now,
        });
        const limits = getPanelHeaderLimits(mode, g);

        // 只有 month / year / decade 三档做「整块禁用」合并；quarter 不透传
        const mergedDisabledDate =
          mode === 'quarter' ? ctx.disabledDate : mergeDisabledToBlock(ctx.disabledDate, mode, g);

        // ==================== 标题槽 ====================
        let titleNode;
        if (titleKind === 'year') {
          // month / quarter：一个「年」按钮，点了切到年面板（⚠️ 不传 viewDate）
          titleNode = h(
            'button',
            {
              type: 'button',
              key: 'year',
              'aria-label': locale.yearSelect,
              onClick: () => props.onModeChange?.('year'),
              tabIndex: -1,
              class: `${prefixCls}-year-btn`,
            },
            formatWith(g, locale, locale.yearFormat, pickerValue),
          );
        } else {
          // year / decade：起止年。year 是可点的「十年」按钮，decade 是纯文本
          const startYearDate = limits.getStart?.(pickerValue) ?? pickerValue;
          const endYearDate = limits.getEnd?.(pickerValue) ?? pickerValue;
          const startStr = formatWith(g, locale, locale.yearFormat, startYearDate);
          const endStr = formatWith(g, locale, locale.yearFormat, endYearDate);

          titleNode =
            titleKind === 'decadeRange'
              ? h(
                  'button',
                  {
                    type: 'button',
                    key: 'decade',
                    'aria-label': locale.decadeSelect,
                    onClick: () => props.onModeChange?.('decade'),
                    tabIndex: -1,
                    class: `${prefixCls}-decade-btn`,
                  },
                  [startStr, '-', endStr],
                )
              : `${startStr}-${endStr}`;
        }

        return h('div', { class: panelPrefixCls }, [
          h(
            PanelHeader,
            {
              // month / quarter 没有「翻一格」这一档（上一级已经是年）
              offset: limits.offset,
              superOffset: limits.superOffset,
              getStart: limits.getStart,
              getEnd: limits.getEnd,
              onChange: props.onPickerValueChange,
            },
            { default: () => titleNode },
          ),
          h(PanelBody, { geometry, disabledDate: mergedDisabledDate }),
        ]);
      };
    },
  });
}

/** 月面板。`disabledDate` 的合并规则见 `buildPanelCells` 之外的这一条：
 *  **只有「整月都禁用」才算禁用**（首末两日都判为禁用）。 */
export const MonthPanel = defineUpperPanel('month', 'year');
/** 季面板。⚠️ 它的 `disabledDate` **不做整季合并**（上游 QuarterPanel 直接透传 props）。 */
export const QuarterPanel = defineUpperPanel('quarter', 'year');
/** 年面板。`disabledDate` 合并成「整年」（当年 1/1 与 12/31 都禁用）。 */
export const YearPanel = defineUpperPanel('year', 'decadeRange');
/** 十年面板。`disabledDate` 合并成「整个十年」。标题是纯文本，不可点。 */
export const DecadePanel = defineUpperPanel('decade', 'centuryRange');

/** 四个面板的 props 类型（供 `PickerPanel` 的 `components` 通道使用）。 */
export type UpperPanelProps = typeof upperPanelProps;
export type { PanelDateType };
