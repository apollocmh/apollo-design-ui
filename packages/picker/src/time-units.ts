/**
 * 时间列的**档位表**与「合法时间」收敛。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的 `es/hooks/useTimeInfo.js`（108 行）。
 * ⚠️ 它 `import React`（`useMemo` / `useCallback`）⇒ **不可对拍**（契约 §2.1）；
 * 这里把 `generateUnits` 与「档位表 + `getValidTime`」整体重写成**纯函数**，
 * 由 `src/__tests__/time-units.test.ts` 覆盖。
 *
 * 上游把它写成 hook 的唯一目的是记忆化；本仓按需重算（Vue 侧由 `computed` 承担缓存）。
 */

import { warning } from '@apollo-design/utils';
import { leftPad } from './misc-util';
import type { DisabledTimes, TimePanelConfig } from './time-config';
import { findValidateTime, type TimeUnit } from './time-util';
import type { GenerateConfig } from './types';

/**
 * 时间列的一格（上游 `Unit<DateType>`）。
 *
 * ⚠️ 比 `time-util.ts` 的 `TimeUnit` 多一个 `label` —— `findValidateTime` 只关心
 * `value` / `disabled`（那是它对上游 `timePanelUtil.js` 的逐位对拍面），
 * 而列渲染需要 `label`。两处刻意不复用同一个类型：把 `label` 提成必填会让
 * oracle 用例凭空多出一堆无关字段。
 */
export interface TimeColumnUnit extends TimeUnit {
  label: string;
}

/**
 * 生成一个档位表。
 *
 * ⚠️ 三条照抄的细节：
 *  - `step >= 1` 时取整（`step | 0`），否则**强制为 1**（`step: 0.5` 会退化成逐格）；
 *  - `hideDisabledOptions` 为真时**跳过**禁用档位 —— 于是「选中值恰好被禁用」时
 *    列里根本没有它，`getValidTime` 会把它挪到最近的可用档位；
 *  - 循环上界是 `i <= end`（含端点）。
 */
export function generateUnits(
  start: number,
  end: number,
  step = 1,
  hideDisabledOptions = false,
  disabledUnits: readonly number[] = [],
  pad = 2,
): TimeColumnUnit[] {
  const units: TimeColumnUnit[] = [];
  const integerStep = step >= 1 ? step | 0 : 1;

  for (let i = start; i <= end; i += integerStep) {
    const disabled = disabledUnits.includes(i);
    if (!disabled || !hideDisabledOptions) {
      units.push({ label: leftPad(i, pad), value: i, disabled });
    }
  }
  return units;
}

/** 一格的取值：给了就用，否则回退到**第一个可用档位**。 */
export function getEnabled(
  units: readonly TimeColumnUnit[],
  value?: number | null,
): number | undefined {
  const enabledUnits = units.filter((unit) => !unit.disabled);
  return value ?? enabledUnits?.[0]?.value;
}

export interface TimeInfo<DateType> {
  /** 把 `nextTime` 逐级对齐到**未被禁用**的档位（可指定 `certainDate` 换一套禁用规则） */
  getValidTime: (nextTime: DateType, certainDate?: DateType) => DateType;
  /** 小时列（12 小时制时 label 已转成 1–12） */
  rowHourUnits: TimeColumnUnit[];
  getMinuteUnits: (hour: number) => TimeColumnUnit[];
  getSecondUnits: (hour: number, minute: number) => TimeColumnUnit[];
  getMillisecondUnits: (hour: number, minute: number, second: number) => TimeColumnUnit[];
}

function emptyDisabled(): number[] {
  return [];
}

/**
 * 取某个时刻的四档禁用集合。
 *
 * ⚠️ 优先级是「`disabledTime(date)` 的返回 > 顶层 `disabledHours` 等 > 空」，
 * 且**逐档独立** —— `disabledTime` 只返回了 `disabledHours` 时，
 * 分/秒/毫秒仍走顶层 props（上游原样）。
 */
function getDisabledTimes<DateType>(
  props: TimePanelConfig<DateType>,
  targetDate: DateType,
): [
  () => number[],
  (hour: number) => number[],
  (hour: number, minute: number) => number[],
  (hour: number, minute: number, second: number) => number[],
] {
  const disabledConfig: DisabledTimes = props.disabledTime?.(targetDate) ?? {};
  return [
    disabledConfig.disabledHours ?? props.disabledHours ?? emptyDisabled,
    disabledConfig.disabledMinutes ?? props.disabledMinutes ?? emptyDisabled,
    disabledConfig.disabledSeconds ?? props.disabledSeconds ?? emptyDisabled,
    disabledConfig.disabledMilliseconds ?? props.disabledMilliseconds ?? emptyDisabled,
  ];
}

/**
 * 由四档禁用集合生成「小时列 + 三个按上级取值生成的函数」。
 *
 * 小时是**一次性**算好的（`rowHourUnits`）；分/秒/毫秒是**函数**，因为
 * 「哪些分钟被禁用」取决于当前的小时 —— 这是上游把后三档做成闭包的原因。
 */
