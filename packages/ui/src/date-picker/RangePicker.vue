<script setup lang="ts">
/**
 * RangePicker —— 范围壳（G4 · S5）。
 *
 * 对应上游：
 *   - antd 6.6.4 `es/date-picker/generatePicker/generateRangePicker.js`（234 行）
 *   - `@rc-component/picker` 的 `es/PickerInput/RangePicker.js`（574 行）
 *   - `es/PickerInput/Selector/RangeSelector.js`（209 行）
 *   - `es/PickerInput/Popup/{index,PopupPanel,PresetPanel}.js`
 * （**重新定义**，不搬运，H2）
 *
 * ── 与单值壳（`DatePicker.vue`）的关系 ───────────────────────────────────────
 *
 * 上游是**两份独立实现**（`SinglePicker` / `RangePicker` 各 500+ 行），共享的是
 * 更下层的 hooks（`useRangeValue` / `useRangeValueChange` / `useFilledProps` …）。
 * 本仓照这个切分：**共用的全在 hooks / components 里**，两个 `.vue` 只做接线。
 * ⇒ 凡是「两端与单值的差异」，在 hooks 里都有参数（`fieldCount` / `rangeValue` /
 * `range`）——两个 `.vue` 里**不应**出现「同一段逻辑抄两遍」。
 *
 * ── 🚨 六条与单值不同、且「写错不报错」的判据 ─────────────────────────────────
 *
 * 1. **locale 取自 `useLocale('Calendar')`**（`generateRangePicker.js:155`），
 *    **不是** `'DatePicker'` —— 单值才是 `'DatePicker'`。取错会让语言包回落成默认，
 *    表现为「placeholder 文案是英文」（本仓默认语言是 en_US，所以更难发现）。
 * 2. **分隔符是一个 `<span class="{prefixCls}-separator">`**，默认内容是
 *    `SwapRightOutlined`；自定义 `separator` 时**去掉 `aria-hidden`**
 *    （上游两条专门的 a11y 测试）。
 * 3. **双面板**（`multiplePanel`）：`internalMode === picker && internalMode !== 'time'`。
 *    两个面板**各自**要 `hideNext` / `hidePrev`（藏掉中间那侧的箭头），
 *    且**右面板的浏览值 = 左面板 +1 屏**（`offsetPanelDate`）。
 * 4. **`-range-wrapper` / `-range-arrow` 只在对齐 range 时才出现**（`Popup/index.js:164-178`）——
 *    箭头靠 `activeInfo`（活动输入框的几何）定位。
 * 5. **`showNow` 的默认值在范围下是 `false`**（`useShowNow` 第 5 参 `rangePicker = true`）
 *    ⇒ 范围**默认没有「今天」页脚**。这与单值相反。
 * 6. **`type` 传给用户 `disabledDate` 的是原始 `picker`**（同单值，见
 *    `hooks/picker-invalidate.ts` 的文件头）。
 */
import { CloseCircleFilled, SwapRightOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import {
  fillIndex,
  formatValue,
  getFromDate,
  isSame,
  isSameTimestamp,
  offsetPanelDate,
  type PanelDateType,
  type PickerMode,
  PickerPanel,
} from '@apollo-design/picker';
import { useZIndex } from '@apollo-design/portal';
import { observeResize, useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  computed,
  h,
  onScopeDispose,
  type Ref,
  ref,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { Footer } from './components/Footer';
import { PresetPanel } from './components/PresetPanel';
import {
  getFormatLength,
  getMergedNeedConfirm,
  getShowNow,
  isTargetInContainers,
  toDisabledPair,
} from './components/picker-shared';
import { getRootClassNames } from './components/root-class';
import { Selector } from './components/Selector';
import {
  BUILT_IN_PLACEMENTS,
  getDropdownClassName,
  getRealPlacement,
  getTransitionName,
} from './components/trigger-config';
import { dayjsConfig } from './hooks/dayjs-config';
import { useFieldsInvalidate } from './hooks/picker-fields-invalidate';
import { useFilledLocale } from './hooks/picker-filled';
import { useFocusLock } from './hooks/picker-focus-lock';
import { mergeFormat, toInternalMode } from './hooks/picker-format';
import { useDisabledBoundary, useInvalidate } from './hooks/picker-invalidate';
import { getRangePlaceholder, mergePickerLocale } from './hooks/picker-locale';
import { usePresets } from './hooks/picker-presets';
import { useRangePickerValue } from './hooks/picker-range-picker-value';
import { useSuffixIcon } from './hooks/picker-suffix';
import { validateFormat } from './hooks/picker-typing';
import { toDateArray, useInnerValue, useRangeValue, type ValueSlot } from './hooks/picker-value';
import { useRangeValueChange } from './hooks/picker-value-change';
import { useMergedPickerSemantic } from './hooks/use-picker-semantic';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  LimitDate,
  NoUndefinedRangeValue,
  OpenConfig,
  RangePickerProps,
  RangeValue,
} from './interface';

defineOptions({ name: 'ARangePicker', inheritAttrs: false });

/** ⚠️ Boolean prop 必须显式 `undefined` 默认值（同 `DatePicker.vue`，PITFALLS 2 同族）。 */
const props = withDefaults(defineProps<RangePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
  showWeek: undefined,
  showNow: undefined,
  showToday: undefined,
  inputReadOnly: undefined,
  preserveInvalidOnBlur: undefined,
  needConfirm: undefined,
  changeOnBlur: undefined,
  order: undefined,
  disabled: undefined,
  bordered: undefined,
  required: undefined,
  prefix: undefined,
  suffixIcon: undefined,
  clearIcon: undefined,
  separator: undefined,
  prevIcon: undefined,
  nextIcon: undefined,
  superPrevIcon: undefined,
  superNextIcon: undefined,
  removeIcon: undefined,
  pickerValue: undefined,
  defaultPickerValue: undefined,
  defaultOpenValue: undefined,
  allowClear: undefined,
  allowEmpty: undefined,
  previewValue: undefined,
  presets: undefined,
  ranges: undefined,
});

