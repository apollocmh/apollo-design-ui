/**
 * `useOffset` —— rc-slider `hooks/useOffset.js`（282 行）的 Vue 等价物。
 *
 * 这是 slider 的**几何与量化内核**：`formatValue`（量化）+ `offsetValues`（移动 + 挤压）。
 * 判据逐条见 `docs/analysis/slider.md` §4，实现与上游保持**同构**（同名函数、同顺序），
 * 因为下面这些「看起来可以简化」的地方恰好都是行为的一部分：
 *
 *   1. `formatValue` 的候选集合 = **marks ∪ {step 对齐值} ∪ {min, max}**，
 *      取「距离最近」且**并列时后者胜**（`<=` 而不是 `<`）⇒ 顺序敏感，不能重排；
 *   2. `formatStepValue` 用 `toFixed(maxDecimal)` 消除 `0.30000000000000004`，
 *      并在越界时返回 `null`（不是 clamp）；
 *   3. `offsetValue` 的 `'unit'` 模式**递归**处理 `|offset| > 1`（PageUp/PageDown = ±2 走这里）；
 *   4. 禁用把手是**固定锚点**：`getDisabledBoundaryValues` 给出可动区间；
 *   5. `pushable` 的推挤是**四段循环**（Basic push 的 End/Start + Revert 的 End→Start、Start→End），
 *      顺序与方向都不能改 —— 改了会出现「把手互相穿过」或「推不动」。
 *
 * ⚠️ 与 Vue 的唯一结构性差异：上游用 `useCallback` 缓存、用 `useEvent` 拿最新闭包；
 *    本仓用 `computed` 派生（依赖 min/max/step/markList/pushable 等），
 *    函数本身保持纯函数形态（可被 L1 直接单测 —— 这是**加强**而不是放宽）。
 */

import { type MaybeRefOrGetter, toValue } from 'vue';
import type { NormalizedMark } from '../context';

/**
 * 下标读取（`noUncheckedIndexedAccess` 下的显式化）。
 *
 * ⚠️ 不用 `!`（本仓 `noNonNullAssertion` 会报警），也不让 `undefined` 悄悄进算式：
 *    rc 的算法保证这里每个下标都在范围内，`fallback` 是**不可达**的类型兜底
 *    （取 `min` / `max` 之外的值会污染结果，所以调用点显式传）。
 */
function readAt(values: number[], index: number, fallback: number): number {
  return values[index] ?? fallback;
}

/** 十进制位数（用于 `toFixed` 去浮点毛刺）。 */
function decimalCount(num: number): number {
  const str = String(num);
  const dot = str.indexOf('.');
  return dot < 0 ? 0 : str.length - dot - 1;
}

/**
 * 禁用把手的分界：把**禁用把手当作固定锚点**，返回当前把手允许的 `[minBound, maxBound]`。
 *
 * ⚠️ `pushGap` 只在 `pushable` 是**数字**时生效（`true` 时 rc 传进来的是 `mergedStep`，
 *    也就是说调用方已经把布尔形态归一成数字了）。
 */
export function getDisabledBoundaryValues(
  values: number[],
  valueIndex: number,
  min: number,
  max: number,
  pushable: number | boolean | null | undefined,
  isHandleDisabled: (index: number) => boolean,
): [number, number] {
  const pushGap = typeof pushable === 'number' ? pushable : 0;
  let minBound = min;
  let maxBound = max;
  for (let i = valueIndex - 1; i >= 0; i -= 1) {
    if (isHandleDisabled(i)) {
      minBound = (values[i] ?? min) + pushGap;
      break;
    }
  }
  for (let i = valueIndex + 1; i < values.length; i += 1) {
    if (isHandleDisabled(i)) {
      maxBound = (values[i] ?? max) - pushGap;
      break;
    }
  }
  return [minBound, maxBound];
}

/**
 * 点击/拖轨道时：找出「能接受目标值」的最近**启用**把手。
 *
 * 「能接受」= 目标值落在这个把手的禁用锚点区间内 ⇒ 落在全禁用段上的点击是 no-op（返回 -1）。
 */
