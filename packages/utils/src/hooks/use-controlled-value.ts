/**
 * `useControlledValue` —— 受控 / 非受控二选一的状态（Vue 版）。
 *
 * 契约来源：`@rc-component/util/hooks/useControlledState`（antd 侧 22 个组件使用，
 * 是使用面第二广的 hook）。
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
 * 与 React 版的语义对照
 * ---------------------------------------------------------------------------
 *
 *   React:  merged = value !== undefined ? value : inner
 *           useLayoutEffect([value]) 在**非首次**时 inner = value
 *   Vue:    merged = computed(() => getValue() !== undefined ? getValue() : inner)
 *           watch(getValue, v => inner = v)   ← 无 immediate，天然跳过首次
 *
 * `watch` 不带 `immediate` 恰好等价于 React 版"跳过首次挂载"的标记，不需要额外状态。
 *
 * 「受控 → 非受控」切换时 `inner` 会被重置为 `undefined`，这是 rc-util 的既定行为
 * （它注释里叫 "Sync value back to `undefined` when it from control to un-control"），
 * 我们保留。
 *
 * ⚠️ `setValue` 的函数式更新以 **`inner`** 为基准，不是 `merged`。
 *    这与 React 版一致（React 的 setState 也基于 innerValue）。
 *    差异只在"受控且父级未回传"的瞬时窗口内可见，正常用法下两者相等。
 */

import { type ComputedRef, computed, type Ref, ref, watch } from 'vue';

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

  const inner = ref(
    typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue,
  ) as Ref<T>;

  const merged = computed<T>(() => {
    const controlled = getValue();
    return controlled !== undefined ? controlled : inner.value;
  });

  // 非首次的 value 变化 → 同步回 inner（含"受控变非受控"时重置为 undefined）
  watch(getValue, (next) => {
    inner.value = next as T;
  });

  const setValue = (next: ControlledUpdater<T>): void => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(inner.value) : next;
    inner.value = resolved;
    onChange?.(resolved);
  };

  return [merged, setValue];
}

export default useControlledValue;
