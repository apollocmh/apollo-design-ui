/**
 * `@apollo-design/locale` 的类型契约。
 *
 * 逐字段对齐 antd 6.6.4 的 `es/locale/index.d.ts` 与各分片的 `.d.ts`：
 * `pagination/Pagination.d.ts` / `date-picker/generatePicker/interface.d.ts` /
 * `table/interface.d.ts` / `modal/interface.d.ts` / `tour/interface.d.ts` /
 * `popconfirm/PurePanel.d.ts` / `transfer/index.d.ts` / `upload/interface.d.ts` /
 * `empty/index.d.ts` / `time-picker/index.d.ts`。
 *
 * ⚠️ **两处类型不能照抄上游的 import 路径**：
 *   - `PaginationLocale` 上游从 `@rc-component/pagination` 引，
 *   - `PickerLocale.lang` 上游从 `@rc-component/picker/interface` 引。
 *   本包 `dependsOn: []`，**不依赖任何 rc 包**，所以这两个接口按
 *   「我们实际发布的数据形状」**结构化重写**。字段集是从固化数据里探出来的
 *   （见契约文档 §2 与 §9 第 4 条）—— 不是凭记忆写的。
 *
 * ⚠️ 上游用 `React.ReactNode` 的地方这里用 Vue 的 `VNodeChild`，
 *   保持「可以传节点」的表达力（消费方从 antd 迁过来时不会因为类型太窄而报错）。
 */

import type { VNodeChild } from 'vue';

// ---------------------------------------------------------------------------
// Pagination（上游来自 @rc-component/pagination/locale/*）
// ---------------------------------------------------------------------------

/**
 * 分页的语言数据。11 个字段，**全部是 string**。
 *
 * ⚠️ 字段名是 `snake_case`（`items_per_page` / `prev_5`），与 antd 其它分片的
 * `camelCase` 不一致 —— 这是 rc-pagination 的既有形状，照抄。
 */
export interface PaginationLocale {
  items_per_page: string;
  jump_to: string;
  /** ⚠️ 部分语言没有（实测 73 个包里 71 个有） */
  jump_to_confirm?: string;
  page: string;
  prev_page: string;
  next_page: string;
  prev_5: string;
  next_5: string;
  prev_3: string;
  next_3: string;
  /** ⚠️ 部分语言没有（实测 73 个包里 71 个有） */
  page_size?: string;
}

// ---------------------------------------------------------------------------
// TimePicker / DatePicker
// ---------------------------------------------------------------------------

export interface TimePickerLocale {
  placeholder?: string;
  rangePlaceholder?: [string, string];
}

/**
 * 日期选择器的 `lang` 部分（上游是 `RcPickerLocale & AdditionalPickerLocaleLangProps`）。
 *
 * ⚠️ 前四个字段（`yearFormat` / `dayFormat` / `cellMeridiemFormat` / `monthBeforeYear`）
 * 来自 rc-picker 的 `commonLocale`，**每个语言包都有**；
 * `shortWeekDays` / `shortMonths` **只有 5 个语言有**（`it_IT` / `mr_IN` / `pt_BR` /
 * `pt_PT` / `tr_TR`），所以是可选的。
 */
export interface PickerLangLocale {
  // ---- rc-picker 的 commonLocale：**每个语言包都有** ----
  yearFormat: string;
  monthBeforeYear: boolean;

  // ---- rc-picker 的每语言字段：**每个语言包都有** ----
  locale: string;
  today: string;
  now: string;
  backToToday: string;
  ok: string;
  clear: string;
  week: string;
  month: string;
  year: string;
  timeSelect: string;
  dateSelect: string;
  monthSelect: string;
  yearSelect: string;
  decadeSelect: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
  previousCentury: string;
  nextCentury: string;

  // ---- antd 在 date-picker/locale/* 里额外加的：这两个**每个包都有** ----
  placeholder: string;
  rangePlaceholder: [string, string];