/** ⚠️ `defineEmits` 的类型参数必须是**类型字面量**（与 `interface.ts` 的 `RangePickerEmits` 是同一契约的两处表达）。 */
const emit = defineEmits<{
  change: [dates: NoUndefinedRangeValue | null, dateStrings: [string, string]];
  'update:value': [dates: RangeValue | null];
  calendarChange: [
    dates: NoUndefinedRangeValue,
    dateStrings: [string, string],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ];
  ok: [dates: NoUndefinedRangeValue];
  openChange: [open: boolean, config?: OpenConfig];
  'update:open': [open: boolean];
  pickerValueChange: [
    date: [DatePickerDate, DatePickerDate],
    info: { source: 'reset' | 'panel'; mode: [DatePickerPanelMode, DatePickerPanelMode] },
  ];
  'update:pickerValue': [date: [DatePickerDate, DatePickerDate]];
  panelChange: [values: NoUndefinedRangeValue, modes: [DatePickerPanelMode, DatePickerPanelMode]];
  clear: [];
  focus: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  blur: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  invalid: [invalid: boolean];
  submit: [event: Event];
  keydown: [event: KeyboardEvent, preventDefault: () => void];
}>();

// ============================== 废弃 prop 告警 ==============================
/**
 * 与单值同一张表（上游 `generateRangePicker.js:77-83` 逐字），
 * 但**告警名是 `DatePicker.RangePicker`**（`:76`）。
 */
const devWarning = useDevWarning('DatePicker.RangePicker');
const DEPRECATED_PROPS: Record<string, string> = {
  dropdownClassName: 'classNames.popup.root',
  popupClassName: 'classNames.popup.root',
  popupStyle: 'styles.popup.root',
  bordered: 'variant',
  onSelect: 'onCalendarChange',
};
for (const [oldProp, newProp] of Object.entries(DEPRECATED_PROPS)) {
  devWarning.deprecated(props[oldProp as keyof RangePickerProps] === undefined, oldProp, newProp);
}

// ============================== 上下文归一 ==============================
const context = useComponentConfig('datePicker');
/** 🚨 范围还有一份 `rangePicker` 配置（`className` / `style` / `separator`）。 */
const rangePickerContext = useComponentConfig('rangePicker');
const { getPrefixCls } = context;

interface DatePickerComponentConfig {
  classNames?: DatePickerSemanticClassNames;
  styles?: DatePickerSemanticStyles;
  className?: string;
  style?: Record<string, string | number>;
  suffixIcon?: VNodeChild;
  clearIcon?: VNodeChild;
  allowClear?: boolean | { clearIcon?: VNodeChild };
  separator?: VNodeChild;
}
const pickerContext = context as unknown as DatePickerComponentConfig;
const rangePickerConfig = rangePickerContext as unknown as DatePickerComponentConfig;

const direction = useDirection();
const contextDisabled = useDisabled();
const formItemContext = useFormItemInputContext();

/** 🚨 传字面量 `'picker'` ⇒ 默认 `apollo-picker`（同单值）。 */
const prefixCls = computed(() => getPrefixCls('picker', props.prefixCls));
const rootPrefixCls = computed(() => getPrefixCls());
const rtl = computed(() => direction.value === 'rtl');

/** 分隔符：`props.separator ?? context.rangePicker.separator`（上游 `:95-96`）。 */
const mergedSeparator = computed(() => props.separator ?? rangePickerConfig.separator);
const hasCustomSeparator = computed(
  () => mergedSeparator.value !== null && mergedSeparator.value !== undefined,
);

// ============================== locale / 尺寸 / 变体 / 状态 ==============================
/**
 * 🚨 **`'Calendar'`**（不是 `'DatePicker'`）—— 上游 `generateRangePicker.js:155`。
 */
const [contextLocale] = useLocale('Calendar');
const mergedLocale = computed(() => mergePickerLocale(contextLocale, props.locale));

const { compactSize, compactItemClassnames } = useCompactItemContext(prefixCls, direction);
const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);

const { variant, enableVariantCls } = useVariant({
  component: 'rangePicker',
  variant: () => props.variant,
  legacyBordered: () => props.bordered,
});

const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
/** 两端的禁用（归一成元组）。 */
const disabledPair = computed(() => toDisabledPair(mergedDisabled.value));
/** 🚨 范围的 `-disabled` 类判据是 **`disabled.every()`**（两端都禁用），见 `root-class.ts`。 */
const everyDisabled = computed(() => disabledPair.value.every(Boolean));
/** 可用的 field 数（上游 `enabledFieldCount`，喂给提交时机状态机）。 */
const enabledFieldCount = computed(() => disabledPair.value.filter((d) => !d).length);

const hasFeedback = computed(() => formItemContext.value.hasFeedback === true);
const mergedStatus = computed(() => getMergedStatus(formItemContext.value.status, props.status));

// ============================== picker / format ==============================
const mergedPicker = computed(() => props.picker ?? 'date');
/** 组件粒度（上游 `internalPicker`）。 */
const internalMode = computed(() => toInternalMode(props.picker, props.showTime));

const filled = useFilledLocale({
  source: computed(() => ({
    picker: props.picker,
    showTime: props.showTime,
    format: props.format,
  })),
  locale: computed(() => mergedLocale.value.lang),
  internalMode,
});
const filledLang = computed(() => filled.filledLocale.value);

const mergedFormat = computed(() =>
  mergeFormat(internalMode.value, filledLang.value, props.format),
);

const mergedNeedConfirm = computed(() =>
  getMergedNeedConfirm(props.needConfirm, internalMode.value),
);

const firstFormatLength = computed(() =>
  getFormatLength(mergedFormat.value.firstFormat, dayjsConfig.getNow()),
);

/** 解析上下文（`locale` + 已归一的 `formatList` + 日期库适配层）。 */
const parseContext = computed(() => ({
  locale: filledLang.value.locale,
  formatList: mergedFormat.value.formatList,
  generateConfig: dayjsConfig,
}));

// ============================== 语义槽 ==============================
const semantic = useMergedPickerSemantic({
  contextClassNames: () => pickerContext.classNames,
  classNames: () => props.classNames,
  contextStyles: () => pickerContext.styles,
  styles: () => props.styles,
  popupClassName: () => props.popupClassName ?? props.dropdownClassName,
  popupStyle: () => props.popupStyle as Record<string, string | number> | undefined,
  // ⚠️ 范围多一层：上游 `useMergedPickerSemantic(…, rangePicker?.style ?? null)`（第 7 参）
  contextStyleRoot: () => rangePickerConfig.styles,
  props: props as never,
});

