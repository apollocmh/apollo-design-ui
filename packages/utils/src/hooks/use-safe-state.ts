/**
 * `useSafeState` —— 带「已销毁保护」的状态。
 *
 * 契约来源：`@rc-component/util/hooks/useState`（antd 的 `form` 使用）。
 *
 * 语义：`setValue(next, ignoreDestroy?)`。当 `ignoreDestroy` 为 `true` 且组件已销毁时，
 * **跳过**这次更新。
 *
 * ⚠️ 为什么不做成"自动保护"（rc-util 的注释专门解释了这一点）：
 *    自动跳过会**掩盖真实的内存泄漏** —— 一个本该在卸载时被取消的异步请求，
 *    如果 setState 被静默忽略，开发者永远发现不了请求还在跑。
 *    所以必须由调用方显式声明"我知道这里可能在卸载后触发，且忽略它是安全的"。
 *
 * Vue 侧的对应问题比 React 温和：对已卸载组件的 `ref` 赋值不会报错，
 * 但会**保留对组件状态的引用**，阻止 GC。所以这个保护在 Vue 里依然有价值。
 */

import { getCurrentScope, onScopeDispose, type Ref, ref } from 'vue';

export type SetState<T> = (
  nextValue: T | ((prevValue: T) => T),
  /**
   * 为 `true` 时，组件已销毁则**不**更新。
   * 调用方需自行确认忽略这次更新是安全的。
   */
  ignoreDestroy?: boolean,
) => void;

export function useSafeState<T>(defaultValue?: T | (() => T)): [Ref<T | undefined>, SetState<T>] {
  const value = ref(
    typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue,
  ) as Ref<T | undefined>;
  let destroyed = false;

  const setState: SetState<T> = (nextValue, ignoreDestroy) => {
    if (ignoreDestroy && destroyed) {
      return;
    }
    value.value =
      typeof nextValue === 'function'
        ? (nextValue as (prev: T | undefined) => T | undefined)(value.value)
        : nextValue;
  };

  if (getCurrentScope()) {
    onScopeDispose(() => {
      destroyed = true;
    });
  }

  return [value, setState];
}

export default useSafeState;
