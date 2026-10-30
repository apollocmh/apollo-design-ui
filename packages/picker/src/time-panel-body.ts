/**
 * 时间面板的主体：2–5 列可滚动的时间列。
 *
 * 上游：`es/PickerPanel/TimePanel/TimePanelBody/index.js`（243 行）。
 *
 * ── 三处「列与列之间存在依赖」的地方（顺序不能换）──────────────────────────────
 *
 * 1. **分钟列的内容取决于小时**（`getMinuteUnits(validHour)`），秒取决于时+分，毫秒取决于
 *    时+分+秒。而 `validHour` 不是 `hour`，是 `getEnabled(rowHourUnits, hour)`
 *    ——「当前值」被禁用时**回退到第一个可用档位**，否则列里会没有选中项。
 * 2. **12 小时制下小时列要过滤**（`isAM(hour)` ⇒ 只留上午档），而 `validHour` 取的是
 *    **未过滤**的全量 `rowHourUnits` —— 因为 `getMinuteUnits` 要的是真实小时数。
 * 3. **上下午两档的禁用判据是「所有小时都被禁用或都不是这一侧」**，不是「没有上午的小时」。
 *
 * ── 触发链 ────────────────────────────────────────────────────────────────────
 *
 * 任何一列改值 → `fillTimeUnitValue(template, val, unit)` → `getValidTime`（逐级对齐到
 * 可用档位）→ `onSelect`。所以**「点一个被禁用的值」是不会发生的**（列里没有它），
 * 但「点完之后其它列的值变得不可用」会发生，由 `getValidTime` 兜住。
 */

import { computed, defineComponent, h, type PropType, ref, type SlotsType } from 'vue';
import { type PanelDateType, type PanelSlots, usePanelHack, usePanelInfo } from './panel-context';
import { TimeColumn, type TimeColumnValue } from './time-column';
import type { TimePanelConfig } from './time-config';
import {
  fillTimeUnitValue,
  getMeridiemTime,
  getMeridiemUnits,
  getTimeParts,
  getTriggerDateTemplate,
  isAM,
} from './time-tmpl';
import { getTimeInfo } from './time-units';

