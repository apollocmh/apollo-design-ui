/**
 * 面板外壳 `PickerPanel`：把 props 归一成「模式 + 值 + 浏览值 + 时间配置」，
 * 再按当前模式挑一个面板组件渲染出来。
 *
 * 上游：`@rc-component/picker@1.12.2` 的 `es/PickerPanel/index.js`（285 行）。
 *
 * ── 这个组件是整条面板链上**唯一持有状态**的地方 ──────────────────────────────
 *
 * 三个独立的「受控 / 非受控」值（上游用三个 `useControlledState`）：
 *
 * | 值 | 受控 prop | 非受控初值 | 作用 |
 * |---|---|---|---|
 * | `value` | `value` | `defaultValue` | 选中值（多选时是列表） |
 * | `pickerValue` | `pickerValue` | `defaultPickerValue ?? value[0] ?? now` | 面板**当前浏览**的日期 |
 * | `mode` | `mode` | `picker ?? 'date'` | 面板粒度（日/月/年/十年…） |
 *
 * ⚠️ 三处**看起来像 bug 但必须照抄**的地方：
 *
 * 1. **`pickerValue` 有一条 `watch`**：`value[0]` 变了**且 `pickerValue` 未受控**时，
 *    把浏览值也跟过去。所以「外部改 value ⇒ 面板跳到那个月」，但**受控 `pickerValue`
 *    时这条不生效**（这就是 `!pickerValue` 那个条件）。上游用 `useEffect` + 缺依赖的
 *    依赖数组（`[mergedValue[0]]`）实现，本仓用 `watch` 明确写出来。
 * 2. **`onChange` 只在「真的变了」时发**：判据是长度变化 **或** 任一项
 *    `isSame(internalPicker)` 为假。单值模式传下去的是 `nextValue[0]`
 *    （可能是 `undefined`）；多选模式传整个数组。
 * 3. **`onPanelValueSelect` 里的「自动降级」队列只在 `mergedMode !== picker` 时跑** ——
 *    即「从年面板选了一年 ⇒ 自动切到月面板 ⇒ 再到日面板」。队列按 `picker` 分三档，
 *    且**取 `queue[index + 1]`，取不到就什么都不做**（不会停在中间态）。
 */

import { computed, defineComponent, h, type PropType, provide, ref, watch } from 'vue';
import { DatePanel, WeekPanel } from './date-panel';
import { isSame } from './date-util';
import { fillLocale } from './locale-fill';
import { pickProps } from './misc-util';
import {
  PANEL_SHARED_KEY,
  type PanelCellRender,
  type PanelDateType,
  type PanelSemanticClassNames,
  type PanelSemanticStyles,
} from './panel-context';
import { providePanelHack } from './panel-props';
import {
  type DisabledTimes,
  fillShowTimeConfig,
  getTimeProps,
  type PickerFormat,
  type TimePanelConfig,
} from './time-config';
import { DateTimePanel, TimePanel } from './time-panel';
import { toggleDates } from './toggle-dates';
import type {
  DisabledDate,
  GenerateConfig,
  InternalMode,
  PanelMode,
  PickerLocale,
  PickerMode,
} from './types';
import { DecadePanel, MonthPanel, QuarterPanel, YearPanel } from './upper-panels';

/** 默认的面板组件表（上游 `DefaultComponents`）。 */
export const DEFAULT_PANEL_COMPONENTS = {
  date: DatePanel,
  datetime: DateTimePanel,
  week: WeekPanel,
  month: MonthPanel,
  quarter: QuarterPanel,
  year: YearPanel,
  decade: DecadePanel,
  time: TimePanel,
} as const;

/** `picker='date'` 且开了 `showTime` 时，实际渲染的是 `datetime` 面板。 */
function toInternalMode(picker: PickerMode | undefined, showTime: unknown): InternalMode {
  const base = picker ?? 'date';
  if (base === 'date' && showTime) {
    return 'datetime';
  }
  return base;
}

/** 从「年/月/十年」面板选完之后该退到哪一级。 */
const DECADE_YEAR_QUEUE: PanelMode[] = ['decade', 'year'];
const DECADE_YEAR_MONTH_QUEUE: PanelMode[] = [...DECADE_YEAR_QUEUE, 'month'];

function getModeQueue(picker: PickerMode): PanelMode[] {
  switch (picker) {
    case 'quarter':
      return [...DECADE_YEAR_QUEUE, 'quarter'];
    case 'week':
      return [...DECADE_YEAR_MONTH_QUEUE, 'week'];
    case 'date':
      return [...DECADE_YEAR_MONTH_QUEUE, 'date'];
    default:
      return DECADE_YEAR_MONTH_QUEUE;
  }
}

