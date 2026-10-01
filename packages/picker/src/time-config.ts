/**
 * `showTime` 的配置归一（「显示哪几列」「用哪个格式」）。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的 `es/hooks/useTimeConfig.js`（150 行）。
 * ⚠️ 它 `import { getRowFormat, pickProps, toArray } from '../utils/miscUtil'` 且
 * `import { fillTimeFormat } from './useLocale'`，而 `useLocale.js` `import React`
 * ⇒ **整条链不可对拍**。这里逐行重写成纯函数，由 `src/__tests__/time-config.test.ts` 覆盖。
 *
 * ── 这个模块解决的三件事 ──────────────────────────────────────────────────────
 *
 * 1. **时间配置有三个来源**（契约 §3.5 的邻近条目）：组件顶层 props（`hourStep` 等）、
 *    `showTime`（对象形态）里同名的键、以及 `format`。合并优先级是
 *    「`showTime` 对象 > 顶层 props」，且 `showTime.defaultValue` 会被改写成
 *    `defaultOpenValue`（上游对旧名的兼容）。
 * 2. **`showHour/Minute/Second` 的三态**（`undefined` / `true` / `false`）要先由
 *    `fillShowConfig` 收敛：全 `undefined` 时默认全开；只要有一个显式值，其余按
 *    「有一个 `false` ⇒ 缺省为 `true`；全是 `true` ⇒ 缺省为 `false`」补。
 * 3. **格式串与 show 的互相推导**：`fillShowTimeConfig` 在「一个 show 都没显式给」时
 *    从**基准格式串**里反推（`H`/`h`/`k`/`LT`/`LLL` ⇒ 小时……），基准格式的优先级是
 *    `showTime.format` > `props.format` > `locale.fieldXxxFormat`。
 */

import { fillTimeFormat } from './locale-fill';
import { getRowFormat, pickProps, toArray } from './misc-util';
import type { PanelDateType } from './panel-context';
import type { InternalMode, PickerLocale, PickerMode } from './types';

/** `disabledTime` 返回的四档禁用集合（`useTimeInfo` 的消费形态）。 */
export interface DisabledTimes {
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
  disabledMilliseconds?: (hour: number, minute: number, second: number) => number[];
}

/**
 * 时间面板的配置（`TimePanel` / `TimePanelBody` 的全部入参）。
 *
 * 形状对齐上游 `SharedTimeProps<DateType>`，**去掉**了 React 相关的键。
 * 它同时也是 `PickerPanel` 顶层会透传的一组 props（`pickTimeProps` 挑的就是它们）。
 */
export interface TimePanelConfig<DateType> {
  format?: string;
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
  /** 该时间点的禁用集合；`disabledHours` 等顶层键是它的回退来源 */
  disabledTime?: (date: DateType) => DisabledTimes;
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
  disabledMilliseconds?: (hour: number, minute: number, second: number) => number[];

  changeOnScroll?: boolean;
  defaultValue?: DateType;
  defaultOpenValue?: DateType;
}

/**
 * 日期值 → 格式串的**函数形态**。上游 `interface.d.ts:204` 逐字：
 *
 * ```ts
 * export type CustomFormat<DateType> = (value: DateType) => string;
 * ```
 *
 * ⚠️ 它**只参与格式化，不参与解析** —— 键入时无法从一个函数反推出日期，
 * 所以 `pickPropFormat` 遇到它会返回 `null`（「没有静态格式串」），
 * 解析退回 `formatList` 的字符串项。这与上游一致。
 */
export type CustomFormat<DateType> = (value: DateType) => string;

/** 上游 `interface.d.ts:205`：`string | CustomFormat<DateType>`。 */
export type FormatType<DateType = PanelDateType> = string | CustomFormat<DateType>;