export const TimePanelBody = defineComponent({
  name: 'ApolloPickerTimePanelBody',
  props: {
    // -------------------------------------------------- 显示哪几列
    showHour: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showMinute: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showSecond: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showMillisecond: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    /** 12 小时制（含上下午两列） */
    use12Hours: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    changeOnScroll: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    /** 其余时间配置（步长 / 禁用 / 默认值）—— 整包透传给 `getTimeInfo` */
    timeConfig: {
      type: Object as PropType<TimePanelConfig<PanelDateType>>,
      default: () => ({}),
    },
  },
  slots: Object as SlotsType<PanelSlots>,
  setup(props, { slots, expose }) {
    const columnRefs = Array.from({ length: 5 }, () => ref<{ focus: () => void } | null>(null));
    expose({ focus: () => columnRefs.find((column) => column.value)?.value?.focus() });
    const info = usePanelInfo();
    const hack = usePanelHack();
    /** 由面板算好的「禁用规则 + 步长」配置（`showXxx` 不是它的成员）。 */
    const unitConfig = computed<TimePanelConfig<PanelDateType>>(() => ({
      ...props.timeConfig,
      hideDisabledOptions: props.timeConfig.hideDisabledOptions,
      hourStep: props.timeConfig.hourStep,
      minuteStep: props.timeConfig.minuteStep,
      secondStep: props.timeConfig.secondStep,
      millisecondStep: props.timeConfig.millisecondStep,
      use12Hours: props.use12Hours,
    }));

    return () => {
      const ctx = info.value;
      const { prefixCls, classNames, styles, values, generateConfig: g, locale } = ctx;
      const onHover = ctx.onHover ?? (() => undefined);
      const { pickerValue } = ctx;

      const value = values[0] ?? null;
      const showMeridiem = props.use12Hours === true;

      const timeInfo = getTimeInfo(g, unitConfig.value, value ?? undefined);
      const { getValidTime, rowHourUnits, getMinuteUnits, getSecondUnits, getMillisecondUnits } =
        timeInfo;

      // ==================== 当前值 / 浏览值的四个单位 ====================
      const valueTime = getTimeParts(g, value);
      const pickerTime = getTimeParts(g, pickerValue);
      const hour = valueTime?.hour ?? null;
      const minute = valueTime?.minute ?? null;
      const second = valueTime?.second ?? null;
      const millisecond = valueTime?.millisecond ?? null;
      const meridiem: 'am' | 'pm' | null = hour === null ? null : isAM(hour) ? 'am' : 'pm';

      // ==================== 各列档位 ====================
      // >>> 小时列：12 小时制时**按当前的上下午过滤**
      const hourUnits =
        showMeridiem && hour !== null
          ? isAM(hour)
            ? rowHourUnits.filter((unit) => isAM(unit.value))
            : rowHourUnits.filter((unit) => !isAM(unit.value))
          : rowHourUnits;

      /** `值` 为空或落到被禁用的档位时，回退到第一个可用档位。 */
      const getEnabled = (
        units: readonly { value: number; disabled: boolean }[],
        val: number | null,
      ): number | undefined => {
        if (val !== null) {
          return val;
        }
        return units.filter((unit) => !unit.disabled)[0]?.value;
      };

      const validHour = getEnabled(rowHourUnits, hour);
      const minuteUnits = getMinuteUnits(validHour ?? 0);
      const validMinute = getEnabled(minuteUnits, minute);
      const secondUnits = getSecondUnits(validHour ?? 0, validMinute ?? 0);
      const validSecond = getEnabled(secondUnits, second);
      const millisecondUnits = getMillisecondUnits(
        validHour ?? 0,
        validMinute ?? 0,
        validSecond ?? 0,
      );
      const validMillisecond = getEnabled(millisecondUnits, millisecond);

      const meridiemUnits = showMeridiem ? getMeridiemUnits(g, locale, rowHourUnits) : [];

      // ==================== 变更 ====================
      const triggerChange = (nextDate: PanelDateType | null): void => {
        if (nextDate === null) {
          return;
        }
        ctx.onSelect(getValidTime(nextDate));
      };

      const template = getTriggerDateTemplate({
        generateConfig: g,
        value,
        pickerValue,
        valueTime,
        pickerTime,
        validTime:
          validHour === undefined
            ? undefined
            : {
                hour: validHour,
                minute: validMinute ?? 0,
                second: validSecond ?? 0,
                millisecond: validMillisecond ?? 0,
              },
      });

      const changeUnit = (
        val: TimeColumnValue,
        unit: 'Hour' | 'Minute' | 'Second' | 'Millisecond',
      ) => {
        if (typeof val === 'number') triggerChange(fillTimeUnitValue(g, template, val, unit));
      };
      const hoverUnit = (
        val: TimeColumnValue | null,
        unit: 'Hour' | 'Minute' | 'Second' | 'Millisecond',
      ) => {
        if (typeof val === 'number' || val === null) {
          onHover(fillTimeUnitValue(g, template, val, unit));
        }
      };

      const onMeridiemChange = (val: TimeColumnValue): void => {
        if (typeof val === 'string') triggerChange(getMeridiemTime(g, template, val, hour));
      };
      const onMeridiemHover = (val: TimeColumnValue | null): void => {
        if (typeof val === 'string' || val === null) {
          onHover(getMeridiemTime(g, template, val, hour));
        }
      };

      // ==================== 渲染 ====================
      const columns = [];

      if (props.showHour) {
        columns.push(
          h(
            TimeColumn,
            {
              units: hourUnits,
              value: hour,
              optionalValue: pickerTime?.hour ?? null,
              ref: columnRefs[0],
              type: 'hour',
              onChange: (value) => changeUnit(value, 'Hour'),
              onHover: (value) => hoverUnit(value, 'Hour'),
              onDblClick: hack.onCellDblClick,
              changeOnScroll: props.changeOnScroll,
            },
            slots,
          ),
        );
      }
      if (props.showMinute) {
        columns.push(
          h(
            TimeColumn,
            {
              units: minuteUnits,
              value: minute,
              optionalValue: pickerTime?.minute ?? null,
              ref: columnRefs[1],
              type: 'minute',
              onChange: (value) => changeUnit(value, 'Minute'),
              onHover: (value) => hoverUnit(value, 'Minute'),
              onDblClick: hack.onCellDblClick,
              changeOnScroll: props.changeOnScroll,
            },
            slots,
          ),
        );
      }
      if (props.showSecond) {
        columns.push(
          h(
            TimeColumn,
            {
              units: secondUnits,
              value: second,
              optionalValue: pickerTime?.second ?? null,
              ref: columnRefs[2],
              type: 'second',
              onChange: (value) => changeUnit(value, 'Second'),
              onHover: (value) => hoverUnit(value, 'Second'),
              onDblClick: hack.onCellDblClick,
              changeOnScroll: props.changeOnScroll,
            },
            slots,
          ),
        );
      }
      if (props.showMillisecond) {
        columns.push(
          h(
            TimeColumn,
            {
              units: millisecondUnits,
              value: millisecond,
              optionalValue: pickerTime?.millisecond ?? null,
              ref: columnRefs[3],
              type: 'millisecond',
              onChange: (value) => changeUnit(value, 'Millisecond'),
              onHover: (value) => hoverUnit(value, 'Millisecond'),
              onDblClick: hack.onCellDblClick,
              changeOnScroll: props.changeOnScroll,
            },
            slots,
          ),
        );
      }
      if (showMeridiem) {
        // ⚠️ 上下午列的 `value` 是 `'am' | 'pm'`（字符串），不是数字 ——
        //    `TimeColumn` 的 `value` prop 因此声明成 `number | string | null`。
        columns.push(
          h(
            TimeColumn,
            {
              units: meridiemUnits,
              value: meridiem,
              optionalValue: null,
              ref: columnRefs[4],
              type: 'meridiem',
              onChange: onMeridiemChange,
              onHover: onMeridiemHover,
              onDblClick: hack.onCellDblClick,
              changeOnScroll: props.changeOnScroll,
            },
            slots,
          ),
        );
      }

      return h(
        'div',
        { class: [`${prefixCls}-content`, classNames.content], style: styles.content },
        columns,
      );
    };
  },
});