  // ---------------------------------------------------------------------------
  // ⚠️ 下面这些是**部分语言才有**的。字段集是从固化数据里逐包统计出来的
  //    （73 个包，括号里是实测出现次数），不是照抄上游的 .d.ts ——
  //    上游的 `RcPickerLocale` 把它们大多声明为必填，但那与数据不符：
  //    照抄会让 73 个语言包里的绝大多数类型报错。见契约文档 §9 第 4 条。
  // ---------------------------------------------------------------------------
  /** 71/73 */
  dayFormat?: string;
  /** 70/73 */
  cellMeridiemFormat?: string;
  /** 62/73 */
  yearPlaceholder?: string;
  /** 63/73 */
  quarterPlaceholder?: string;
  /** 63/73 */
  monthPlaceholder?: string;
  /** 63/73 */
  weekPlaceholder?: string;
  /** 63/73 */
  rangeYearPlaceholder?: [string, string];
  /** 63/73 */
  rangeMonthPlaceholder?: [string, string];
  /** 55/73 */
  rangeQuarterPlaceholder?: [string, string];
  /** 63/73 */
  rangeWeekPlaceholder?: [string, string];
  /** 33/73 */
  weekSelect?: string;
  /** 16/73（`it_IT` / `mr_IN` / `pt_BR` / `pt_PT` / `tr_TR` 等） */
  shortWeekDays?: string[];
  /** 16/73 */
  shortMonths?: string[];
  /** 5/73 */
  monthFormat?: string;
  /** 4/73 */
  cellDateFormat?: string;
  /** 3/73 */
  fieldDateFormat?: string;
  /** 3/73 */
  fieldDateTimeFormat?: string;
  /** 1/73 */
  fieldMonthFormat?: string;
  /** 1/73 */
  fieldWeekFormat?: string;
}

export interface PickerLocale {
  lang: PickerLangLocale;
  timePickerLocale: TimePickerLocale;
  /**
   * 下面四个是上游保留的**已废弃**字段（），
   * 官方注释写的是「Invalid, Please use `lang.field*Format` instead」。
   * 本包的 73 个语言包**都没有**它们 —— 列在这里只为让类型与上游同构。
   */
  /** @deprecated 用 `lang.fieldDateFormat` */
  dateFormat?: string;
  /** @deprecated 用 `lang.fieldDateTimeFormat` */
  dateTimeFormat?: string;
  /** @deprecated 用 `lang.fieldWeekFormat` */
  weekFormat?: string;
  /** @deprecated 用 `lang.fieldWeekFormat` */
  monthFormat?: string;
}

// ---------------------------------------------------------------------------
// 各组件分片
// ---------------------------------------------------------------------------

export interface TableLocale {
  filterTitle?: string;
  filterConfirm?: VNodeChild;
  filterReset?: VNodeChild;
  filterEmptyText?: VNodeChild;
  /** @deprecated 用 `filterCheckAll` */
  filterCheckall?: VNodeChild;
  filterCheckAll?: VNodeChild;
  filterSearchPlaceholder?: string;
  emptyText?: VNodeChild | (() => VNodeChild);
  selectAll?: VNodeChild;
  selectNone?: VNodeChild;
  selectInvert?: VNodeChild;
  selectionAll?: VNodeChild;
  sortTitle?: string;
  expand?: string;
  collapse?: string;
  triggerDesc?: string;
  triggerAsc?: string;
  cancelSort?: string;
}

export interface ModalLocale {
  okText: string;
  cancelText: string;
  justOkText: string;
}

export interface TourLocale {
  Next: string;
  Previous: string;
  Finish: string;
}

export interface PopconfirmLocale {
  okText: string;
  cancelText: string;
}