// ============================== 值状态机 ==============================
const getDateTexts = (dates: ValueSlot[]): string[] =>
  dates.map((date) =>
    formatValue(date, {
      generateConfig: dayjsConfig,
      locale: filledLang.value,
      format: mergedFormat.value.firstFormat ?? '',
    }),
  );

const inner = useInnerValue({
  generateConfig: computed(() => dayjsConfig),
  getDateTexts,
  /** 🚨 范围恒定两个槽位。 */
  rangeValue: true,
  order: computed(() => props.order === true),
  defaultValue: toDateArray(props.defaultValue),
  getValue: () => (props.value !== undefined ? toDateArray(props.value) : undefined),
  onCalendarChange: (dates, texts, info) => {
    emit('calendarChange', dates as never, texts as never, info as never);
  },
  onOk: (dates) => emit('ok', dates as never),
});

const resolveLimit = (limit: LimitDate | undefined): PanelDateType | undefined =>
  typeof limit === 'function' ? (limit({}) as PanelDateType) : (limit as PanelDateType | undefined);

const boundaryDisabledDate = useDisabledBoundary({
  generateConfig: dayjsConfig,
  locale: () => filledLang.value,
  disabledDate: () => props.disabledDate,
  minDate: () => resolveLimit(props.minDate) as DatePickerDate | undefined,
  maxDate: () => resolveLimit(props.maxDate) as DatePickerDate | undefined,
});

const isInvalidateDate = useInvalidate({
  generateConfig: dayjsConfig,
  locale: () => filledLang.value,
  // 🚨 原始 picker（同单值，见 `picker-invalidate.ts` 文件头第 3 条）
  picker: () => mergedPicker.value,
  disabledDate: () => props.disabledDate,
  minDate: () => resolveLimit(props.minDate) as DatePickerDate | undefined,
  maxDate: () => resolveLimit(props.maxDate) as DatePickerDate | undefined,
  showTime: () => mergedShowTime.value as unknown as Record<string, unknown> | undefined,
  boundaryDate: boundaryDisabledDate,
});

const allowEmptyPair = computed(() => {
  const value = props.allowEmpty;
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value)
    ? ([Boolean(value[0]), Boolean(value[1])] as const)
    : ([Boolean(value), Boolean(value)] as const);
});

const rangeValue = useRangeValue({
  generateConfig: computed(() => dayjsConfig),
  locale: computed(() => filledLang.value),
  picker: computed(() => mergedPicker.value),
  allowEmpty: allowEmptyPair,
  order: computed(() => props.order === true),
  disabledSlots: disabledPair,
  isInvalidateDate,
  getDateTexts,
  inner,
  onChange: (dates, texts) => {
    // 🚨 C11：`update:value` 与语义事件 `change` **同时**发
    emit('change', dates as never, texts as never);
    emit('update:value', dates as never);
  },
});

// ============================== 开合 / 浏览值 / 粒度 ==============================
const innerOpen = ref(props.defaultOpen === true);
const mergedOpen = computed(() => props.open ?? innerOpen.value);

const onOpenChange = (next: boolean): void => {
  if (props.open === undefined) {
    innerOpen.value = next;
  }
  emit('openChange', next);
  emit('update:open', next);
};

/** 上游 `triggerOpen`：**两端全禁用时不许打开**（`RangePicker.js:119-124`）。 */
const triggerOpen = (nextOpen: boolean): void => {
  if (!everyDisabled.value || !nextOpen) {
    onOpenChange(nextOpen);
  }
};

/** 两端各自的粒度（上游 `useControlledState([picker, picker], mode)`）。 */
const innerModes = ref<[DatePickerPanelMode, DatePickerPanelMode]>([
  mergedPicker.value,
  mergedPicker.value,
]);
const mergedModes = computed<[DatePickerPanelMode, DatePickerPanelMode]>(
  () => props.mode ?? innerModes.value,
);
watch(
  () => props.mode,
  (next) => {
    if (next !== undefined) {
      innerModes.value = next;
    }
  },
);

// ============================== 提交时机状态机（fieldCount = 2）=============
const valueChange = useRangeValueChange({
  /**
   * 🚨 **传 getter，不能传值**：范围下这个数是
   * `disabled.filter(d => !d).length`，用户动态改 `disabled` 时会变。
   * 传固化值会让「字段导航的环长度」过期 —— 两端都禁用时长度为 0
   * ⇒ `(actionIndex + 1) % 0` 是 `NaN`（见 `picker-value-change.ts` 的说明）。
   */
  fieldCount: () => enabledFieldCount.value,
  needConfirm: () => mergedNeedConfirm.value,
  allowEmpty: () => allowEmptyPair.value ?? [false, false],
  /**
   * ⚠️ 范围传的是**逐 field 的值**（上游 `getCalendarValue()` 原样）。
   * 单值那边要包成 `[整组值]`，范围**不包** —— 两端各是一个槽位。
   */
  getCalendarValue: () => inner.calendarValue.value,
  triggerCalendarChange: (index, value) => {
    inner.triggerCalendarChange(fillIndex(inner.calendarValue.value, index, value as ValueSlot));
  },
  flushSubmit: (index, needTriggerChange) => {
    rangeValue.flushSubmit(index, needTriggerChange);
    if (needTriggerChange) {
      triggerOpen(false);
    }
  },
  resetValue: (index) => rangeValue.resetValue(index),
});

/** 上游 `activeIndex`（渲染与面板都用它）。 */
const activeIndex = computed(() => valueChange.activeIndex.value);

/** 上游 `mergedMode`：当前活动端的粒度。 */
const mergedMode = computed<DatePickerPanelMode>(
  () => mergedModes.value[activeIndex.value] || mergedPicker.value,
);
/** 面板粒度对应的内部模式（同单值的 `panelInternalMode`）。 */
const panelInternalMode = computed(() =>
  mergedMode.value === 'date' && mergedShowTime.value ? 'datetime' : mergedMode.value,
);
/** 上游 `multiplePanel`：**组件粒度与面板粒度一致、且不是纯时间** ⇒ 并排两个面板。 */
const multiplePanel = computed(
  () => panelInternalMode.value === mergedPicker.value && panelInternalMode.value !== 'time',
);

