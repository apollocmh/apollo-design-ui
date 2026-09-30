<script setup lang="ts">
/**
 * DatePicker —— 单值壳（G4 · S1）。
 *
 * 对应上游：antd 6.6.4 `es/date-picker/generatePicker/generateSinglePicker.js`
 * （**重新定义**，不搬运，H2）。
 *
 * ── 组装关系 ────────────────────────────────────────────────────────────────
 *
 * ```
 * Trigger（_internal/trigger.ts）                    ← 开合 / 定位 / Portal / 动效
 *   ├─ default slot: Selector（components/Selector.ts）  ← 触发元素：输入框 + 后缀 + 清除
 *   └─ popup: PickerPanel（@apollo-design/picker）        ← 面板（引擎包的 Vue 组件）
 * ```
 *
 * 值 / 开合 / 浏览值三个状态机在 `hooks/picker-value.ts`（S1 已落地并测过 51 条）。
 *
 * ── 🚨 四处「读源码才知道」的接线判据 ────────────────────────────────────────
 *
 * 1. **`prefixCls` 传的是字面量 `'picker'`**（`getPrefixCls('picker', …)`）⇒ 默认
 *    `apollo-picker`，**不是** `apollo-date-picker`。类名与 CSS 变量命名空间因此
 *    **不同名**（变量是 `--apollo-date-picker-*`）—— 见 `interface.ts` 文件头。
 * 2. **4 个面板导航图标是空 `<span>`**（`${prefixCls}-prev-icon` 等），图形由 CSS 画。
 *    不传会让面板渲染它自己的默认图标 ⇒ DOM 与上游不一致。
 * 3. **传给面板的 `locale` 是 `mergedLocale.lang`**（antd 的 `locale: locale.lang`）——
 *    antd 的完整语言包分片 `{lang, timePickerLocale}` 与面板要的 locale 是**两个类型**
 *    （`hooks/picker-types.ts` 的 `RcPickerLocale`）。
 * 4. **`trigger` 的开合是 `showAction: []` + `hideAction: ['click']`**（rc
 *    `PickerTrigger/index.js`）—— 没有 showAction ⇒ 只能靠点击输入框开（由 Selector
 *    的 `onSelectorClick` 显式触发），关则是「点击外部」。
 *
 * ── S1 的已知欠账（登记在 README §5）────────────────────────────────────────
 *
 * - **zIndex** 未接（上游 `useZIndex('DatePicker', …)`）⇒ 影响 L6 的浮层层级。
 * - **`minDate` / `maxDate` 的函数形态**在本地求值（`resolveLimit`），求值时机与
 *   上游 `useDisabledBoundary` 可能有别 ⇒ S2 核对。
 * - **键入 / 掩码 / 键盘分段**整体在 S2–S4；S1 只做「点击开 + 面板选择 + 受控值」。
 * - **`needConfirm` 的完整语义**（确认制）只做了「非 needConfirm 时点选即提交」。
 */
import { CloseCircleFilled } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { formatValue, type PanelDateType, PickerPanel } from '@apollo-design/picker';
import { type Component, type CSSProperties, computed, h, ref, type VNodeChild } from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getMergedPickerStatus } from './components/picker-shared';
import { getRootClassNames } from './components/root-class';
import { Selector } from './components/Selector';
import {
  BUILT_IN_PLACEMENTS,
  getDropdownClassName,
  getRealPlacement,
  getTransitionName,
} from './components/trigger-config';
import { dayjsConfig } from './hooks/dayjs-config';
import { mergeFormat, toInternalMode } from './hooks/picker-format';
import { getPlaceholder, mergePickerLocale } from './hooks/picker-locale';
import { useSuffixIcon } from './hooks/picker-suffix';
import { toDateArray, useInnerValue, useRangeValue, type ValueSlot } from './hooks/picker-value';
import { useMergedPickerSemantic } from './hooks/use-picker-semantic';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  LimitDate,
  OpenConfig,
  SingleValue,
} from './interface';

defineOptions({ name: 'ADatePicker', inheritAttrs: false });

