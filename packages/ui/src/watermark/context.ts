/**
 * Watermark 的嵌套面板上下文（antd 的 `es/watermark/context.js` 对应物）。
 *
 * `usePanelRef` 给「可继承水印的面板」（未来的 Modal / Drawer 等）用：
 * 把面板内层元素注册进父级 Watermark，让水印也覆盖到 Teleport 出去的浮层。
 * antd 用 `panelRef` 回调 + context；Vue 侧同构 —— 回调 ref 函数可直接绑到元素上。
 */

import {
  type InjectionKey,
  inject,
  type MaybeRefOrGetter,
  onScopeDispose,
  provide,
  toValue,
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

type ComponentPublicInstanceLike = { $el?: HTMLElement };

/**
 * 面板元素注册。`panelSelector` 传入时把水印挂到选择器命中的内层元素上
 * （antd 的 Modal 用它挂到 `-body`）。返回值直接绑到元素的 `ref` 上。
 *
 * ⚠️ `panelSelector` 收 `MaybeRefOrGetter`：Modal 的选择器含 `prefixCls`，前缀可运行时变更
 * ⇒ 必须每次 ref 回调现读（传普通字符串 = setup 快照，换前缀后选择器连不上，Issue #19.2）。
 */
export function usePanelRef(
  panelSelector?: MaybeRefOrGetter<string | undefined>,
): (ele: HTMLElement | ComponentPublicInstanceLike | null) => void {
  const watermark = useWatermarkContext();
  let panelEle: HTMLElement | null = null;

  const panelRef = (ele: HTMLElement | ComponentPublicInstanceLike | null) => {
    if (ele) {
      const root = ((ele as ComponentPublicInstanceLike).$el ?? ele) as HTMLElement;
      const selector = toValue(panelSelector);
      const innerContentEle = selector ? root.querySelector<HTMLElement>(selector) : root;
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
