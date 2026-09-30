/**
 * DatePicker 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/date-picker/index.d.ts` + `es/date-picker/generatePicker/interface.d.ts`
 * 与 rc 内核 `@rc-component/picker@1.12.2` 的 `es/interface.d.ts` /
 * `es/PickerInput/{SinglePicker,RangePicker}.d.ts`（**重新定义**，不搬运，H2）。
 * 判据逐条见 `docs/analysis/date-picker.md`（含 SSR dump 的实测字节）。
 * 禁止 any / as any / @ts-expect-error（H10）。
 *
 * ── ⚠️ 这个组件看着是「薄壳」，但成本中心不在这里 ────────────────────────────────
 *
 * antd 侧确实薄（非 locale 2650 行），可 rc 的 `PickerInput` 是 **37 个 `.js` / 4290 行**
 * 且**绑 React**（`picker` foundation 只 Vue 化了**面板**）。
 * ⇒ 本文件只负责**类型面**，它与实现深度无关：**所有 prop 都必须声明**，
 * 否则会被 Vue 归进 `attrs` 而**静默失效**（PITFALLS 跨包判据 1 / 分析文档 §11.1）。
 * 「哪些行为本轮落地、哪些 `DEFERRED`」是 G4 的裁决，登记在 README §5 与
 * registry 的 `layerNotes`。
 *
 * ── 为什么**不**声明 HTML 透传属性 ──────────────────────────────────────────────
 *
 * 上游的 `SharedPickerProps extends SharedHTMLAttrs`（= `Omit<React.InputHTMLAttributes<HTMLDivElement>, …14 个>`），
 * 也就是「除那 14 个之外的原生属性都能透传」。Vue 里这层由 **`attrs` 自动兜住**，
 * 不需要（也不应该）逐个声明 —— 声明了反而会把它们从 `attrs` 里摘出来，
 * 失去 `v-bind="$attrs"` 的透传。⚠️ 代价是**未声明的自定义 prop 会静默进 attrs**
 * （这正是 PITFALLS 跨包判据 1 的坑，也是本文件必须写全的原因）。
 *
 * ── Vue 化映射（COMPATIBILITY.md 的规则）───────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `value` + `onChange(date, dateString)` | `v-model:value` + `@change`（**双发**） | C11 |
 * | `open` + `onOpenChange` | `v-model:open` + `@openChange` | C11 |
 * | `pickerValue` + `onPickerValueChange` | `v-model:pickerValue` + `@pickerValueChange` | C11 |
 * | `onCalendarChange` / `onOk` / `onPanelChange` / `onClear` / `onFocus` / `onBlur` | **emits**（载荷同形） | C5 |
 * | `panelRender` / `cellRender` / `renderExtraFooter` / `tagRender` | **函数 prop + 同名 scoped slot 双通道** | C8 |
 * | `presets[].label` / `separator` / `suffixIcon` / `clearIcon` / `prefix` / `prevIcon`… | `VNodeChild`（**必须显式 `undefined` 默认值**，Boolean 转换陷阱） | PITFALLS 2 |
 * | `DatePicker.RangePicker` 等 5 个静态子入口 | 同名导出 + `DatePicker.X` 静态别名 | 同上游 |
 * | `ref` → `PickerRef` / `RangePickerRef` | `expose({ nativeElement, focus, blur })` + `useDatePicker()` | INTENDED |
 * | `DatePicker.generatePicker(customGenerateConfig)` | **不实现**（本仓只支持 dayjs） | INTENDED |
 * | `_InternalPanelDoNotUseOrYouWillBeFired` | `PurePanel` 同名导出（名字带「别用」⇒ 保留原名） | 同上游 |
 *
 * ── 与本仓其它组件的三处刻意差异 ────────────────────────────────────────────────
 *
 * 1. **语义槽是「4 个平铺 + 7 个嵌套」**（`popup.{root,header,body,content,item,footer,container}`），
 *    与 tabs 的「8 平铺 + 1 嵌套」不同 ⇒ 深合并要能吃两层，且 `classNames.popup`
 *    允许是 **string**（旧写法）或对象（新写法）。
 * 2. **`prefixCls` 传下去会变成 `apollo-picker`**（不是 `apollo-date-picker`）——
 *    上游 `getPrefixCls('picker', customizePrefixCls)` 传的是字面量 `'picker'`。
 *    ⚠️ 面板类名因此整体换前缀，`picker` 包的 37 条基线要按「类名替换后的同构」比对。
 * 3. **有 expose**（`nativeElement` / `focus` / `blur`），且范围版的 `focus` 签名不同
 *    （收 `index`，可指定聚焦哪一端）。
 */

