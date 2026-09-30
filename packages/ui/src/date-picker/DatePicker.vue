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
 * 四个状态机：
 *   1. **值 / 日历值** —— `hooks/picker-value.ts`（`useInnerValue` + `useRangeValue`）；
 *   2. **提交时机** —— `hooks/picker-value-change.ts`（上游 405 行状态机：把每种交互
 *      来源解析成唯一 action）。S2 收口时落地；**S4 的字段导航与它同源**；
 *   3. **开合** —— 本文件（`innerOpen` / `mergedOpen` / `onOpenChange`）；
 *   4. **浏览值** —— 本文件（`innerPickerValue` / `panelPickerValue`）。
 *
 * ── 🚨 四处「读源码才知道」的接线判据 ────────────────────────────────────────
 *
 * 1. **`prefixCls` 传的是字面量 `'picker'`**（`getPrefixCls('picker', …)`）⇒ 默认
 *    `apollo-picker`，**不是** `apollo-date-picker`。类名与 CSS 变量命名空间因此
 *    **不同名**（变量是 `--apollo-date-picker-*`）—— 见 `interface.ts` 文件头。
 * 2. **4 个面板导航图标是空 `<span>`**（`${prefixCls}-prev-icon` 等），图形由 CSS 画。
 *    不传会让面板渲染它自己的默认图标 ⇒ DOM 与上游不一致。
 * 3. **传给面板的 `locale` 是 `locale.lang` 且必须**补齐**（antd 的 `locale: locale.lang`）
 *    —— antd 的完整语言包分片 `{lang, timePickerLocale}` 与面板要的 locale 是**两个类型**
 *    （`hooks/picker-types.ts` 的 `RcPickerLocale`）；而 `fieldDateFormat` 这些键
 *    两边语言包都没有，靠 `hooks/picker-filled.ts` 补（见那儿的文件头）。
 * 4. **`trigger` 的开合是 `showAction: []` + `hideAction: ['click']`**（rc
 *    `PickerTrigger/index.js`）—— 没有 showAction ⇒ 只能靠点击输入框开（由 Selector
 *    的 `onSelectorClick` 显式触发），关则是「点击外部」。
 *
 * ── 已知欠账（登记在 README §5）─────────────────────────────────────────────
 *
 * - **`minDate` / `maxDate` 的函数形态**在本地求值（`resolveLimit`），求值时机与
 *   上游 `useDisabledBoundary` 可能有别 ⇒ 待核对。
 * - **掩码模式（`format.type: 'mask'`）= S3**；**`-input-active` 分段渲染 = S4**；
 *   **`multiple` + `tagRender` / `maxTagCount`、范围两端切换 = S5**。
 * - **面板 `mode` 的受控化**：上游把 `mergedMode` 受控地喂给面板，本仓让面板自管、
 *   只**跟随** `onPanelChange` 记一份（`panelFinished` 要用）。见 README §5.5。
 * - **`preserveInvalidOnBlur` / `previewValue` / `inputReadOnly` 的交互**尚未接。
 * - **原生 `submit`**（上游 `Selector` 的 `onSubmit` ⇒ `triggerConfirm('keyboard-submit')`）
 *   未接 —— `<input>` 不派发 `submit`，属边角。
 * - **`onSelectorFocus` 的 `inherit: true`**（`triggerOpen(true, { inherit: true })`）
 *   在本仓的 `Trigger` 上没有对应选项 ⇒ 当前等价于普通打开。
 */
import { CloseCircleFilled, CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import {
  formatValue,
  type InternalMode,
  isSame,
  type PanelDateType,
  PickerPanel,
  toggleDates,
} from '@apollo-design/picker';
import { useZIndex } from '@apollo-design/portal';
import { useDevWarning } from '@apollo-design/utils';
import { type Component, type CSSProperties, computed, h, ref, type VNodeChild, watch } from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getFormatLength, getMergedNeedConfirm } from './components/picker-shared';
import { getRootClassNames } from './components/root-class';
import { Selector } from './components/Selector';
import {
  BUILT_IN_PLACEMENTS,
  getDropdownClassName,
  getRealPlacement,
  getTransitionName,
} from './components/trigger-config';
import { dayjsConfig } from './hooks/dayjs-config';
import { useFilledLocale } from './hooks/picker-filled';
import { mergeFormat, toInternalMode } from './hooks/picker-format';
import { getPlaceholder, mergePickerLocale } from './hooks/picker-locale';
import { useSuffixIcon } from './hooks/picker-suffix';
import { validateFormat } from './hooks/picker-typing';
import { toDateArray, useInnerValue, useRangeValue, type ValueSlot } from './hooks/picker-value';
import { useRangeValueChange } from './hooks/picker-value-change';
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