export function getClosestEnabledHandleIndex(
  values: number[],
  targetValue: number,
  min: number,
  max: number,
  pushable: number | boolean | null | undefined,
  isHandleDisabled: (index: number) => boolean,
): number {
  let closestIndex = -1;
  let closestDist = max - min;
  values.forEach((value, index) => {
    if (isHandleDisabled(index)) return;
    const [minBound, maxBound] = getDisabledBoundaryValues(
      values,
      index,
      min,
      max,
      pushable,
      isHandleDisabled,
    );
    if (minBound <= targetValue && targetValue <= maxBound) {
      const dist = Math.abs(targetValue - value);
      if (dist <= closestDist) {
        closestDist = dist;
        closestIndex = index;
      }
    }
  });
  return closestIndex;
}

export interface UseOffsetOptions {
  min: MaybeRefOrGetter<number>;
  max: MaybeRefOrGetter<number>;
  step: MaybeRefOrGetter<number | null>;
  markList: MaybeRefOrGetter<NormalizedMark[]>;
  allowCross: MaybeRefOrGetter<boolean>;
  pushable: MaybeRefOrGetter<number | boolean | null | undefined>;
  isHandleDisabled: (index: number) => boolean;
}

export interface UseOffsetResult {
  formatValue: (value: number) => number;
  offsetValues: (
    values: number[],
    offset: number | 'min' | 'max',
    valueIndex: number,
    mode?: 'unit' | 'dist',
  ) => { value: number; values: number[] };
}

