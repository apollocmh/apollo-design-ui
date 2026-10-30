/**
 * Watermark 的嵌套面板上下文（antd 的 `es/watermark/context.js` 对应物）。
 *
 * `usePanelRef` 给「可继承水印的面板」（未来的 Modal / Drawer 等）用：
 * 把面板内层元素注册进父级 Watermark，让水印也覆盖到 Teleport 出去的浮层。
 * antd 用 `panelRef` 回调 + context；Vue 侧同构 —— 回调 ref 函数可直接绑到元素上。
 */

import { getElement, isHTMLElement } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  type InjectionKey,
  inject,
  type MaybeRefOrGetter,
  onScopeDispose,
  onUpdated,
  provide,
  toValue,
  watch,
} from 'vue';

export interface WatermarkContextValue {
  add: (ele: HTMLElement) => void;
  remove: (ele: HTMLElement | null) => void;
}

const VOID_FUNC = () => {};

export const watermarkContextKey: InjectionKey<WatermarkContextValue> = Symbol('apolloWatermark');

const DEFAULT_CONTEXT: WatermarkContextValue = { add: VOID_FUNC, remove: VOID_FUNC };

/**
 * 取最近的 Watermark 上下文（没有则退化为空实现）。
 *
 * ⚠️ `usePanelRef` 与 Watermark 本体**共用**这个入口（Issue #49）：Watermark 需要在
 *    provide 之前先拿到父级 context，才能在 `inherit=false` 时把登记「往上交」。
 */
export function useWatermarkContext(): WatermarkContextValue {
  return inject(watermarkContextKey, DEFAULT_CONTEXT);
}

/** Register the current native panel host with the nearest inheriting watermark. */
export function usePanelRef(
  panelSelector?: MaybeRefOrGetter<string | undefined>,
): (element: Element | ComponentPublicInstance | null) => void {
  const watermark = useWatermarkContext();
  let current: Element | ComponentPublicInstance | null = null;
  let panel: HTMLElement | null = null;

  const sync = () => {
    const root = getElement(current);
    const selector = toValue(panelSelector);
    const next = isHTMLElement(root)
      ? selector
        ? root.querySelector<HTMLElement>(selector)
        : root
      : null;
    if (next === panel) return;
    if (panel) watermark.remove(panel);
    panel = next;
    if (panel) watermark.add(panel);
  };
  watch(() => toValue(panelSelector), sync, { flush: 'post' });
  onUpdated(sync);
  onScopeDispose(() => {
    current = null;
    sync();
  });
  return (element) => {
    current = element;
    sync();
  };
}

/** 供 Watermark 本体 provide。 */
export function provideWatermark(context: WatermarkContextValue): void {
  provide(watermarkContextKey, context);
}
