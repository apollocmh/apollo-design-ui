/**
 * 时间面板的**取值运算**（模板日期 → 某一列改值后的日期）。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的
 * `es/PickerPanel/TimePanel/TimePanelBody/index.js`（243 行）与
 * `es/PickerPanel/TimePanel/TimePanelBody/TimeColumn.js`（135 行）。
 * ⚠️ 两者都 `import * as React` ⇒ **不可对拍**，这里把其中**与 DOM 无关**的部分
 * 抽成纯函数，由 `src/__tests__/time-tmpl.test.ts` 覆盖。
 *
 * ── 为什么需要「模板日期」这一层 ──────────────────────────────────────────────
 *
 * 时间列是**三到五列独立滚动**的，某一列改值时必须先把「当前时刻」拼出来。
 * 上游的优先级是三段（照抄，且顺序不可换）：
 *   1. `value`（当前选中值）存在且**有时**（`hour` 非空）⇒ 用它的一组 h/m/s/ms；
 *   2. 否则 `pickerValue`（面板当前浏览值）的一组；
 *   3. 否则**第一档可用值**（`validHour` / `validMinute` / …）。
 * 第 3 段是为什么 `getEnabled` 要先算出来再传进来。
 */

import { formatValue } from './date-util';
import type { TimeColumnUnit } from './time-units';
import type { GenerateConfig, PickerLocale } from './types';

export type { TimeColumnUnit };

/** 一个时刻的四个单位。**只有整组存在或整组不存在**两种状态（上游的 `hour` 判据即此）。 */
export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

/** 从日期取四个单位；空值 ⇒ `null`。 */
export function getTimeParts<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date?: DateType | null,
): TimeParts | null {
  if (date === null || date === undefined) {
    return null;
  }
  return {
    hour: generateConfig.getHour(date),
    minute: generateConfig.getMinute(date),
    second: generateConfig.getSecond(date),
    millisecond: generateConfig.getMillisecond(date),
  };
}

/** 上午？`hour < 12`。 */
export function isAM(hour: number): boolean {
  return hour < 12;
}

export interface TimeTemplateInput<DateType> {
  generateConfig: GenerateConfig<DateType>;
  /** 当前选中值（可能为 `null` = 还没选） —— 只用来当模板的**日期**部分 */
  value?: DateType | null;
  /** 面板当前浏览值 */
  pickerValue?: DateType | null;
  /** 来自 `value` 的一组时间 */
  valueTime?: TimeParts | null;
  /** 来自 `pickerValue` 的一组时间 */
  pickerTime?: TimeParts | null;
  /** 第一档可用值（`getEnabled` 的产物） */
  validTime?: TimeParts | undefined;
}

/**
 * 拼出「改某一列时用的基准时刻」。
 *
 * ⚠️ 三段判据的分界是**「有没有一组时间」**，不是「有没有 `value`」：
 * 只有日期没有时间的 `value` 会掉到第 2 段（上游写的是 `isNonNullable(hour)`）。
 */
export function getTriggerDateTemplate<DateType>(input: TimeTemplateInput<DateType>): DateType {
  const { generateConfig: g, value, pickerValue, valueTime, pickerTime, validTime } = input;
  let tmpl = value ?? pickerValue ?? g.getNow();

  const parts = valueTime ?? pickerTime ?? validTime;
  if (parts) {
    tmpl = g.setHour(tmpl, parts.hour);
    tmpl = g.setMinute(tmpl, parts.minute);
    tmpl = g.setSecond(tmpl, parts.second);
    tmpl = g.setMillisecond(tmpl, parts.millisecond);
  }

  return tmpl;
}

/** `val` 为 `null`（= 清空该列）时返回 `null`，否则返回「模板 + 该列改值」后的日期。 */
export function fillTimeUnitValue<DateType>(
  generateConfig: GenerateConfig<DateType>,
  template: DateType,
  val: number | null,
  unit: 'Hour' | 'Minute' | 'Second' | 'Millisecond',
): DateType | null {
  if (val === null) {
    return null;
  }
  switch (unit) {
    case 'Hour':
      return generateConfig.setHour(template, val);
    case 'Minute':
      return generateConfig.setMinute(template, val);
    case 'Second':
      return generateConfig.setSecond(template, val);
    default:
      return generateConfig.setMillisecond(template, val);
  }
}