export function useOffset(options: UseOffsetOptions): UseOffsetResult {
  const { isHandleDisabled } = options;

  /** clamp 到 `[min, max]`。 */
  const formatRangeValue = (val: number): number => {
    const min = toValue(options.min);
    const max = toValue(options.max);
    return Math.max(min, Math.min(max, val));
  };

  /** 按 step 对齐；`step === null` 或越界 ⇒ `null`。 */
  const formatStepValue = (val: number): number | null => {
    const step = toValue(options.step);
    const min = toValue(options.min);
    const max = toValue(options.max);
    if (step === null) return null;
    const stepValue = min + Math.round((formatRangeValue(val) - min) / step) * step;
    const maxDecimal = Math.max(decimalCount(step), decimalCount(max), decimalCount(min));
    const fixedValue = Number(stepValue.toFixed(maxDecimal));
    return min <= fixedValue && fixedValue <= max ? fixedValue : null;
  };

  /** 量化到「marks ∪ step 网格 ∪ {min,max}」里最近的一个（并列取后者）。 */
  const formatValue = (val: number): number => {
    const min = toValue(options.min);
    const max = toValue(options.max);
    const step = toValue(options.step);
    const markList = toValue(options.markList);
    const formatNextValue = formatRangeValue(val);

    const alignValues: (number | null)[] = markList.map((mark) => mark.value);
    if (step !== null) {
      alignValues.push(formatStepValue(val));
    }
    alignValues.push(min, max);

    const candidates = alignValues.filter((v): v is number => v !== null && v !== undefined);
    // 候选集合至少含 min/max ⇒ 非空；`?? min` 是类型兜底
    let closeValue = candidates[0] ?? min;
    let closeDist = max - min;
    candidates.forEach((alignValue) => {
      const dist = Math.abs(formatNextValue - alignValue);
      if (dist <= closeDist) {
        closeValue = alignValue;
        closeDist = dist;
      }
    });
    return closeValue;
  };

  /**
   * 单把手移动（`unit` = 移动 n 个候选步；`dist` = 移动 offset 的距离）。
   *
   * ⚠️ `unit` 模式会**递归**（`|offset| > 1` 时每次走一步）—— PageUp/PageDown 与 mark 重叠的
   *    场景靠这段保证「点两下 PageUp 就前进两个候选值」。
   */
  const offsetValue = (
    values: number[],
    offset: number | 'min' | 'max',
    valueIndex: number,
    mode: 'unit' | 'dist' = 'unit',
  ): number => {
    const min = toValue(options.min);
    const max = toValue(options.max);
    const step = toValue(options.step);
    const markList = toValue(options.markList);

    if (typeof offset === 'number') {
      const originValue = readAt(values, valueIndex, min);
      const targetDistValue = originValue + offset;

      const potentialValues: (number | null)[] = [];
      markList.forEach((mark) => {
        potentialValues.push(mark.value);
      });
      potentialValues.push(min, max);
      // 起点值本身也可能在 mark 上而不在 step 网格上
      potentialValues.push(formatStepValue(originValue));

      const sign = offset > 0 ? 1 : -1;
      if (mode === 'unit') {
        potentialValues.push(step === null ? null : formatStepValue(originValue + sign * step));
      } else {
        potentialValues.push(formatStepValue(targetDistValue));
      }

      // 先把候选收敛成 `number[]`（过滤掉 `null` / `undefined`），后面一律按 number[] 处理
      const numericValues: number[] = potentialValues.filter(
        (val): val is number => val !== null && val !== undefined,
      );
      const alignCandidates: number[] = numericValues
        // 去掉反向候选
        .filter((val) => (offset < 0 ? val <= originValue : val >= originValue))
        // unit 模式不能停在原地
        .filter((val) => (mode !== 'unit' ? true : val !== originValue));

      const compareValue = mode === 'unit' ? originValue : targetDistValue;
      let nextValue: number | undefined = alignCandidates[0];
      let valueDist = nextValue === undefined ? Infinity : Math.abs(nextValue - compareValue);
      alignCandidates.forEach((potentialValue) => {
        const dist = Math.abs(potentialValue - compareValue);
        if (dist < valueDist) {
          nextValue = potentialValue;
          valueDist = dist;
        }
      });

      if (nextValue === undefined) {
        return offset < 0 ? min : max;
      }
      if (mode === 'dist') {
        return nextValue;
      }
      if (Math.abs(offset) > 1) {
        const cloneValues = [...values];
        cloneValues[valueIndex] = nextValue;
        return offsetValue(cloneValues, offset - sign, valueIndex, mode);
      }
      return nextValue;
    }
    if (offset === 'min') return min;
    if (offset === 'max') return max;
    return max;
  };

  /** 同 `offsetValue`，额外回传「是否真的变了」（推送循环的收敛判据）。 */
  const offsetChangedValue = (
    values: number[],
    offset: number | 'min' | 'max',
    valueIndex: number,
    mode: 'unit' | 'dist' = 'unit',
  ): { value: number; changed: boolean } => {
    const originValue = values[valueIndex];
    const nextValue = offsetValue(values, offset, valueIndex, mode);
    return { value: nextValue, changed: nextValue !== originValue };
  };

  /** 间距不够时要推：`pushable === null` ⇒ 完全不允许重叠；数字 ⇒ 小于该间距就推。 */
  const needPush = (dist: number): boolean => {
    const pushable = toValue(options.pushable);
    return (
      (pushable === null && dist === 0) ||
      (typeof pushable === 'number' && dist < (pushable as number))
    );
  };

  const offsetValues = (
    values: number[],
    offset: number | 'min' | 'max',
    valueIndex: number,
    mode: 'unit' | 'dist' = 'unit',
  ): { value: number; values: number[] } => {
    const min = toValue(options.min);
    const max = toValue(options.max);
    const allowCross = toValue(options.allowCross);
    const pushable = toValue(options.pushable);

    const nextValues = values.map(formatValue);
    const originValue = readAt(nextValues, valueIndex, min);
    const [minBound, maxBound] = getDisabledBoundaryValues(
      nextValues,
      valueIndex,
      min,
      max,
      pushable,
      isHandleDisabled,
    );
    const nextValue = offsetValue(nextValues, offset, valueIndex, mode);
    nextValues[valueIndex] = nextValue;
    if (minBound <= maxBound) {
      nextValues[valueIndex] = Math.max(
        minBound,
        Math.min(maxBound, readAt(nextValues, valueIndex, originValue)),
      );
    } else {
      nextValues[valueIndex] = originValue;
    }

    if (allowCross === false) {
      // >>>>> 不允许交叉：被邻居挤住
      const pushNum = (pushable as number) || 0;
      if (valueIndex > 0 && readAt(nextValues, valueIndex - 1, min) !== originValue) {
        nextValues[valueIndex] = Math.max(
          readAt(nextValues, valueIndex, originValue),
          readAt(nextValues, valueIndex - 1, min) + pushNum,
        );
      }
      if (
        valueIndex < nextValues.length - 1 &&
        readAt(nextValues, valueIndex + 1, max) !== originValue
      ) {
        nextValues[valueIndex] = Math.min(
          readAt(nextValues, valueIndex, originValue),
          readAt(nextValues, valueIndex + 1, max) - pushNum,
        );
      }
    } else if (typeof pushable === 'number' || pushable === null) {
      // >>>>> 可交叉 + 可推挤：四段循环（顺序不可改，见文件头判据 5）
      // Basic push：先把右侧推走
      for (let i = valueIndex + 1; i < nextValues.length; i += 1) {
        if (isHandleDisabled(i)) break;
        let changed = true;
        while (needPush(readAt(nextValues, i, max) - readAt(nextValues, i - 1, min)) && changed) {
          ({ value: nextValues[i], changed } = offsetChangedValue(nextValues, 1, i));
        }
        const [, itemMaxBound] = getDisabledBoundaryValues(
          nextValues,
          i,
          min,
          max,
          pushable,
          isHandleDisabled,
        );
        nextValues[i] = Math.min(readAt(nextValues, i, max), itemMaxBound);
      }
      // Basic push：再把左侧推走
      for (let i = valueIndex; i > 0; i -= 1) {
        if (isHandleDisabled(i - 1)) break;
        let changed = true;
        while (needPush(readAt(nextValues, i, max) - readAt(nextValues, i - 1, min)) && changed) {
          ({ value: nextValues[i - 1], changed } = offsetChangedValue(nextValues, -1, i - 1));
        }
        const [itemMinBound] = getDisabledBoundaryValues(
          nextValues,
          i - 1,
          min,
          max,
          pushable,
          isHandleDisabled,
        );
        nextValues[i - 1] = Math.max(readAt(nextValues, i - 1, min), itemMinBound);
      }
      // Revert：End → Start
      for (let i = nextValues.length - 1; i > 0; i -= 1) {
        if (isHandleDisabled(i) || isHandleDisabled(i - 1)) continue;
        let changed = true;
        while (needPush(readAt(nextValues, i, max) - readAt(nextValues, i - 1, min)) && changed) {
          ({ value: nextValues[i - 1], changed } = offsetChangedValue(nextValues, -1, i - 1));
        }
        const [itemMinBound] = getDisabledBoundaryValues(
          nextValues,
          i - 1,
          min,
          max,
          pushable,
          isHandleDisabled,
        );
        nextValues[i - 1] = Math.max(readAt(nextValues, i - 1, min), itemMinBound);
      }
      // Revert：Start → End
      for (let i = 0; i < nextValues.length - 1; i += 1) {
        if (isHandleDisabled(i) || isHandleDisabled(i + 1)) continue;
        let changed = true;
        while (needPush(readAt(nextValues, i + 1, max) - readAt(nextValues, i, min)) && changed) {
          ({ value: nextValues[i + 1], changed } = offsetChangedValue(nextValues, 1, i + 1));
        }
        const [, itemMaxBound] = getDisabledBoundaryValues(
          nextValues,
          i + 1,
          min,
          max,
          pushable,
          isHandleDisabled,
        );
        nextValues[i + 1] = Math.min(readAt(nextValues, i + 1, max), itemMaxBound);
      }
    }

    return { value: nextValues[valueIndex], values: nextValues };
  };

  return { formatValue, offsetValues };
}