import type { PickerLocale } from '@apollo-design/locale';
import type {
  GenerateConfig,
  PanelMode,
  CustomFormat as PickerCustomFormat,
  PickerFormat,
  FormatType as PickerFormatType,
  PickerMode,
} from '@apollo-design/picker';
import type { Dayjs } from 'dayjs';
import type { CSSProperties, VNodeChild } from 'vue';
import type { SizeType } from '../config-provider';

// ---------------------------------------------------------------------------
// 基础联合（枚举值必须与 antd 一致 —— COMPONENT-RULES.md §4）
// ---------------------------------------------------------------------------

/**
 * 日期值 = dayjs 实例。
 *
 * ⚠️ **刻意用 ui 自己的 `Dayjs`**（不是 `@apollo-design/picker` 的 `PanelDateType`）——
 * pnpm 的严格 `node_modules` 让两个包各有一份 dayjs 声明；若本类型指向 picker 的那份，
 * 只要它出现在 `.vue` 的 `setup()` 返回值里（template 要用），`vue-tsc` 就会报 **TS2742**
 * （`cannot be named without a reference to packages/picker/node_modules/dayjs`）。
 * 两者是同一版本（`catalog:`）的无私有成员结构类型 ⇒ **结构等价**，互换不报错。
 */
export type DatePickerDate = Dayjs;

/**
 * 尺寸。
 *
 * ⚠️ 直接用 config-provider 的 `SizeType`（`'small' | 'medium' | 'middle' | 'large'`）——
 * 上游这里就是 `ButtonSize` / `SizeType`，不另立一份（否则 config-provider 的
 * `componentSize` 传下来时会因为枚举不等而产生类型错）。
 */
export type DatePickerSize = SizeType;

/**
 * 校验状态。
 *
 * ⚠️ 上游实测：`status="error"` 只加 `-status-error` 类名，
 * **不改** `input[aria-invalid]`（仍是 `"false"`）—— 见分析文档 §4.3。
 */
export type DatePickerStatus = 'error' | 'warning';

/** 视觉变体。默认 `'outlined'`；`bordered` 是它的 deprecated 别名。 */
export type DatePickerVariant = 'outlined' | 'borderless' | 'filled' | 'underlined';

/** 浮层落点（与 antd 的 4 值一致）。 */
export type DatePickerPlacement = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';

/** `picker` 取值 —— 复用 `@apollo-design/picker` 的同名类型（同一件事，不重定义）。 */
export type DatePickerMode = PickerMode;

/** 面板模式（含 `decade` 中间层）。 */
export type DatePickerPanelMode = PanelMode;

/** 方向（影响 4 个导航图标与 `start` / `end` 的镜像）。 */
export type DatePickerDirection = 'ltr' | 'rtl';

/** 日期库适配层（透传口，本仓恒为 dayjs）。 */
export type DatePickerGenerateConfig = GenerateConfig<DatePickerDate>;

// ---------------------------------------------------------------------------
// 值形态
// ---------------------------------------------------------------------------

/** 单值：`multiple` 时是数组。 */
export type SingleValue = DatePickerDate | DatePickerDate[] | null;

/**
 * 范围值。
 *
 * ⚠️ `null` 与 `undefined` **语义不同**：`null` = 用户清空了该端，
 * `undefined` = 该端尚未选择。上游用两个别名区分。
 */
export type RangeValue = [
  start: DatePickerDate | null | undefined,
  end: DatePickerDate | null | undefined,
];

/** `onChange` 的载荷 —— 两端都不允许 `undefined`（上游 `NoUndefinedRangeValueType`）。 */
export type NoUndefinedRangeValue = [start: DatePickerDate | null, end: DatePickerDate | null];

// ---------------------------------------------------------------------------
// 判定与渲染（函数面）
// ---------------------------------------------------------------------------

/**
 * 禁用判定。
 *
 * `info.type` 是**当前面板粒度**；`info.from` 只在区间选择的「结束」判定里出现
 * （上游注释：Tell the first date user selected on this range selection）。
 */
export type DisabledDate = (
  date: DatePickerDate,
  info: { type: DatePickerPanelMode; from?: DatePickerDate },
) => boolean;

/** 时间列的禁用档位（`disabledTime` 的返回值）。 */
export interface DisabledTimes {
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
  disabledMilliseconds?: (hour: number, minute: number, second: number) => number[];
}

/**
 * 上下界。
 *
 * ⚠️ 上游是**函数形态**（`(info) => DateType | null | undefined`），不是静态日期 ——
 * 因为「结束日期最早能选哪天」取决于「开始日期选了什么」。
 */
export type LimitDate = DatePickerDate | ((info: { from?: DatePickerDate }) => DatePickerDate);

/** `cellRender` 的 info 参数（面板格子的上下文）。 */
export interface CellRenderInfo {
  /** 区间选择时告知是哪一端。 */
  range?: 'start' | 'end';
  prefixCls: string;
  /** 未自定义时本仓会渲染的原始节点（上游是 `React.ReactElement`，这里化到 `VNodeChild`）。 */
  originNode: VNodeChild;
  today: DatePickerDate;
  type: DatePickerPanelMode;
  locale?: PickerLocale;
  /** 时间面板列的下标（`type: 'time'` 时才有）。 */
  subType?: 'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';
}

