/**
 * 引擎的工具与**纯几何算法**（rc `es/util.js` + `es/ColorPicker.js` 的 `HUE_COLORS`）。
 *
 * ── 为什么几何要抽成纯函数（这是本组件最重要的一处重构）────────────────────────
 *
 * 上游的 `calculateColor` 直接读 `containerRef.current.getBoundingClientRect()`。
 * 本仓的 jsdom **没有布局**（所有矩形恒为 0）⇒ 那种写法在 L1 里只能测到「不崩」，
 * 算法本身一条都钉不住（`docs/analysis/color-picker.md` §5 风险 1）。
 *
 * 所以这里把「读矩形」与「算颜色」拆开：
 *   - `calculateColor(offset, containerRect, targetRect, color, type)` —— **纯**，
 *     L1 直接喂矩形就能钉死全部边界；
 *   - 拖拽 hook（`use-color-drag.ts`）负责读真实矩形再调它。
 *
 * ⚠️ 这不是行为差异：调用方读到的矩形与上游同源（`getBoundingClientRect`），
 * 计算式**逐字**照抄上游（含 `<= 0 ? 0` 与 `>= 1 ? 1` 这两处夹取）。
 */

import { Color } from './color';
import type { ColorGenInput, HsbaColorType, TransformOffset } from './interface';

/** 引擎的 `generateColor`（rc `util.js`）：已是实例则原样，否则构造。 */
export const generateColor = (color: ColorGenInput): Color =>
  color instanceof Color ? color : new Color(color);

/** 上游的默认色 `#1677ff`（= `colorPrimary`）。 */
export const defaultColor = generateColor('#1677ff');

/**
 * 色相条底图（rc `ColorPicker.js` 的 `HUE_COLORS` 逐字）。
 *
 * 7 个停靠点、`percent` 为 0/17/33/50/67/83/100（**不是** 60 的整数倍）——
 * 这是上游的手调值，照抄，别"修正"成均匀分布。
 */
export const HUE_COLORS: { color: string; percent: number }[] = [
  { color: 'rgb(255, 0, 0)', percent: 0 },
  { color: 'rgb(255, 255, 0)', percent: 17 },
  { color: 'rgb(0, 255, 0)', percent: 33 },
  { color: 'rgb(0, 255, 255)', percent: 50 },
  { color: 'rgb(0, 0, 255)', percent: 67 },
  { color: 'rgb(255, 0, 255)', percent: 83 },
  { color: 'rgb(255, 0, 0)', percent: 100 },
];

/** 一个矩形的尺寸（`getBoundingClientRect()` 里我们真正要的两个量）。 */
export interface ColorRect {
  width: number;
  height: number;
}

/**
 * 颜色 → 手柄位置（百分比）。rc `util.js` 的 `calcOffset` 逐字。
 *
 * | `type` | x | y |
 * |---|---|---|
 * | `'hue'` | `h / 360 * 100` | `50` |
 * | `'alpha'` | `a * 100` | `50` |
 * | 其它（取色面板） | `s * 100` | `(1 - b) * 100` |
 */
export function calcOffset(color: Color, type?: HsbaColorType): TransformOffset {
  const hsb = color.toHsb();
  switch (type) {
    case 'hue':
      return { x: (Number(hsb.h) / 360) * 100, y: 50 };
    case 'alpha':
      return { x: color.a * 100, y: 50 };
    default:
      return { x: Number(hsb.s) * 100, y: (1 - Number(hsb.b)) * 100 };
  }
}

/**
 * 手柄偏移 → 新颜色（rc `util.js` 的 `calculateColor`，**纯函数版**）。
 *
 * `container` 是外层可拖拽区（取色面板 / 滑块条），`target` 是手柄本身
 * （位置以手柄中心为准，所以要先补半个手柄的宽高）。
 *
 * ⚠️ 三处夹取是判据，照抄：
 *   - 取色面板：`s <= 0 ? 0`、`b >= 1 ? 1`（**只夹下界/上界**，不夹上界/下界）；
 *   - `hue`：`h <= 0 ? 0`；
 *   - `alpha`：`a <= 0 ? 0`。
 */
export function calculateColor(
  offset: TransformOffset,
  container: ColorRect,
  target: ColorRect,
  color: Color,
  type?: HsbaColorType,
): Color {
  const { width, height } = container;
  const centerOffsetX = target.width / 2;
  const centerOffsetY = target.height / 2;

  const saturation = (offset.x + centerOffsetX) / width;
  const bright = 1 - (offset.y + centerOffsetY) / height;

  const hsb = color.toHsb();
  const alphaOffset = saturation;
  const hueOffset = ((offset.x + centerOffsetX) / width) * 360;

  if (type) {
    switch (type) {
      case 'hue':
        return generateColor({ ...hsb, h: hueOffset <= 0 ? 0 : hueOffset });
      case 'alpha':
        return generateColor({ ...hsb, a: alphaOffset <= 0 ? 0 : alphaOffset });
    }
  }

  return generateColor({
    h: hsb.h,
    s: saturation <= 0 ? 0 : saturation,
    b: bright >= 1 ? 1 : bright,
    a: hsb.a,
  });
}
