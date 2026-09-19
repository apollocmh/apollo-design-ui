// 手写窄声明：见同目录 dateUtil.d.ts 的说明。
import type { GenerateConfig } from '../../src/types';

/** 上游 `Unit<number>` 的最小投影 —— oracle 只关心 `value` 与 `disabled`。 */
export interface OracleTimeUnit {
  value: number;
  disabled: boolean;
}

export declare function findValidateTime<DateType>(
  date: DateType,
  getHourUnits: () => OracleTimeUnit[],
  getMinuteUnits: (hour: number) => OracleTimeUnit[],
  getSecondUnits: (hour: number, minute: number) => OracleTimeUnit[],
  getMillisecondUnits: (
    hour: number,
    minute: number,
    second: number,
  ) => OracleTimeUnit[],
  generateConfig: GenerateConfig<DateType>,
): DateType;
