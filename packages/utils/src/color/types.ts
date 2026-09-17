import type { Color } from './color';

/**
 * 颜色的输入输出类型。
 *
 * 这些结构与 CSS 的 `rgb()` / `hsl()` / `hsv()` 三种记法一一对应，
 * 不沿用上游的名称（`Palette` / `ColorInput` …），因为语义不完全重合。
 */

/** RGB 记法。`a` 省略时为 1；取值 0–1（不是 0–255）。 */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/** HSL 记法。`h` 为 0–360，`s` / `l` 为 0–1。 */
export interface HslColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

/** HSV（= HSB）记法。`h` 为 0–360，`s` / `v` 为 0–1。 */
export interface HsvColor {
  h: number;
  s: number;
  v: number;
  a?: number;
}

/** 对象形态的颜色输入。三个通道齐全的那一组决定记法。 */
export type ColorObject = RgbColor | HslColor | HsvColor;

/**
 * {@link Color} 接受的输入。
 *
 * 字符串形态支持 `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa` 与
 * `rgb()` / `rgba()` / `hsl()` / `hsla()` / `hsv()` / `hsb()`，
 * 通道可以是整数或百分比，alpha 支持 `, 0.5` 与 `/ 50%` 两种写法。
 *
 * ⚠️ **不支持 CSS 颜色名**（`red` / `aliceblue` …）。上游的 `@ant-design/fast-color`
 * 内置了 148 个名字的查表；那是一份**色值数据**，放在 L0 的通用工具包里会与
 * `ARCHITECTURE.md` R3（L0 不含色值字面量）冲突。本库的色值只可能来自 Token，
 * 而 Token 全是 hex / rgb() 记法，所以这条差异不影响任何已知路径。
 */
export type ColorInput = string | ColorObject | Color;

/** 解析后的不透明通道，供外部直接消费。 */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}
