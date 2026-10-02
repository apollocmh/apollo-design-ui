/**
 * Vue 侧（@apollo-design/ui）的 ColorPicker 视觉用例。与 `react/color-picker.jsx` 逐条对应。
 *
 * ⚠️ 浮层进截图区域的做法与 React 侧**完全对称**：`open` 受控静态帧 +
 * `placement="bottomLeft"` + `autoAdjustOverflow: false`（落点钉死）。
 * 面板经 Portal 挂 `body`，落点在 `#stage` 的包围盒内 ⇒ 拍得到。
 * 理由与「为什么不测 `children`」见 `react/color-picker.jsx` 的文件头。
 */

import { ColorPicker } from '@apollo-design/ui';
import { h } from 'vue';
import {
  COLOR_PICKER_BOX_STYLE,
  COLOR_PICKER_GRADIENT,
  COLOR_PICKER_PRESETS,
  COLOR_PICKER_VALUE,
} from '../shared.mjs';

/** 用例盒子：`minHeight` 撑开 `#stage`，让 Portal 出来的面板落进截图区。 */
const box = (children, minHeight) =>
  h('div', { style: { ...COLOR_PICKER_BOX_STYLE, minHeight: `${minHeight}px` } }, [children]);

/** 触发器 + 受控静态帧面板（落点钉死）。 */
const picker = (props, minHeight) =>
  box(h(ColorPicker, { placement: 'bottomLeft', autoAdjustOverflow: false, ...props }), minHeight);

export default {
  /** 触发器 + 面板：取色区 / 色相滑块 / alpha 滑块 / 色块 / 输入区三段。 */
  basicOpen: () => picker({ defaultValue: COLOR_PICKER_VALUE, open: true }, 560),

  /** `mode` 两档 + 渐变值 ⇒ 操作条（Segmented）+ **渐变条**。 */
  gradientOpen: () =>
    picker({ mode: ['single', 'gradient'], defaultValue: COLOR_PICKER_GRADIENT, open: true }, 620),

  /** `presets` ⇒ Divider + 预设面板（Collapse + 色块网格）。 */
  presetsOpen: () =>
    picker({ presets: COLOR_PICKER_PRESETS, defaultValue: COLOR_PICKER_VALUE, open: true }, 760),

  /** `allowClear` ⇒ 操作条里的清空按钮。 */
  allowClearOpen: () =>
    picker({ allowClear: true, defaultValue: COLOR_PICKER_VALUE, open: true }, 560),

  /** `disabledAlpha` ⇒ alpha 滑块与 alpha 输入**都消失**。 */
  disabledAlphaOpen: () =>
    picker({ disabledAlpha: true, defaultValue: COLOR_PICKER_VALUE, open: true }, 560),

  /** `showText` ⇒ 触发器右侧文本（**不开浮层**）。 */
  showText: () => picker({ showText: true, defaultValue: COLOR_PICKER_VALUE }, 88),

  /** `size="large"` ⇒ 触发器尺寸（**不开浮层**）。 */
  sizeLarge: () => picker({ size: 'large', defaultValue: COLOR_PICKER_VALUE }, 88),

  /** `size="small"` ⇒ 触发器尺寸（**不开浮层**）。 */
  sizeSmall: () => picker({ size: 'small', defaultValue: COLOR_PICKER_VALUE }, 88),

  /** 禁用态触发器（含文本 ⇒ 禁用文字色可辨）。 */
  disabled: () => picker({ showText: true, disabled: true, defaultValue: COLOR_PICKER_VALUE }, 88),
};
