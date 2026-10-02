/**
 * ColorPicker 的两条**组件级 context**（antd `es/color-picker/context.js` 的 Vue 对应物）。
 *
 * ── 与上游的形态差异（PLATFORM）────────────────────────────────────────────────
 *
 * 上游是 React Context（值在每次渲染时**重新创建**）；本仓按 `slider/context.ts` 的
 * 既有手法，注入的是 **`ComputedRef`** —— 消费方读 `ctx.value.xxx`，依赖可追踪、
 * 且不会因为父组件重渲染而丢掉引用。
 *
 * ── 两条 context 的职责（判据来自 `ColorPickerPanel.tsx`）────────────────────────
 *
 * | context | 谁 provide | 谁 inject |
 * |---|---|---|
 * | `panelPickerContextKey` | `ColorPickerPanel` | `PanelPicker` / `GradientColorBar` / `ColorInput` 家族 / `ColorClear` |
 * | `panelPresetsContextKey` | `ColorPickerPanel` | `PanelPresets` → `ColorPresets` |
 *
 * ⚠️ `PanelPicker` 把 `panelPickerContext` 的**剩余字段**（`injectProps`）整体透传给
 * `ColorClear` 与 `ColorInput` —— 所以这两条链上的字段名必须与上游逐字一致。
 */

import type { ComputedRef, InjectionKey } from 'vue';
import type { AggregationColor } from './color';
import type { ModeOptions } from './hooks/use-mode-color';
import type { ColorFormatType, ModeType, PresetsItem } from './interface';

/** `PanelPickerContext` 的值面。 */
export interface PanelPickerContextValue {
  prefixCls: string;
  allowClear?: boolean;
  disabled?: boolean;
  disabledAlpha?: boolean;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  modeOptions: ModeOptions;

  value: AggregationColor;
  /**
   * 值变化。
   *
   * ⚠️ 第二个参数 `pickColor` 是「是否来自取色面板的拖拽」——
   * `ColorPicker` 用它决定**要不要发 `onChangeComplete`**（拖拽期间不发）。
   */
  onChange: (value: AggregationColor, pickColor?: boolean) => void;
  onChangeComplete: (value: AggregationColor) => void;

  format?: ColorFormatType;
  onFormatChange?: (format?: ColorFormatType) => void;

  /** 渐变条上被激活的手柄下标。 */
  activeIndex: number;
  /** 渐变条手柄激活变化。 */
  onActive: (index: number) => void;
  /** 渐变条是否正在拖拽。 */
  gradientDragging: boolean;
  /** 渐变条拖拽状态变化。 */
  onGradientDragging: (dragging: boolean) => void;

  onClear?: () => void;
  disabledFormat?: boolean;
}

/** `PanelPresetsContext` 的值面。 */
export interface PanelPresetsContextValue {
  prefixCls: string;
  presets?: PresetsItem[];
  disabled?: boolean;
  value: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

export const panelPickerContextKey: InjectionKey<ComputedRef<PanelPickerContextValue>> = Symbol(
  'apolloColorPickerPanelPickerContext',
);

export const panelPresetsContextKey: InjectionKey<ComputedRef<PanelPresetsContextValue>> = Symbol(
  'apolloColorPickerPanelPresetsContext',
);
