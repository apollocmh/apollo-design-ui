/**
 * Statistic 的公共导出（Statistic / Statistic.Timer / Statistic.Countdown）。
 *
 * 与 antd 的 `es/statistic/index.js` 对齐的对外面：antd 用
 * `Object.assign(Statistic, { Timer, Countdown })` 挂静态子组件（skeleton 范式）；
 * 三个组件同时提供**具名导出**（`Timer` / `Countdown` 名字太通用、与未来独立
 * 组件撞车的风险同 `SkeletonAvatar` 条 —— 但 antd 侧 `Timer` 不是独立组件，
 * 保留 `StatisticTimer` 前缀名做具名导出更安全）。
 */

import { withInstall } from '../_internal/with-install';
import CountdownComponent from './Countdown';
import StatisticComponent from './Statistic';
import TimerComponent from './Timer';

/** Statistic 组件。注册名 `AStatistic`（COMPONENT-RULES.md 规则 R2）。 */
export const Statistic = withInstall(StatisticComponent);

/** `Statistic.Timer`（antd 6.x 的新计时形态）。注册名 `AStatisticTimer`。 */
export const StatisticTimer = withInstall(TimerComponent);

/** `Statistic.Countdown`。注册名 `ACountdown`。@deprecated → `Statistic.Timer type="countdown"`。 */
export const StatisticCountdown = withInstall(CountdownComponent);

/**
 * antd 的静态属性形态（`Statistic.Timer` / `Statistic.Countdown`）逐字保留 ——
 * 两处引用同一定义。
 */
Object.assign(Statistic, { Timer: StatisticTimer, Countdown: StatisticCountdown });

export default Statistic;

export type {
  CountdownProps,
  CountdownValueType,
  StatisticFormatConfig,
  StatisticFormatter,
  StatisticProps,
  StatisticRef,
  StatisticSemanticAllType,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  StatisticSemanticValue,
  StatisticTimerProps,
  TimerType,
  ValueType,
} from './interface';
export { genStatisticStyle } from './style';
export type { ComponentToken as StatisticComponentToken } from './style/token';
export { prepareComponentToken as prepareStatisticComponentToken } from './style/token';
export { formatCounter, formatTimeStr } from './utils';