// ============================== 废弃 prop 告警 ==============================
/**
 * 上游 `generateSinglePicker.js` 的 `deprecatedProps` 表（**逐字**）：
 *
 * ```js
 * const deprecatedProps = {
 *   dropdownClassName: 'classNames.popup.root',
 *   popupClassName:    'classNames.popup.root',
 *   popupStyle:        'styles.popup.root',
 *   bordered:          'variant',
 *   onSelect:          'onCalendarChange',
 * };
 * Object.entries(deprecatedProps).forEach(([oldProp, newProp]) => {
 *   warning.deprecated(!(oldProp in props), oldProp, newProp);
 * });
 * ```
 *
 * 🚨 **判据必须从 `!(oldProp in props)` 改成 `props.x === undefined`**：
 * React 的 `props` 只含**实际传过**的键，而 Vue 的 `props` 对象**恒含所有声明过的键**
 * （未传时是 `undefined`）⇒ 照抄 `in` 会让**每一条告警每次都触发** ——
 * 恒假告警比没有告警更糟（会淹掉真告警，也会让「告警一致性」测试假红）。
 * 全仓同判：`input` / `input-number` / `text-area` 的 `bordered` 都是 `=== undefined`。
 *
 * ⚠️ 仅 dev 生效（`useDevWarning` 内部走 `isDev()`）。
 */
const devWarning = useDevWarning('DatePicker');
const DEPRECATED_PROPS: Record<string, string> = {
  dropdownClassName: 'classNames.popup.root',
  popupClassName: 'classNames.popup.root',
  popupStyle: 'styles.popup.root',
  bordered: 'variant',
  onSelect: 'onCalendarChange',
};
for (const [oldProp, newProp] of Object.entries(DEPRECATED_PROPS)) {
  devWarning.deprecated(props[oldProp as keyof DatePickerProps] === undefined, oldProp, newProp);
}

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

/**
 * `Selector` 的命令面（上游 `SinglePicker` 的 `selectorRef`）。
 *
 * - `focus()` —— 点根节点 / 点清除后把焦点还给输入框；
 * - `nativeElement()` —— S4 的 `isInternalElement` 要它（判断新焦点是否还在 Picker 里）。
 *
 * ⚠️ 上游 `SingleSelector` 的 `useImperativeHandle` 还暴露 `nativeElement` / `blur`，
 * 本仓按需加（S5 再说）。
 */
const selectorRef = ref<{
  focus: () => void;
  nativeElement: () => HTMLElement | null;
} | null>(null);

/** 触发器的命令面（`popupElement()` 用于 `isInternalElement`）。 */
const triggerRef = ref<{ popupElement: () => HTMLElement | null } | null>(null);

/**
 * 当前获得焦点的 field（`null` = 焦点不在 Picker 里）。
 *
 * 上游 `useFocusEvents` 的 `focusedIndex`：它的**唯一**用途是产出 `-focused` 根类名
 * （`SingleSelector` 的 `focused` prop）。
 */
const focusedIndex = ref<number | null>(null);

/**
 * 新焦点是否仍落在 Picker 内（上游 `isTargetInContainers([selectorRoot, popup])`）。
 *
 * 🚨 **这是「点面板格子不会把浮层关掉」的关键**：面板根是 `tabindex="0"` 的 div
 * （`picker-panel.ts` 的 `tabIndex` 默认 0）⇒ 点格子时焦点移到**面板**上，
 * `relatedTarget` 在浮层里 ⇒ 不算「确认离开」。
 * ⚠️ 若哪天面板根丢了 `tabindex`，这条会**静默失效**（浮层在第一次点格子时就关）。
 */
const isInternalElement = (target: EventTarget | null): boolean => {
  const node = target as Node | null;
  const containers = [
    selectorRef.value?.nativeElement() ?? null,
    triggerRef.value?.popupElement() ?? null,
  ];
  return containers.some(
    (container) => !!container && (container === node || container.contains(node)),
  );
};

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
const mergedStatus = computed(() => getMergedStatus(formItemContext.value.status, props.status));

// ============================== picker / format ==============================
const mergedPicker = computed(() => props.picker ?? 'date');
/** 内部模式：`'date' + showTime` ⇒ `'datetime'`（`'datetime'` 是**独立分支**）。 */
const internalMode = computed(() => toInternalMode(props.picker, props.showTime));