/**
 * 上游 `useFilledProps` 的 `complexPicker = multipleInteractivePicker || multiple`。
 *
 * 🚨 **范围没有 `multiple`** —— rc 的 `SharedPickerProps`（`RangePickerProps` 的基类）
 * 根本不含这个键，只有 `SinglePickerProps` 才有。所以上游那一支对范围恒为
 * `undefined`，等价于 `multipleInteractivePicker`。
 *
 * ⚠️ 照抄时**不能**写 `props.multiple`：`RangePickerProps` 上没有这个键，
 * Vue 里它会落到 `attrs`（PITFALLS 3），类型上也取不到。
 */
const complexPicker = computed(() => {
  const mode = internalMode.value;
  return mode === 'time' || mode === 'datetime';
});

// ============================== showTime（范围代理） ==============================
/**
 * 上游 `RangePicker.js:174-192`：`showTime.disabledTime` 在范围下要**代理一层**，
 * 把「当前活动端」与「另一端的值」补进去。
 *
 * ⚠️ `from` 的来源是 `getFromDate(calendarValue, triggeredFields, activeIndex)` ——
 * 「本轮参与过且有值的第一个 field」；与当前活动端**相同**时给 `undefined`。
 */
const mergedShowTime = computed(() => {
  const showTime = props.showTime;
  if (!showTime) {
    return null;
  }
  if (typeof showTime !== 'object') {
    return showTime;
  }
  const disabledTime = showTime.disabledTime;
  if (!disabledTime) {
    return showTime;
  }
  const proxyDisabledTime = (date: DatePickerDate) => {
    const index = activeIndex.value;
    const range: 'start' | 'end' = index === 1 ? 'end' : 'start';
    const fromDate = getFromDate(
      inner.calendarValue.value as unknown[],
      valueChange.triggeredFields.value,
      index,
    ) as DatePickerDate | undefined;
    return disabledTime(date, range, { from: fromDate });
  };
  return { ...showTime, disabledTime: proxyDisabledTime };
});

// ============================== 焦点 ==============================
/** 焦点是否在 Picker 内（上游 `focused`）。 */
const focused = ref(false);
const selectorRef = ref<{
  focus: (options?: number | { index?: number; preventScroll?: boolean }) => void;
  blur: () => void;
  nativeElement: () => HTMLElement | null;
  startInput: () => HTMLInputElement | null;
  endInput: () => HTMLInputElement | null;
} | null>(null);
const triggerRef = ref<{ popupElement: () => HTMLElement | null } | null>(null);
const popupContainerRef = ref<HTMLElement | null>(null);

const isInternalElement = (target: EventTarget | null): boolean =>
  isTargetInContainers(target, [
    selectorRef.value?.nativeElement() ?? null,
    triggerRef.value?.popupElement() ?? null,
  ]);

/** 上游 `getActiveRange`。 */
const activeRange = (index: number): 'start' | 'end' => (index === 1 ? 'end' : 'start');

const onFieldFocus = (index: number, event: FocusEvent): void => {
  focused.value = true;
  emit('focus', event, { range: activeRange(index) });
};
const onFieldBlur = (index: number, event: FocusEvent): void => {
  if (!isInternalElement(event.relatedTarget)) {
    focused.value = false;
    triggerOpen(false);
  }
  emit('blur', event, { range: activeRange(index) });
};

// ============================== 浏览值 ==============================
const { currentPickerValue, setCurrentPickerValue } = useRangePickerValue({
  generateConfig: dayjsConfig,
  locale: () => filledLang.value,
  calendarValue: () => inner.calendarValue.value,
  modes: () => mergedModes.value,
  open: () => mergedOpen.value,
  preserveOnFieldChange: () => true,
  activeIndex: () => (focused.value || mergedOpen.value ? activeIndex.value : null),
  pickerMode: () => mergedPicker.value as PickerMode,
  multiplePanel: () => multiplePanel.value,
  defaultPickerValue: () =>
    props.defaultPickerValue === undefined || props.defaultPickerValue === null
      ? undefined
      : toDateArray(props.defaultPickerValue),
  pickerValue: () =>
    props.pickerValue === undefined || props.pickerValue === null
      ? undefined
      : toDateArray(props.pickerValue),
  timeDefaultValue: () =>
    (props.showTime && typeof props.showTime === 'object'
      ? props.showTime.defaultOpenValue
      : props.defaultOpenValue) as DatePickerDate[] | undefined,
  onPickerValueChange: (values, info) => {
    emit('pickerValueChange', values as never, info as never);
    emit('update:pickerValue', values as never);
  },
  minDate: () => resolveLimit(props.minDate) as DatePickerDate | undefined,
  maxDate: () => resolveLimit(props.maxDate) as DatePickerDate | undefined,
});

/** 右面板的浏览值 = 左面板 +1 屏（上游 `PopupPanel.js:25-33`）。 */
const secondPickerValue = computed<DatePickerDate>(() => {
  const base = currentPickerValue.value ?? dayjsConfig.getNow();
  return multiplePanel.value
    ? (offsetPanelDate(dayjsConfig, mergedPicker.value as PickerMode, base, 1) as DatePickerDate)
    : base;
});

const onSecondPickerValueChange = (nextDate: DatePickerDate): void => {
  setCurrentPickerValue(
    offsetPanelDate(dayjsConfig, mergedPicker.value as PickerMode, nextDate, -1) as DatePickerDate,
    'panel',
  );
};

// ============================== 字段失效 / 焦点锁 / 悬停 ==============================
const { submitInvalidates, onSelectorInvalid } = useFieldsInvalidate(
  () => inner.calendarValue.value,
  (date, info) => isInvalidateDate(date, { activeIndex: info.activeIndex }),
  () => allowEmptyPair.value,
);

useFocusLock({
  index: () => valueChange.currentIndex.value,
  forceFocus: () => valueChange.forceFocus.value,
  selectorRef: () => selectorRef.value,
  popupRef: () => popupContainerRef.value,
  triggerOpen: (open) => triggerOpen(open),
});

/** 悬停（上游 `RangePicker.js:274-296`）。 */
const internalHoverValues = ref<DatePickerDate[] | null>(null);
const hoverSource = ref<'cell' | 'preset' | null>(null);
const hoverValues = computed(() => internalHoverValues.value ?? inner.calendarValue.value);

/** 🚨 关闭时清掉悬停值（上游 `:292-296`）。 */
watch(mergedOpen, (next) => {
  if (!next) {
    internalHoverValues.value = null;
  }
});

