/**
 * slider/util.ts —— rc-slider `util.js`（30 行）的 Vue 等价物。
 *
 * 三个纯函数，判据逐字（`docs/analysis/slider.md` §4/§8）：
 *   1. `getOffset`：值 → [0,1] 的比例（**不做 clamp**，调用方自己保证值域）；
 *   2. `getDirectionStyle`：比例 → 四方向的位置 style（**含 translate 补偿**）；
 *   3. `getIndex`：`number[] | string[] | T` 的「逐把手取值」语义。
 */

import type { CSSProperties } from 'vue';
import type { SliderDirection } from './interface';

/** 值 → 比例。⚠️ `max === min` 时为 `NaN`（rc 同判，不做保护）。 */
export function getOffset(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

/**
 * 比例 → 位置 style（四方向）。
 *
 * ⚠️ 四个分支的**属性名与 transform 符号都不同**，逐字对齐 rc：
 *    ltr：`left` + `translateX(-50%)`；rtl：`right` + `translateX(50%)`；
 *    btt：`bottom` + `translateY(50%)`；ttb：`top` + `translateY(-50%)`。
 */
export function getDirectionStyle(
  direction: SliderDirection,
  value: number,
  min: number,
  max: number,
): CSSProperties {
  const offset = getOffset(value, min, max);
  switch (direction) {
    case 'rtl':
      return { right: `${offset * 100}%`, transform: 'translateX(50%)' };
    case 'btt':
      return { bottom: `${offset * 100}%`, transform: 'translateY(50%)' };
    case 'ttb':
      return { top: `${offset * 100}%`, transform: 'translateY(-50%)' };
    default:
      return { left: `${offset * 100}%`, transform: 'translateX(-50%)' };
  }
}

/** 数组 ⇒ 取第 index 项；单值 ⇒ 原样返回（rc 的逐把手 prop 语义）。 */
export function getIndex<T>(value: T | T[], index: number): T | undefined {
  return Array.isArray(value) ? value[index] : value;
}
