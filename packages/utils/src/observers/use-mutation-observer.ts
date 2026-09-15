/**
 * `useMutationObserver` —— DOM 变更监听。
 *
 * 契约来源：`@rc-component/mutate-observer@2.0.1`（antd 的 `image` / `masonry` 等使用）。
 *
 * 与 `useResizeObserver` 同样的取舍：**不用 VueUse 的实现**，因为我们要求
 * 「同一元素 + 同一回调只注册一次」，且需要与 rc-mutate-observer 相同的
 * `observe` / `disconnect` 生命周期语义。
 *
 * 默认只观察 `{ attributes: true, childList: true, subtree: true }` ——
 * 这是 rc-mutate-observer 的默认值，调用方通常不覆盖。
 */

import { getCurrentScope, type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

export type MutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

const elementCallbacks = new Map<Element, Set<MutationCallback>>();
const elementObservers = new Map<Element, MutationObserver>();
const elementOptions = new Map<Element, MutationObserverInit>();

let supported: boolean | null = null;

function isSupported(): boolean {
  if (supported === null) {
    supported = typeof MutationObserver !== 'undefined';
  }
  return supported;
}

/** rc-mutate-observer 的默认配置。 */
export const DEFAULT_MUTATION_OPTIONS: MutationObserverInit = {
  attributes: true,
  childList: true,
  subtree: true,
};

/**
 * 注册一个变更监听。
 *
 * 同一元素上多次调用会**共用一个 MutationObserver 实例**（回调集合合并），
 * 但 `options` 取**第一次**注册时的值 —— 因为一个 observer 只能有一份配置。
 * 若后续调用传入不同 options，会被忽略（这是刻意的：混用配置的语义无法定义）。
 *
 * @returns 注销函数。
 */
export function observeMutation(
  element: Element,
  callback: MutationCallback,
  options?: MutationObserverInit,
): () => void {
  if (!isSupported()) {
    return () => {};
  }

  let callbacks = elementCallbacks.get(element);
  if (!callbacks) {
    callbacks = new Set();
    elementCallbacks.set(element, callbacks);
    elementOptions.set(element, options ?? DEFAULT_MUTATION_OPTIONS);

    const mo = new MutationObserver((mutations, obs) => {
      const current = elementCallbacks.get(element);
      if (!current) return;
      for (const cb of [...current]) {
        cb(mutations, obs);
      }
    });
    elementObservers.set(element, mo);
    mo.observe(element, elementOptions.get(element));
  }
  callbacks.add(callback);

  return () => {
    const current = elementCallbacks.get(element);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      elementObservers.get(element)?.disconnect();
      elementObservers.delete(element);
      elementCallbacks.delete(element);
      elementOptions.delete(element);
    }
  };
}

/** 测试辅助：重置全部 observer。生产代码不应调用。 */
export function resetMutationObserver(): void {
  for (const mo of elementObservers.values()) {
    mo.disconnect();
  }
  elementObservers.clear();
  elementCallbacks.clear();
  elementOptions.clear();
  supported = null;
}

export interface UseMutationObserverOptions {
  target: MaybeRefOrGetter<Element | null | undefined>;
  onMutate?: MutationCallback;
  options?: MutationObserverInit;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

export function useMutationObserver(options: UseMutationObserverOptions): void {
  const { target, onMutate, options: observerOptions, disabled } = options;

  let stop: (() => void) | undefined;

  const release = (): void => {
    stop?.();
    stop = undefined;
  };

  const sync = (): void => {
    release();
    if (toValue(disabled)) return;
    const element = toValue(target);
    if (!element || !onMutate) return;
    stop = observeMutation(element, onMutate, observerOptions);
  };

  watch([() => toValue(target), () => toValue(disabled)], sync, { immediate: true, flush: 'post' });

  if (getCurrentScope()) {
    onScopeDispose(release);
  }
}