/**
 * `previewValue` 的**有效默认值是 `'hover'`**（上游 `useFilledProps.js` 解构时的默认）
 * ⇒ 必须 `?? 'hover'`。
 *
 * 🚨 直接写 `props.previewValue !== 'hover'` 是**错的**：prop 未声明默认值时是
 * `undefined`，而 `undefined !== 'hover'` 为真 ⇒ **悬停预览默认永远不生效**
 * （`presets` 的悬停高亮、输入框的预览文本全都不会出现）。2026-10-01 实测修正。
 */
const mergedPreviewValue = computed(() => props.previewValue ?? 'hover');

const onSetHover = (date: DatePickerDate[] | null, source: 'cell' | 'preset'): void => {
  if (mergedPreviewValue.value !== 'hover') {
    return;
  }
  internalHoverValues.value = date;
  hoverSource.value = source;
};

/**
 * 上游 `showWeakHover`（`:282-288`，逐字）：
 *
 * ```js
 * const showWeakHover =
 *   hoverSource === 'cell' &&
 *   !calendarValue[(activeIndex + 1) % 2] &&
 *   !isSameTimestamp(generateConfig, calendarValue[activeIndex], mergedValue[activeIndex]);
 * ```
 *
 * 🚨 第三条判据是 **`isSameTimestamp`（时间戳级）**，不是 `isSame(…, internalMode)`
 * （粒度级）—— 两者只在 `showTime` 下分叉：同一天不同时刻，上游判「不同」⇒
 * 走弱悬停；用粒度判等会判「相同」⇒ 弱悬停不生效。
 * 2026-10-01 修正（此前写成了 `isSame`）。
 */
const showWeakHover = computed(() => {
  const index = activeIndex.value;
  return (
    hoverSource.value === 'cell' &&
    !inner.calendarValue.value[(index + 1) % 2] &&
    !isSameTimestamp(dayjsConfig, inner.calendarValue.value[index], inner.mergedValue.value[index])
  );
});
const activeHoverValue = computed(() => internalHoverValues.value?.[activeIndex.value]);

// ============================== presets ==============================
const presetList = usePresets(
  () => props.presets,
  () =>
    props.ranges as
      | Record<string, NoUndefinedRangeValue | (() => NoUndefinedRangeValue)>
      | undefined,
);

const onPresetSubmit = (values: unknown): void => {
  // ⚠️ 不做窄化断言：`triggerSubmit` 的入参本就允许 `DatePickerDate | null | undefined`
  //    （`toggleDates` 的返回类型如此），`RangeValueDate.value` 是它的子集。
  const passed = rangeValue.triggerSubmit(values as readonly (DatePickerDate | null)[]);
  if (passed) {
    triggerOpen(false);
  }
};

const onNow = (now: PanelDateType): void => {
  valueChange.triggerChange(activeIndex.value, 'confirm', now);
};

// ============================== 面板 ==============================
const panelBaseProps = computed(() => ({
  prefixCls: prefixCls.value,
  direction: direction.value,
  locale: filledLang.value,
  generateConfig: dayjsConfig,
  picker: mergedPicker.value,
  mode: mergedMode.value,
  multiple: undefined,
  value: inner.calendarValue.value as never,
  pickerValue: currentPickerValue.value as PanelDateType,
  defaultPickerValue: undefined,
  // 🚨 合并了 min/max 的判定（上游 `mergedProps.disabledDate`）
  disabledDate: boundaryDisabledDate as never,
  minDate: resolveLimit(props.minDate),
  maxDate: resolveLimit(props.maxDate),
  cellRender: props.cellRender as never,
  /**
   * 悬停的两个载荷（上游 `RangePicker.js:274-296`）。
   *
   * 🚨 **这是 `-cell-in-range` 的唯一来源** —— `buildPanelCells` 只在
   * `cellSelection && hoverRangeValue` 时才计算 `inRange`（`panel.ts:256-264`）。
   * 不传 ⇒ **区间内的浅蓝底永远不出现**（2026-10-01 由 L6 的 `range-value` 变体
   * 实测抓到：`range` 空值三视口 0.000% exact，一有值就出现 `block-diff`）。
   *
   * 两个载荷的判据（逐字照抄）：
   * ```js
   * hoverValue:      showWeakHover && activeHoverValue ? [activeHoverValue] : null,
   * hoverRangeValue: showWeakHover ? null : hoverValues,
   * ```
   * 「弱悬停」= 正在选**第一端**、另一端还空着 ⇒ 只高亮悬停的那一格，
   * 不把「已选端 → 悬停格」连成区间（否则第一端会被区间底色盖住）。
   */
  hoverValue:
    showWeakHover.value && activeHoverValue.value ? ([activeHoverValue.value] as never) : null,
  hoverRangeValue: (showWeakHover.value ? null : hoverValues.value) as never,
  showTime: mergedShowTime.value as never,
  showWeek: props.showWeek,
  format: mergedFormat.value.firstFormat,
  classNames: semantic.classNames.value.popup,
  styles: semantic.styles.value.popup,
  prevIcon: props.prevIcon ?? h('span', { class: `${prefixCls.value}-prev-icon` }),
  nextIcon: props.nextIcon ?? h('span', { class: `${prefixCls.value}-next-icon` }),
  superPrevIcon: props.superPrevIcon ?? h('span', { class: `${prefixCls.value}-super-prev-icon` }),
  superNextIcon: props.superNextIcon ?? h('span', { class: `${prefixCls.value}-super-next-icon` }),
  /** 🚨 双击格子（上游 `PopupPanel.js:36-42`）：有确认制才提交。 */
  onCellDblClick: () => {
    if (mergedNeedConfirm.value) {
      valueChange.triggerChange(activeIndex.value, 'confirm');
    }
  },
  onSelect: (date: PanelDateType) => {
    const panelFinished = !complexPicker.value && internalMode.value === panelInternalMode.value;
    valueChange.triggerChange(
      activeIndex.value,
      panelFinished ? 'panel-final' : 'panel-intermediate',
      date,
    );
  },
  onHover: (date: PanelDateType | null) => {
    onSetHover(
      date
        ? (fillIndex(inner.calendarValue.value, activeIndex.value, date) as DatePickerDate[])
        : null,
      'cell',
    );
  },
  onPanelChange: (viewDate: PanelDateType | undefined, mode: DatePickerPanelMode) => {
    if (props.mode === undefined) {
      innerModes.value = fillIndex(mergedModes.value, activeIndex.value, mode) as [
        DatePickerPanelMode,
        DatePickerPanelMode,
      ];
    }
    const clonePickerValue: (DatePickerDate | null)[] = [...inner.calendarValue.value];
    if (viewDate) {
      clonePickerValue[activeIndex.value] = viewDate as DatePickerDate;
    }
    emit('panelChange', clonePickerValue as never, mergedModes.value as never);
  },
  onPickerValueChange: (next: PanelDateType) => {
    setCurrentPickerValue(next as DatePickerDate, 'panel');
  },
}));