/**
 * 面板格子的自定义渲染。
 *
 * `current` 是上游的 `CurrentType` **联合**（`DateType | number | string`）——
 * 时间列里传数字、上下午列里传 `'am' | 'pm'`。⚠️ 不要收窄成 `DatePickerDate`。
 */
export type CellRender = (
  current: DatePickerDate | number | string,
  info: CellRenderInfo,
) => VNodeChild;

/** 预设项（`presets`）。 */
export interface ValueDate {
  label: VNodeChild;
  /** 允许是函数（懒求值，上游 `DateType | (() => DateType)`）。 */
  value: DatePickerDate | (() => DatePickerDate);
}

/** 范围预设项（值为 `[start, end]`）。 */
export interface RangeValueDate {
  label: VNodeChild;
  value: NoUndefinedRangeValue | (() => NoUndefinedRangeValue);
}

/** `tagRender`（仅 `multiple`）的入参。 */
export interface CustomTagProps {
  label: VNodeChild;
  value: DatePickerDate;
  disabled: boolean;
  onClose: (event?: MouseEvent) => void;
  closable: boolean;
}

/** 浮层开合的第二个参数（上游 `OpenConfig`）。 */
export interface OpenConfig {
  /** 范围选择时指明哪一端（0 = start，1 = end）。 */
  index?: number;
  /** 同一帧内先开后关时保留（范围选择切段用）。 */
  inherit?: boolean;
  /** 跳过「延迟一帧关闭」，立刻关。 */
  force?: boolean;
}

// ---------------------------------------------------------------------------
// 语义槽（antd `DatePickerSemanticType`：**4 个平铺 + 7 个嵌套**）
// ---------------------------------------------------------------------------

/** 浮层内部的 7 个子槽（上游 `PanelSemanticName`）。 */
export interface PickerPopupSemanticClassNames {
  root?: string;
  header?: string;
  body?: string;
  content?: string;
  item?: string;
  footer?: string;
  container?: string;
}

export interface PickerPopupSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  content?: CSSProperties;
  item?: CSSProperties;
  footer?: CSSProperties;
  container?: CSSProperties;
}

/**
 * 语义 classNames。
 *
 * ⚠️ `popup` 允许两种形态：**string**（旧写法，等价于 `popup.root`）或**对象**（新写法）。
 * `popupClassName` / `dropdownClassName` 是它的 deprecated 别名。
 */
export interface DatePickerSemanticClassNames {
  root?: string;
  prefix?: string;
  input?: string;
  suffix?: string;
  popup?: string | PickerPopupSemanticClassNames;
}

export interface DatePickerSemanticStyles {
  root?: CSSProperties;
  prefix?: CSSProperties;
  input?: CSSProperties;
  suffix?: CSSProperties;
  /** ⚠️ 只有对象形态（`popupStyle` 是它的 deprecated 别名）。 */
  popup?: PickerPopupSemanticStyles;
}

/** 语义化输入：对象或函数（上游 `GenerateSemantic`）。 */
export type DatePickerSemanticValue<T, Props> = T | ((info: { props: Props }) => T);

// ---------------------------------------------------------------------------
// 时间配置（`showTime` 的三形态）
// ---------------------------------------------------------------------------

/**
 * 时间面板配置（单值）。
 *
 * ⚠️ 与 `@apollo-design/picker` 的 `TimePanelConfig` **同名不同义**（那个是已归一的
 * 面板配置，这个是对外 prop）：对外面 `format` 是单个 `string`、`defaultValue`
 * 是**日期**而不是「时间列的默认值」。两者的换算在 `picker` 包的 `getTimeProps` 里
 * （`defaultValue` 同名不同义的坑见 PITFALLS 185 族）。
 */
export interface SharedTimeProps {
  format?: string;
  showNow?: boolean;
  showHour?: boolean;
  showMinute?: boolean;
  showSecond?: boolean;
  showMillisecond?: boolean;
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  millisecondStep?: number;
  hideDisabledOptions?: boolean;
  /** @deprecated 用 `defaultOpenValue`。 */
  defaultValue?: DatePickerDate;
  /** 空值时的模板（决定「先点时间」时用的是哪一天）。 */
  defaultOpenValue?: DatePickerDate;
  /** @deprecated 用 `disabledTime`。 */
  disabledHours?: () => number[];
  /** @deprecated 用 `disabledTime`。 */
  disabledMinutes?: (hour: number) => number[];
  /** @deprecated 用 `disabledTime`。 */
  disabledSeconds?: (hour: number, minute: number) => number[];
  disabledTime?: (date: DatePickerDate) => DisabledTimes;
  changeOnScroll?: boolean;
}