export const PickerPanel = defineComponent({
  name: 'ApolloPickerPanel',
  props: {
    prefixCls: { type: String, default: 'apollo-picker' },
    direction: { type: String as PropType<'ltr' | 'rtl' | undefined>, default: undefined },
    locale: { type: Object as PropType<PickerLocale>, required: true },
    generateConfig: {
      type: Object as PropType<GenerateConfig<PanelDateType>>,
      required: true,
    },
    /** 根节点的 `tabIndex`（上游默认 `0`；`-1` 表示不可 Tab 到达） */
    tabIndex: { type: Number, default: 0 },

    // ---------------------------------------------------------------- 模式
    picker: { type: String as PropType<PickerMode | undefined>, default: undefined },
    mode: { type: String as PropType<PanelMode | undefined>, default: undefined },
    onPanelChange: {
      type: Function as PropType<
        ((viewDate: PanelDateType | undefined, mode: PanelMode) => void) | undefined
      >,
      default: undefined,
    },

    // ---------------------------------------------------------------- 值
    multiple: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    value: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
    onChange: {
      type: Function as PropType<((next: never) => void) | undefined>,
      default: undefined,
    },
    onSelect: {
      type: Function as PropType<((date: PanelDateType) => void) | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------------- 浏览值
    pickerValue: {
      type: null as unknown as PropType<PanelDateType | undefined>,
      default: undefined,
    },
    defaultPickerValue: {
      type: null as unknown as PropType<PanelDateType | undefined>,
      default: undefined,
    },
    onPickerValueChange: {
      type: Function as PropType<((next: PanelDateType) => void) | undefined>,
      default: undefined,
    },

    // --------------------------------------------------- hover 与格子
    hoverValue: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
    hoverRangeValue: {
      type: Array as PropType<PanelDateType[] | undefined>,
      default: undefined,
    },
    cellRender: { type: Function as PropType<PanelCellRender | undefined>, default: undefined },

    // ---------------------------------------------------- 限制与图标
    disabledDate: {
      type: Function as PropType<DisabledDate<PanelDateType> | undefined>,
      default: undefined,
    },
    minDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
    maxDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
    onHover: {
      type: Function as PropType<((date: PanelDateType | null) => void) | undefined>,
      default: undefined,
    },
    showWeek: { type: Boolean as PropType<boolean | undefined>, default: undefined },

    // ------------------------------------------------------ 时间配置
    showTime: {
      type: [Boolean, Object] as PropType<boolean | TimePanelConfig<PanelDateType> | undefined>,
      default: undefined,
    },
    format: {
      type: null as unknown as PropType<PickerFormat | undefined>,
      default: undefined,
    },

    // --------------------------------------------- 顶层的时间配置（`SharedTimeProps`）
    //
    // 🚨 这批键**必须显式声明**，否则会被 Vue 归进 `attrs`，
    //    而 `getTimeProps` 走的是 `pickProps(props, showTimeKeys)` —— 取不到就是**静默失效**。
    //    症状（2026-09-30 实测）：`<PickerPanel use12Hours />` 时空面板只有 3 列（少了上下午列），
    //    `hourStep` / `disabledHours` / `hideDisabledOptions` 全部不生效。
    //    ⚠️ 上游把这些键 spread 进 `PickerPanel` 的 props（`SharedTimeProps`），
    //    所以「从 props 上取得到」是它的**契约**，不是实现细节。
    use12Hours: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showHour: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showMinute: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showSecond: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showMillisecond: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    hourStep: { type: Number as PropType<number | undefined>, default: undefined },
    minuteStep: { type: Number as PropType<number | undefined>, default: undefined },
    secondStep: { type: Number as PropType<number | undefined>, default: undefined },
    millisecondStep: { type: Number as PropType<number | undefined>, default: undefined },
    hideDisabledOptions: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    changeOnScroll: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    disabledHours: {
      type: Function as PropType<(() => number[]) | undefined>,
      default: undefined,
    },
    disabledMinutes: {
      type: Function as PropType<((hour: number) => number[]) | undefined>,
      default: undefined,
    },
    disabledSeconds: {
      type: Function as PropType<((hour: number, minute: number) => number[]) | undefined>,
      default: undefined,
    },
    disabledTime: {
      type: Function as PropType<((date: PanelDateType) => DisabledTimes) | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------------- 逃生
    hideHeader: { type: Boolean as PropType<boolean | undefined>, default: undefined },

    // ---------------------------------------------------------- 语义
    classNames: {
      type: Object as PropType<PanelSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<PanelSemanticStyles | undefined>, default: undefined },
    /** 组件替换表（`mode` ⇒ 组件） */
    components: {
      type: Object as PropType<Partial<Record<InternalMode, unknown>> | undefined>,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    const rootRef = ref<HTMLElement | null>(null);
    expose({ nativeElement: rootRef });

    // ========================= Time =========================
    // ⚠️ 入参是「组件 props 的超集」，含顶层的时间 props（`hourStep` 等）。
    const [timeProps, localeTimeProps, showTimeFormat, propFormat] = computed(() =>
      getTimeProps(props),
    ).value;

    // ========================= Locale =========================
    const filledLocale = computed(() => fillLocale(props.locale, localeTimeProps.format ?? ''));

    // ========================= Picker =========================
    const internalPicker = computed<InternalMode>(() =>
      toInternalMode(props.picker, props.showTime),
    );

    // ======================== ShowTime ========================
    const mergedShowTime = computed(() =>
      fillShowTimeConfig(
        internalPicker.value,
        showTimeFormat,
        propFormat,
        timeProps,
        filledLocale.value,
      ),
    );

    // ========================== Mode ==========================
    const innerMode = ref<PanelMode>(props.mode ?? props.picker ?? 'date');
    watch(
      () => props.mode,
      (next) => {
        if (next !== undefined) {
          innerMode.value = next;
        }
      },
    );
    const mergedMode = computed<PanelMode>(() =>
      props.mode !== undefined ? props.mode : innerMode.value,
    );
    const setMergedMode = (next: PanelMode): void => {
      if (props.mode === undefined) {
        innerMode.value = next;
      }
    };
    const internalMode = computed<InternalMode>(() =>
      mergedMode.value === 'date' && mergedShowTime.value ? 'datetime' : mergedMode.value,
    );

    // ========================= Value =========================
    const innerValue = ref<PanelDateType[]>(props.defaultValue ?? []);
    watch(
      () => props.value,
      (next) => {
        if (next !== undefined) {
          innerValue.value = next;
        }
      },
    );
    const rawValue = computed<PanelDateType[]>(() =>
      props.value !== undefined ? props.value : innerValue.value,
    );
    /** 清掉空值；单值模式只留第一个。 */
    const mergedValue = computed<PanelDateType[]>(() => {
      const values = (rawValue.value ?? []).filter((val): val is PanelDateType => Boolean(val));
      return props.multiple ? values : values.slice(0, 1);
    });

    const setMergedValue = (next: PanelDateType[]): void => {
      if (props.value === undefined) {
        innerValue.value = next;
      }
    };

    const generator = (): GenerateConfig<PanelDateType> => props.generateConfig;

    const triggerChange = (nextValue: PanelDateType[]): void => {
      // 🚨 **必须先取快照再写**（2026-09-30 由 L2 抓到的一个真 bug）。
      //
      // 上游是 React：`mergedValue` 是**本次渲染的闭包常量**，`setMergedValue(next)` 是
      // 排队的 state 更新 ⇒ 比较用的是**旧**值。本仓的 `mergedValue` 是 Vue 的 `computed`
      // ⇒ 一旦 `setMergedValue` 改了内部 `ref`，它**立刻**返回新值，于是
      //   `current.length !== nextValue.length` 与 `isSame(...)` 全部为假
      //   ⇒ `changed` 恒为 `false` ⇒ **非受控模式下 `onChange` 永远不触发**。
      // 症状：受控用法（`value` 从外部传）一切正常，因为那时 `setMergedValue` 是空操作；
      // 只有**非受控**才暴露 —— 而它是 `defaultValue` 用户的默认路径。
      const current = mergedValue.value;
      setMergedValue(nextValue);
      const changed =
        current.length !== nextValue.length ||
        current.some(
          (ori, index) =>
            !isSame(
              generator(),
              filledLocale.value,
              ori,
              nextValue[index] as PanelDateType,
              internalPicker.value,
            ),
        );
      if (changed) {
        props.onChange?.((props.multiple ? nextValue : nextValue[0]) as never);
      }
    };

    /** 面板选了一个日期 —— 只有「当前模式就是 picker 模式」时才真的改值。 */
    const onInternalSelect = (newDate: PanelDateType): void => {
      props.onSelect?.(newDate);
      if (mergedMode.value === props.picker) {
        const nextValues = props.multiple
          ? (toggleDates(
              generator(),
              filledLocale.value,
              internalPicker.value === 'datetime' ? 'date' : internalPicker.value,
              mergedValue.value,
              newDate,
            ) as PanelDateType[])
          : [newDate];
        triggerChange(nextValues);
      }
    };

    // >>> PickerValue
    const innerPickerValue = ref<PanelDateType>(
      props.defaultPickerValue ?? mergedValue.value[0] ?? props.generateConfig.getNow(),
    );
    watch(
      () => props.pickerValue,
      (next) => {
        if (next !== undefined) {
          innerPickerValue.value = next;
        }
      },
    );
    const mergedPickerValue = computed<PanelDateType>(() =>
      props.pickerValue !== undefined ? props.pickerValue : innerPickerValue.value,
    );
    const setInternalPickerValue = (next: PanelDateType): void => {
      if (props.pickerValue === undefined) {
        innerPickerValue.value = next;
      }
    };

    // ⚠️ 那条「value 变了 ⇒ 浏览值跟过去」的同步（仅非受控 pickerValue 时生效）
    watch(
      () => mergedValue.value[0],
      (next) => {
        if (next && props.pickerValue === undefined) {
          setInternalPickerValue(next);
        }
      },
    );

    const triggerPanelChange = (viewDate?: PanelDateType, nextMode?: PanelMode): void => {
      props.onPanelChange?.(viewDate ?? mergedPickerValue.value, nextMode ?? mergedMode.value);
    };
    const setPickerValue = (nextPickerValue: PanelDateType, triggerPanelEvent = false): void => {
      setInternalPickerValue(nextPickerValue);
      props.onPickerValueChange?.(nextPickerValue);
      if (triggerPanelEvent) {
        triggerPanelChange(nextPickerValue);
      }
    };
    const triggerModeChange = (nextMode: PanelMode, viewDate?: PanelDateType): void => {
      setMergedMode(nextMode);
      if (viewDate) {
        setPickerValue(viewDate);
      }
      triggerPanelChange(viewDate, nextMode);
    };

    const onPanelValueSelect = (nextValue: PanelDateType): void => {
      onInternalSelect(nextValue);
      setPickerValue(nextValue);

      if (mergedMode.value !== props.picker) {
        const queue = getModeQueue((props.picker ?? 'date') as PickerMode);
        const index = queue.indexOf(mergedMode.value);
        const nextMode = queue[index + 1];
        if (nextMode) {
          triggerModeChange(nextMode, nextValue);
        }
      }
    };

    // ======================= Hover Date =======================
    const hoverRangeDate = computed<[PanelDateType, PanelDateType] | null>(() => {
      const raw = props.hoverRangeValue;
      if (!raw) {
        return null;
      }
      let start: PanelDateType | undefined;
      let end: PanelDateType | undefined;
      if (Array.isArray(raw)) {
        [start, end] = raw;
      } else {
        start = raw as unknown as PanelDateType;
      }
      if (!start && !end) {
        return null;
      }
      const finalStart = (start ?? end) as PanelDateType;
      const finalEnd = (end ?? start) as PanelDateType;
      return props.generateConfig.isAfter(finalStart, finalEnd)
        ? [finalEnd, finalStart]
        : [finalStart, finalEnd];
    });

    // ======================== Context =========================
    provide(PANEL_SHARED_KEY, {
      classNames: props.classNames ?? {},
      styles: props.styles ?? {},
    });
    providePanelHack({ hideHeader: props.hideHeader });

    // ========================= Render =========================
    return () => {
      const prefixCls = props.prefixCls;
      const panelCls = `${prefixCls}-panel`;
      const mode = internalMode.value;
      const PanelComponent =
        (props.components?.[mode] as never) ?? DEFAULT_PANEL_COMPONENTS[mode] ?? DatePanel;

      const panelProps = pickProps(props, [
        'showWeek',
        'prevIcon',
        'nextIcon',
        'superPrevIcon',
        'superNextIcon',
        'disabledDate',
        'minDate',
        'maxDate',
        'onHover',
      ] as unknown as (keyof typeof props)[]);

      return h(
        'div',
        {
          ref: rootRef,
          tabIndex: props.tabIndex,
          class: [panelCls, props.direction === 'rtl' ? `${panelCls}-rtl` : undefined],
        },
        h(
          PanelComponent as never,
          {
            ...panelProps,
            prefixCls,
            locale: filledLocale.value,
            generateConfig: props.generateConfig,
            showTime: mergedShowTime.value,
            onModeChange: triggerModeChange,
            pickerValue: mergedPickerValue.value,
            onPickerValueChange: (nextPickerValue: PanelDateType) => {
              setPickerValue(nextPickerValue, true);
            },
            value: mergedValue.value[0],
            values: mergedValue.value,
            onSelect: onPanelValueSelect,
            cellRender: props.cellRender,
            hoverRangeValue: hoverRangeDate.value,
            hoverValue: props.hoverValue,
          } as never,
        ),
      );
    };
  },
});