const panelVNode = computed(() => {
  const base = panelBaseProps.value as unknown as Record<string, unknown>;
  const isTime = mergedPicker.value === 'time';
  if (!multiplePanel.value) {
    return h(PickerPanel as Component, { ...base, hideHeader: isTime });
  }
  // 🚨 双面板：左藏 next 侧、右藏 prev 侧（`PopupPanel.js:59-76`）
  return h('div', { class: `${prefixCls.value}-panels` }, [
    h(PickerPanel as Component, { ...base, hideHeader: isTime, hideNext: true }),
    h(PickerPanel as Component, {
      ...base,
      hideHeader: isTime,
      hidePrev: true,
      pickerValue: secondPickerValue.value,
      onPickerValueChange: onSecondPickerValueChange,
    }),
  ]);
});

// ============================== 浮层 ==============================
const mergedSuffixIcon = useSuffixIcon({
  picker: mergedPicker,
  hasFeedback,
  feedbackIcon: computed(() => formItemContext.value.feedbackIcon as VNodeChild),
  suffixIcon: computed(() =>
    props.suffixIcon === undefined ? pickerContext.suffixIcon : props.suffixIcon,
  ),
});

const placeholder = computed(() =>
  getRangePlaceholder(
    mergedLocale.value,
    mergedPicker.value,
    props.placeholder as [string, string] | undefined,
  ),
);

const mergedAllowClear = computed<false | { clearIcon: VNodeChild }>(() => {
  const allowClear = props.allowClear ?? pickerContext.allowClear ?? true;
  if (allowClear === false) {
    return false;
  }
  const fromObject =
    typeof allowClear === 'object' && allowClear.clearIcon ? allowClear.clearIcon : undefined;
  return {
    clearIcon: fromObject ?? props.clearIcon ?? pickerContext.clearIcon ?? h(CloseCircleFilled),
  };
});

/** 活动端几何（喂给 range-arrow 的定位）。 */
const activeInfo = ref<[number, number, number]>([0, 0, 0]);
const rangeArrowRef = ref<HTMLElement | null>(null);
const rangeWrapperRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const arrowOffset = ref(0);
const containerOffset = ref(0);

/**
 * range-arrow / container 的偏移（上游 `Popup/index.js:62-90`）。
 *
 * ⚠️ 依赖 DOM 布局 ⇒ jsdom 下全 0（`getBoundingClientRect` 恒 0）⇒ 结果恒 0。
 * 真实浏览器里由 `onActiveInfo` + ResizeObserver 驱动。
 */
const syncRangeOffset = (): void => {
  if (!rangeWrapperRef.value) {
    return;
  }
  const [activeInputLeft, activeInputRight] = activeInfo.value;
  const arrowWidth = rangeArrowRef.value?.offsetWidth ?? 0;
  const wrapperRect = rangeWrapperRef.value.getBoundingClientRect();
  if (!wrapperRect.height || wrapperRect.right < 0) {
    return;
  }
  arrowOffset.value =
    (rtl.value ? activeInputRight - arrowWidth : activeInputLeft) - wrapperRect.left;
  const selectorWidth = activeInfo.value[2];
  if (containerWidth.value && containerWidth.value < selectorWidth) {
    const offset = rtl.value
      ? wrapperRect.right - (activeInputRight - arrowWidth + containerWidth.value)
      : activeInputLeft + arrowWidth - wrapperRect.left - containerWidth.value;
    containerOffset.value = Math.max(0, offset);
  } else {
    containerOffset.value = 0;
  }
};

watch(activeInfo, syncRangeOffset, { flush: 'post' });

/**
 * ResizeObserver：容器宽度变了要重算偏移。
 *
 * ⚠️ 它现在挂在 **vnode 钩子**上（见 `bindEl` 的说明），不再是函数 ref。
 */
let disposeResize: (() => void) | null = null;

const bindRangeWrapper = (el: HTMLElement | null): void => {
  rangeWrapperRef.value = el;
  disposeResize?.();
  disposeResize = null;
  if (el) {
    disposeResize = observeResize(el, () => {
      if (rangeWrapperRef.value) {
        containerWidth.value = rangeWrapperRef.value.offsetWidth;
      }
      syncRangeOffset();
    });
  }
};

/**
 * 🚨 **浮层里的元素一律用 vnode 钩子绑，不能用 `ref:`**。
 *
 * 为什么：这些 vnode 由下面的 `popupVNode` computed 创建，而 `Trigger` 的
 * `contentSource` 在它**自己的 setup 期**就被 `watch({ immediate: true })`
 * 求值了（`trigger.ts:494-504`）⇒ 创建 vnode 时 `currentRenderingInstance` 是 `null`
 * ⇒ `rawRef.i`（owner）是 `null` ⇒ Vue 的 `setRef` 读 `owner.refs` 直接抛
 * `TypeError: Cannot read properties of null (reading 'refs')`。
 *
 * ⚠️ **dev 构建只 `warn`「Missing ref owner context. ref cannot be used on hoisted
 * vnodes.」，然后 `return`** —— 所以 jsdom 用例、dev 页面、甚至 `--mode compare`
 * 都可能全绿；只有**生产构建 + 真浏览器**才炸。2026-10-01 由 L6 的 `range` 变体首次暴露。
 *
 * 修法：`onVnodeMounted` / `onVnodeUnmounted` 由 `invokeVNodeHook` 调用，
 * **完全不经过 `setRef`** ⇒ 不需要 owner。
 */
