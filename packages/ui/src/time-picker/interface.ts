/**
 * TimePicker 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/time-picker/index.d.ts`（68 行，全文已读）+
 * `es/date-picker/generatePicker/interface.d.ts` 的 `GenericTimePickerProps` /
 * `PickerPropsWithMultiple`。类型**重新定义**（H2），不复制搬运。
 *
 * ── 上游的类型构造链（逐层展开，别跳步）──────────────────────────────────────
 *
 * ```ts
 * GenericTimePickerProps<D> = Omit<PickerProps<D>, 'picker' | 'showTime'> & {
 *   onSelect?: (value: D) => void;                     // @deprecated
 * };
 * PickerTimeProps<D> = PickerPropsWithMultiple<D, GenericTimePickerProps<D>>;
 *   // ⇒ Omit<GenericTimePickerProps, 'defaultValue'|'value'|'onChange'|'onOk'>
 *   //   & { multiple?: IsMultiple (默认 false); defaultValue?; value?; onChange?; onOk? }
 * TimePickerProps = Omit<PickerTimeProps<Dayjs>, 'picker' | 'classNames' | 'styles'> & {
 *   addon?; status?; popupClassName?; popupStyle?; rootClassName?; classNames?; styles?;
 * }
 * ```
 *
 * ⇒ 三条**只有展开才看得见**的结论：
 *
 * 1. 🚨 **`picker` 与 `showTime` 被剔除** —— 本组件恒 `picker='time'`，
 *    且时间轴没有「日期 + 时间」的二级面板。
 * 2. 🚨 **`multiple` 的类型是 `false`**（`PickerPropsWithMultiple` 的 `IsMultiple`
 *    默认 `false`，上游没传第二个实参）⇒ 上游**在类型层就禁止** TimePicker 多选。
 *    本仓照抄（见 `TimePickerProps.multiple` 的说明）。
 * 3. 🚨 **`classNames` / `styles` 是「先剔除再挂回」** —— 挂回的是
 *    `TimePickerSemanticType`（4 平铺 + `popup` 嵌套），**不是** date-picker 那份。
 *    ⚠️ 两份类型**逐字段相同**（已核对），所以本仓**别名复用** date-picker 的
 *    `DatePickerSemantic*`（见下方 `TimePickerSemantic*` 的说明）。
 *
 * ── 本仓的复用策略 ────────────────────────────────────────────────────────────
 *
 * `DatePicker.vue` 已经支持 `picker='time'`（`date-picker` 已 completed），
 * 所以 `TimePicker` 只是它的**薄壳** ⇒ 类型也用 `Omit<DatePickerProps, …>` 派生，
 * **不重抄 60 个字段**。派生掉的键与理由逐条写在 `TimePickerProps` 上方。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type {
  CellRenderInfo,
  DatePickerDate,
  DatePickerEmits,
  DatePickerExpose,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  DatePickerSlots,
  DatePickerStatus,
  NoUndefinedRangeValue,
  PickerCommonProps,
  RangePickerEmits,
  RangePickerExpose,
  RangePickerProps,
  RangeValue,
  RangeValueDate,
  ValueDate,
} from '../date-picker/interface';

// ---------------------------------------------------------------------------
// 单值
// ---------------------------------------------------------------------------

/**
 * TimePicker 的值。
 *
 * 上游是 `Dayjs | null`（`PickerPropsWithMultiple<…, IsMultiple = false>` 展开的结果）。
 * 本仓 date-picker 的 `SingleValue = DatePickerDate | DatePickerDate[] | null`
 * 含数组分支（为 `multiple` 服务）；`TimePicker` 的 `multiple` 恒 `false`
 * ⇒ 收窄成单值，与上游同形。
 */
export type TimePickerValue = DatePickerDate | null;

// ---------------------------------------------------------------------------
// 语义槽（别名复用 date-picker 的那份）
// ---------------------------------------------------------------------------

/**
 * `classNames` 的形状：**4 平铺 + 1 嵌套**。
 *
 * ```
 * root | prefix | input | suffix
 * popup: string | { root | header | body | content | item | footer | container }
 * ```
 *
 * ⚠️ 上游在 `time-picker/index.tsx` 里**又声明了一份** `TimePickerSemanticType`
 * （与 `date-picker` 的 `DatePickerSemanticType` 逐字段相同）。本仓**不重抄** ——
 * 两份类型的字段、可空性、`popup` 的 `string | object` 双形态都一致，
 * 重抄只会带来「改一处忘另一处」的漂移风险。
 */
export type TimePickerSemanticClassNames = DatePickerSemanticClassNames;

/** `styles` 的形状（同上；⚠️ `popup` **只有对象形态**）。 */
export type TimePickerSemanticStyles = DatePickerSemanticStyles;

/**
 * 语义槽的「对象 | 函数」双形态。
 *
 * ⚠️ 函数形态的入参是 `{ props }`，`props` 是**合并后**的 props
 * （上游 `mergedProps = { ...props, variant: mergedVariant }`）—— 见 §4.2。
 */
