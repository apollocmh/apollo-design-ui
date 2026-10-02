/**
 * ColorPicker 的四个工具函数（antd `es/color-picker/util.js` 78 行的移植）。
 *
 * 四条的判据各有一处容易写错，逐条标在函数上。
 */

import { AggregationColor } from './color';
import { Color as EngineColor } from './engine/color';
import type { ColorGenInput, ColorValueType } from './interface';

/**
 * 归一成 `AggregationColor`。**已是实例则原样返回**（不是克隆）——
 * 调用方依赖这个身份（`AggregationColor` 内部还有 `cleared` 状态）。
 */
export const generateColor = (
  color: ColorGenInput<AggregationColor> | Exclude<ColorValueType, null>,
): AggregationColor => {
  if (color instanceof AggregationColor) {
    return color;
  }
  return new AggregationColor(color);
};

/** 四舍五入（`Number(value || 0)` 兜住 `undefined` / `NaN`）。 */
export const getRoundNumber = (value: number): number => Math.round(Number(value || 0));

/**
 * alpha 的百分数。
 *
 * 🚨 **走 `toHsb().a`**（不是 `toRgb().a`）—— 两者在正常颜色上同值，但 `toHsb()`
 * 是上游选的那条路，换掉会在 hsb 输入路径上漂移。
 */
export const getColorAlpha = (color: AggregationColor): number =>
  getRoundNumber(color.toHsb().a * 100);

/**
 * 返回 alpha = 1 的同色（`alpha` 可覆盖）。
 *
 * 🚨 **rgb 全 0 时改从 `hsb` 取**（上游注释原文："Color from hsb input may get `rgb`
 * is (0/0/0) when `hsb.b` is 0"）。漏掉这条，「纯黑 + 低亮度」的颜色会被当成
 * 「透明黑」，`disabledAlpha` 的改写结果就错了。
 */
export const genAlphaColor = (color: AggregationColor, alpha?: number): AggregationColor => {
  const rgba = color.toRgb();

  if (!rgba.r && !rgba.g && !rgba.b) {
    const hsba = color.toHsb();
    hsba.a = alpha || 1;
    return generateColor(hsba);
  }

  rgba.a = alpha || 1;
  return generateColor(rgba);
};

/**
 * 渐变条上某个百分位的插值颜色（`[10%-#fff, 20%-#000]` 的 15% ⇒ `#888`）。
 *
 * 实现是：在两端各补一个 0% / 100% 的端点，再找 `percent` 落在哪一段里，
 * 用引擎 `Color.mix(endColor, ratio)` 插值后 `toRgbString()`。
 *
 * ⚠️ 与上游的一处**防御性差异**：上游假定 `colors` 非空（`colors[0].color` /
 * `colors[colors.length - 1].color` 直接取下标）。空数组在上游会抛 `TypeError`；
 * 本仓返回 `''`（与上游「理论不可达」那条 `/* istanbul ignore next *\/` 分支同值）。
 * 空数组不是可达路径（调用方只在渐变条有段时调它），登记为 PLATFORM。
 */
export const getGradientPercentColor = (
  colors: { percent: number; color: string }[],
  percent: number,
): string => {
  const first = colors[0];
  const last = colors[colors.length - 1];
  if (!first || !last) {
    return '';
  }

  const filledColors = [
    { percent: 0, color: first.color },
    ...colors,
    { percent: 100, color: last.color },
  ];

  for (let i = 0; i < filledColors.length - 1; i += 1) {
    const start = filledColors[i];
    const end = filledColors[i + 1];
    if (!start || !end) {
      continue;
    }

    const startPtg = start.percent;
    const endPtg = end.percent;
    const startColor = start.color;
    const endColor = end.color;

    if (startPtg <= percent && percent <= endPtg) {
      const dist = endPtg - startPtg;
      if (dist === 0) {
        return startColor;
      }

      const ratio = ((percent - startPtg) / dist) * 100;
      const startRcColor = new EngineColor(startColor);
      const endRcColor = new EngineColor(endColor);

      return startRcColor.mix(endRcColor, ratio).toRgbString();
    }
  }

  return '';
};
