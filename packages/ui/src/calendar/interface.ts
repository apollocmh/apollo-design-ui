/**
 * Calendar 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/calendar/generateCalendar.d.ts` + `es/calendar/Header.d.ts`
 * 与 rc 内核 `@rc-component/picker` 的 `es/interface.d.ts`（`CellRenderInfo`）
 * —— **重新定义**，不搬运（H2）。判据逐条见 `docs/analysis/calendar.md`。
 * 禁止 any / as any / @ts-expect-error（H10）。
 *
 * ── 这个组件与 date-picker 的三处**根本差别** ──────────────────────────────────
 *
 * 1. **它不是薄壳**。`DatePicker` 的输入框内核是 rc 的 `PickerInput`（37 个 `.js`），
 *    本仓只做了面板；`Calendar` 的**全部**逻辑（`generateCalendar.tsx` 445 行）
 *    都在 antd 这一层，没有任何 rc 内核可复用 ⇒ 本组件要**自己**实现状态机。
 * 2. **它没有浮层**。面板是**内联**的（`<CalendarHeader/> + <PickerPanel hideHeader/>`）
 *    ⇒ 与 date-picker 相反，**不需要** `PurePanel` 绕 Portal 的手法，SSR 能拿到全量 DOM。
 * 3. **类名前缀是 `apollo-picker-calendar`**（上游 `getPrefixCls('picker')`），
 *    而 **CSS 变量名是 `--apollo-calendar-*`**（`genStyleHooks('Calendar')` 的命名空间）
 *    —— **类名与变量名的命名空间不同**，这是本组件最容易写错的一处。
 *
 * ── Vue 化映射（COMPATIBILITY.md 的规则）───────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `value` + `onChange(date)` | `v-model:value` + `@change`（**双发**） | C11 |
 * | `mode` + `onPanelChange(date, mode)` | `v-model:mode` + `@panelChange`（**双发**） | C11 |
 * | `onSelect(date, info)` | `@select`（载荷同形，无 v-model 通道 —— 它不是状态） | C5 |
 * | `headerRender` / `cellRender` / `fullCellRender` | **函数 prop + 同名 scoped slot 双通道** | C8 |
 * | `ref` → `CalendarRef` | `expose({ nativeElement })` | PLATFORM |
 *
 * ⚠️ **`update:mode` 的发出时机**：只在**模式真的变了**的时候（`triggerModeChange`）。
 * `panelChange` 会**多**发一种情况 —— 选中的日期跨月/跨年时，上游会**补发**
 * `panelChange(当前值, 当前模式)`（模式没变）⇒ 那条路径**不**发 `update:mode`。
 * 与 `value` 同判：`update:xxx` 只在值变化时发。
 *
 * ── 为什么**不**声明 HTML 透传属性 ──────────────────────────────────────────────
 *
 * 根是一个 `<div>`，原生属性由 **`attrs` 自动兜住**；声明了反而会把它们从 `attrs`
 * 里摘出来。⚠️ 代价是**未声明的自定义 prop 会静默进 attrs**（PITFALLS 跨包判据 1）
 * ⇒ 上游 `CalendarProps` 的每一个键都必须在下面声明。
 */

import type { PickerLocale } from '@apollo-design/locale';
import type { PanelCellRenderInfo } from '@apollo-design/picker';
import type { Dayjs } from 'dayjs';
import type { CSSProperties, VNodeChild } from 'vue';

// ---------------------------------------------------------------------------
// 基础联合（枚举值必须与 antd 一致 —— COMPONENT-RULES.md §4）
// ---------------------------------------------------------------------------

/** 本组件消费的日期类型。与 `DatePickerDate` 同源（都是 dayjs 实例）。 */
export type CalendarDate = Dayjs;

/**
 * 日历模式。
 *
 * - `'month'`（默认）：面板是一张**月历**（`panelMode = 'date'`）
 * - `'year'`：面板退化成**12 个月的网格**（`panelMode = 'month'`）
 *
 * ⚠️ 与 `PanelMode` **不是**一回事：`mode` 只有两档，面板粒度由
 * `panelMode = mode === 'year' ? 'month' : 'date'` 派生（`docs/analysis/calendar.md` §2.1）。
 */
export type CalendarMode = 'year' | 'month';

/**
 * `@select` 的第二个参数（上游 `SelectInfo`）。
 *
 * ⚠️ 四个取值对应四条不同的调用链，且**面板那一支传的是 `panelMode`**
 * （`'date'` | `'month'`），**不是**字面量 `'date'` —— 见 §2.2 的顺序判据。
 */
export interface SelectInfo {
  /** `'year'` 年下拉 / `'month'` 月下拉 / `'date'` 面板 / `'customize'` `headerRender` 里自调。 */
  source: 'year' | 'month' | 'date' | 'customize';
}

// ---------------------------------------------------------------------------
// 渲染 prop（上游三个，都是**函数 prop + 同名 scoped slot** 双通道 —— C8）
// ---------------------------------------------------------------------------