/**
 * 组件 `format` prop 的可能形态（**2026-09-30 加回泛型与函数形态**）。
 *
 * 上游 `@rc-component/picker` 的 `es/interface.d.ts` 第 237 行：
 * ```
 * format?: FormatType<DateType> | FormatType<DateType>[] | { format: string; type?: 'mask' };
 * ```
 *
 * ── 与「本仓曾经不挂泛型」的关系 ──────────────────────────────────────────────
 *
 * 本仓此前只落到「字符串 / 字符串数组 / `{ format }`」三形态，于是**刻意不挂
 * `DateType` 泛型**（挂了无人使用 ⇒ biome 的 `noUnusedVariables`，更糟的是会让人
 * 误以为函数形态已支持）。`date-picker` 的 **S2** 真做函数式 `format` 时按约定
 * 「随实现一起把泛型加回来」—— 本文件即那一步（PITFALLS 214）。
 *
 * ⚠️ 第三支的 `type?: 'mask'` 是上游有的（掩码模式），本仓此前也漏了，一并补上。
 */
export type PickerFormat<DateType = PanelDateType> =
  | FormatType<DateType>
  | readonly FormatType<DateType>[]
  | { format: string; type?: 'mask' };

/**
 * **组件层**的 `showTime` 对象形态。
 *
 * 🚨 与 `TimePanelConfig` 有两处**真实差异** —— 因为两者描述的是两个不同的东西：
 * `TimePanelConfig` 是「**时间面板**的配置」，本接口是「**组件 props** 里的 `showTime`」。
 *
 *  1. `disabledTime` 还要收**范围**的三参形态
 *     （rc `RangeTimeProps`：`(date, range, info) => DisabledTimes`）；
 *  2. `defaultValue` / `defaultOpenValue` 在范围下是**两端**的数组（`[start, end]`），
 *     不是单个日期。
 *
 * ⚠️ 放宽这两处**不改变任何运行期行为**：`getTimeProps` 从不调用 `disabledTime`
 *    （只是把它抄进 `timeConfig`），也从不去读 `defaultValue`（见 `TimeConfigSource`
 *    的第 3 条，组件层的 `defaultValue` 已被丢弃）。真正调用 `disabledTime` 的是
 *    `useTimeInfo` / `useInvalidate`，它们拿到的是**面板形态** —— 范围的原始三参函数
 *    在 `RangePicker` 里被代理成一面参之后才下发（rc `RangePicker.js` 的
 *    `proxyDisabledTime`），这是上游的架构，不是这里的妥协。
 */
export interface TimeConfigShowTime<DateType>
  extends Omit<TimePanelConfig<DateType>, 'disabledTime' | 'defaultValue' | 'defaultOpenValue'> {
  disabledTime?: (
    date: DateType,
    range: 'start' | 'end',
    info: { from?: DateType },
  ) => DisabledTimes;
  defaultValue?: DateType | DateType[];
  defaultOpenValue?: DateType | DateType[];
}

/**
 * `getTimeProps` 的输入：既含顶层时间 props，也含 `showTime` / `format` / `picker`。
 *
 * 🚨 三处**故意与 `TimePanelConfig` 不同**，因为「真实组件的 props」与「时间面板的配置」
 * 是两个不同的东西，只是有一批键同名：
 *
 *  1. `locale` —— 放行但**不读**（`PickerPanel` 传的是它自己的整个 props）；
 *  2. `format` —— 组件层可以是数组 / 对象形态（`PickerFormat`），
 *     而 `TimePanelConfig.format` 是已归一的单个格式串；
 *  3. `defaultValue` —— **同名不同义**：组件层是「面板的值」（`DateType[]`），
 *     时间层的 `defaultValue` 是「时间列的默认值」（`DateType`）。
 *     上游把两者 spread 在一起（后者被前者覆盖），本仓在 `getTimeProps` 里**丢弃**它
 *     （时间侧只认 `defaultOpenValue`，而 `defaultOpenValue ?? defaultValue` 的兼容
 *     已经在 `getTimeProps` 内做完了）。
 */