/**
 * locale 的**补齐**（上游 `useFilledProps.js:72-76` 的 `Locale` + `ShowTime` 两段）。
 *
 * 🚨 **这不是可选项**：语言包（本仓的与 antd 的**都一样**）**没有**
 * `fieldDateFormat` / `fieldDateTimeFormat` 这些键，默认格式串来自 rc 的
 * `fillLocale` 硬编码兜底。不补 ⇒ `formatList` 恒空 ⇒ **键入永远判非法**。
 * 详见 `hooks/picker-filled.ts` 的文件头（含两轮实测证据）。
 *
 * ⚠️ 三处用法必须都用**补齐后**的 locale：
 *   `mergeFormat`（字段格式串）/ `formatValue`（`dateString`）/
 *   `PickerPanel`（表头标题走 `locale.fieldDateFormat`）。
 */
const filled = useFilledLocale({
  source: computed(() => ({
    picker: props.picker,
    showTime: props.showTime,
    format: props.format,
  })),
  locale: computed(() => mergedLocale.value.lang),
  internalMode,
});
/** 补齐后的 rc locale —— 下游一律用它，不再直接用 `mergedLocale.value.lang`。 */
const filledLang = computed(() => filled.filledLocale.value);

const mergedFormat = computed(() =>
  mergeFormat(internalMode.value, filledLang.value, props.format),
);

/**
 * `needConfirm` 的合并值（上游 `useFilledProps.js:74-76`）。
 *
 * ⚠️ 传的是 `internalMode`（`InternalMode`）而**不是** `props.picker` ——
 * `'datetime'` 只在 `InternalMode` 里（`date` + `showTime`），
 * 传错会让带时间的日期选择器「点一下就提交」。
 *
 * ⚠️ 它同时是**提交时机状态机**的入参（`needConfirm`），所以在状态机之前定义。
 */
const mergedNeedConfirm = computed(() =>
  getMergedNeedConfirm(props.needConfirm, internalMode.value),
);

/**
 * `input[size]` 用的格式字符数。
 *
 * ⚠️ `firstFormat` 可能是**函数形态**（`CustomFormat`）—— 那种情况下
 * `.length` 是**形参个数**，必须先拿 `getNow()` 求值（上游 `useInputProps.js` 逐字）。
 * 求值放在这里而不是 `Selector`：那是个哑组件，不持有日期库。
 */