function getAllUnits<DateType>(
  getDisabledHours: () => number[],
  getDisabledMinutes: (hour: number) => number[],
  getDisabledSeconds: (hour: number, minute: number) => number[],
  getDisabledMilliseconds: (hour: number, minute: number, second: number) => number[],
  config: {
    hideDisabledOptions?: boolean;
    hourStep?: number;
    use12Hours?: boolean;
    millisecondStep?: number;
    minuteStep?: number;
    secondStep?: number;
  },
): [
  TimeColumnUnit[],
  (hour: number) => TimeColumnUnit[],
  (hour: number, minute: number) => TimeColumnUnit[],
  (hour: number, minute: number, second: number) => TimeColumnUnit[],
] {
  const {
    hideDisabledOptions,
    hourStep = 1,
    use12Hours,
    millisecondStep = 100,
    minuteStep = 1,
    secondStep = 1,
  } = config;

  const hours = generateUnits(0, 23, hourStep, hideDisabledOptions, getDisabledHours());

  // ⚠️ 12 小时制只改 **label**（`0 → 12`），档位的 `value` 仍是 0–23 ——
  //    所以点击「12」得到的是 `value: 0`。`TimePanelBody` 再按 `isAM` 过滤。
  const rowHourUnits = use12Hours
    ? hours.map((unit) => ({ ...unit, label: leftPad(unit.value % 12 || 12, 2) }))
    : hours;

  return [
    rowHourUnits,
    (nextHour: number) =>
      generateUnits(0, 59, minuteStep, hideDisabledOptions, getDisabledMinutes(nextHour)),
    (nextHour: number, nextMinute: number) =>
      generateUnits(
        0,
        59,
        secondStep,
        hideDisabledOptions,
        getDisabledSeconds(nextHour, nextMinute),
      ),
    (nextHour: number, nextMinute: number, nextSecond: number) =>
      generateUnits(
        0,
        999,
        millisecondStep,
        hideDisabledOptions,
        getDisabledMilliseconds(nextHour, nextMinute, nextSecond),
        3,
      ),
  ];
}

/**
 * 时间面板的完整「档位 + 校验」面。
 *
 * 上游返回五元组 `[getValidTime, rowHourUnits, getMinuteUnits, getSecondUnits,
 * getMillisecondUnits]`；这里换成同名的对象字段（可读性），语义与顺序一一对应。
 *
 * @param date 「当前值」—— 缺省用 `getNow()`。它只影响**默认**的禁用集合
 *   （`getValidTime` 的第二参可以换一套）。
 */
export function getTimeInfo<DateType>(
  generateConfig: GenerateConfig<DateType>,
  props: TimePanelConfig<DateType> = {},
  date?: DateType,
): TimeInfo<DateType> {
  const {
    use12Hours,
    hourStep = 1,
    minuteStep = 1,
    secondStep = 1,
    millisecondStep = 100,
    hideDisabledOptions,
  } = props;

  const mergedDate = date ?? generateConfig.getNow();

  // ======================== Warnings ========================
  // ⚠️ 上游用 `24 % hourStep === 0` 这个**整除**判据，而不是范围判据 ——
  //    目的是「档位能整齐覆盖一轮」。`hourStep: 5` 非法（24 % 5 = 4），`hourStep: 6` 合法。
  warning(24 % hourStep === 0, `\`hourStep\` ${hourStep} is invalid. It should be a factor of 24.`);
  warning(
    60 % minuteStep === 0,
    `\`minuteStep\` ${minuteStep} is invalid. It should be a factor of 60.`,
  );
  warning(
    60 % secondStep === 0,
    `\`secondStep\` ${secondStep} is invalid. It should be a factor of 60.`,
  );

  // ======================== Units ========================
  const unitOptions = {
    hideDisabledOptions,
    hourStep,
    use12Hours,
    millisecondStep,
    minuteStep,
    secondStep,
  };
  const [rowHourUnits, getMinuteUnits, getSecondUnits, getMillisecondUnits] = getAllUnits(
    ...getDisabledTimes(props, mergedDate),
    unitOptions,
  );

  // ======================== Validate ========================
  const getValidTime = (nextTime: DateType, certainDate?: DateType): DateType => {
    let getCheckHourUnits = () => rowHourUnits;
    let getCheckMinuteUnits = getMinuteUnits;
    let getCheckSecondUnits = getSecondUnits;
    let getCheckMillisecondUnits = getMillisecondUnits;

    if (certainDate) {
      const [
        targetRowHourUnits,
        targetGetMinuteUnits,
        targetGetSecondUnits,
        targetGetMillisecondUnits,
      ] = getAllUnits(...getDisabledTimes(props, certainDate), unitOptions);
      getCheckHourUnits = () => targetRowHourUnits;
      getCheckMinuteUnits = targetGetMinuteUnits;
      getCheckSecondUnits = targetGetSecondUnits;
      getCheckMillisecondUnits = targetGetMillisecondUnits;
    }

    return findValidateTime(
      nextTime,
      getCheckHourUnits,
      getCheckMinuteUnits,
      getCheckSecondUnits,
      getCheckMillisecondUnits,
      generateConfig,
    );
  };

  return { getValidTime, rowHourUnits, getMinuteUnits, getSecondUnits, getMillisecondUnits };
}
