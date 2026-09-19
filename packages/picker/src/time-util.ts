/**
 * 时间列校验。
 *
 * 与 `@rc-component/picker@1.12.2` 的
 * `es/PickerPanel/TimePanel/TimePanelBody/util.js` **逐位对拍**
 * （`src/__tests__/time-util.oracle.test.ts`）。
 */

import type { GenerateConfig } from './types';

/** 时间列的一格。上游 `Unit<number>` 的最小投影。 */
export interface TimeUnit {
  value: number;
  disabled: boolean;
}

interface AlignedUnit<DateType> {
  /** 该级最终落在哪个值上 */
  value: number;
  /** 对齐后的日期（下一级的输入） */
  date: DateType;
}

function alignValidate<DateType>(
  date: DateType,
  getUnitValue: (date: DateType) => number,
  setUnitValue: (date: DateType, value: number) => DateType,
  units: readonly TimeUnit[],
): AlignedUnit<DateType> {
  let value = getUnitValue(date);
  let nextDate = date;

  const currentUnit = units.find((unit) => unit.value === value);

  // 档位不存在**或**被禁用 ⇒ 需要换一个值
  if (!currentUnit || currentUnit.disabled) {
    const validateUnits = units.filter((unit) => !unit.disabled);
    const reverseEnabledUnits = [...validateUnits].reverse();
    const validateUnit =
      reverseEnabledUnits.find((unit) => unit.value <= value) ?? validateUnits[0];
    if (validateUnit) {
      value = validateUnit.value;
      nextDate = setUnitValue(date, value);
    }
  }

  return { value, date: nextDate };
}

/**
 * 把 `date` 的时分秒毫秒逐级对齐到**未被禁用**的档位。
 *
 * 顺序是 h → m → s → ms，且**后一级的档位表依赖前一级的结果**
 * （`getMinuteUnits(nextHour)`）—— 顺序不能换。
 *
 * ⚠️ 找不到合法档位时的规则是：**反向第一个 `value <= 当前值`**，
 * 全都比当前值大时才取第一个可用档位。这是「向上找最近」的反面，
 * 上游就是这么写的（契约 §3.7）。
 */
export function findValidateTime<DateType>(
  date: DateType,
  getHourUnits: () => readonly TimeUnit[],
  getMinuteUnits: (hour: number) => readonly TimeUnit[],
  getSecondUnits: (hour: number, minute: number) => readonly TimeUnit[],
  getMillisecondUnits: (hour: number, minute: number, second: number) => readonly TimeUnit[],
  generateConfig: GenerateConfig<DateType>,
): DateType {
  const hour = alignValidate(
    date,
    (current) => generateConfig.getHour(current),
    (current, value) => generateConfig.setHour(current, value),
    getHourUnits(),
  );
  const minute = alignValidate(
    hour.date,
    (current) => generateConfig.getMinute(current),
    (current, value) => generateConfig.setMinute(current, value),
    getMinuteUnits(hour.value),
  );
  const second = alignValidate(
    minute.date,
    (current) => generateConfig.getSecond(current),
    (current, value) => generateConfig.setSecond(current, value),
    getSecondUnits(hour.value, minute.value),
  );
  const millisecond = alignValidate(
    second.date,
    (current) => generateConfig.getMillisecond(current),
    (current, value) => generateConfig.setMillisecond(current, value),
    getMillisecondUnits(hour.value, minute.value, second.value),
  );

  return millisecond.date;
}