const firstFormatLength = computed(() =>
  getFormatLength(mergedFormat.value.firstFormat, dayjsConfig.getNow()),
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
      // ⚠️ 用**补齐后**的 locale（`filledLang`）。补齐前 `fieldDateFormat` 是
      //    `undefined` ⇒ `firstFormat` 也 `undefined`，只是被 `?? ''` 兜住 ⇒
      //    「显示对但功能不对」—— 见 `hooks/picker-filled.ts` 文件头。
      locale: filledLang.value,
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
  // ⚠️ 补齐后的 locale（解析 / 格式化都要它，见 `hooks/picker-filled.ts`）
  locale: computed(() => filledLang.value),
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

/**
 * 开合的唯一出口。
 *
 * ⚠️ 上游是 `triggerOpen(open, { force })`，`force` 只用于**绕过 `disabled` 守卫**
 * （`useOpen.js`）。本仓的 `onOpenChange` 没有那个守卫 ⇒ 各调用处的
 * `{ force: true }` 在语义上是**空操作**（已在调用点注明）。
 */
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

/**
 * 面板粒度（**受控**给面板）。
 *
 * 上游是 `useControlledState(picker, mode)`：`props.mode` 有值就用它，否则用内部状态；
 * 面板**每次**粒度变化都通过 `onPanelChange` 报回来（`triggerModeChange`）。
 * 本仓照此实现 —— 面板收到的是**已确定**的 `mode`，它自己的内部状态不再生效
 * （`picker-panel.ts` 的 `setMergedMode` 在 `props.mode !== undefined` 时是 no-op）。
 *
 * ⚠️ 反馈是**下一 tick** 生效（我们更新 `innerMode` → `mergedMode` → 面板 prop）。
 * 下钻链（年→月→日）每一步都读面板**当时**的 `mergedMode`，所以链式推进正常。
 */
const innerMode = ref<DatePickerPanelMode>(props.mode ?? mergedPicker.value);
watch(
  () => props.mode,
  (next) => {
    if (next !== undefined) {
      innerMode.value = next;
    }
  },
);
const mergedMode = computed<DatePickerPanelMode>(() => props.mode ?? innerMode.value);

/**
 * 面板粒度对应的内部模式（上游 `SinglePicker` 的 `internalMode`）。
 *
 * 🚨 与上面的 `internalMode`（= 上游的 **`internalPicker`**）**不是一回事**：
 *   - `internalMode`：从 **`props.picker`** 推 ⇒ 恒定的「组件粒度」；
 *   - `panelInternalMode`：从 **面板当前 mode** 推 ⇒ 随用户下钻 / 回退变化。
 *
 * `panelFinished` 正是用「两者是否相等」判断「面板这一下走完了吗」：
 * 在年 / 十年面板里点一格**不该**提交（那时两者不等）。
 */
const panelInternalMode = computed<InternalMode>(() =>
  mergedMode.value === 'date' && props.showTime ? 'datetime' : mergedMode.value,
);

/** 上游 `multipleInteractivePicker` / `complexPicker`（`useFilledProps.js:65-66`）。 */
const multipleInteractivePicker = computed(
  () => internalMode.value === 'time' || internalMode.value === 'datetime',
);
const complexPicker = computed(() => multipleInteractivePicker.value || props.multiple === true);

// ============================== 提交时机状态机（S2 剩余 / S4 内核）=============
/**
 * 上游 `SinglePicker.js:170-190` 的四件套接线。
 *
 * ```
 * getFieldCalendarValue()          → [values.length ? values : null]  ← **整组值**或 null
 * triggerFieldCalendarChange(_, v) → triggerCalendarChange(v)         ← `_index` 被丢弃
 * flushFieldSubmit(_, need)        → need 时 triggerSubmit + 关浮层
 * resetFieldValue()                → resetValue()                     ← **丢弃 index**
 * ```
 *
 * 🚨 上游的 `getCalendarValue` 给状态机的不是「单个日期」而是**整组值**：
 * 单值时空是 `null`、非空是 `[date]`（`multiple` 时是整组）。`currentEmpty`
 * 的判定完全依赖这个形状 —— 传单个日期会让「空值」永远判不出来。
 */
const valueChange = useRangeValueChange({
  fieldCount: 1,
  needConfirm: () => mergedNeedConfirm.value,
  allowEmpty: () => [false],
  getCalendarValue: () =>
    [inner.calendarValue.value.length ? inner.calendarValue.value : null] as const,
  triggerCalendarChange: (_index, value) => {
    inner.triggerCalendarChange(value as ValueSlot[]);
  },
  flushSubmit: (_index, needTriggerChange) => {
    if (needTriggerChange) {
      rangeValue.triggerSubmit(inner.calendarValue.value);
      // 上游 `triggerOpen(false, { force: true })` —— `force` 在本仓无对应物
      onOpenChange(false);
    }
  },
  // ⚠️ 单值上游**丢弃 index**（`resetFieldValue = () => { resetValue(); }`）⇒ 恒为全量回滚
  resetValue: () => rangeValue.resetValue(),
});

/**
 * 浮层开合的两个副作用（上游 `SinglePicker.js:187-191` + `:451-456`）。
 *
 * **开** ⇒ 把面板粒度重置回 `picker`（`Reset for every active`）。
 *   ⚠️ 上游那段的 `triggerEvent = false` ⇒ **不**发 `onPanelChange`；
 *   受控的 `props.mode` 不重置（`setMode` 在受控时不写内部状态）。
 *   🚨 不做这一步的后果：用户下钻到年面板后关闭、再打开会**仍停在年面板**
 *   （浮层关闭**不卸载** —— `Trigger` 的 `removeOnLeave: false`）。
 *
 * **关** ⇒ `popupClose`（见上）。
 *
 * ⚠️ 关浮层是**异步**的（离场动效结束才卸载）⇒ 断言卸载必须**轮询**（PITFALLS 179）。
 */
watch(mergedOpen, (next) => {
  if (next) {
    if (props.mode === undefined) {
      innerMode.value = mergedPicker.value;
    }
    return;
  }
  valueChange.triggerChange(0, 'popupClose');
});

// ============================== 键入（S2） ==============================

/**
 * **键入的值非法**（rc 的 `invalid` 通道 —— 与 antd 的 `status` 是两回事）。
 *
 * ⚠️ 上游 `useInputProps.js:122-134` 的判据逐字：
 * ```js
 * onChange: text => {
 *   onInputChange();
 *   const parsed = validateFormat(text);
 *   if (parsed) { onInvalid(false, index); onChange(parsed, index); return; }
 *   onInvalid(!!text, index);   // ← 空串算**合法**
 * }
 * ```
 * ⇒ `invalid` 只在「非空且解析不出」时为真。
 */
const invalid = ref(false);

/** 解析上下文（`locale` + 已归一的 `formatList` + 日期库适配层）。 */
const parseContext = computed(() => ({
  locale: filledLang.value.locale,
  formatList: mergedFormat.value.formatList,
  generateConfig: dayjsConfig,
}));

/**
 * 键入文本的**完整处理**（上游 `useInputProps.js:114-135` 的 `onChange`）。
 *
 * ```
 * onInputChange()                      // = triggerSingleValueChange(0, 'input')，**不带值**
 *   ↓                                  //   只为「建立本轮交互」
 * validateFormat(text)
 *   命中 → onInvalid(false, index)
 *        → onChange(parsed, index)     //   SingleSelector 包一层：onChange([date], 'input')
 *   未中 → onInvalid(!!text, index)
 * ```
 *
 * ⚠️ **`onInputChange()` 在前**：它先把 `currentIndex` 建起来并把该 field 标成
 * `modified`；随后的带值调用才走 `modify` 把值写进临时日历值。
 *
 * ⚠️ 两个入口共用它：**普通模式的 DOM `input` 事件** 与 **掩码模式的 `keydown`**
 * （掩码下原生 `input` 是空实现 —— 上游 `Input.js` 的 `onInternalChange`）。
 */
const applyInputText = (text: string): void => {
  // ① 上游 `useInputProps.js:115`
  valueChange.triggerChange(0, 'input');
  const parsed = validateFormat(text, parseContext.value);
  if (parsed) {
    invalid.value = false;
    emit('invalid', false);
    // ② `SingleSelector.onSingleChange`：**包成数组**再交给状态机
    valueChange.triggerChange(0, 'input', [parsed]);
    return;
  }
  // ⚠️ 空串算合法（上游 `onInvalid(!!text)`）
  const nextInvalid = text !== '';
  invalid.value = nextInvalid;
  emit('invalid', nextInvalid);
};

/** 普通模式的 DOM `input` 事件（掩码模式下**不**绑它）。 */
const onInput = (_index: number, event: Event): void => {
  applyInputText((event.target as HTMLInputElement).value);
};

/**
 * 聚焦（上游 `SinglePicker.js:417-423` + `useFocusEvents` 的 `onFieldFocus`）。
 *
 * `field-switch` + 开浮层（`inherit: true`）+ 记 `focusedIndex`。
 * ⚠️ `field-switch` 在单值下（`index === currentIndex`）会解析成 `abort` —— 但它**仍然**
 * 会把 `currentIndex` 建起来（`triggerChange` 的入口那一支），这正是上游的意图。
 */
const onInputFocus = (_index: number, event: FocusEvent): void => {
  focusedIndex.value = 0;
  valueChange.triggerChange(0, 'field-switch');
  onOpenChange(true);
  emit('focus', event, {});
};

/**
 * 失焦（上游 `useFocusEvents` 的 `onFieldBlur`，逐字）。
 *
 * ```js
 * if (!isInternalElement(event.relatedTarget)) { setFocusedIndex(null); onConfirmedBlur?.(); }
 * ```
 *
 * 🚨 **只有「确认离开 Picker」才清焦点 + 关浮层**：
 *   - 点面板格子 ⇒ 焦点落到面板根（`tabindex="0"`）⇒ 在浮层里 ⇒ **不**关；
 *   - `Tab` 到 Picker 外面 ⇒ `relatedTarget` 不在选择器根也不在浮层 ⇒ 关。
 * 写成「一 blur 就关」会让「点日期格子」直接关掉浮层（`showTime` 的确认制就废了）。
 *
 * ⚠️ 上游还有一支「面板里获得焦点的控件变成 disabled ⇒ 把焦点抢回输入框」
 * （`source === 'panel' && target.hasAttribute('disabled')`）—— 那属于**面板侧**的
 * focus 事件（`onPanelFocus`/`onBlur` 挂在浮层容器上），本仓尚未接，见 README §5.5。
 */
const onInputBlur = (_index: number, event: FocusEvent): void => {
  if (!isInternalElement(event.relatedTarget)) {
    focusedIndex.value = null;
    // 上游 `useFocusEvents` 的第四参：`onConfirmedBlur` = `() => triggerOpen(false)`
    onOpenChange(false);
  }
  emit('blur', event, {});
};

/**
 * 按键 —— **一个**处理器，但内部是上游**四段**的顺序：
 *
 * ```
 * ⓪ Input.onSharedKeyDown：Enter **且文本合法** ⇒ onSubmit（= keyboard-submit ⇒ 提交）
 * ① SinglePicker.onSelectorKeyDown：Tab ⇒ keyboard-submit-weak；Escape ⇒ esc + 关浮层
 * ② 用户的 deprecated onKeyDown（第二参是 preventDefault 的兼容 shim）
 * ③ useInputProps 自己：Escape ⇒ 关浮层；Enter ⇒ **只在关闭时**开浮层
 * ```
 *
 * 出处：`Input.js:182-187`（`onSharedKeyDown`）→ `useInputProps.js:140-162`。
 *
 * 🚨 **`Enter` 不是「不提交」**（这一点我先前写错了，2026-10-01 更正）：
 *   - **文本合法** ⇒ `onSubmit()` ⇒ `triggerConfirm('keyboard-submit')` ⇒ `switchNext`
 *     ⇒ **提交并关浮层**；
 *   - **文本非法 / 为空** ⇒ 不提交，落到 ③ 的「只在关闭时开浮层」。
 * 之前的注释与用例把它写成「Enter 一律不提交」——那只对**空文本**成立。
 * ⚠️ 顺序也重要：⓪ 在 ① 之前，所以「Enter 提交」不会被 Tab/Escape 的分支影响。
 */
const onInputKeydown = (_index: number, event: KeyboardEvent): void => {
  // ⓪ 上游 `Input.js:182-183`
  if (event.key === 'Enter') {
    const text = (event.target as HTMLInputElement).value;
    if (validateFormat(text, parseContext.value)) {
      valueChange.triggerChange(0, 'keyboard-submit');
    }
  }

  // ① 上游 `SinglePicker.js:426-433`
  if (event.key === 'Tab') {
    valueChange.triggerChange(0, 'keyboard-submit-weak');
  } else if (event.key === 'Escape') {
    valueChange.triggerChange(0, 'esc');
    onOpenChange(false);
  }

  // ② deprecated 的 `onKeyDown` 通道（第二参是 `preventDefault` 的兼容 shim）
  let prevented = false;
  emit('keydown', event, () => {
    prevented = true;
  });

  // ③ 上游 `useInputProps.js:144-158`
  if (event.defaultPrevented || prevented) {
    return;
  }
  switch (event.key) {
    case 'Escape':
      onOpenChange(false);
      break;
    case 'Enter':
      // ⚠️ **只在关闭时开** —— 走到这里说明文本不合法（合法的已在 ⓪ 提交）
      if (!mergedOpen.value) {
        onOpenChange(true);
      }
      break;
    default:
      break;
  }
};

/**
 * 清除（上游 `SinglePicker.js:242-249`，逐字）。
 *
 * ```js
 * resetSingleValueChange();      // 先结束本轮交互的簿记（**不动值**）
 * triggerSubmitChange(null);     // 再提交空值
 * triggerOpen(false, { force }); // 关浮层
 * selectorRef.current.focus();   // 焦点还给输入框（点的是清除按钮）
 * onClear?.();
 * ```
 */
const onClear = (): void => {
  valueChange.reset();
  rangeValue.triggerSubmit(null);
  onOpenChange(false);
  selectorRef.value?.focus();
  emit('clear');
};

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

/**
 * `-css-var` 类（+ 字面量 `css-var-root`）。
 *
 * 🚨 **顺序对齐 antd 的实测基线**（`tests/compat/baselines/date-picker.dom.json`）：
 * ```
 * apollo-picker apollo-picker-outlined css-dev-only-do-not-override-1v6lqee css-var-root apollo-picker-css-var
 * ```
 * ⇒ `css-var-root` 在 **前**、`{prefixCls}-css-var` 在 **后**
 * （本仓没有 hashId，那一段按「无 cssinjs」的既定差异省略）。
 *
 * 🚨 **两个出口都要挂**（根 + 浮层）：浮层走 Portal，不在根的子树里 ⇒
 * 只挂根的话浮层里 `var(--apollo-date-picker-*)` 全部静默回退
 * （症状：面板宽度 calc 非法 ⇒ 宽度被丢弃 ⇒ 面板铺满容器）。
 * 见 `style/index.ts` 的 `genDatePickerStyle` 与 PITFALLS 9 / D95。
 */
const cssVarClassName = computed(() => `css-var-root ${prefixCls.value}-css-var`);

const rootClass = computed(() =>
  getRootClassNames({
    prefixCls: prefixCls.value,
    // 🚨 rc 的 `Selector` 状态类：`disabled` 时根类名是
    //    `apollo-picker apollo-picker-disabled apollo-picker-outlined`（L4 实测）
    disabled: mergedDisabled.value,
    // S5：多选（`-multiple`，rc 的 5 个状态类里**排第 1**）
    multiple: props.multiple === true,
    // rc 的 `-invalid` 类（**键入非法**，与 antd 的 `-status-error` 是两回事）
    invalid: invalid.value,
    // S4：`-focused`（上游 `useFocusEvents` 的 `focusedIndex !== null`）
    focused: focusedIndex.value !== null,
    rtl: rtl.value,
    size: mergedSize.value as string | undefined,
    variant: variant.value,
    enableVariantCls: enableVariantCls.value,
    status: mergedStatus.value,
    hasFeedback: hasFeedback.value,
    compactItemClassnames: compactItemClassnames.value,
    contextClassName: pickerContext.className,
    className: props.className,
    // 🚨 在 `className` 之后、`rootClassName` 之前（上游 `clsx(hashId, cssVarCls, rootCls, rootClassName)`）
    cssVarClassName: cssVarClassName.value,
    rootClassName: props.rootClassName,
  }),
);

/**
 * 浮层 z-index（上游 `useZIndex('DatePicker', mergedStyles?.popup?.root?.zIndex)`）。
 *
 * `DatePicker` 在 `ZIndexConsumer` 里（offset 50）—— 与 Select/Dropdown/Menu 同档。
 * 用户可在 `styles.popup.root.zIndex` 覆盖。
 */
const zIndex = useZIndex('DatePicker', () => {
  const rootStyle = semantic.styles.value.popup?.root;
  return rootStyle?.zIndex as number | undefined;
});

const popupClassNames = computed(() => [
  ...getDropdownClassName({
    prefixCls: prefixCls.value,
    range: false,
    rtl: rtl.value,
    popupClassName: props.popupClassName ?? props.dropdownClassName,
  }),
  // 🚨 浮层也要拿组件变量（Portal 到 body ⇒ 不在根的子树里），见 `cssVarClassName`
  cssVarClassName.value,
]);

const transitionName = computed(() => getTransitionName(rootPrefixCls.value, props.transitionName));

/**
 * 浮层根的**内联样式**（`styles.popup.root`；deprecated 的 `popupStyle` 已被
 * `useMergedPickerSemantic` 合并进同一处 —— 见 `fillPopupStyle`）。
 *
 * 🚨 2026-10-01 补齐：此前 `semantic.styles` 算出来了却**从没绑到 `Trigger`** ⇒
 * `popupStyle` / `styles.popup.root` 静默无效（移植上游 `legacy popupStyle` 用例时抓到）。
 *
 * ⚠️ `Trigger` 的 `popupStyle` 类型是 `Record<string, string | number>`（有索引签名），
 * 而 `CSSProperties` 是**接口**（没有索引签名）⇒ 必须显式收窄，不能直接传。
 */
const popupStyle = computed(
  () => semantic.styles.value.popup?.root as Record<string, string | number> | undefined,
);

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
  // ⚠️ 传**补齐后**的 rc locale。面板自己也会补一次（`||` 判据），
  //    但表头标题读 `locale.fieldDateFormat` ⇒ 传补齐的才对。
  locale: filledLang.value,
  generateConfig: dayjsConfig,
  picker: mergedPicker.value,
  /**
   * 面板粒度（**受控**）。
   *
   * ⚠️ 传的是 `mergedMode`（已确定的值）而不是 `props.mode` —— 与上游
   * `SinglePicker.js:366` 的 `mode: mergedMode` 一致。面板的内部状态因此不再生效，
   * 全部粒度变化都走 `onPanelChange` 回灌（见 `mergedMode` 的说明）。
   */
  mode: mergedMode.value,
  value: inner.calendarValue.value as never,
  multiple: props.multiple,
  onSelect: (date: PanelDateType) => {
    // 上游 `SinglePicker.js:322-328`（逐字）
    if (props.multiple && panelInternalMode.value !== mergedPicker.value) {
      return;
    }
    const nextValues = props.multiple
      ? toggleDates(
          dayjsConfig,
          filledLang.value,
          mergedMode.value,
          inner.calendarValue.value,
          date as DatePickerDate,
        )
      : [date];
    // 「面板这一下走完了吗」= 不是复杂选择器 **且** 面板粒度就是组件的粒度
    const panelFinished = !complexPicker.value && internalMode.value === panelInternalMode.value;
    valueChange.triggerChange(0, panelFinished ? 'panel-final' : 'panel-intermediate', nextValues);
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
  /**
   * 面板粒度变化（上游 `SinglePicker.js:214-222` 的 `triggerModeChange`）。
   *
   * 面板收到的是**受控**的 `mode`（`mergedMode`）⇒ 面板自己的内部状态不生效，
   * 粒度变化**必须**从这里回灌（见 `mergedMode` 的说明）。
   */
  onPanelChange: (viewDate: PanelDateType | undefined, mode: DatePickerPanelMode) => {
    if (props.mode === undefined) {
      innerMode.value = mode;
    }
    emit('panelChange', viewDate as never, mode);
  },
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
  firstFormatLength: firstFormatLength.value,
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
  invalid: invalid.value,
  // ---------------------------------------------------------- 多选（S5）
  multiple: props.multiple === true,
  /** 原始值（标签要拿它去删；`valueTexts` 只有文本）。 */
  values: inner.calendarValue.value as unknown[],
  tagRender: props.tagRender,
  maxTagCount: props.maxTagCount,
  /**
   * 标签的删除图标。
   *
   * ⚠️ 上游 `MultipleDates.js` 自己的兜底是字符串 `'×'`，但 **antd 总会传一个** ——
   * `Select` 的 `useIcons` 的默认是 **`CloseOutlined`** ⇒ 有效默认是图标而不是 `'×'`。
   * 本仓照 antd 的有效默认。
   */
  removeIcon: props.removeIcon ?? h(CloseOutlined),
  /**
   * 删除一个标签（上游 `SingleSelector.onMultipleRemove`，逐字）。
   *
   * ```js
   * const nextValues = value.filter(ori => ori && !isSame(generateConfig, locale, ori, date, internalPicker));
   * onChange(nextValues, open ? 'input' : 'remove');
   * ```
   *
   * 🚨 **来源随浮层开合而不同**：开着 ⇒ `'input'`（只是临时改动，等确认）；
   * 关着 ⇒ `'remove'`（**最终**提交）。这直接改变状态机解析出的 action
   * （`'remove'` 是唯一「即使不允许为空也要提交」的来源）。
   * ⚠️ 判等粒度是 **`internalMode`**（组件粒度），不是面板当前粒度。
   */
  onMultipleRemove: (value: unknown) => {
    const nextValues = inner.calendarValue.value.filter(
      (date) =>
        date &&
        !isSame(dayjsConfig, filledLang.value, date, value as DatePickerDate, internalMode.value),
    );
    valueChange.triggerChange(0, mergedOpen.value ? 'input' : 'remove', nextValues);
  },
  // ---------------------------------------------------------- 掩码模式（S3）
  /** 归一后的掩码格式串（`format.type === 'mask'` 时非空）。 */
  maskFormat: mergedFormat.value.maskFormat ?? undefined,
  preserveInvalidOnBlur: props.preserveInvalidOnBlur === true,
  /** 掩码模式下 `Enter` 提交与 `paste` 都要「文本能否解析」。 */
  validateFormat: (text: string) => Boolean(validateFormat(text, parseContext.value)),
  /** 掩码：文本 ≠ 模板且 ≠ 受控值 ⇒ 打开浮层（上游 `onHelp` ⇒ `onOpenChange(true)`）。 */
  onInputHelp: () => onOpenChange(true),
  /** 掩码：`Enter` + 文本合法 ⇒ 提交（上游 `Input.onSharedKeyDown`）。 */
  onInputSubmit: () => valueChange.triggerChange(0, 'keyboard-submit'),
  /** 掩码：合法文本从 `keydown` 路径进来（原生 `input` 是空实现）。 */
  onInputText: (_index: number, text: string) => applyInputText(text),
  onInput,
  onInputFocus,
  onInputBlur,
  onInputKeydown,
  onClear,
  /**
   * 上游 `SinglePicker.js:234-240`：先把焦点还给输入框，再**无条件打开**。
   *
   * ⚠️ **不是 toggle** —— 关闭靠「点击外部」（`hideAction: ['click']`）。
   * 写成 `onOpenChange(!mergedOpen)` 会让「点一下输入框」把已开的浮层关掉，
   * 与 antd 不一致。
   */
  onSelectorClick: () => {
    if (!mergedDisabled.value) {
      selectorRef.value?.focus();
    }
    onOpenChange(true);
  },
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
    ref="triggerRef"
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
    :popup-style="popupStyle"
    :get-popup-container="props.getPopupContainer"
    :z-index="zIndex"
    :motion="popupMotion"
    stretch="minWidth"
  >
    <Selector ref="selectorRef" v-bind="selectorProps" />
  </Trigger>
</template>