export interface TransferLocale {
  titles?: VNodeChild[];
  notFoundContent?: VNodeChild | VNodeChild[];
  searchPlaceholder: string;
  itemUnit: string;
  itemsUnit: string;
  remove?: string;
  selectAll?: string;
  deselectAll?: string;
  selectCurrent?: string;
  selectInvert?: string;
  removeAll?: string;
  removeCurrent?: string;
}

/** `Empty` 用的是它自己的 `TransferLocale`（同名不同义，只有一个 `description`）。 */
export interface EmptyLocale {
  description: string;
}

export interface UploadLocale {
  uploading?: string;
  removeFile?: string;
  downloadFile?: string;
  uploadError?: string;
  previewFile?: string;
}

/** 所有组件共用的占位/提示文案。 */
export interface GlobalLocale {
  placeholder?: string;
  close?: string;
  sortable?: string;
  show?: string;
  hide?: string;
}

export interface TextLocale {
  edit?: VNodeChild;
  copy?: VNodeChild;
  copied?: VNodeChild;
  expand?: VNodeChild;
  collapse?: VNodeChild;
}

/**
 * 表单校验消息模板。
 *
 * 上游来自 `@rc-component/form` 的 `ValidateMessages`。本包按数据形状重写：
 * **所有字段都是可选的**（rc-form 允许局部覆盖），模板串里用 `${label}` / `${min}`
 * 这类占位符。
 */
export interface ValidateMessages {
  default?: string;
  required?: string;
  enum?: string;
  whitespace?: string;
  date?: { format?: string; parse?: string; invalid?: string };
  types?: {
    string?: string;
    method?: string;
    array?: string;
    object?: string;
    number?: string;
    date?: string;
    boolean?: string;
    integer?: string;
    float?: string;
    regexp?: string;
    email?: string;
    url?: string;
    hex?: string;
  };
  string?: { len?: string; min?: string; max?: string; range?: string };
  number?: { len?: string; min?: string; max?: string; range?: string };
  array?: { len?: string; min?: string; max?: string; range?: string };
  pattern?: { mismatch?: string };
}

export interface FormLocale {
  optional?: string;
  defaultValidateMessages: ValidateMessages;
}

export interface QRCodeLocale {
  expired?: string;
  refresh?: string;
  scanned?: string;
}

export interface CarouselLocale {
  prevSlide: string;
  nextSlide: string;
}

export interface ColorPickerLocale {
  presetEmpty: string;
  transparent: string;
  singleColor: string;
  gradientColor: string;
}

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

/**
 * 一个语言包。
 *
 * ⚠️ `locale` 是**唯一必填**字段，其余全部可选 —— 这让「只覆盖一部分分片」
 * 成为合法用法（`ConfigProvider` 的 `locale` 就是被这样用的）。
 *
 * ⚠️ 两个容易看错的地方：
 *   - `Select` 在类型里存在，但 **75 个语言包一个都没有它** ——
 *     它是留给 `ConfigProvider` 消费方的口子，不是疏漏。
 *   - `Carousel` / `ColorPicker` 的子字段是**必填**，与其它分片不同。照抄上游。
 */
export interface Locale {
  locale: string;
  Pagination?: PaginationLocale;
  DatePicker?: PickerLocale;
  TimePicker?: TimePickerLocale;
  Calendar?: PickerLocale;
  Table?: TableLocale;
  Modal?: ModalLocale;
  Tour?: TourLocale;
  Popconfirm?: PopconfirmLocale;
  Transfer?: TransferLocale;
  Select?: Record<string, unknown>;
  Upload?: UploadLocale;
  Empty?: EmptyLocale;
  global?: GlobalLocale;
  Icon?: Record<string, unknown>;
  Text?: TextLocale;
  Form?: FormLocale;
  QRCode?: QRCodeLocale;
  Carousel?: CarouselLocale;
  ColorPicker?: ColorPickerLocale;
}

/** 分片名（`'locale'` 之外的全部键）。 */
export type LocaleComponentName = Exclude<keyof Locale, 'locale'>;
