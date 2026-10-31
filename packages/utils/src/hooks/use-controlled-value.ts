/**
 * `useControlledValue` —— 受控 / 非受控二选一的状态（Vue 版）。
 *
 * 以 Vue 公开模型值为准：受控时仅提议更新，非受控时保存本地值。
 *
 * ---------------------------------------------------------------------------
 * 什么时候用 `defineModel`，什么时候用这个？（依据：rc-util-contract.md §3.1）
 * ---------------------------------------------------------------------------
 *
 *   | 场景                                   | 用什么                                |
 *   |---------------------------------------|---------------------------------------|
 *   | SFC 里，prop + 事件是标准 `v-model` 对  | **`defineModel<T>()`**（编译器宏，首选）|
 *   | SFC 里，prop 名不是 `modelValue`        | `defineModel<T>('value')`             |
 *   | `.ts` composable 里（headless 逻辑）    | **`useControlledValue`**（本函数）     |
 *
 * 之所以还需要本函数：`defineModel` 是编译器宏，**只能出现在 `<script setup>` 里**。
 * `form-core` / `picker` 这类 headless 引擎包里的 composable 拿不到 SFC 上下文，
 * 必须有一个显式的受控/非受控实现。
 *
 * ---------------------------------------------------------------------------
 * 受控边界
 * ---------------------------------------------------------------------------
 *
 * `undefined` 表示撤销受控；此时保留最后一次实际接收的值，不泄漏父级拒绝的提议。
 * 函数式更新始终读取当前 merged 值。父级值同步接收，避免同一轮更新后撤控丢值。
 */

import { type ComputedRef, computed, shallowRef, watch } from 'vue';

export type ControlledUpdater<T> = T | ((prevValue: T) => T);

export interface UseControlledValueOptions<T> {
  /** 非受控时的初始值。函数形式只求值一次（惰性初始化）。 */
  defaultValue: T | (() => T);
  /** 读取受控值。返回 `undefined` 表示当前是非受控模式。 */
  getValue: () => T | undefined;
  /** 值变化时回调（受控模式下父级据此更新 prop）。 */
  onChange?: (value: T) => void;
}

export function useControlledValue<T>(
  options: UseControlledValueOptions<T>,
): [ComputedRef<T>, (next: ControlledUpdater<T>) => void] {
  const { defaultValue, getValue, onChange } = options;

  const initialControlled = getValue();
  const inner = shallowRef<T>(
    initialControlled !== undefined
      ? initialControlled
      : typeof defaultValue === 'function'
        ? (defaultValue as () => T)()
        : defaultValue,
  );

  const merged = computed<T>(() => {
    const controlled = getValue();
    return controlled !== undefined ? controlled : inner.value;
  });

  watch(
    getValue,
    (next) => {
      if (next !== undefined) inner.value = next;
    },
    { flush: 'sync' },
  );

  const setValue = (next: ControlledUpdater<T>): void => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(merged.value) : next;
    if (getValue() === undefined) inner.value = resolved;
    onChange?.(resolved);
  };

  return [merged, setValue];
}

export default useControlledValue;