/** `headerRender` 的入参（上游 `HeaderRender` 的 config）。 */
export interface CalendarHeaderRenderConfig {
  /** 当前值。 */
  value: CalendarDate;
  /** 当前模式。 */
  type: CalendarMode;
  /** 选一个日期（走 `triggerChange` + `onSelect(source: 'customize')`）。 */
  onChange: (date: CalendarDate) => void;
  /** 切模式（走 `triggerModeChange`）。 */
  onTypeChange: (type: CalendarMode) => void;
}

export type CalendarHeaderRender = (config: CalendarHeaderRenderConfig) => VNodeChild;

/**
 * `cellRender` / `fullCellRender` 的第二个参数。
 *
 * 上游类型是 `@rc-component/picker` 的 `CellRenderInfo<DateType>`，本仓已有同形的
 * `PanelCellRenderInfo` ⇒ **直接别名，不新定义**（重声明会与 picker 包的那份漂移）。
 *
 * ⚠️ 类型上 `info.type` 是 `PanelMode`（7 档），但 Calendar 只会传
 * `'date'`（月历）或 `'month'`（年模式）；`info.subType` 恒 `undefined`
 * （那是时间列才有的字段）。
 */
export type CalendarCellRenderInfo = PanelCellRenderInfo;

/** 自定义**内容**（`<div class="{calendarCls}-date-content">` 里的东西）。 */
export type CalendarCellRender = (date: CalendarDate, info: CalendarCellRenderInfo) => VNodeChild;

/** 自定义**整个格子**（连 `-date-value` 一起换掉）。 */
export type CalendarFullCellRender = (
  date: CalendarDate,
  info: CalendarCellRenderInfo,
) => VNodeChild;

// ---------------------------------------------------------------------------
// 语义槽（antd `CalendarSemanticType`：**6 个平铺**，没有嵌套）
// ---------------------------------------------------------------------------

/**
 * 语义 classNames。
 *
 * 🚨 **6 个槽是「两段式归属」的**（`docs/analysis/calendar.md` §2.5）：
 *
 * ```
 * root | header                        ← Calendar 自己用
 * body | content | item | itemContent  ← 转交给面板（PickerPanel）
 * ```
 *
 * ⚠️ `itemContent` **特殊**：它还**单独**被默认的单元格渲染用在
 * `${calendarPrefixCls}-date-content` 上 —— 即同一个槽名会同时落到
 * 「面板的 item 内容」与「日历自绘的 date-content」两处。
 */
export interface CalendarSemanticClassNames {
  root?: string;
  header?: string;
  body?: string;
  content?: string;
  item?: string;
  itemContent?: string;
}

export interface CalendarSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  body?: CSSProperties;
  content?: CSSProperties;
  item?: CSSProperties;
  itemContent?: CSSProperties;
}

/** 语义化输入：对象或函数（上游 `GenerateSemantic` 的 `classNamesAndFn` / `stylesAndFn`）。 */
export type CalendarSemanticValue<T, Props> = T | ((info: { props: Props }) => T);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * `Calendar` 的 props（上游 `CalendarProps<DateType>` 的**全量**）。
 *
 * 分四组：**值 / 模式**、**渲染**、**约束**、**外观与语义槽**。
 */
export interface CalendarProps {
  // ============================================================ 值 / 模式
  /** 受控值。 */
  value?: CalendarDate;
  /**
   * 非受控初值。
   *
   * ⚠️ 两者都不传时上游取 **`getNow()`（运行时求值）** ⇒ 默认值是「今天」，
   * **视觉/契约用例必须显式传 `value`**，否则基线随运行日变化
   * （与 date-picker 的 `defaultPickerValue` 同判）。
   */
  defaultValue?: CalendarDate;
  /** 受控模式（默认 `'month'`）。 */
  mode?: CalendarMode;

  // ============================================================ 渲染
  /** 自定义 header 整块。函数 prop 形态。 */
  headerRender?: CalendarHeaderRender;
  /** 自定义格子**内容**。函数 prop 形态。 */
  cellRender?: CalendarCellRender;
  /** 自定义**整个格子**。函数 prop 形态。 */
  fullCellRender?: CalendarFullCellRender;

  // ============================================================ 约束
  /**
   * 可选范围（闭区间）。
   *
   * ⚠️ 越界判定用 **`isAfter`（不含端点）**，且与 `disabledDate` 是**「或」**：
   * `disabled = 越界 || disabledDate?.(date)` —— 见 §2.3。
   */
  validRange?: [CalendarDate, CalendarDate];
  /** 额外的禁用判定。 */
  disabledDate?: (date: CalendarDate) => boolean;
  /** 显示周号（第几周）。 */
  showWeek?: boolean;
  /** 全屏（默认 **`true`**）。`false` 时是「迷你日历」（`-mini`，控件降为 `small`）。 */
  fullscreen?: boolean;