/**
 * 上下午列的改值。
 *
 * ⚠️ 两个「只在需要时才 ± 12」的分支 —— `val === 'am'` 而当前本来就是上午时
 * 直接返回模板（**不动 h/m/s**），这样不会破坏用户刚在小时列改到的值。
 */
export function getMeridiemTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  template: DateType,
  val: 'am' | 'pm' | null,
  hour?: number | null,
): DateType | null {
  if (val === null) {
    return null;
  }
  if (hour === null || hour === undefined) {
    return template;
  }
  if (val === 'am' && !isAM(hour)) {
    return generateConfig.setHour(template, hour - 12);
  }
  if (val === 'pm' && isAM(hour)) {
    return generateConfig.setHour(template, hour + 12);
  }
  return template;
}

/**
 * 滚动结束后「离滚动位置最近的那一格」的下标。
 *
 * 读源码作规格：`TimeColumn.js` 的 `onInternalScroll` 回调体（`SCROLL_DELAY = 300` 后执行）。
 *
 * ⚠️ 三条照抄的细节：
 *  - 比较的是「相对**第一个 li** 的偏移」与 `scrollTop` 的差 —— 不用绝对 `offsetTop`，
 *    因为列上下有 padding；
 *  - **禁用格的差值被替换成 `Number.MAX_SAFE_INTEGER`**，于是它只会在「所有格都禁用」
 *    时被选中；
 *  - `liTopList` 与 `units` **按下标一一对应**（上游直接 `units[minDistIndex]`）。
 */
export function getNearestUnitIndex(
  // ⚠️ 只读 `disabled` ⇒ 入参刻意放宽到「任意带 disabled 的档位」：
  //    上下午列的 `value` 是 `'am' | 'pm'`（字符串）而不是数字，
  //    收窄成 `TimeColumnUnit[]` 会逼调用方做一次无意义的类型转换。
  units: readonly { disabled: boolean }[],
  liTopList: readonly number[],
  scrollTop: number,
): number {
  const liDistList = liTopList.map((top, index) => {
    if (units[index]?.disabled) {
      return Number.MAX_SAFE_INTEGER;
    }
    return Math.abs(top - scrollTop);
  });

  const minDist = Math.min(...liDistList);
  // ⚠️ `indexOf` 与 `findIndex((d) => d === minDist)` **语义等价**（都是严格相等；
  //    `NaN` 时两者都返回 -1）—— 这里是 biome `lint/complexity/useIndexOf` 的等价修法。
  //    📌 该错误是 **master 上既有的**（本文件此前未被任何改动触碰），
  //    它会让 `verify:full` 的 `lint:format` 直接红 ⇒ color-picker 收口时顺手修掉。
  return liDistList.indexOf(minDist);
}

/**
 * 上下午列的两档。
 *
 * ⚠️ 与 `TimeColumnUnit` **不是同一个类型** —— 它的 `value` 是 `'am'` / `'pm'`
 * （字符串），而上游的 `Unit<DateType>` 对值类型是泛型的。刻意不复用：
 * 把字符串塞进 `value: number` 会需要一次 `as`，而那正是 H10 禁止的。
 */
export interface MeridiemUnit {
  label: string;
  value: 'am' | 'pm';
  disabled: boolean;
}

/** 12 小时制的两档（`cellMeridiemFormat` 给了就按它格式化 9 点 / 15 点）。 */
export function getMeridiemUnits<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  rowHourUnits: readonly TimeColumnUnit[],
): MeridiemUnit[] {
  const base = generateConfig.getNow();
  const formatMeridiem = (date: DateType, defaultLabel: string): string =>
    locale.cellMeridiemFormat
      ? formatValue(date, { locale, format: locale.cellMeridiemFormat, generateConfig })
      : defaultLabel;

  return [
    {
      label: formatMeridiem(generateConfig.setHour(base, 9), 'AM'),
      value: 'am',
      disabled: rowHourUnits.every((h) => h.disabled || !isAM(h.value)),
    },
    {
      label: formatMeridiem(generateConfig.setHour(base, 15), 'PM'),
      value: 'pm',
      disabled: rowHourUnits.every((h) => h.disabled || isAM(h.value)),
    },
  ];
}
