/**
 * `useRange` / `useDisabled` —— rc-slider 的两个小 hook 的 Vue 等价物。
 *
 * 判据（`docs/analysis/slider.md` §3.1 / §3.3）：
 *
 * `useRange(range)` ⇒ `[rangeEnabled, rangeEditable, rangeDraggableTrack, minCount, maxCount]`
 *   - `true` / 未传 ⇒ `[!!range, false, false, 0]`（⚠️ 只有**恰好 true** 才启用双把手）
 *   - 对象 ⇒ `[true, !!editable, !editable && !!draggableTrack, minCount || 0, maxCount]`
 *     ⚠️ `editable` 与 `draggableTrack` 同时给 ⇒ 告警且 **draggableTrack 置 false**
 *     ⚠️ `minCount || 0`（`minCount: 0` 与未传等价）
 *
 * `useDisabled(rawDisabled)` ⇒ `[isHandleDisabled, getDisabledState]`
 *   - 布尔 ⇒ `isHandleDisabled` 恒该值
 *   - 数组 ⇒ `isHandleDisabled(i) = !!rawDisabled[i]`
 *   - `getDisabledState(values)` ⇒ `[disabled, hasDisabledHandle]`：
 *     布尔 ⇒ `[rawDisabled, rawDisabled && values.length > 0]`；
 *     数组 ⇒ `[全部禁用, 任一禁用]`
 */

import { devUseWarning } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue, watch } from 'vue';
import type { SliderRange, SliderRangeConfig } from '../interface';

export interface UseRangeResult {
  rangeEnabled: ComputedRef<boolean>;
  rangeEditable: ComputedRef<boolean>;
  rangeDraggableTrack: ComputedRef<boolean>;
  minCount: ComputedRef<number>;
  maxCount: ComputedRef<number | undefined>;
}

const isRangeConfig = (range: unknown): range is SliderRangeConfig =>
  !!range && typeof range === 'object';

export function useRange(range: MaybeRefOrGetter<SliderRange | undefined>): UseRangeResult {
  const warn = devUseWarning('Slider');
  const rangeConfig = computed(() => toValue(range));

  // ⚠️ 告警放在 `watch` 而不是 computed getter 里：computed 的 getter 必须是纯函数
  //    （Vue 只保证「依赖变化时重算」，副作用写进去是契约外的）。
  watch(
    rangeConfig,
    (r) => {
      if (isRangeConfig(r)) {
        // ⚠️ devUseWarning 的签名是 `(valid, message)`（两参），不是 antd 的三参
        warn(!(r.editable && r.draggableTrack), '`editable` can not work with `draggableTrack`.');
      }
    },
    { immediate: true },
  );

  return {
    rangeEnabled: computed(() => !!rangeConfig.value),
    rangeEditable: computed(() => {
      const r = rangeConfig.value;
      return isRangeConfig(r) ? !!r.editable : false;
    }),
    rangeDraggableTrack: computed(() => {
      const r = rangeConfig.value;
      if (!isRangeConfig(r)) return false;
      // rc 逐字：两者互斥 ⇒ draggableTrack 被关掉（告警在 watch 里）
      return !r.editable && !!r.draggableTrack;
    }),
    minCount: computed(() => {
      const r = rangeConfig.value;
      return (isRangeConfig(r) ? r.minCount : 0) || 0;
    }),
    maxCount: computed(() => {
      const r = rangeConfig.value;
      return isRangeConfig(r) ? r.maxCount : undefined;
    }),
  };
}

export interface UseDisabledResult {
  /** 该把手是否禁用。 */
  isHandleDisabled: (index: number) => boolean;
  /** 由当前值推导 `[整体禁用, 有任一禁用]`。 */
  getDisabledState: (values: number[]) => [boolean, boolean];
}

export function useDisabled(
  rawDisabled: MaybeRefOrGetter<boolean | boolean[] | undefined>,
): UseDisabledResult {
  const isHandleDisabled = (index: number): boolean => {
    const raw = toValue(rawDisabled);
    if (typeof raw === 'boolean') return raw;
    return raw?.[index] ?? false;
  };

  const getDisabledState = (values: number[]): [boolean, boolean] => {
    const raw = toValue(rawDisabled);
    if (typeof raw === 'boolean') {
      return [raw, raw && values.length > 0];
    }
    return [
      values.length > 0 && values.every((_, index) => isHandleDisabled(index)),
      values.some((_, index) => isHandleDisabled(index)),
    ];
  };

  return { isHandleDisabled, getDisabledState };
}
