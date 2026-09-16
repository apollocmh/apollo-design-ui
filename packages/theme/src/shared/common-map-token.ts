import type { CommonMapToken, SeedToken, StyleMapToken } from '../types';
import { genRadius } from './radius';

/**
 * 动效时长与线宽、圆角的公共派生。
 *
 * `toFixed(1)` 不能省：motionUnit = 0.1 时 `0 + 0.1 * 3` 在浮点下是 0.30000000000000004，
 * 直接模板化会得到 `0.30000000000000004s`。antd 用 toFixed(1) 规避，我们同。
 */
export function genCommonMapToken(
  token: Pick<SeedToken, 'motionUnit' | 'motionBase' | 'borderRadius' | 'lineWidth'>,
): CommonMapToken & { lineWidthBold: number } & Omit<StyleMapToken, 'lineWidthBold'> {
  const { motionUnit, motionBase, borderRadius, lineWidth } = token;
  return {
    motionDurationFast: `${(motionBase + motionUnit).toFixed(1)}s`,
    motionDurationMid: `${(motionBase + motionUnit * 2).toFixed(1)}s`,
    motionDurationSlow: `${(motionBase + motionUnit * 3).toFixed(1)}s`,
    lineWidthBold: lineWidth + 1,
    ...genRadius(borderRadius),
  };
}
