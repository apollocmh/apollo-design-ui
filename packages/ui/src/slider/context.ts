/**
 * slider/context.ts —— rc-slider `context.js` 的 Vue 等价物。
 *
 * 两个 context：
 *   1. `SliderContext`：Slider 向下广播的运行期读值（子组件**只读**）——
 *      min/max/direction/step/included/includedStart/includedEnd/range/tabIndex/
 *      aria 系列/styles/classNames/isHandleDisabled；
 *   2. `UnstableContext`：rc 标了 `@private NOT PROMISE AVAILABLE` 的**观测钩子**
 *      （`onDragStart` / `onDragChange`）。⚠️ 名字里的 Unstable 是上游的**契约声明**，
 *      本仓照原样保留 `unstableSliderContextKey` —— 内部用它做拖拽观测（测试与
 *      antd 的 image demo 同源用法），**不对外导出**。
 *
 * ⚠️ Vue 用 `provide/inject`，所以广播的是**响应式对象**（rc 每次渲染重建对象）。
 *    子组件读 `ctx.xxx` 即可拿到最新值（见 PITFALLS 195：读到 ref 本身是坑）。
 */

import type { ComputedRef, InjectionKey } from 'vue';
import type {
  SliderDirection,
  SliderMarkObject,
  SliderSemanticClassNames,
  SliderSemanticStyles,
} from './interface';

/** `SliderContext` 的值形状（逐字段对应 rc 的 createContext 默认值）。 */
export interface SliderContextValue {
  min: number;
  max: number;
  direction: SliderDirection;
  /** ⚠️ 禁用态是**复合**的：`disabled = 全部把手禁用`。 */
  disabled: boolean;
  keyboard: boolean;
  step: number | null;
  included: boolean;
  /** 已选区间的起点/终点值（给 Track / Dot / Mark 判「激活」用）。 */
  includedStart: number;
  includedEnd: number;
  range: boolean;
  tabIndex?: number | number[];
  ariaLabelForHandle?: string | string[];
  ariaLabelledByForHandle?: string | string[];
  ariaRequired?: boolean;
  ariaValueTextFormatterForHandle?: ((value: number) => string) | ((value: number) => string)[];
  styles: SliderSemanticStyles;
  classNames: SliderSemanticClassNames;
  isHandleDisabled: (index: number) => boolean;
}

export const sliderContextKey: InjectionKey<SliderContextValue> = Symbol('apolloSliderContext');

/** `UnstableContext`（rc 的观测钩子）。 */
export interface UnstableSliderContextValue {
  onDragStart?: (info: {
    rawValues: number[];
    draggingIndex: number;
    draggingValue: number;
  }) => void;
  onDragChange?: (info: {
    rawValues: number[];
    deleteIndex: number;
    draggingIndex: number;
    draggingValue: number | null;
  }) => void;
}

export const unstableSliderContextKey: InjectionKey<UnstableSliderContextValue> = Symbol(
  'apolloUnstableSliderContext',
);

/** marks 归一后的形态（内部用；对外是 `SliderMarks`）。 */
export interface NormalizedMark extends SliderMarkObject {
  value: number;
}

/** `SliderInternalContext`（antd 层）：给 `handleRender` / icon-slider demo 用的注入通道。 */
export interface SliderInternalContextValue {
  handleRender?: (node: unknown, info: { index: number }) => unknown;
  direction?: 'ltr' | 'rtl';
}

export const sliderInternalContextKey: InjectionKey<ComputedRef<SliderInternalContextValue>> =
  Symbol('apolloSliderInternalContext');
