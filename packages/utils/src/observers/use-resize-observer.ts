/**
 * `useResizeObserver` —— 尺寸变化监听。
 *
 * 契约来源：`@rc-component/resize-observer@1.1.2`（antd 的
 * `affix` / `avatar` / `masonry` / `splitter` / `typography` 使用，5 个消费者 → 够格进 L0）。
 *
 * ===========================================================================
 * 为什么不用 `@vueuse/core` 的 `useResizeObserver`（决策记录）
 * ===========================================================================
 *
 * VueUse 的实现是「**每次调用创建一个 ResizeObserver**」。
 * 而 rc-resize-observer 的契约是「**全局单例 observer + 元素 → 回调集合**」：
 *
 *   - 同一元素被多个组件监听时，只注册一次（浏览器只为每个元素派发一次 entry，
 *     多个 observer 会导致同一元素被观察多次，触发多轮回调）
 *   - 单例意味着「一个页面里有多少个监听者」与「有多少个 ResizeObserver 实例」解耦
 *
 * 这是**可观测的差异**（测试 setup 里的 `MockResizeObserver.instances` 会暴露实例数），
 * 所以不能替换。VueUse 在这件事上语义不匹配。
 *
 * ===========================================================================
 * SSR / 无 ResizeObserver 环境
 * ===========================================================================
 *
 * `typeof ResizeObserver === 'undefined'` 时**静默降级**：不监听、不抛错。
 * 调用方（浮层定位、测量）必须能容忍"永远不会收到回调"。
 */

import { getCurrentScope, type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

/** 传给回调的尺寸快照。字段与 rc-resize-observer 对齐。 */
export interface ResizeObserverSize {
  width: number;
  height: number;
  offsetWidth: number;
  offsetHeight: number;
  /** 内容区尺寸（不含 padding/border）。 */
  contentWidth: number;
  contentHeight: number;
}

export type ResizeCallback = (size: ResizeObserverSize, entry: ResizeObserverEntry) => void;

/** 元素 → 回调集合。用 `Set` 保证同一个回调重复注册只生效一次。 */
const elementCallbacks = new Map<Element, Set<ResizeCallback>>();

let observer: ResizeObserver | null = null;
let observerSupported: boolean | null = null;

function isSupported(): boolean {
  if (observerSupported === null) {
    observerSupported = typeof ResizeObserver !== 'undefined';
  }
  return observerSupported;
}

function getObserver(): ResizeObserver | null {
  if (!isSupported()) return null;
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const callbacks = elementCallbacks.get(entry.target);
        if (!callbacks) continue;
        // 快照：回调里可能注销自己，直接遍历 Set 会出问题
        for (const callback of [...callbacks]) {
          callback(toSize(entry), entry);
        }
      }
    });
  }
  return observer;
}

function toSize(entry: ResizeObserverEntry): ResizeObserverSize {
  const target = entry.target as HTMLElement;
  const box = entry.contentBoxSize?.[0];
  const contentWidth = box ? box.inlineSize : (entry.contentRect?.width ?? 0);
  const contentHeight = box ? box.blockSize : (entry.contentRect?.height ?? 0);

  return {
    width: entry.contentRect?.width ?? 0,
    height: entry.contentRect?.height ?? 0,
    offsetWidth: target.offsetWidth ?? 0,
    offsetHeight: target.offsetHeight ?? 0,
    contentWidth,
    contentHeight,
  };
}

/**
 * 注册一个尺寸监听。**同一元素 + 同一回调函数引用**只会注册一次。
 *
 * @returns 注销函数。必须调用，否则会持续持有元素与回调的引用。
 */
export function observeResize(element: Element, callback: ResizeCallback): () => void {
  const ro = getObserver();
  if (!ro) {
    return () => {};
  }

  let callbacks = elementCallbacks.get(element);
  if (!callbacks) {
    callbacks = new Set();
    elementCallbacks.set(element, callbacks);
    ro.observe(element);
  }
  callbacks.add(callback);

  return () => {
    const current = elementCallbacks.get(element);
    if (!current) return;
    current.delete(callback);
    if (current.size === 0) {
      elementCallbacks.delete(element);
      ro.unobserve(element);
    }
  };
}

/** 测试辅助：重置单例与注册表。生产代码不应调用。 */
export function resetResizeObserver(): void {
  observer?.disconnect();
  observer = null;
  elementCallbacks.clear();
  observerSupported = null;
}

export interface UseResizeObserverOptions {
  /** 被监听元素。`null` / `undefined` 时不做任何事（ref 还没就绪是常态）。 */
  target: MaybeRefOrGetter<Element | null | undefined>;
  /** 尺寸变化回调。 */
  onResize?: ResizeCallback;
  /** 为 `true` 时不监听（可用于临时挂起）。 */
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}

export function useResizeObserver(options: UseResizeObserverOptions): void {
  const { target, onResize, disabled } = options;

  let stop: (() => void) | undefined;

  const release = (): void => {
    stop?.();
    stop = undefined;
  };

  const sync = (): void => {
    release();
    if (toValue(disabled)) return;
    const element = toValue(target);
    if (!element || !onResize) return;
    stop = observeResize(element, onResize);
  };

  // immediate + flush:'post'：挂载后立刻建立监听（DOM 已就绪）
  watch([() => toValue(target), () => toValue(disabled)], sync, { immediate: true, flush: 'post' });

  if (getCurrentScope()) {
    onScopeDispose(release);
  }
}
