/**
 * 动态高度收集。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/hooks/useHeights.js`（78 行）。
 *
 * 四条不能改的判据（契约文档 §3.5）：
 *   1. **`element.offsetParent` 为假就跳过** —— 这是「隐藏的项不测」的判据
 *      （`display: none` 时 `offsetParent` 为 `null`）。
 *      ⚠️ jsdom 下 `offsetParent` **恒为 `null`** ⇒ 收集循环一个都不收，见契约文档 §7.1。
 *   2. 高度 = **`offsetHeight` + 上下 margin**（`parseFloat` 失败按 0）。
 *   3. **只有真的变了才 `updatedMark++`** —— 否则每次收集都触发范围重算，滚动会卡。
 *   4. 非 `sync` 时用**微任务** + 自增 id 做**合并与失效**：只有最后一次的 id 匹配才执行。
 */

import { getCurrentScope, onScopeDispose, type Ref, ref } from 'vue';
import { CacheMap } from './cache';
import type { ItemKey } from './types';

/** `parseFloat` 失败按 0（上游的 `parseNumber`）。 */
function parseNumber(value: string): number {
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

/** 取元素所属文档的 `getComputedStyle`；跨 frame 时比全局的 `getComputedStyle` 正确。 */
function computedStyleOf(element: HTMLElement): CSSStyleDeclaration | null {
  const view = element.ownerDocument?.defaultView;
  return view ? view.getComputedStyle(element) : null;
}

export interface UseHeightsReturn<T> {
  /** 注册 / 注销一项的元素。`null` 表示注销 */
  setInstanceRef(item: T, element: HTMLElement | null): void;
  /**
   * 收集一遍高度。
   *
   * @param sync `true` 同步执行；默认走微任务（合并同一 tick 内的多次调用）
   */
  collectHeight(sync?: boolean): void;
  /** 高度缓存。`id` 每次 `set` 自增，可作为响应式依赖 */
  heights: CacheMap<number>;
  /** 每次「确有变化」自增。范围计算依赖它 */
  updatedMark: Ref<number>;
  /** 作废尚未执行的收集 */
  cancelPending(): void;
}

export function useHeights<T>(
  getKey: (item: T) => ItemKey,
  onItemAdd?: ((item: T) => void) | undefined,
  onItemRemove?: ((item: T) => void) | undefined,
): UseHeightsReturn<T> {
  const updatedMark = ref(0);
  const instanceMap = new Map<ItemKey, HTMLElement>();
  const heights = new CacheMap<number>();
  let promiseId = 0;

  const cancelPending = (): void => {
    promiseId += 1;
  };

  const doCollect = (): void => {
    let changed = false;

    for (const [key, element] of instanceMap) {
      // ⚠️ 判据 1：隐藏的项不测
      if (element?.offsetParent) {
        const style = computedStyleOf(element);
        const marginTop = style ? parseNumber(style.marginTop) : 0;
        const marginBottom = style ? parseNumber(style.marginBottom) : 0;
        const totalHeight = element.offsetHeight + marginTop + marginBottom;
        // ⚠️ 判据 3：只有变了才算「变化」
        if (heights.get(key) !== totalHeight) {
          heights.set(key, totalHeight);
          changed = true;
        }
      }
    }

    if (changed) {
      updatedMark.value += 1;
    }
  };

  const collectHeight = (sync = false): void => {
    cancelPending();
    if (sync) {
      doCollect();
      return;
    }
    // ⚠️ 判据 4：微任务 + id 合并
    promiseId += 1;
    const id = promiseId;
    void Promise.resolve().then(() => {
      if (id === promiseId) {
        doCollect();
      }
    });
  };

  const setInstanceRef = (item: T, element: HTMLElement | null): void => {
    const key = getKey(item);
    const origin = instanceMap.get(key);

    if (element) {
      instanceMap.set(key, element);
      collectHeight();
    } else {
      instanceMap.delete(key);
    }

    // 上游写法：`!origin !== !element` —— 比「有无」的布尔值，而不是比元素本身。
    // 同一个 key 换成另一个元素时**不**触发 add/remove。
    if (!origin !== !element) {
      if (element) {
        onItemAdd?.(item);
      } else {
        onItemRemove?.(item);
      }
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(cancelPending);
  }

  return { setInstanceRef, collectHeight, heights, updatedMark, cancelPending };
}