export type TimePickerSemanticValue<T, Props = PickerCommonProps> = DatePickerSemanticValue<
  T,
  Props
>;

/** 时间面板浮层的语义槽（`popup` 对象形态；`popupStyle` 是它的 deprecated 别名）。 */
/** 同上。 */
export type {
  PickerPopupSemanticClassNames as TimePickerPopupSemanticClassNames,
  PickerPopupSemanticStyles as TimePickerPopupSemanticStyles,
} from '../date-picker/interface';

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

/**
 * `TimePicker` 的 props。
 *
 * ── 从 `DatePickerProps` 派生的四个 `Omit` 键，逐条给理由 ──────────────────────
 *
 * | 剔除的键 | 理由 |
 * |---|---|
 * | `picker` | 恒 `'time'`（上游 `TimePickerProps` 也剔除它） |
 * | `showTime` | 时间轴没有「日期 + 时间」的二级面板（上游同判） |
 * | `classNames` / `styles` | 挂回的是**本组件自己的**语义类型（形状相同但语义归属不同） |
 * | `multiple` | 上游收成 `false`（类型层禁止多选） |
 * | `onSelect` | 上游收成**单值**签名 `(value: D) => void` |
 * | `value` / `defaultValue` | 上游收成**单值** `Dayjs \| null`（本仓的 `SingleValue` 含数组分支） |
 *
 * ⚠️ **不剔除** `popupClassName` / `popupStyle` / `dropdownClassName` —— 它们在
 * `PickerCommonProps` 里已经声明过，且**告警矩阵不对称**（单个 TimePicker 不发、
 * RangePicker 发，见 `docs/analysis/time-picker.md` §2.4）⇒ 保留声明，
 * 由 `.vue` 决定「吞掉还是透传」。
 */
export interface TimePickerProps
  extends Omit<
    DatePickerProps,
    | 'picker'
    | 'showTime'
    | 'multiple'
    | 'onSelect'
    | 'value'
    | 'defaultValue'
    | 'classNames'
    | 'styles'
  > {
  // ============================================================ 值（单值）
  /** 当前值。走 `v-model:value`。 */
  value?: TimePickerValue;
  /** 非受控初值。⚠️ 必须是 dayjs 实例。 */
  defaultValue?: DatePickerDate | null;

  /**
   * 🚨 **类型上是 `false`，不是 `boolean`**。
   *
   * 上游 `PickerPropsWithMultiple<…, IsMultiple = false>` 的默认实参就是 `false`
   * ⇒ `<TimePicker multiple />` 在 antd 里**编译不过**（`time` 也不支持多选）。
   * 本仓照抄：既拦住误用，又与上游的 `.d.ts` 同形。
   */
  multiple?: false;

  // ============================================================ 已废弃 / 新增
  /** @deprecated 用 `renderExtraFooter`。⚠️ 与 `renderExtraFooter` 同时传时后者优先。 */
  addon?: () => VNodeChild;
  /** 校验状态（`'error'` / `'warning'`）。⚠️ `PickerCommonProps` 里已有，这里重申语义。 */
  status?: DatePickerStatus;
  /**
   * @deprecated 用 `classNames.popup.root`。
   *
   * 🚨 **单个 TimePicker 上不发废弃告警**（上游外层把它解构掉了，只合并进语义槽）；
   * 而 `TimePicker.RangePicker` 上**发**。见分析 §2.4 的实测表。
   */
  popupClassName?: string;
  /** @deprecated 用 `styles.popup.root`。⚠️ 告警行为同上。 */
  popupStyle?: CSSProperties;

  // ============================================================ 语义槽（挂回）
  /** 语义化类名（4 平铺 + `popup` 嵌套）。支持**函数形态**。 */
  classNames?: TimePickerSemanticValue<TimePickerSemanticClassNames>;
  /** 语义化样式（同上）。支持**函数形态**。 */
  styles?: TimePickerSemanticValue<TimePickerSemanticStyles>;

  // ============================================================ legacy 回调
  /**
   * @deprecated 用 `onCalendarChange`。
   *
   * ⚠️ 上游只在 **`picker === 'time' && !multiple`** 时把它接到 `onCalendarChange`
   * 上；本组件恒满足该条件 ⇒ 恒定生效。
   * ⚠️ 与 date-picker 的差别：上游这里收**单值**（`GenericTimePickerProps` 重新声明过）。
   */
  onSelect?: (value: DatePickerDate) => void;
}

