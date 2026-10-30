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

import { useControlledValue } from '@apollo-design/utils';
import {
  type Component,
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import { DatePanel, WeekPanel } from './date-panel';
import { isSame } from './date-util';
import { fillLocale } from './locale-fill';
import { pickProps } from './misc-util';
import {
  PANEL_SHARED_KEY,
  type PanelDateType,
  type PanelSemanticClassNames,
  type PanelSemanticStyles,
  type PanelSlots,
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
  expose: ['nativeElement'],
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

    // ---------------------------------------------------------------- 值
    multiple: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    value: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
    defaultValue: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },

    // ---------------------------------------------------------- 浏览值
    pickerValue: {
      type: null as unknown as PropType<PanelDateType | undefined>,
      default: undefined,
    },
    defaultPickerValue: {
      type: null as unknown as PropType<PanelDateType | undefined>,
      default: undefined,
    },

    // --------------------------------------------------- hover 与格子
    hoverValue: { type: Array as PropType<PanelDateType[] | undefined>, default: undefined },
    hoverRangeValue: {
      type: null as unknown as PropType<PanelDateType | PanelDateType[] | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------- 限制与图标
    disabledDate: {
      type: Function as PropType<DisabledDate<PanelDateType> | undefined>,
      default: undefined,
    },
    minDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
    maxDate: { type: null as unknown as PropType<PanelDateType | undefined>, default: undefined },
    showWeek: { type: Boolean as PropType<boolean | undefined>, default: undefined },

    /**
     * 🚨 4 个导航图标**必须显式声明**（与下面那批时间 props 同一条判据）。
     *
     * 不声明 ⇒ `ui` 传进来的 vnode 被 Vue 归进 **`attrs`**（不是 props）
     * ⇒ 上面 `pickProps(props, ['prevIcon', …])` 取到 `undefined` 并被过滤
     * ⇒ `DatePanel` 的上下文里没有图标 ⇒ `PanelHeader` 回退到
     * `DEFAULT_HEADER_ICONS` 的**字符**兜底（`‹` / `«` / `›` / `»`）。
     *
     * 症状（2026-10-01 由 L6 像素差异 + 表头探针定位）：表头箭头变成**细字形文字**，
     * 而不是 antd 的「空 `<span>` + CSS 画的 1.5px 折线」——
     * `ui` 侧 `DatePicker.vue` 明明传了 `<span class="…-prev-icon">`，
     * `packages/ui/src/date-picker/style/index.ts` 的 `::before` 规则也明明在，
     * 但**两者永远碰不到面**。探针对拍：
     *
     * | 侧 | 表头按钮的 innerHTML |
     * |---|---|
     * | React | `<button …><span class="ant-picker-super-prev-icon"></span></button>` |
     * | Vue（修前） | `<button …>«</button>` |
     *
     * ⚠️ 这是**纯属性声明缺口**，L1–L5 全绿也能过：L4 的 ARIA 比对看的是
     * `aria-label`（本来就不由箭头形状决定，见 `panel-header.ts` 文件头第 3 条）。
     */
    prevIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    nextIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    superPrevIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    superNextIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },

    // ------------------------------------------------------ 时间配置
    showTime: {
      type: [Boolean, Object] as PropType<boolean | TimePanelConfig<PanelDateType> | undefined>,
      default: undefined,
    },
    format: {
      type: null as unknown as PropType<PickerFormat<PanelDateType> | undefined>,
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
    disabledMilliseconds: {
      type: Function as PropType<
        ((hour: number, minute: number, second: number) => number[]) | undefined
      >,
      default: undefined,
    },
    disabledTime: {
      type: Function as PropType<((date: PanelDateType) => DisabledTimes) | undefined>,
      default: undefined,
    },

    // ---------------------------------------------------------- 逃生
    //
    // 🚨 这四个键**必须显式声明**（同「时间 props」那条判据）：不声明 ⇒ `ui` 传进来的值
    //    被 Vue 归进 `attrs` ⇒ `props.hideNext` 恒 `undefined` ⇒ 双面板的中间箭头
    //    **静默不隐藏**。
    //
    // ⚠️ 上游把这四个值放在**外层** `PickerHackContext.Provider`（`Popup/PopupPanel.js:62-75`），
    //    而本仓 `PickerPanel` **自己**也 provide 了一份（下面 `providePanelHack`）——
    //    Vue 的 `provide` 同样「最近的赢」⇒ 外层注入会被**遮蔽**。
    //    所以这里必须把它们收成 props 再合并进自己那份 provide，
    //    不能靠 ui 层在外面 provide。
    hideHeader: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    /** 藏掉 prev 侧两个按钮（双面板的**右**面板用） */
    hidePrev: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    /** 藏掉 next 侧两个按钮（双面板的**左**面板用） */
    hideNext: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    // ---------------------------------------------------------- 语义
    classNames: {
      type: Object as PropType<PanelSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<PanelSemanticStyles | undefined>, default: undefined },
    /** 组件替换表（`mode` ⇒ 组件） */
    components: {
      type: Object as PropType<Partial<Record<InternalMode, Component>> | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:value': (_value: PanelDateType[]) => true,
    'update:pickerValue': (_value: PanelDateType) => true,
    'update:mode': (_mode: PanelMode) => true,
    change: (_value: PanelDateType | PanelDateType[] | undefined) => true,
    select: (_value: PanelDateType) => true,
    hover: (_value: PanelDateType | null) => true,
    pickerValueChange: (_value: PanelDateType) => true,
    panelChange: (_viewDate: PanelDateType, _mode: PanelMode) => true,
    cellDblClick: () => true,
  },
  slots: Object as SlotsType<PanelSlots>,
  setup(props, { emit, slots }) {
    const rootRef = ref<HTMLElement | null>(null);

    // ========================= Time =========================
    // ⚠️ 入参是「组件 props 的超集」，含顶层的时间 props（`hourStep` 等）。
    const timeConfig = computed(() => getTimeProps(props));

    // ========================= Locale =========================
    const filledLocale = computed(() => fillLocale(props.locale, timeConfig.value[1].format ?? ''));

    // ========================= Picker =========================
    const internalPicker = computed<InternalMode>(() =>
      toInternalMode(props.picker, props.showTime),
    );
    const picker = computed(() => props.picker ?? 'date');

    // ======================== ShowTime ========================
    const mergedShowTime = computed(() =>
      fillShowTimeConfig(
        internalPicker.value,
        timeConfig.value[2],
        timeConfig.value[3],
        timeConfig.value[0],
        filledLocale.value,
      ),
    );

    // ========================== Mode ==========================
    const [mergedMode, setMergedMode] = useControlledValue<PanelMode>({
      getValue: () => props.mode,
      defaultValue: () => picker.value,
    });
    watch(picker, (next) => {
      if (props.mode === undefined) setMergedMode(next);
    });
    const internalMode = computed<InternalMode>(() =>
      mergedMode.value === 'date' && mergedShowTime.value ? 'datetime' : mergedMode.value,
    );

    // ========================= Value =========================
    const [rawValue, setMergedValue] = useControlledValue<PanelDateType[]>({
      getValue: () => props.value,
      defaultValue: () => props.defaultValue ?? [],
      onChange: (value) => emit('update:value', value),
    });
    /** 清掉空值；单值模式只留第一个。 */
    const mergedValue = computed<PanelDateType[]>(() => {
      const values = (rawValue.value ?? []).filter((val): val is PanelDateType => Boolean(val));
      return props.multiple ? values : values.slice(0, 1);
    });

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
      const changed =
        current.length !== nextValue.length ||
        current.some(
          (ori, index) =>
            !isSame(generator(), filledLocale.value, ori, nextValue[index], internalPicker.value),
        );
      if (changed) {
        setMergedValue(nextValue);
        emit('change', props.multiple ? nextValue : nextValue[0]);
      }
    };

    /** 面板选了一个日期 —— 只有「当前模式就是 picker 模式」时才真的改值。 */
    const onInternalSelect = (newDate: PanelDateType): void => {
      emit('select', newDate);
      if (mergedMode.value === picker.value) {
        const nextValues = props.multiple
          ? toggleDates(
              generator(),
              filledLocale.value,
              internalPicker.value === 'datetime' ? 'date' : internalPicker.value,
              mergedValue.value,
              newDate,
            )
          : [newDate];
        triggerChange(nextValues);
      }
    };

    // >>> PickerValue
    const [mergedPickerValue, setInternalPickerValue] = useControlledValue<PanelDateType>({
      getValue: () => props.pickerValue,
      defaultValue: () =>
        props.defaultPickerValue ?? mergedValue.value[0] ?? props.generateConfig.getNow(),
    });

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
      emit('panelChange', viewDate ?? mergedPickerValue.value, nextMode ?? mergedMode.value);
    };
    const setPickerValue = (nextPickerValue: PanelDateType, triggerPanelEvent = false): void => {
      setInternalPickerValue(nextPickerValue);
      emit('update:pickerValue', nextPickerValue);
      emit('pickerValueChange', nextPickerValue);
      if (triggerPanelEvent) {
        triggerPanelChange(nextPickerValue);
      }
    };
    const triggerModeChange = (nextMode: PanelMode, viewDate?: PanelDateType): void => {
      setMergedMode(nextMode);
      emit('update:mode', nextMode);
      if (viewDate) {
        setPickerValue(viewDate);
      }
      triggerPanelChange(viewDate, nextMode);
    };

    const onPanelValueSelect = (nextValue: PanelDateType): void => {
      onInternalSelect(nextValue);
      if (mergedMode.value !== picker.value) {
        const queue = getModeQueue(picker.value);
        const index = queue.indexOf(mergedMode.value);
        const nextMode = queue[index + 1];
        if (nextMode) {
          triggerModeChange(nextMode, nextValue);
          return;
        }
      }
      setPickerValue(nextValue);
    };

    // ======================= Hover Date =======================
    const hoverRangeDate = computed<[PanelDateType, PanelDateType] | null>(() => {
      const raw = props.hoverRangeValue;
      if (!raw) {
        return null;
      }
      const [start, end] = Array.isArray(raw) ? raw : [raw];
      const finalStart = start ?? end;
      const finalEnd = end ?? start;
      if (!finalStart || !finalEnd) return null;
      return props.generateConfig.isAfter(finalStart, finalEnd)
        ? [finalEnd, finalStart]
        : [finalStart, finalEnd];
    });

    // ======================== Context =========================
    provide(PANEL_SHARED_KEY, {
      get classNames() {
        return props.classNames ?? {};
      },
      get styles() {
        return props.styles ?? {};
      },
    });
    providePanelHack({
      get hideHeader() {
        return props.hideHeader;
      },
      get hidePrev() {
        return props.hidePrev;
      },
      get hideNext() {
        return props.hideNext;
      },
      onCellDblClick: () => emit('cellDblClick'),
    });

    // ========================= Render =========================
    const renderPanel = () => {
      const prefixCls = props.prefixCls;
      const panelCls = `${prefixCls}-panel`;
      const mode = internalMode.value;
      const PanelComponent: Component = props.components?.[mode] ?? DEFAULT_PANEL_COMPONENTS[mode];

      const panelProps = pickProps(props, [
        'showWeek',
        'prevIcon',
        'nextIcon',
        'superPrevIcon',
        'superNextIcon',
        'disabledDate',
        'minDate',
        'maxDate',
      ]);

      return h(
        'div',
        {
          ref: rootRef,
          tabIndex: props.tabIndex,
          class: [panelCls, props.direction === 'rtl' ? `${panelCls}-rtl` : undefined],
        },
        h(
          PanelComponent,
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
            values: mergedValue.value,
            onSelect: onPanelValueSelect,
            onHover: (date: PanelDateType | null) => emit('hover', date),
            hoverRangeValue: hoverRangeDate.value,
            hoverValue: props.hoverValue,
          },
          slots,
        ),
      );
    };
    return { nativeElement: rootRef, renderPanel };
  },
  render() {
    return this.renderPanel();
  },
});

export type PickerPanelRef = Pick<InstanceType<typeof PickerPanel>, 'nativeElement'>;