  // ============================================================ 外观与语义槽
  /** 自定义前缀类名。⚠️ 默认 = `getPrefixCls('picker')` = **`apollo-picker`**（不是 `apollo-calendar`）。 */
  prefixCls?: string;
  /** 语义化类名（6 平铺槽）。支持**函数形态**。 */
  classNames?: CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps>;
  /** 语义化样式（同上）。支持**函数形态**。 */
  styles?: CalendarSemanticValue<CalendarSemanticStyles, CalendarProps>;
  /**
   * 语言包（与 `ConfigProvider` 的 `locale.Calendar` 深合并）。
   *
   * ⚠️ 类型是 `@apollo-design/locale` 的 `PickerLocale`（`{ lang, timePickerLocale }`）——
   * 与上游 `locale?: typeof enUS` 同形（`enUS` 就是 `PickerLocale` 的一份实例）。
   */
  locale?: PickerLocale;

  // ============================================================ 废弃（4 个）
  //
  // ⚠️ 判据是 **`props.x !== undefined`**，不是 React 的 `in props` ——
  //    Vue 的 `props` 恒含所有声明过的键（`in` 会**恒告警**）。
  // ----------------------------------------------------------------
  /** @deprecated 用 `fullCellRender`。 */
  dateFullCellRender?: CalendarFullCellRender;
  /** @deprecated 用 `cellRender`。 */
  dateCellRender?: CalendarCellRender;
  /** @deprecated 用 `fullCellRender`。 */
  monthFullCellRender?: CalendarFullCellRender;
  /** @deprecated 用 `cellRender`。 */
  monthCellRender?: CalendarCellRender;
}

// ---------------------------------------------------------------------------
// Emits
// ---------------------------------------------------------------------------

/**
 * 事件面。
 *
 * ⚠️ **C11：`v-model` 与语义事件必须同时发出**（全仓还有 `update:*` 的欠账，
 * 见 PITFALLS 162；**新组件一律按 C11 做**）。
 *
 * 三条发出路径的判据见 `docs/analysis/calendar.md` §2.2，**顺序即语义**：
 *
 * ```
 * triggerChange(date):
 *   update:value + (跨月/跨年才补发 panelChange) + change
 *   ⚠️ 与当前值**同一天**时，三条**都不发**（上游的 isSameDate 守卫）
 * triggerModeChange(newMode):
 *   update:mode + panelChange(当前值, 新模式)
 * onInternalSelect(date, source):
 *   上面那两条之一 + select(date, { source })
 * ```
 */
export interface CalendarEmits {
  /** 选中的日期变化（语义事件，载荷与上游 `onChange` 同形）。 */
  change: (date: CalendarDate) => void;
  /** `v-model:value`。 */
  'update:value': (date: CalendarDate) => void;
  /**
   * 面板粒度或浏览值变化。
   *
   * ⚠️ 会比 `change` **多**发一种：日期跨月/跨年时上游**补发**
   * `panelChange(当前值, 当前模式)` —— 此时模式没变、也**不**发 `update:mode`。
   */
  panelChange: (date: CalendarDate, mode: CalendarMode) => void;
  /** `v-model:mode`。⚠️ **只在模式真的变了**的时候发。 */
  'update:mode': (mode: CalendarMode) => void;
  /** 选中（每次，含 `headerRender` 里自调的 `onChange`）。 */
  select: (date: CalendarDate, info: SelectInfo) => void;
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

/**
 * 插槽面。
 *
 * 规则：上游的 **render prop 一律「函数 prop + 同名 scoped slot」双通道**（C8）——
 * 两条路走同一个内部实现，避免出现「只有一种写法能生效」。
 *
 * ⚠️ 上游 `CalendarProps` 里**没有** slot 型字段（三个渲染点都是函数 prop）；
 * 这三个插槽是本仓按 C8 补的等价物。
 */
export interface CalendarSlots {
  /** `headerRender` 的插槽形态。`config` 与函数 prop 的入参同形。 */
  headerRender?: (config: CalendarHeaderRenderConfig) => VNodeChild;
  /** `cellRender` 的插槽形态。 */
  cellRender?: (props: { current: CalendarDate; info: CalendarCellRenderInfo }) => VNodeChild;
  /** `fullCellRender` 的插槽形态。 */
  fullCellRender?: (props: { current: CalendarDate; info: CalendarCellRenderInfo }) => VNodeChild;
}

// ---------------------------------------------------------------------------
// Expose
// ---------------------------------------------------------------------------

/**
 * 命令面（上游 `CalendarRef`）。
 *
 * ⚠️ 上游**只有** `nativeElement`，**没有** `focus` / `blur`
 * （`DatePicker` 的 `PickerRef` 才有）⇒ 本仓**不补**，照上游只暴露一个字段。
 */
export interface CalendarExpose {
  /** 根 DOM（`<div class="apollo-picker-calendar …">`）。 */
  nativeElement: HTMLDivElement;
}

// ---------------------------------------------------------------------------
// 复用导出的类型（消费方少写一个 import 路径）
// ---------------------------------------------------------------------------

/** 单元格渲染信息（= picker 包的 `PanelCellRenderInfo`）。 */
export type { PanelCellRenderInfo as CalendarPanelCellRenderInfo };