/**
 * ⚠️ **Boolean prop 必须显式 `undefined` 默认值**（PITFALLS 2 同族）：
 * Vue 对**纯 Boolean** 类型会做 casting（未传 ⇒ `false`），而本组件多处判据是
 * 「`undefined` = 非受控 / 用默认」与「`false` = 显式关闭」**语义不同**：
 *   - `open === undefined` ⇒ 非受控；`open === false` ⇒ 受控且关闭
 *   - `suffixIcon === undefined` ⇒ 用默认图标；`null` / `false` ⇒ 整块不渲染
 *   - `allowClear` 的三态同理（`undefined` 用默认、`false` 永不渲染）
 * 所以下面这串 `undefined` 不是冗余，是**语义的一部分**。
 */
const props = withDefaults(defineProps<DatePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
  multiple: undefined,
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
  previewValue: undefined,
});

/**
 * ⚠️ **Vue 的 `defineEmits` 宏要求类型参数是「类型字面量」** —— imported interface
 * （`interface.ts` 的 `DatePickerEmits`）不会被宏静态解析（本仓既有组件同样用内联
 * 字面量，见 `affix/Affix.vue`）。
 *
 * ⇒ 这里与 `interface.ts` 的 `DatePickerEmits` **是同一份契约的两处表达**，
 *   改一处必须同步另一处。`DatePickerEmits` 仍然保留为**对外可引用的类型**。
 */
const emit = defineEmits<{
  change: [date: SingleValue, dateString: string | string[] | null];
  'update:value': [date: SingleValue];
  calendarChange: [
    date: DatePickerDate | DatePickerDate[],
    dateString: string | string[],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ];
  ok: [date: DatePickerDate | DatePickerDate[]];
  openChange: [open: boolean, config?: OpenConfig];
  'update:open': [open: boolean];
  pickerValueChange: [
    date: DatePickerDate,
    info: { source: 'reset' | 'panel'; mode: DatePickerPanelMode },
  ];
  'update:pickerValue': [date: DatePickerDate];
  panelChange: [value: DatePickerDate, mode: DatePickerPanelMode];
  clear: [];
  focus: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  blur: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  invalid: [invalid: boolean];
  submit: [event: Event];
  keydown: [event: KeyboardEvent, preventDefault: () => void];
}>();

// ============================== 上下文归一 ==============================
const context = useComponentConfig('datePicker');
const { getPrefixCls } = context;
/**
 * `ConfigProvider` 里 `components.datePicker` 的配置。
 *
 * ⚠️ `useComponentConfig` 的默认泛型是 `Record<string, unknown>`（它只负责搬运，
 * 值的类型由消费方给出）⇒ 这里显式收窄。**不收窄会让 `context.classNames` /
 * `context.suffixIcon` 全是 `unknown`**，进而把下游一连串表达式都推成 `unknown`
 * （本轮实测：`semantic` 的入参、`mergedSuffixIcon` 的返回类型同时报错）。
 */
interface DatePickerComponentConfig {
  classNames?: DatePickerSemanticClassNames;
  styles?: DatePickerSemanticStyles;
  className?: string;
  style?: CSSProperties;
  suffixIcon?: VNodeChild;
  clearIcon?: VNodeChild;
  allowClear?: boolean | { clearIcon?: VNodeChild };
}
const pickerContext = context as unknown as DatePickerComponentConfig;
const direction = useDirection();
const contextDisabled = useDisabled();
const formItemContext = useFormItemInputContext();

/** 🚨 传字面量 `'picker'` ⇒ 默认 `apollo-picker`（不是 `apollo-date-picker`）。 */
const prefixCls = computed(() => getPrefixCls('picker', props.prefixCls));
/** 动效名的前缀是 **rootPrefixCls**（PITFALLS 180 同族：写错会静默失效）。 */
const rootPrefixCls = computed(() => getPrefixCls());
const rtl = computed(() => direction.value === 'rtl');

// ============================== locale / 尺寸 / 变体 / 状态 ==============================
const [contextLocale] = useLocale('DatePicker');
const mergedLocale = computed(() => mergePickerLocale(contextLocale, props.locale));

const { compactSize, compactItemClassnames } = useCompactItemContext(prefixCls, direction);
const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);

const { variant, enableVariantCls } = useVariant({
  component: 'datePicker',
  variant: () => props.variant,
  legacyBordered: () => props.bordered,
});

const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
const hasFeedback = computed(() => formItemContext.value.hasFeedback === true);
const mergedStatus = computed(() =>
  getMergedPickerStatus(formItemContext.value.status, props.status),
);