export interface TimeConfigSource<DateType>
  extends Omit<TimePanelConfig<DateType>, 'format' | 'defaultValue' | 'disabledTime'> {
  picker?: PickerMode;
  /** 🚨 组件层的 `showTime`（含范围的数组默认值与三参 `disabledTime`），见 `TimeConfigShowTime`。 */
  showTime?: boolean | TimeConfigShowTime<DateType>;
  format?: PickerFormat<DateType>;
  locale?: PickerLocale;
  /** 见上面的第 3 条：结构兼容用，本函数不读它。 */
  defaultValue?: unknown;
  /**
   * 🚨 **组件层**的 `disabledTime` —— 与 `TimePanelConfig` 的同名键**不同形**。
   *
   * `disabledTime` 在 `showTimeKeys` 里（所以顶层也会被 `pickProps` 挑走），
   * 而范围组件的顶层 `disabledTime` 是三参的（rc 的 `RangePickerProps`
   * 就是 `extends Omit<RangeTimeProps, …>`）⇒ 这里必须收下两个形态。
   * 同 `TimeConfigShowTime`：**只搬运，不调用**。
   */
  disabledTime?: (
    date: DateType,
    range: 'start' | 'end',
    info: { from?: DateType },
  ) => DisabledTimes;
}

/**
 * `showTime` 里**不会**被 `pickTimeProps` 挑走的键。
 *
 * ⚠️ `'format'` 是**刻意注释掉**的（上游原样）—— 见 `pickTimeProps` 的第 3 步：
 * 只有 `picker === 'time'` 时才会把 `props.format` 写进 `timeProps`。
 */
const showTimeKeys = [
  'showNow',
  'showHour',
  'showMinute',
  'showSecond',
  'showMillisecond',
  'use12Hours',
  'hourStep',
  'minuteStep',
  'secondStep',
  'millisecondStep',
  'hideDisabledOptions',
  'defaultValue',
  'disabledHours',
  'disabledMinutes',
  'disabledSeconds',
  'disabledMilliseconds',
  'disabledTime',
  'changeOnScroll',
  'defaultOpenValue',
] as const;

/** `show` 显式给了就用它；否则看格式串里有没有这几个 keyword。 */
function checkShow(format: string, keywords: readonly string[], show?: boolean): boolean {
  return show ?? keywords.some((keyword) => format.includes(keyword));
}

function isStringFormat(format: unknown): format is string {
  return typeof format === 'string' && format.length > 0;
}

/** 4 个 show 键里**有没有任何一个被显式给过**（`false` 也算给过）。 */
function existShowConfig(
  showHour?: boolean,
  showMinute?: boolean,
  showSecond?: boolean,
  showMillisecond?: boolean,
): boolean {
  return [showHour, showMinute, showSecond, showMillisecond].some((show) => show !== undefined);
}

/**
 * 收敛 `showHour` / `showMinute` / `showSecond` 的三态。
 *
 * ⚠️ 三条分支的判据不对称，且**逐字**照抄上游：
 *  - `showMillisecond` **不参与**「有没有显式配置」的判定，也不被兜底赋值；
 *  - 第一个分支要求「没有显式配置」**且四个值全为假值**；
 *  - `defaultShow = existFalse ? true : !existTrue` —— 有一个显式 `false` 时缺省为
 *    `true`，否则缺省为 `false`。
 */
function fillShowConfig(
  hasShowConfig: boolean,
  showHour?: boolean,
  showMinute?: boolean,
  showSecond?: boolean,
  showMillisecond?: boolean,
): [boolean | undefined, boolean | undefined, boolean | undefined, boolean | undefined] {
  let parsedShowHour = showHour;
  let parsedShowMinute = showMinute;
  let parsedShowSecond = showSecond;

  if (
    !hasShowConfig &&
    !parsedShowHour &&
    !parsedShowMinute &&
    !parsedShowSecond &&
    !showMillisecond
  ) {
    parsedShowHour = true;
    parsedShowMinute = true;
    parsedShowSecond = true;
  } else if (hasShowConfig) {
    const existFalse = [parsedShowHour, parsedShowMinute, parsedShowSecond].some(
      (show) => show === false,
    );
    const existTrue = [parsedShowHour, parsedShowMinute, parsedShowSecond].some(
      (show) => show === true,
    );
    const defaultShow = existFalse ? true : !existTrue;
    parsedShowHour = parsedShowHour ?? defaultShow;
    parsedShowMinute = parsedShowMinute ?? defaultShow;
    parsedShowSecond = parsedShowSecond ?? defaultShow;
  }

  return [parsedShowHour, parsedShowMinute, parsedShowSecond, showMillisecond];
}