/**
 * `TimePicker.RangePicker` 的 props。
 *
 * 上游：`TimeRangePickerProps = Omit<RangePickerTimeProps<Dayjs>, 'picker'> & {
 *   popupClassName?; popupStyle?; }`，其中
 * `RangePickerTimeProps = Omit<RangePickerProps, 'showTime' | 'picker'>`。
 *
 * ⚠️ 与单个 TimePicker 的**三处**差别（都是实测出来的）：
 *
 * 1. 🚨 **外层不解构任何 prop**（上游只有 3 行：`{...props} picker="time" mode={undefined}`）
 *    ⇒ `bordered` / `popupClassName` / `popupStyle` **原样透传** ⇒ 内层**会**发废弃告警。
 * 2. **`variant` 走 `rangePicker` 那份配置**（不是 `timePicker`）—— 见分析 §2.2。
 * 3. **`separator` 读 `rangePicker.separator`**（不是 `timePicker`）。
 */
export interface TimeRangePickerProps
  extends Omit<RangePickerProps, 'picker' | 'showTime' | 'classNames' | 'styles'> {
  /**
   * @deprecated 用 `classNames.popup.root`。
   *
   * 🚨 与单个 TimePicker **相反**：这里**会**发
   * `[apollo: DatePicker.RangePicker] \`popupClassName\` is deprecated`（实测）。
   */
  popupClassName?: string;
  /** @deprecated 用 `styles.popup.root`。⚠️ 告警行为同上。 */
  popupStyle?: CSSProperties;

  /** 语义化类名（与单个 TimePicker 同一套形状）。支持**函数形态**。 */
  classNames?: TimePickerSemanticValue<TimePickerSemanticClassNames>;
  /** 语义化样式（同上）。支持**函数形态**。 */
  styles?: TimePickerSemanticValue<TimePickerSemanticStyles>;
}

// ---------------------------------------------------------------------------
// emits / slots / expose
// ---------------------------------------------------------------------------

/**
 * `TimePicker` 的 emits。
 *
 * ⚠️ **刻意与 `DatePickerEmits` 完全同形**（直接别名），理由有两条：
 *
 * 1. 上游 `TimePicker` 的 `onChange` / `onOk` 由 `PickerPropsWithMultiple` 重声明成
 *    单值，但**本仓把回调放在 emits 里**（`change` / `ok`），`update:value` 是
 *    `v-model:value` 的通道。若这里把载荷收窄成单值，`DatePicker.vue` 的
 *    `change`（载荷含数组分支）就无法原样转发 ⇒ 要在薄壳里做一次**无意义的**类型断言。
 * 2. `multiple` 恒 `false` ⇒ 数组分支**运行时不可达**，收窄只增加代码不增加保证。
 *
 * ⇒ 类型面与 date-picker 保持同形，**迁移时更安全**（`v-model` 的类型不会因为
 * 换了个组件名而变）。
 */
export type TimePickerEmits = DatePickerEmits;

/** `TimePicker.RangePicker` 的 emits（同上，与 `RangePickerEmits` 同形）。 */
export type TimeRangePickerEmits = RangePickerEmits;

/**
 * `TimePicker` 的 slots。
 *
 * ⚠️ 上游 `TimePickerProps` 里**没有 slot 型字段**（`addon` / `renderExtraFooter`
 * 都是函数 prop），但本仓的 date-picker 提供了一套**函数 prop 的插槽等价物**
 * ⇒ 原样透传（薄壳不为插槽做任何额外的事）。
 */
export type TimePickerSlots = DatePickerSlots;

/** `TimePicker.RangePicker` 的 slots（同上）。 */
export type TimeRangePickerSlots = DatePickerSlots;

/**
 * `TimePicker` 的 expose（命令式句柄）。
 *
 * ⚠️ 上游是 `PickerRef`（来自 `@rc-component/picker`），本仓由 `date-picker`
 * 的 `DatePickerExpose` 表达 ⇒ 直接别名，**不新定义**（两个组件的根是同一个
 * `.apollo-picker`）。
 */
export type TimePickerExpose = DatePickerExpose;

/** `TimePicker.RangePicker` 的 expose（`RangePickerExpose` 多了两端 input）。 */
export type TimeRangePickerExpose = RangePickerExpose;

// ---------------------------------------------------------------------------
// 复用导出的类型（消费方少写一个 import 路径）
// ---------------------------------------------------------------------------

/**
 * `TimePicker` 的 locale。
 *
 * 上游 `time-picker/index.tsx` 里也导出了同名接口
 * `{ placeholder?: string; rangePlaceholder?: [string, string] }`；
 * 本仓的 `@apollo-design/locale` **已经**有同形同名的类型 ⇒ 直接再导出，
 * **不新声明**（重声明会与 locale 包的那份漂移）。
 */
export type { TimePickerLocale } from '@apollo-design/locale';
/** 单元格渲染信息（透传给 date-picker 的面板）。 */
/** 单值预设项。 */
/** 范围预设项。 */
/** 范围值。 */
/** 范围的两端都不允许 `undefined`（提交后的形态）。 */
export type {
  CellRenderInfo as TimePickerCellRenderInfo,
  NoUndefinedRangeValue as TimeNoUndefinedRangeValue,
  RangeValue as TimeRangeValue,
  RangeValueDate as TimeRangeValueDate,
  ValueDate as TimePickerValueDate,
};