// ============================== picker / format ==============================
const mergedPicker = computed(() => props.picker ?? 'date');
/** 内部模式：`'date' + showTime` ⇒ `'datetime'`（`'datetime'` 是**独立分支**）。 */
const internalMode = computed(() => toInternalMode(props.picker, props.showTime));

const mergedFormat = computed(() =>
  mergeFormat(internalMode.value, mergedLocale.value.lang, props.format),
);

// ============================== 语义槽 ==============================
const semantic = useMergedPickerSemantic({
  contextClassNames: () => pickerContext.classNames,
  classNames: () => props.classNames,
  contextStyles: () => pickerContext.styles,
  styles: () => props.styles,
  popupClassName: () => props.popupClassName ?? props.dropdownClassName,
  popupStyle: () => props.popupStyle as Record<string, string | number> | undefined,
  props: props as never,
});

// ============================== 值状态机 ==============================
/** 把值列表格式化成文本（`dateString`）。上游用 `formatList[0]`。 */
const getDateTexts = (dates: ValueSlot[]): string[] =>
  dates.map((date) =>
    formatValue(date, {
      generateConfig: dayjsConfig,
      locale: mergedLocale.value.lang,
      // ⚠️ locale 缺 `fieldDateFormat` 时 `firstFormat` 是 `undefined` ——
      //    上游此时会抛错，本仓降级成空串（README §2 第 1 条，INTENDED）。
      format: mergedFormat.value.firstFormat ?? '',
    }),
  );

const inner = useInnerValue({
  generateConfig: computed(() => dayjsConfig),
  getDateTexts,
  rangeValue: false,
  order: computed(() => props.order === true),
  defaultValue: toDateArray(props.defaultValue),
  getValue: () => (props.value !== undefined ? toDateArray(props.value) : undefined),
  onCalendarChange: (dates, texts, info) => {
    emit('calendarChange', dates as never, texts, info);
    // legacy `onSelect`：上游只在 `picker === 'time' && !multiple` 时转发
    if (props.onSelect && mergedPicker.value === 'time' && !props.multiple) {
      props.onSelect(dates.filter((d): d is DatePickerDate => Boolean(d)) as never);
    }
  },
  onOk: (dates) => emit('ok', dates.filter((d): d is DatePickerDate => Boolean(d)) as never),
});

const isInvalidateDate = (
  date: DatePickerDate,
  info: { from?: DatePickerDate; activeIndex: number },
): boolean =>
  props.disabledDate?.(date, {
    // ⚠️ 上游的**类型面**写的是 `info.type: PanelMode`，但运行时传的是
    //    `internalPicker`（`InternalMode`，含 `'datetime'`）—— 两者不一致，
    //    JS 不检查所以没人发现。这里如实 cast 并注明（S2 核对该差异是否可观测）。
    type: internalMode.value as unknown as DatePickerPanelMode,
    ...(info.from ? { from: info.from } : {}),
  }) === true;

const rangeValue = useRangeValue({
  generateConfig: computed(() => dayjsConfig),
  locale: computed(() => mergedLocale.value.lang),
  picker: computed(() => mergedPicker.value),
  allowEmpty: computed(() => undefined),
  order: computed(() => props.order === true),
  disabledSlots: computed(() => [mergedDisabled.value, mergedDisabled.value] as const),
  isInvalidateDate,
  getDateTexts,
  inner,
  onChange: (dates, texts) => {
    // 🚨 C11：`update:value` 与语义事件 `change` **同时**发
    const next = props.multiple ? (dates ?? []) : (dates?.[0] ?? null);
    emit('change', next as never, (texts?.[0] ?? null) as never);
    emit('update:value', next as never);
  },
});

// ============================== 开合 / 浏览值 ==============================
const innerOpen = ref(props.defaultOpen === true);
const mergedOpen = computed(() => props.open ?? innerOpen.value);

const onOpenChange = (next: boolean): void => {
  if (props.open === undefined) {
    innerOpen.value = next;
  }
  emit('openChange', next);
  emit('update:open', next);
};

const innerPickerValue = ref<DatePickerDate | null>(props.defaultPickerValue ?? null);
const mergedPickerValue = computed<DatePickerDate | null>(
  () => props.pickerValue ?? innerPickerValue.value,
);
/** 未给浏览值时用「第一个有值的槽位」兜底，再不行用今天。 */
const panelPickerValue = computed<DatePickerDate>(
  () =>
    mergedPickerValue.value ??
    (inner.calendarValue.value[0] as DatePickerDate | null) ??
    dayjsConfig.getNow(),
);

