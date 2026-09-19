/**
 * `@apollo-design/picker` 的公共类型面。
 *
 * 形状对齐 `@rc-component/picker@1.12.2` 的 `es/generate/index.d.ts` 与
 * `es/interface.d.ts`（行为判据），但**不是**它们的副本：
 * 去掉了 React 相关的 `CellRender` / `React.ReactElement`，
 * 并把 `Locale` 收窄为本包真正会读的键。
 *
 * 契约文档：`docs/foundation/picker-contract.md` §5.1
 */

/** 面板模式。与上游 `PanelMode` 同集。 */
export type PanelMode = 'time' | 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade';

/** 上游 `InternalMode`：面板模式加上「日期 + 时间」的组合态。 */
export type InternalMode = PanelMode | 'datetime';

/** 上游 `PickerMode`：能被 Picker 直接选取的模式（`decade` 只是中间层）。 */
export type PickerMode = Exclude<PanelMode, 'decade'>;

/**
 * 日期库适配层。
 *
 * 本包对日期库的**唯一**依赖面 —— 保留这层抽象的理由见契约 §9 的 P2：
 * 它让 Oracle 可以逐位对拍（§4.2 / §4.3）。
 */
export interface GenerateConfig<DateType> {
  // -------------------------------------------------------------- get
  getWeekDay: (value: DateType) => number;
  getMillisecond: (value: DateType) => number;
  getSecond: (value: DateType) => number;
  getMinute: (value: DateType) => number;
  getHour: (value: DateType) => number;
  getDate: (value: DateType) => number;
  getMonth: (value: DateType) => number;
  getYear: (value: DateType) => number;
  getNow: () => DateType;
  getFixedDate: (fixed: string) => DateType;
  getEndDate: (value: DateType) => DateType;

  // -------------------------------------------------------------- add
  addYear: (value: DateType, diff: number) => DateType;
  addMonth: (value: DateType, diff: number) => DateType;
  addDate: (value: DateType, diff: number) => DateType;

  // -------------------------------------------------------------- set
  setYear: (value: DateType, year: number) => DateType;
  setMonth: (value: DateType, month: number) => DateType;
  setDate: (value: DateType, num: number) => DateType;
  setHour: (value: DateType, hour: number) => DateType;
  setMinute: (value: DateType, minute: number) => DateType;
  setSecond: (value: DateType, second: number) => DateType;
  setMillisecond: (value: DateType, millisecond: number) => DateType;

  // ----------------------------------------------------------- compare
  isAfter: (date1: DateType, date2: DateType) => boolean;
  isValidate: (date: DateType) => boolean;

  locale: {
    getWeekFirstDay: (locale: string) => number;
    getWeekFirstDate: (locale: string, value: DateType) => DateType;
    getWeek: (locale: string, value: DateType) => number;
    format: (locale: string, date: DateType, format: string) => string;
    /** Should only return validate date instance */
    parse: (locale: string, text: string, formats: string[]) => DateType | null;
    getShortWeekDays?: (locale: string) => string[];
    getShortMonths?: (locale: string) => string[];
  };
}

/**
 * 面板 locale 子集。
 *
 * 只声明本包真正会读的键（契约 §3.1 / §3.4）。
 * 其余文案（`today` / `ok` / `clear` …）由 `ui` 层直接读 `@apollo-design/locale`。
 */
export interface PickerLocale {
  locale: string;

  fieldDateFormat?: string;
  fieldDateTimeFormat?: string;
  fieldTimeFormat?: string;
  fieldMonthFormat?: string;
  fieldYearFormat?: string;
  fieldWeekFormat?: string;
  fieldQuarterFormat?: string;

  cellDateFormat?: string;
  cellYearFormat?: string;
  cellQuarterFormat?: string;

  yearFormat?: string;
  monthFormat?: string;
  /** 表头里月份显示在年份之前 */
  monthBeforeYear?: boolean;

  shortWeekDays?: readonly string[];
  shortMonths?: readonly string[];

  /** 周号列的列头文案 */
  week?: string;
}

/** 禁用判定。`info.from` 只在区间选择校验「结束」时出现（契约 §3.6）。 */
export type DisabledDate<DateType> = (
  date: DateType,
  info: { type: PanelMode; from?: DateType },
) => boolean;

/**
 * 一个格子的完整状态。由 `buildPanelCells` 产出，`ui` 层只负责把它渲染成 DOM。
 *
 * class 名的拼接规则见契约 §3.4.3 —— **不在本包内**（R4：引擎无视觉）。
 */
export interface PanelCell<DateType> {
  date: DateType;
  /** 线性下标 `row * colNum + col`（契约 §3.4.1） */
  offset: number;
  row: number;
  col: number;
  text: string;
  title?: string;
  disabled: boolean;
  inView: boolean;
  today: boolean;
  selected: boolean;
  hovered: boolean;
  inRange: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
}