/**
 * `props.format` → 单个格式串（数组取第一个、对象取 `.format`）。
 *
 * ⚠️ **泛型**（2026-09-30 随 `PickerFormat` 的泛型化一起改）：`TimeConfigSource<DateType>`
 * 的 `format` 是 `PickerFormat<DateType>`，若本函数固定收 `PickerFormat<PanelDateType>`
 * 会在 `DateType ≠ PanelDateType` 时报 TS2345。
 *
 * ⚠️ 函数形态（`CustomFormat`）在这里**返回 `null`** —— 它只参与格式化、不参与解析，
 * 键入时无法从函数反推日期（与上游一致）。
 */
function pickPropFormat<DateType>(format: PickerFormat<DateType> | undefined): string | null {
  if (!format) {
    return null;
  }
  let propFormat: unknown = format;
  if (Array.isArray(propFormat)) {
    propFormat = propFormat[0];
  }
  propFormat =
    typeof propFormat === 'object' ? (propFormat as { format?: unknown }).format : propFormat;
  return typeof propFormat === 'string' ? propFormat : null;
}

/**
 * 从组件 props 里挑出时间配置。
 *
 * 返回四元组（上游顺序）：`[timeConfig, localeTimeProps, showTimeFormat, propFormat]`
 *  - `timeConfig`：供 `fillShowTimeConfig` 消费的合并结果；
 *  - `localeTimeProps`：`timeConfig` 叠上收敛后的 4 个 show（`useLocale` 的入参）；
 *  - `showTimeFormat`：`showTime.format`；
 *  - `propFormat`：`props.format` 的单串形态。
 *
 * ⚠️ `picker === 'time'` 时 `props.format` 会被**写进** `timeConfig.format` ——
 * 这是 `showTimeKeys` 里刻意不含 `'format'` 的补偿（上游原样）。
 */
export function getTimeProps<DateType>(
  componentProps: TimeConfigSource<DateType>,
): [TimeConfigShowTime<DateType>, TimeConfigShowTime<DateType>, string | undefined, string | null] {
  const picked = pickProps(
    componentProps,
    showTimeKeys as unknown as (keyof typeof componentProps)[],
  ) as Record<string, unknown>;
  // ⚠️ 丢掉组件层的 `defaultValue`（面板的值 = 数组），见 `TimeConfigSource` 的第 3 条。
  //    时间侧只认 `defaultOpenValue`，而它已经在下面被 `showTime.defaultValue` 兜底过。
  delete picked.defaultValue;
  const timeProps = picked as TimePanelConfig<DateType>;
  const propFormat = pickPropFormat(componentProps.format);

  if (componentProps.picker === 'time' && propFormat !== null) {
    timeProps.format = propFormat;
  }

  const { showTime } = componentProps;
  const showTimeConfig: TimeConfigShowTime<DateType> =
    showTime && typeof showTime === 'object' ? showTime : {};
  const timeConfig: TimeConfigShowTime<DateType> = {
    defaultOpenValue: showTimeConfig.defaultOpenValue ?? showTimeConfig.defaultValue,
    ...timeProps,
    ...showTimeConfig,
  };

  const { showMillisecond } = timeConfig;
  let { showHour, showMinute, showSecond } = timeConfig;
  const hasShowConfig = existShowConfig(showHour, showMinute, showSecond, showMillisecond);
  [showHour, showMinute, showSecond] = fillShowConfig(
    hasShowConfig,
    showHour,
    showMinute,
    showSecond,
    showMillisecond,
  );

  return [
    timeConfig,
    { ...timeConfig, showHour, showMinute, showSecond, showMillisecond },
    timeConfig.format,
    propFormat,
  ];
}