/** 范围的时间配置（`disabledTime` 多两个参数；`defaultOpenValue` 是数组）。 */
export interface RangeTimeProps
  extends Omit<SharedTimeProps, 'defaultValue' | 'defaultOpenValue' | 'disabledTime'> {
  /** @deprecated 用 `defaultOpenValue`。 */
  defaultValue?: DatePickerDate[];
  defaultOpenValue?: DatePickerDate[];
  disabledTime?: (
    date: DatePickerDate,
    range: 'start' | 'end',
    info: { from?: DatePickerDate },
  ) => DisabledTimes;
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

/**
 * 自定义格式化函数（= picker 的 `CustomFormat` 在 `DatePickerDate` 上的**特化**）。
 *
 * ⚠️ **2026-09-30 起改为复用 picker 的定义**（此前 ui 侧自己写了一遍，两处同义
 * ⇒ 有漂移风险）。`@apollo-design/picker` 的 `PickerFormat` 也已在同一天加回泛型与
 * 函数形态（PITFALLS 214 的欠账还清）—— 所以这里能直接特化，不再需要「类型说支持、
 * 实现不做」的妥协。
 */
export type CustomFormat = PickerCustomFormat<DatePickerDate>;

/** `string | CustomFormat`（上游 `FormatType<DateType>` 的特化）。 */
export type FormatType = PickerFormatType<DatePickerDate>;

/** 掩码模式：`format` 写成对象并给 `type: 'mask'`。与 `PickerFormat` 的第三支同构。 */
export interface MaskFormatConfig {
  format: string;
  type?: 'mask';
}

/**
 * `format` 的完整形态 —— **直接复用** picker 的 `PickerFormat<DatePickerDate>`。
 *
 * ⇒ 「字符串 / 字符串数组 / `{ format, type: 'mask' }` / **函数**」四种形态由
 * picker 一处定义，ui 侧不再复刻。
 */
export type DatePickerFormat = PickerFormat<DatePickerDate>;

// ---------------------------------------------------------------------------
// 共用 props（单值 / 范围**完全一致**的那一批）
// ---------------------------------------------------------------------------

/**
 * 两壳共用的 props。
 *
 * 这里的每一条在单值与范围下**同型同义**；凡是形状有差异的（`value` / `id` /
 * `placeholder` / `disabled` / `mode` / `presets` / `showTime` / 各回调 / `expose`）
 * 一律下沉到各自的 interface。
 * 分组依据见分析文档 §3（上游的解构列表）。
 */
export interface PickerCommonProps {
  // ============================================================ 开合
  /** 浮层是否打开。走 `v-model:open`。 */
  open?: boolean;
  /** 非受控的初始开合。 */
  defaultOpen?: boolean;

  // ============================================================ 面板
  /** 选择粒度。 */
  picker?: DatePickerMode;
  /** 只在 `picker === 'date'` 时有意义：显示周号列。 */
  showWeek?: boolean;
  /** 是否显示「此刻」按钮。 */
  showNow?: boolean;
  /** @deprecated 用 `showNow`。 */
  showToday?: boolean;
  /** 自定义面板内容（包裹原始面板）。 */
  panelRender?: (originPanel: VNodeChild) => VNodeChild;
  /** 面板底部的额外内容。 */
  renderExtraFooter?: (mode: DatePickerPanelMode) => VNodeChild;
  /** 单元格自定义渲染。 */
  cellRender?: CellRender;
  /** @deprecated 用 `cellRender`。 */
  dateRender?: (currentDate: DatePickerDate, today: DatePickerDate) => VNodeChild;
  /** @deprecated 用 `cellRender`。 */
  monthCellRender?: (currentDate: DatePickerDate, locale: PickerLocale) => VNodeChild;

  // ============================================================ 格式化
  /** 输入框的解析 / 格式化。 */
  format?: DatePickerFormat;
  /**
   * 输入框只读（不可键入，但仍可点）。
   *
   * ⚠️ 与掩码、键入解析同属 rc `PickerInput` 的行为面（分析文档 §11.1）。
   */
  inputReadOnly?: boolean;
  /**
   * 键入非法日期时，失焦后**保留**输入框内容（不还原）。
   * 上游注释：only used for strong a11y requirement which do not want modify after blur。
   */
  preserveInvalidOnBlur?: boolean;
  /**
   * 面板 hover 时是否把预览值写进输入框。`false` 不预览；`'hover'` 预览（默认）。
   */
  previewValue?: false | 'hover';
  /**
   * 需要点「确定」才提交。
   *
   * 上游默认：只有 `time` / `datetime` 才显示确定按钮；`true` = 都要，
   * `false` = 关闭面板即提交。
   */
  needConfirm?: boolean;
  /** @deprecated 已移除、不再生效（用 `needConfirm`）。 */
  changeOnBlur?: boolean;
  /**
   * 提交时是否对范围值排序。
   * 上游注释：Default will always order of selection after submit。
   */
  order?: boolean;

  // ============================================================ 约束
  /** 禁用判定。 */
  disabledDate?: DisabledDate;
  /** 可选下界（同时限制**面板导航**）。 */
  minDate?: LimitDate;
  /** 可选上界。 */
  maxDate?: LimitDate;

  // ============================================================ 装饰
  /** 前缀内容。 */
  prefix?: VNodeChild;
  /** 后缀图标。`null` / `false` 不渲染；`undefined` / `true` 用默认图标。 */
  suffixIcon?: VNodeChild;
  /**
   * 清除按钮。
   *
   * ⚠️ 对象形态里的 `clearIcon` 优先于独立的 `clearIcon` prop
   * （`_internal/use-allow-clear.ts` 已实现该回退链）。
   */
  allowClear?: boolean | { clearIcon?: VNodeChild };
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: VNodeChild;

  // ============================================================ locale
  /**
   * 语言包（与 `ConfigProvider` 的 `locale.DatePicker` 深合并）。
   *
   * ⚠️ 类型是 `@apollo-design/locale` 的 `PickerLocale`（`{ lang, timePickerLocale }`），
   * **不是** `@apollo-design/picker` 的同名类型（面板要的是 `locale.lang`）——
   * 见 `hooks/picker-types.ts` 的说明。
   */
  locale?: PickerLocale;

  // ============================================================ 状态
  size?: DatePickerSize;
  status?: DatePickerStatus;
  /** 视觉变体（默认 `'outlined'`）。 */
  variant?: DatePickerVariant;
  /** @deprecated 用 `variant`。 */
  bordered?: boolean;

  // ============================================================ 语义槽 / 根节点
  classNames?: DatePickerSemanticValue<DatePickerSemanticClassNames, PickerCommonProps>;
  styles?: DatePickerSemanticValue<DatePickerSemanticStyles, PickerCommonProps>;
  /** 根节点附加类名。 */
  className?: string;
  /** 根节点附加类名（与 `className` 并列，上游有两个入口）。 */
  rootClassName?: string;
  style?: CSSProperties;

  // ============================================================ 定位 / 透传
  /** 浮层动效名（默认 `${rootPrefixCls}-slide-up`，⚠️ 前缀是 **rootPrefixCls**）。 */
  transitionName?: string;
  /** 浮层落点。 */
  placement?: DatePickerPlacement;
  /** 自定义浮层容器。 */
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  /** 浮层的对齐微调（透传触发器）。 */
  popupAlign?: Record<string, unknown>;
  /** 内置落点表（透传触发器）。 */
  builtinPlacements?: Record<string, unknown>;
  /** 自定义前缀类名（默认 = `getPrefixCls('picker')` = `apollo-picker`）。 */
  prefixCls?: string;
  /** 文字方向。 */
  direction?: DatePickerDirection;
  /** @deprecated 用 `classNames.popup.root`。 */
  dropdownClassName?: string;
  /** @deprecated 用 `classNames.popup.root`。 */
  popupClassName?: string;
  /** @deprecated 用 `styles.popup.root`。 */
  popupStyle?: CSSProperties;
  /** 面板内部的组件替换（`button` / `input` / 7 个面板）。 */
  components?: Record<string, unknown>;
  /** @deprecated 用 `components.input`。 */
  inputRender?: (props: Record<string, unknown>) => VNodeChild;
  /** 4 个面板导航图标（上游覆盖成空 span，图形由样式画）。 */
  prevIcon?: VNodeChild;
  nextIcon?: VNodeChild;
  superPrevIcon?: VNodeChild;
  superNextIcon?: VNodeChild;
  /** 面板浏览值的非受控初值（**优先级高于 `value`**，上游注释逐字）。 */
  defaultPickerValue?: DatePickerDate | null;

  // ============================================================ 输入框原生面
  //
  // 🚨 这 5 个键在 rc 的 `useInputProps` 里被**显式解构**（不是走 `...restProps`）：
  //
  //   const { required, 'aria-required': ariaRequired, onSubmit, name, autoComplete,
  //           id, onInvalid, ... } = props;
  //
  // ⇒ 在 Vue 里**必须声明**，否则会落进 `attrs` 而 rc 那套取值拿不到（静默失效）。
  // G2 初稿只声明了 `id`，漏了下面这 5 个（2026-09-30 补齐）。
  // ----------------------------------------------------------------
  /** 原生 `required`（会透传成 `input[required]` 与 `aria-required`）。 */
  required?: boolean;
  /** 原生 `name`。 */
  name?: string;
  /** 原生 `autoComplete`。⚠️ 实测默认渲染成 `autocomplete="off"`（大写 O 的 React 写法在 DOM 里被规范化）。 */
  autoComplete?: string;
  /** 表单提交（原生 `submit` 事件）。 */
  onSubmit?: (event: Event) => void;
  /** 键入非法值时触发（`input[aria-invalid]` 的同步通道）。 */
  onInvalid?: (invalid: boolean) => void;

  // ============================================================ legacy / 回调
  /**
   * @deprecated 用 `onCalendarChange`。
   *
   * ⚠️ 上游只在 **`picker === 'time' && !multiple`** 时把它接到 `onCalendarChange` 上
   * （`generateSinglePicker.js`：`const hasLegacyOnSelect = onSelect && picker === 'time' && !multiple`）。
   * 本仓同样只在那一支生效 —— 别无条件转发。
   */
  onSelect?: (date: DatePickerDate | DatePickerDate[]) => void;
  /**
   * @deprecated 用 `onKeyDown`（原生）。上游的 `LegacyOnKeyDown` 第二参是 `preventDefault`。
   * 本仓在 emits 里给 `keydown`（载荷 `(event, preventDefault)`）。
   */
  onKeyDown?: (event: KeyboardEvent, preventDefault: () => void) => void;
}

// ---------------------------------------------------------------------------
// 单值 DatePicker
// ---------------------------------------------------------------------------

/** 单值 DatePicker 的 props。 */
export interface DatePickerProps extends PickerCommonProps {
  // ---------------------------------------------------------------- 值
  /** 当前值。`multiple` 时为数组。走 `v-model:value`。 */
  value?: SingleValue;
  /** 非受控初值。⚠️ 必须是 dayjs 实例（传 ISO 字符串会在 rc 的 `isValidate` 抛错）。 */
  defaultValue?: DatePickerDate | DatePickerDate[];
  /** 是否允许选择多个日期（⚠️ 不支持 `time` / `datetime`）。 */
  multiple?: boolean;
  /** 仅 `multiple` 生效：最多显示几个标签（`'responsive'` = 按宽度自适应）。 */
  maxTagCount?: number | 'responsive';
  /** 仅 `multiple` 生效：自定义标签渲染。 */
  tagRender?: (props: CustomTagProps) => VNodeChild;
  /**
   * 仅 `multiple` 生效：标签的删除图标（rc 的 `BasePickerProps.removeIcon`）。
   *
   * ⚠️ antd 经 **Select 的 `useIcons`** 算它：`removeIcon` → context 的 → 默认
   * `CloseOutlined`。本仓复用 `_internal/use-allow-clear` 的同族回退链。
   */
  removeIcon?: VNodeChild;

  // ---------------------------------------------------------------- 标识
  /** 输入框的 `id`（与 `htmlFor` 配对）。 */
  id?: string;

  // ---------------------------------------------------------------- 面板
  /** 面板浏览值（受控）。走 `v-model:pickerValue`。 */
  pickerValue?: DatePickerDate | null;
  /** 面板粒度（受控）。 */
  mode?: DatePickerPanelMode;
  /** 时间选择配置（单值版）。 */
  showTime?: boolean | SharedTimeProps;
  /** 时间面板的空值模板。 */
  defaultOpenValue?: DatePickerDate;
  /** 预设项。 */
  presets?: ValueDate[];

  // ---------------------------------------------------------------- 装饰
  /** 输入框占位符（范围版是元组，见 `RangePickerProps`）。 */
  placeholder?: string;
  /**
   * 是否禁用。
   *
   * ⚠️ **单值版是 `boolean`，范围版是 `boolean | [boolean, boolean]`**
   * （`RangePickerProps` 自己覆盖了它）⇒ 不能在 `PickerCommonProps` 里声明。
   */
  disabled?: boolean;

  // ---------------------------------------------------------------- 回调
  /** 面板浏览值变化（每次开浮层 / 点面板都会发）。 */
  onPickerValueChange?: (
    date: DatePickerDate,
    info: { source: 'reset' | 'panel'; mode: DatePickerPanelMode },
  ) => void;
  /** 面板粒度变化。 */
  onPanelChange?: (value: DatePickerDate, mode: DatePickerPanelMode) => void;
  /** 取消 / 选中 / 键入时的中间回调。 */
  onCalendarChange?: (
    date: DatePickerDate | DatePickerDate[],
    dateString: string | string[],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ) => void;
}

// ---------------------------------------------------------------------------
// 范围 DatePicker
// ---------------------------------------------------------------------------

/** 范围 DatePicker 的 props（与单值的差异集中在「数组化」的那几项）。 */
export interface RangePickerProps
  extends Omit<
    PickerCommonProps,
    'showTime' | 'mode' | 'onPanelChange' | 'defaultOpenValue' | 'defaultPickerValue' | 'cellRender'
  > {
  // ---------------------------------------------------------------- 值
  /** 当前值。 */
  value?: RangeValue | null;
  /** 非受控初值。 */
  defaultValue?: RangeValue;

  // ---------------------------------------------------------------- 标识
  /** 输入框的 `id`（对象形态用于给两端不同的 id，上游 `SelectorIdType`）。 */
  id?: string | { start?: string; end?: string };

  // ---------------------------------------------------------------- 面板
  /** 两端各自的浏览值（也接受单个值 = 两端同值）。 */
  pickerValue?: [DatePickerDate, DatePickerDate] | DatePickerDate | null;
  /** 两端的非受控初值。 */
  defaultPickerValue?: [DatePickerDate, DatePickerDate] | DatePickerDate | null;
  /** 两端各自的面板粒度。 */
  mode?: [startMode: DatePickerPanelMode, endMode: DatePickerPanelMode];
  /** 时间配置（范围版：`disabledTime` 多两个参数、`defaultOpenValue` 是数组）。 */
  showTime?: boolean | RangeTimeProps;
  /** 两端的空值模板。 */
  defaultOpenValue?: DatePickerDate[];
  /** 范围预设项。 */
  presets?: RangeValueDate[];
  /** @deprecated 用 `presets`。 */
  ranges?: Record<string, NoUndefinedRangeValue | (() => NoUndefinedRangeValue)>;
  /** 单元格渲染（范围版的 info 一定带 `range`）。 */
  cellRender?: CellRender;

  // ---------------------------------------------------------------- 装饰
  /** 两端的占位符。 */
  placeholder?: [string, string];
  /** 两端之间的分隔符（默认是 `SwapRightOutlined`）。⚠️ 自定义时会去掉 `aria-hidden`。 */
  separator?: VNodeChild;

  // ---------------------------------------------------------------- 状态
  /** 两端的禁用（也接受单个布尔 = 两端同值）。 */
  disabled?: boolean | [boolean, boolean];
  /** 是否允许某一端为空。 */
  allowEmpty?: boolean | [boolean, boolean];

  // ---------------------------------------------------------------- 回调
  /** 两端各自的浏览值变化。 */
  onPickerValueChange?: (
    date: [DatePickerDate, DatePickerDate],
    info: {
      source: 'reset' | 'panel';
      mode: [DatePickerPanelMode, DatePickerPanelMode];
    },
  ) => void;
  /** 面板粒度变化。 */
  onPanelChange?: (
    values: NoUndefinedRangeValue,
    modes: [startMode: DatePickerPanelMode, endMode: DatePickerPanelMode],
  ) => void;
  /** 中间回调（范围版两端都不允许 `undefined`）。 */
  onCalendarChange?: (
    dates: NoUndefinedRangeValue,
    dateStrings: [string, string],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ) => void;
}

// ---------------------------------------------------------------------------
// Emits
// ---------------------------------------------------------------------------

/**
 * 单值的事件面。
 *
 * ⚠️ **C11：`v-model` 与语义事件必须同时发出。** 全仓还有 `update:*` 的欠账
 * （PITFALLS 162），但**新组件一律按 C11 做**（本组件即如此）。
 */
export interface DatePickerEmits {
  /** 值变化。`dateString` 是按 `format` 格式化后的文本。 */
  change: (date: SingleValue, dateString: string | string[] | null) => void;
  /** `v-model:value`。 */
  'update:value': (date: SingleValue) => void;
  /** 选中过程中每次变化都发（未提交也发）。 */
  calendarChange: (
    date: DatePickerDate | DatePickerDate[],
    dateString: string | string[],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ) => void;
  /** 点「确定」。 */
  ok: (date: DatePickerDate | DatePickerDate[]) => void;
  /** 浮层开合。 */
  openChange: (open: boolean, config?: OpenConfig) => void;
  /** `v-model:open`。 */
  'update:open': (open: boolean) => void;
  /** 面板浏览值变化。 */
  pickerValueChange: (
    date: DatePickerDate,
    info: { source: 'reset' | 'panel'; mode: DatePickerPanelMode },
  ) => void;
  /** `v-model:pickerValue`。 */
  'update:pickerValue': (date: DatePickerDate) => void;
  /** 面板粒度变化。 */
  panelChange: (value: DatePickerDate, mode: DatePickerPanelMode) => void;
  /** 点清除按钮。 */
  clear: () => void;
  /** 焦点进入（`info.range` 在范围选择时指明哪一端）。 */
  focus: (event: FocusEvent, info: { range?: 'start' | 'end' }) => void;
  /** 焦点离开。 */
  blur: (event: FocusEvent, info: { range?: 'start' | 'end' }) => void;
  /** 键入值非法。 */
  invalid: (invalid: boolean) => void;
  /** 表单提交。 */
  submit: (event: Event) => void;
  /**
   * 按键（deprecated 的 `onKeyDown` 通道）。
   *
   * ⚠️ 第二参 `preventDefault` 是上游 `LegacyOnKeyDown` 的签名，**必须给** ——
   * 调用方常写成 `(e, preventDefault) => preventDefault()`，缺了它会在运行时炸。
   */
  keydown: (event: KeyboardEvent, preventDefault: () => void) => void;
}

/** 范围的事件面。 */
export interface RangePickerEmits {
  change: (dates: NoUndefinedRangeValue | null, dateStrings: [string, string]) => void;
  'update:value': (dates: RangeValue | null) => void;
  calendarChange: (
    dates: NoUndefinedRangeValue,
    dateStrings: [string, string],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ) => void;
  ok: (dates: NoUndefinedRangeValue) => void;
  openChange: (open: boolean, config?: OpenConfig) => void;
  'update:open': (open: boolean) => void;
  pickerValueChange: (
    date: [DatePickerDate, DatePickerDate],
    info: { source: 'reset' | 'panel'; mode: [DatePickerPanelMode, DatePickerPanelMode] },
  ) => void;
  'update:pickerValue': (date: [DatePickerDate, DatePickerDate]) => void;
  panelChange: (
    values: NoUndefinedRangeValue,
    modes: [startMode: DatePickerPanelMode, endMode: DatePickerPanelMode],
  ) => void;
  clear: () => void;
  focus: (event: FocusEvent, info: { range?: 'start' | 'end' }) => void;
  blur: (event: FocusEvent, info: { range?: 'start' | 'end' }) => void;
  invalid: (invalid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

/**
 * 插槽面。
 *
 * 规则：上游的 **render prop 一律「函数 prop + 同名 scoped slot」双通道**（C8）——
 * 两条路走同一个内部实现，避免出现「只有一种写法能生效」。
 */
export interface DatePickerSlots {
  /** `panelRender`（包裹原始面板）。 */
  panelRender?: (props: { originPanel: VNodeChild }) => VNodeChild;
  /** `renderExtraFooter`。 */
  extraFooter?: (props: { mode: DatePickerPanelMode }) => VNodeChild;
  /** `cellRender`。 */
  cellRender?: (props: {
    current: DatePickerDate | number | string;
    info: CellRenderInfo;
  }) => VNodeChild;
  /** `tagRender`（仅 `multiple`）。 */
  tagRender?: (props: CustomTagProps) => VNodeChild;
  /** 前缀（`prefix` 的插槽形态）。 */
  prefix?: () => VNodeChild;
  /** 后缀图标（`suffixIcon` 的插槽形态）。 */
  suffixIcon?: () => VNodeChild;
  /** 清除图标（`allowClear.clearIcon` 的插槽形态）。 */
  clearIcon?: () => VNodeChild;
  /** 范围分隔符（`separator` 的插槽形态）。 */
  separator?: () => VNodeChild;
  /** 预设项的渲染（覆盖默认的按钮渲染）。 */
  presetRender?: (props: { preset: ValueDate | RangeValueDate; index: number }) => VNodeChild;
}

// ---------------------------------------------------------------------------
// Expose
// ---------------------------------------------------------------------------

/** 单值的命令面（与上游 `PickerRef` 同形）。 */
export interface DatePickerExpose {
  /** 根 DOM。 */
  nativeElement: HTMLDivElement;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
}

/**
 * 范围的命令面（上游 `RangePickerRef`）。
 *
 * ⚠️ `focus` 的签名与单值**不同**：可以指定聚焦哪一端
 * （`focus(1)` 或 `focus({ index: 1 })`）；另有 `startInput` / `endInput`
 * 两个原生 input（上游 `RangeSelectorRef` 独有）。
 */
export interface RangePickerExpose {
  nativeElement: HTMLDivElement;
  focus: (index?: number | (FocusOptions & { index?: number })) => void;
  blur: () => void;
  startInput: HTMLInputElement;
  endInput: HTMLInputElement;
}

// ---------------------------------------------------------------------------
// 只出面板的出口（上游 `_Internal*PanelDoNotUseOrYouWillBeFired`）
// ---------------------------------------------------------------------------

/** `PurePanel` 的 props（只出面板、不出输入框）。 */
export interface PurePanelProps {
  /** 选择粒度。 */
  picker?: DatePickerMode;
  /** 面板粒度。 */
  mode?: DatePickerPanelMode;
  prefixCls?: string;
  value?: DatePickerDate | null;
  showTime?: boolean | SharedTimeProps;
  cellRender?: CellRender;
  disabledDate?: DisabledDate;
  classNames?: DatePickerSemanticClassNames;
  styles?: DatePickerSemanticStyles;
}

/** 范围版 `PurePanel`。 */
export interface PureRangePanelProps extends Omit<PurePanelProps, 'value'> {
  value?: RangeValue | null;
}