// ============================== 展示面 ==============================
const valueTexts = computed<string[]>(() => {
  const texts = getDateTexts(inner.calendarValue.value);
  return props.multiple ? texts : [texts[0] ?? ''];
});

const mergedSuffixIcon = useSuffixIcon({
  picker: mergedPicker,
  hasFeedback,
  // `formItemContext.feedbackIcon` 是 `unknown`（Form 侧的宽松类型）⇒ 收窄。
  feedbackIcon: computed(() => formItemContext.value.feedbackIcon as VNodeChild),
  suffixIcon: computed(() =>
    props.suffixIcon === undefined ? pickerContext.suffixIcon : props.suffixIcon,
  ),
});

const placeholder = computed(() =>
  getPlaceholder(mergedLocale.value, mergedPicker.value, props.placeholder as string | undefined),
);

/** `minDate` / `maxDate` 的函数形态在本地求值（⚠️ S1 欠账，见文件头）。 */
const resolveLimit = (limit: LimitDate | undefined): PanelDateType | undefined =>
  typeof limit === 'function' ? (limit({}) as PanelDateType) : (limit as PanelDateType | undefined);

const rootClass = computed(() =>
  getRootClassNames({
    prefixCls: prefixCls.value,
    size: mergedSize.value as string | undefined,
    variant: variant.value,
    enableVariantCls: enableVariantCls.value,
    status: mergedStatus.value,
    hasFeedback: hasFeedback.value,
    compactItemClassnames: compactItemClassnames.value,
    contextClassName: pickerContext.className,
    className: props.className,
    rootClassName: props.rootClassName,
  }),
);

const popupClassNames = computed(() =>
  getDropdownClassName({
    prefixCls: prefixCls.value,
    range: false,
    rtl: rtl.value,
    popupClassName: props.popupClassName ?? props.dropdownClassName,
  }),
);

const transitionName = computed(() => getTransitionName(rootPrefixCls.value, props.transitionName));

const realPlacement = computed(() => getRealPlacement(props.placement, rtl.value));

/**
 * 清除按钮的**四段回退链**（上游 `_util/hooks/useAllowClear`）：
 *
 * `allowClear.clearIcon` → 独立 `clearIcon`（deprecated）→ context 的 `clearIcon`
 * → **默认 `CloseCircleFilled`**。
 *
 * ⚠️ 最后一段是**必须的**：`showClear` 的第一条条件就是 `isReactRenderable(clearIcon)`
 * ⇒ 不给默认值会让清除按钮**永远不渲染**（本轮实测：3 条用例同时红）。
 *
 * ⚠️ 本仓已有 `_internal/use-allow-clear.ts`（同判），但它的入参是**值**而非
 * getter ⇒ 放进 `computed` 会失去响应性（`props.allowClear` 变了不重算）。
 * 这里用 `computed` 重写一遍，**登记为待统一**（README §5）。
 */
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

/** 传给 `Selector` 的三态：`false` ⇒ 永不渲染。 */
const allowClearForSelector = computed(() => mergedAllowClear.value !== false);
/** 已算好的 clearIcon（含默认值）。 */
const clearIcon = computed(() =>
  mergedAllowClear.value === false ? undefined : mergedAllowClear.value.clearIcon,
);

