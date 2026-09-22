/**
 * Watermark 的嵌套面板上下文（antd 的 `es/watermark/context.js` 对应物）。
 *
 * `usePanelRef` 给「可继承水印的面板」（未来的 Modal / Drawer 等）用：
 * 把面板内层元素注册进父级 Watermark，让水印也覆盖到 Teleport 出去的浮层。
 * antd 用 `panelRef` 回调 + context；Vue 侧同构 —— 回调 ref 函数可直接绑到元素上。
 */

import { type InjectionKey, inject, onScopeDispose, provide } from 'vue';

export interface WatermarkContextValue {
  add: (ele: HTMLElement) => void;
  remove: (ele: HTMLElement | null) => void;
}

const VOID_FUNC = () => {};

export const watermarkContextKey: InjectionKey<WatermarkContextValue> = Symbol('apolloWatermark');

const DEFAULT_CONTEXT: WatermarkContextValue = { add: VOID_FUNC, remove: VOID_FUNC };

type ComponentPublicInstanceLike = { $el?: HTMLElement };

/**
 * 面板元素注册。`panelSelector` 传入时把水印挂到选择器命中的内层元素上
 * （antd 的 Modal 用它挂到 `-body`）。返回值直接绑到元素的 `ref` 上。
 */
export function usePanelRef(
  panelSelector?: string,
): (ele: HTMLElement | ComponentPublicInstanceLike | null) => void {
  const watermark = inject(watermarkContextKey, DEFAULT_CONTEXT);
  let panelEle: HTMLElement | null = null;

  const panelRef = (ele: HTMLElement | ComponentPublicInstanceLike | null) => {
    if (ele) {
      const root = ((ele as ComponentPublicInstanceLike).$el ?? ele) as HTMLElement;
      const innerContentEle = panelSelector ? root.querySelector<HTMLElement>(panelSelector) : root;
      if (innerContentEle) {
        watermark.add(innerContentEle);
        panelEle = innerContentEle;
      }
    } else {
      watermark.remove(panelEle);
    }
  };

  onScopeDispose(() => {
    watermark.remove(panelEle);
  });

  return panelRef;
}

/** 供 Watermark 本体 provide。 */
export function provideWatermark(context: WatermarkContextValue): void {
  provide(watermarkContextKey, context);
}
