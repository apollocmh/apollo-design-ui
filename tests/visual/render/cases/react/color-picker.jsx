/**
 * React 侧（antd 6.6.4）的 ColorPicker 视觉用例。与 `vue/color-picker.js` 逐条对应。
 *
 * ── 浮层怎么进截图区域（与 popover 同判）────────────────────────────────────────
 *
 * `open` 受控静态帧 + `placement="bottomLeft"` + `autoAdjustOverflow={false}`
 * 钉死落点（tooltip / popover 期结论：翻转几何由 position 包 oracle 承担）。
 * 浮层经 Portal 挂 `body`，但它的落点就在触发器下方、落在 `#stage` 的包围盒里
 * ⇒ `screenshotElement('#stage')` 拍得到（`#stage` 的高度由用例盒子的 `minHeight` 撑开）。
 *
 * ⚠️ 与 `date-picker` 的**区别**：这里**不**传 `getPopupContainer` —— ColorPicker 的
 * 面板宽度固定 234px、落点由 `placement` 唯一决定，不需要把浮层搬进用例盒子。
 *
 * ── 为什么不测 `children`（自定义触发器）──────────────────────────────────────
 *
 * 本仓 `children` 走默认插槽 ⇒ Popover 的 `#default` 拿到**数组** ⇒ Trigger 会多包一层
 * `<span>`（上游是单个元素、无包装）。这是**已知的 DOM 差异**（L4 的
 * `color-picker:children` 已如实登记，归 D79），不是 L6 该承担的
 * ⇒ 不为它造一条注定红的变体。
 */

import { ColorPicker } from 'antd';
import {
  COLOR_PICKER_BOX_STYLE,
  COLOR_PICKER_GRADIENT,
  COLOR_PICKER_PRESETS,
  COLOR_PICKER_VALUE,
} from '../shared.mjs';

/** 用例盒子：`minHeight` 撑开 `#stage`，让 Portal 出来的面板落进截图区。 */
const box = (children, minHeight) => (
  <div style={{ ...COLOR_PICKER_BOX_STYLE, minHeight: `${minHeight}px` }}>{children}</div>
);

/** 触发器 + 受控静态帧面板（落点钉死）。 */
const picker = (props, minHeight) =>
  box(<ColorPicker placement="bottomLeft" autoAdjustOverflow={false} {...props} />, minHeight);

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
