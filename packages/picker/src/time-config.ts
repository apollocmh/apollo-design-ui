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

/** 组件 `format` prop 的可能形态（上游 `format` 的类型面）。 */
export type PickerFormat<DateType> = string | readonly string[] | { format: string };

/** `getTimeProps` 的输入：既含顶层时间 props，也含 `showTime` 与 `format` / `picker`。 */
export interface TimeConfigSource<DateType> extends Omit<TimePanelConfig<DateType>, 'format'> {
  picker?: PickerMode;
  showTime?: boolean | TimePanelConfig<DateType>;
  format?: PickerFormat<DateType>;
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

/** `props.format` → 单个格式串（数组取第一个、对象取 `.format`）。 */
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
): [TimePanelConfig<DateType>, TimePanelConfig<DateType>, string | undefined, string | null] {
  const timeProps = pickProps(
    componentProps,
    showTimeKeys as unknown as (keyof typeof componentProps)[],
  ) as TimePanelConfig<DateType>;
  const propFormat = pickPropFormat(componentProps.format);

  if (componentProps.picker === 'time' && propFormat !== null) {
    timeProps.format = propFormat;
  }

  const { showTime } = componentProps;
  const showTimeConfig: TimePanelConfig<DateType> =
    showTime && typeof showTime === 'object' ? showTime : {};
  const timeConfig: TimePanelConfig<DateType> = {
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
  timeConfig: TimePanelConfig<DateType>,
  locale: PickerLocale,
): TimePanelConfig<DateType> | null {
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