/** 面板的全部 props 一次性绑定（`v-bind` 一个 computed，避免 template 里 20+ 属性）。 */
const panelProps = computed(() => ({
  prefixCls: prefixCls.value,
  direction: direction.value,
  locale: mergedLocale.value.lang,
  generateConfig: dayjsConfig,
  picker: mergedPicker.value,
  mode: props.mode,
  value: inner.calendarValue.value as never,
  multiple: props.multiple,
  onSelect: (date: PanelDateType) => {
    const next = [...inner.calendarValue.value];
    next[0] = date;
    inner.triggerCalendarChange(next);
    // ⚠️ S1 只做「非 needConfirm 时点选即提交」；确认制的完整语义在 S2/S5。
    if (props.needConfirm !== true) {
      rangeValue.triggerSubmit(next);
    }
  },
  onPickerValueChange: (next: PanelDateType) => {
    if (props.pickerValue === undefined) {
      innerPickerValue.value = next;
    }
    emit('pickerValueChange', next, { source: 'panel', mode: internalMode.value as never });
    emit('update:pickerValue', next);
  },
  pickerValue: panelPickerValue.value,
  defaultPickerValue: props.defaultPickerValue ?? undefined,
  onPanelChange: (viewDate: PanelDateType | undefined, mode: never) =>
    emit('panelChange', viewDate as never, mode),
  disabledDate: props.disabledDate as never,
  minDate: resolveLimit(props.minDate),
  maxDate: resolveLimit(props.maxDate),
  cellRender: props.cellRender as never,
  showTime: props.showTime as never,
  showWeek: props.showWeek,
  format: mergedFormat.value.firstFormat,
  classNames: semantic.classNames.value.popup,
  styles: semantic.styles.value.popup,
  // 🚨 4 个导航图标必须是空 span（图形由 CSS 画），见文件头第 2 条
  prevIcon: props.prevIcon ?? h('span', { class: `${prefixCls.value}-prev-icon` }),
  nextIcon: props.nextIcon ?? h('span', { class: `${prefixCls.value}-next-icon` }),
  superPrevIcon: props.superPrevIcon ?? h('span', { class: `${prefixCls.value}-super-prev-icon` }),
  superNextIcon: props.superNextIcon ?? h('span', { class: `${prefixCls.value}-super-next-icon` }),
}));

const selectorProps = computed(() => ({
  prefixCls: prefixCls.value,
  picker: mergedPicker.value,
  firstFormat: mergedFormat.value.firstFormat,
  valueTexts: valueTexts.value,
  placeholder: placeholder.value,
  prefix: props.prefix,
  suffixIcon: mergedSuffixIcon.value,
  clearIcon: clearIcon.value,
  clearAriaLabel: mergedLocale.value.lang.clear,
  // ⚠️ 传**已归一的三态**（`false` ⇒ Selector 永不渲染清除按钮）
  allowClear: allowClearForSelector.value,
  disabled: mergedDisabled.value,
  readOnly: props.inputReadOnly === true,
  rootClass: rootClass.value,
  rootStyle: props.style,
  classNames: semantic.classNames.value,
  styles: semantic.styles.value,
  onClear: () => rangeValue.triggerSubmit(null),
  onSelectorClick: () => onOpenChange(!mergedOpen.value),
}));

// ============================== Trigger 的接线值 ==============================
// ⚠️ Vue 的 **template 不支持 TS 断言**（`as X`）⇒ 所有需要收窄/断言的量
// 都必须在 `<script setup>` 里准备好再绑。
const dropdownPrefixCls = computed(() => `${prefixCls.value}-dropdown`);
/**
 * 面板 vnode。
 *
 * ⚠️ `h()` 的 props 形参类型是 `RawProps`（`VNodeProps & Record<string, any>`）——
 * `panelProps` 是**推断出的对象字面量类型**，没有索引签名，直接传会让 `h` 的
 * 重载解析失败（报「missing $, $data, $props…」这种看着像组件实例的错误）。
 * 这里显式收窄成 `Record<string, unknown>`：**不掩盖任何类型问题**
 * （每个字段的值在 `panelProps` 构造处已经过类型检查）。
 */
const panelVNode = computed(() =>
  h(PickerPanel as Component, panelProps.value as unknown as Record<string, unknown>),
);
const builtinPlacements = computed(() => BUILT_IN_PLACEMENTS as Record<string, TriggerAlign>);
const popupAlign = computed(() => props.popupAlign as TriggerAlign | undefined);
const popupMotion = computed(() => ({ motionName: transitionName.value, motionDeadline: 1000 }));
</script>

<template>
  <Trigger
    :prefix-cls="dropdownPrefixCls"
    :popup="panelVNode"
    :show-action="[]"
    :hide-action="['click']"
    :open="mergedOpen"
    :on-open-change="onOpenChange"
    :placement="realPlacement"
    :builtin-placements="builtinPlacements"
    :popup-align="popupAlign"
    :popup-class-name="popupClassNames"
    :get-popup-container="props.getPopupContainer"
    :motion="popupMotion"
    stretch="minWidth"
  >
    <Selector v-bind="selectorProps" />
  </Trigger>
</template>