const bindEl = <T extends Element>(
  target: Ref<T | null>,
  onBind?: (el: T | null) => void,
): Record<string, (vnode: VNode) => void> => ({
  onVnodeMounted: (vnode: VNode) => {
    target.value = vnode.el as T;
    onBind?.(target.value);
  },
  onVnodeUnmounted: () => {
    target.value = null;
    onBind?.(null);
  },
});
onScopeDispose(() => {
  disposeResize?.();
  disposeResize = null;
});

const disableSubmit = computed(() => {
  const valueList = inner.calendarValue.value.filter((v): v is DatePickerDate => Boolean(v));
  if (valueList.length === 0) {
    return true;
  }
  return valueList.some((v, index) => isInvalidateDate(v, { activeIndex: index }));
});

/** 🚨 范围的 `showNow` 默认是 **`false`**（`useShowNow` 第 5 参 `rangePicker = true`）。 */
const mergedShowNow = computed(() =>
  getShowNow(mergedPicker.value, mergedMode.value, props.showNow, props.showToday, true),
);

const panelLayoutVNode = computed(() =>
  h('div', { class: `${prefixCls.value}-panel-layout` }, [
    h(PresetPanel as Component, {
      prefixCls: prefixCls.value,
      presets: presetList.value,
      onClick: (value: unknown) => onPresetSubmit(value),
      onHover: (value: unknown | null) => onSetHover(value as DatePickerDate[] | null, 'preset'),
    }),
    h('div', null, [
      panelVNode.value,
      h(
        Footer as Component,
        {
          prefixCls: prefixCls.value,
          mode: mergedMode.value,
          internalMode: internalMode.value,
          renderExtraFooter: props.renderExtraFooter,
          showNow: mergedShowNow.value,
          showTime: mergedShowTime.value,
          needConfirm: mergedNeedConfirm.value,
          invalid: disableSubmit.value,
          generateConfig: dayjsConfig,
          disabledDate: boundaryDisabledDate,
          locale: mergedLocale.value.lang,
          classNames: semantic.classNames.value.popup,
          styles: semantic.styles.value.popup,
          onNow,
          onSubmit: () => valueChange.triggerChange(activeIndex.value, 'confirm'),
        } as unknown as Record<string, unknown>,
      ),
    ]),
  ]),
);

const popupClassNames = computed(() => [
  ...getDropdownClassName({
    prefixCls: prefixCls.value,
    range: true,
    rtl: rtl.value,
    popupClassName: semantic.classNames.value.popup?.root,
  }),
  `css-var-root ${prefixCls.value}-css-var`,
]);

// ============================== 浮层内容 ==============================
const popupVNode = computed(() => {
  const popupCls = semantic.classNames.value.popup;
  const popupStyles = semantic.styles.value.popup;
  const container = h(
    'div',
    {
      // 🚨 用 vnode 钩子而不是 `ref:`（见 `bindEl` 的说明）
      ...bindEl(popupContainerRef),
      class: [
        `${prefixCls.value}-panel-container`,
        `${prefixCls.value}-${internalMode.value}-panel-container`,
        popupCls?.container,
      ],
      style: {
        [rtl.value ? 'marginRight' : 'marginLeft']: `${containerOffset.value}px`,
        [rtl.value ? 'marginLeft' : 'marginRight']: 'auto',
        ...popupStyles?.container,
      },
      tabIndex: -1,
      onFocus: () => {
        triggerOpen(true);
        onFieldFocus(activeIndex.value, new FocusEvent('focus'));
      },
      onBlur: (event: FocusEvent) => onFieldBlur(activeIndex.value, event),
    },
    [panelLayoutVNode.value],
  );

  // 🚨 只有 range 才有这两层（`Popup/index.js:164-178`）
  return h(
    'div',
    {
      ...bindEl(rangeWrapperRef, bindRangeWrapper),
      class: [
        `${prefixCls.value}-range-wrapper`,
        `${prefixCls.value}-${mergedPicker.value}-range-wrapper`,
      ],
    },
    [
      h('div', {
        ...bindEl(rangeArrowRef),
        class: `${prefixCls.value}-range-arrow`,
        style: { left: `${arrowOffset.value}px` },
      }),
      container,
    ],
  );
});

// ============================== 键入 / 焦点 / 清除 ==============================
const invalidPair = ref<[boolean, boolean]>([false, false]);

const applyInputText = (index: number, text: string): void => {
  valueChange.triggerChange(index, 'input');
  const parsed = validateFormat(text, parseContext.value);
  if (parsed) {
    invalidPair.value = fillIndex(invalidPair.value, index, false) as [boolean, boolean];
    onSelectorInvalid(false, index);
    valueChange.triggerChange(index, 'input', parsed);
    return;
  }
  const nextInvalid = text !== '';
  invalidPair.value = fillIndex(invalidPair.value, index, nextInvalid) as [boolean, boolean];
  onSelectorInvalid(nextInvalid, index);
};

const onInput = (index: number, event: Event): void => {
  applyInputText(index, (event.target as HTMLInputElement).value);
};

const onInputFocus = (index: number, event: FocusEvent): void => {
  valueChange.triggerChange(index, 'field-switch');
  triggerOpen(true);
  onFieldFocus(index, event);
};

const onInputBlur = (index: number, event: FocusEvent): void => {
  onFieldBlur(index, event);
};

const onInputKeydown = (index: number, event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    const text = (event.target as HTMLInputElement).value;
    if (validateFormat(text, parseContext.value)) {
      valueChange.triggerChange(index, 'keyboard-submit');
    }
  }
  if (event.key === 'Tab') {
    valueChange.triggerChange(index, 'keyboard-submit-weak');
  } else if (event.key === 'Escape') {
    valueChange.triggerChange(index, 'esc');
    triggerOpen(false);
  }
  let prevented = false;
  emit('keydown', event, () => {
    prevented = true;
  });
  if (event.defaultPrevented || prevented) {
    return;
  }
  if (event.key === 'Escape') {
    triggerOpen(false);
  } else if (event.key === 'Enter' && !mergedOpen.value) {
    triggerOpen(true);
  }
};

const onClear = (): void => {
  valueChange.reset();
  rangeValue.triggerSubmit(null);
  triggerOpen(false);
  emit('clear');
};

/**
 * 点选择器（上游 `RangePicker.js:250-263`）。
 *
 * 🚨 与单值不同：**先把焦点给「第一个未禁用的端」**，再开浮层。
 */