/**
 * 把时间配置补齐成**面板可消费**的最终形态。
 *
 * 只有 `picker` 是 `'datetime'` / `'time'` 时才有结果（其余模式返回 `null`）。
 *
 * 🚨 入参与出参都是 `TimeConfigShowTime`（**组件层**形态）而不是 `TimePanelConfig`：
 * 上游这里是 `{...pickedProps, format, showHour, …}`，`pickedProps` 就是
 * `getTimeProps` 的第一个产物 ⇒ 组件层多出来的键（范围的数组 `defaultValue`、
 * 三参 `disabledTime`）会**原样穿过**。真正把它们收成面板形态的是调用方
 * （范围下由 `RangePicker` 的 `proxyDisabledTime` 负责，rc 原样）。
 *
 * ⚠️ 两处必须照抄的细节：
 *  - 基准格式的优先级是 `showTime.format` > `props.format` > `locale.fieldXxxFormat`，
 *    且**只有字符串形态**才被采纳（`toArray(...)[0]` 之后再过 `isStringFormat`）；
 *  - `use12Hours` 的最终值来自 `showMeridiem`（由**基准格式**里的 `a`/`A`/`LT`/`LLL`/`LTS`
 *    推出），而不是 `pickedProps.use12Hours` 本身 —— 即显式传 `use12Hours: false` 但格式里
 *    带 `A` 时，结果仍是 `true`。
 */
export function fillShowTimeConfig<DateType>(
  picker: InternalMode,
  showTimeFormat: string | undefined,
  propFormat: string | null,
  timeConfig: TimeConfigShowTime<DateType>,
  locale: PickerLocale,
): TimeConfigShowTime<DateType> | null {
  if (picker !== 'datetime' && picker !== 'time') {
    return null;
  }

  // ====================== BaseFormat ======================
  // ⚠️ 上游此处若 `locale` 未补齐会抛 `Cannot read properties of undefined`。
  //    调用方的不变量是「传 `fillLocale` 的产物」；这里用 `?? ''` 把不可能分支
  //    变成「全部 show=false ⇒ 走 `fillShowConfig` 的兜底」，不改变已补齐时的行为。
  const defaultLocaleFormat = getRowFormat(picker, locale) ?? '';
  let baselineFormat = defaultLocaleFormat;
  const formatList = [showTimeFormat, propFormat];
  for (const item of formatList) {
    const format = toArray(item)[0];
    if (isStringFormat(format)) {
      baselineFormat = format;
      break;
    }
  }

  // ========================= Show =========================
  let { showHour, showMinute, showSecond, showMillisecond } = timeConfig;
  const { use12Hours } = timeConfig;

  const showMeridiem = checkShow(baselineFormat, ['a', 'A', 'LT', 'LLL', 'LTS'], use12Hours);
  const hasShowConfig = existShowConfig(showHour, showMinute, showSecond, showMillisecond);

  if (!hasShowConfig) {
    showHour = checkShow(baselineFormat, ['H', 'h', 'k', 'LT', 'LLL']);
    showMinute = checkShow(baselineFormat, ['m', 'LT', 'LLL']);
    showSecond = checkShow(baselineFormat, ['s', 'LTS']);
    showMillisecond = checkShow(baselineFormat, ['SSS']);
  }

  [showHour, showMinute, showSecond] = fillShowConfig(
    hasShowConfig,
    showHour,
    showMinute,
    showSecond,
    showMillisecond,
  );

  // ======================== Format ========================
  // ⚠️ `showTimeFormat`（而非 `baselineFormat`）才是面板的展示格式 —— 也就是说
  //    「从 `props.format` 反推了 showHour/…」并不会让 `props.format` 变成面板格式。
  const timeFormat =
    showTimeFormat ??
    fillTimeFormat(showHour, showMinute, showSecond, showMillisecond, showMeridiem);

  return {
    ...timeConfig,
    format: timeFormat,
    showHour,
    showMinute,
    showSecond,
    showMillisecond,
    use12Hours: showMeridiem,
  };
}
