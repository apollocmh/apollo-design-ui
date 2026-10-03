/**
 * ColorPicker 的公共导出。
 *
 * 与 antd 的 `es/color-picker/index.js` 对齐的对外面。
 * ⚠️ 上游的 `index.js` 只导出 `ColorPicker`（default）+ 两个**类型**
 * （`AggregationColor as Color`、`ColorPickerProps`）；本仓按仓内约定多导出
 * 样式生成器与 `prepareComponentToken`（与 popover / calendar 同判）。
 */

import { withInstall } from '../_internal/with-install';
import ColorPickerComponent from './ColorPicker.vue';
import PurePanelComponent from './PurePanel';

/** ColorPicker 组件。注册名 `AColorPicker`（COMPONENT-RULES.md 规则 R2）。 */
export const ColorPicker = withInstall(ColorPickerComponent);

/** 静态面板（`ColorPicker._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const ColorPickerPurePanel = withInstall(PurePanelComponent);

ColorPicker._InternalPanelDoNotUseOrYouWillBeFired = ColorPickerPurePanel;

export { ColorPickerPanel } from './ColorPickerPanel';
/**
 * `AggregationColor` 的**类型**导出（上游 `export type { AggregationColor as Color }`）。
 *
 * ⚠️ 只导类型、不导值 —— 上游 `index.js` 里也是 `export type`。
 * 需要**值**（构造颜色）的消费方走 `@apollo-design/utils` 的 `Color`。
 */
/**
 * `Color` 的顶层别名（KNOWN-ISSUES §1.8 已补）：顶层 `Color` 极易撞名，
 * 按「重名用别名」约定导成 `ColorPickerColor`（与 `SelectInfo as CalendarSelectInfo` 同判）。
 */
export type { AggregationColor as Color, AggregationColor as ColorPickerColor } from './color';
export type {
  ColorFormatType,
  ColorGenInput,
  ColorPickerEmits,
  ColorPickerPanelRenderExtra,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
  ColorPickerSemanticType,
  ColorPickerSemanticValue,
  ColorPickerSlots,
  ColorValueType,
  LineGradientType,
  ModeType,
  PresetsItem,
  SingleValueType,
  TriggerPlacement,
  TriggerType,
} from './interface';
export { FORMAT_HEX, FORMAT_HSB, FORMAT_RGB } from './interface';
export { genColorPickerStyle, genColorPickerTokenDecls } from './style';
export type { ComponentToken as ColorPickerComponentToken } from './style/token';
export {
  COLOR_PICKER_DERIVED_KEYS,
  colorPickerDerived,
  prepareComponentToken as prepareColorPickerComponentToken,
} from './style/token';

export default ColorPicker;