const onSelectorClick = (event: MouseEvent): void => {
  const selector = selectorRef.value;
  const native = selector?.nativeElement();
  const rootNode = (event.target as Element | null)?.getRootNode() as Document | undefined;
  const activeEl =
    rootNode?.activeElement ?? (typeof document !== 'undefined' ? document.activeElement : null);
  if (!native || !activeEl || !native.contains(activeEl)) {
    const enabledIndex = disabledPair.value.findIndex((d) => !d);
    if (enabledIndex >= 0) {
      selector?.focus({ index: enabledIndex });
    }
  }
  triggerOpen(true);
};

/** 点「此刻 / 今天」（上游 `onNow` → `triggerPartConfirm`）。 */
watch(mergedOpen, (next, prev) => {
  if (prev === undefined) {
    return;
  }
  if (next) {
    // 上游 `RangePicker.js:480-485`：每次打开把两端的粒度都重置回 `picker`
    if (props.mode === undefined) {
      innerModes.value = [mergedPicker.value, mergedPicker.value];
    }
    return;
  }
  // 关闭 ⇒ `popupClose`（上游 `:166-170` 的 `useLayoutEffect`）
  valueChange.triggerChange(valueChange.currentIndex.value ?? activeIndex.value, 'popupClose');
});

// ============================== 展示面 ==============================
const valueTexts = computed<string[]>(() => {
  const texts = getDateTexts(inner.calendarValue.value);
  return [texts[0] ?? '', texts[1] ?? ''];
});

const cssVarClassName = computed(() => `css-var-root ${prefixCls.value}-css-var`);

const rootClass = computed(() =>
  getRootClassNames({
    prefixCls: prefixCls.value,
    // 🚨 范围的 `-disabled` 是 `every()`、`-invalid` 是 `some()`（见 `root-class.ts`）
    disabled: everyDisabled.value,
    range: true,
    invalid: invalidPair.value.some(Boolean),
    focused: focused.value,
    rtl: rtl.value,
    size: mergedSize.value as string | undefined,
    variant: variant.value,
    enableVariantCls: enableVariantCls.value,
    status: mergedStatus.value,
    hasFeedback: hasFeedback.value,
    compactItemClassnames: compactItemClassnames.value,
    contextClassName: rangePickerConfig.className ?? pickerContext.className,
    className: props.className,
    cssVarClassName: cssVarClassName.value,
    rootClassName: props.rootClassName,
  }),
);

const zIndex = useZIndex('DatePicker', () => {
  const rootStyle = semantic.styles.value.popup?.root;
  return rootStyle?.zIndex as number | undefined;
});

const transitionName = computed(() => getTransitionName(rootPrefixCls.value, props.transitionName));
const realPlacement = computed(() => getRealPlacement(props.placement, rtl.value));
const builtinPlacements = computed(() => BUILT_IN_PLACEMENTS as Record<string, TriggerAlign>);
const popupAlign = computed(() => props.popupAlign as TriggerAlign | undefined);
const popupMotion = computed(() => ({ motionName: transitionName.value, motionDeadline: 1000 }));
const popupStyle = computed(
  () => semantic.styles.value.popup?.root as Record<string, string | number> | undefined,
);
const dropdownPrefixCls = computed(() => `${prefixCls.value}-dropdown`);

const selectorProps = computed(() => ({
  prefixCls: prefixCls.value,
  range: true,
  picker: mergedPicker.value,
  firstFormatLength: firstFormatLength.value,
  valueTexts: valueTexts.value,
  placeholder: placeholder.value,
  prefix: props.prefix,
  suffixIcon: mergedSuffixIcon.value,
  clearIcon: mergedAllowClear.value === false ? undefined : mergedAllowClear.value.clearIcon,
  clearAriaLabel: mergedLocale.value.lang.clear,
  allowClear: mergedAllowClear.value !== false,
  disabled: mergedDisabled.value,
  readOnly: props.inputReadOnly === true,
  activeIndex: focused.value || mergedOpen.value ? activeIndex.value : null,
  rootClass: rootClass.value,
  rootStyle: props.style,
  classNames: semantic.classNames.value,
  styles: semantic.styles.value,
  invalid: invalidPair.value.some(Boolean),
  // 分隔符（范围专属）
  separator: hasCustomSeparator.value ? mergedSeparator.value : h(SwapRightOutlined as never),
  customSeparator: hasCustomSeparator.value,
  // 掩码
  maskFormat: mergedFormat.value.maskFormat ?? undefined,
  preserveInvalidOnBlur: props.preserveInvalidOnBlur === true,
  validateFormat: (text: string) => Boolean(validateFormat(text, parseContext.value)),
  onInputHelp: () => triggerOpen(true),
  onInputSubmit: (index: number) => valueChange.triggerChange(index, 'keyboard-submit'),
  onInputText: (index: number, text: string) => applyInputText(index, text),
  onInput,
  onInputFocus,
  onInputBlur,
  onInputKeydown,
  onClear,
  onSelectorClick,
  onActiveInfo: (info: [number, number, number]) => {
    activeInfo.value = info;
  },
  /**
   * ⚠️ 上游 `RangeSelector.js` 既不传 `multiple` 也不传 `removeIcon`
   * （两个键只存在于 `SingleSelector` 的多选分支）。`Selector` 的
   * `multiple` 默认就是 `false`，这里显式写出来只是为了让「范围不是多选」
   * 这件事在 props 里可见；`removeIcon` 则**根本不该传** —— 它在多选分支
   * 才被读（`Selector.ts:570`），而 `RangePickerProps` 上也没有这个键。
   */
  multiple: false,
}));
</script>

<template>
  <Trigger
    ref="triggerRef"
    :prefix-cls="dropdownPrefixCls"
    :popup="popupVNode"
    :show-action="[]"
    :hide-action="['click']"
    :open="mergedOpen"
    :on-open-change="onOpenChange"
    :placement="realPlacement"
    :builtin-placements="builtinPlacements"
    :popup-align="popupAlign"
    :popup-class-name="popupClassNames"
    :popup-style="popupStyle"
    :get-popup-container="props.getPopupContainer"
    :z-index="zIndex"
    :motion="popupMotion"
    stretch="minWidth"
  >
    <Selector ref="selectorRef" v-bind="selectorProps" />
  </Trigger>
</template>
