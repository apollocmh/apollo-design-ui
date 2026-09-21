/**
 * BorderBeam 的判据纯函数。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/util.js`（逐字对齐，供 L1 直测）。
 */

import { isString } from '@apollo-design/utils';
import type { BorderBeamColor, BorderBeamGradient } from './interface';

export const DEFAULT_BORDER_BEAM_DURATION = 6;

/** 尾部保留淡出区的上限（用户 0–100 线性映射到这里）。 */
export const MAX_BEAM_COLOR_STOP_PERCENT = 70;

const getLinearGradient = (...colorStops: string[]): string =>
  `linear-gradient(to left, ${colorStops.join(', ')}, transparent)`;

const normalizeBorderBeamColor = (value: BorderBeamColor | undefined): BorderBeamGradient[] =>
  isString(value) ? [{ color: value, percent: 0 }] : (value ?? []);

const fillGradientEnd = (items: BorderBeamGradient[]): BorderBeamGradient[] => {
  const lastItem = items[items.length - 1];
  if (!lastItem || lastItem.percent === 100) {
    return items;
  }
  return [...items, { ...lastItem, percent: 100 }];
};

/**
 * 用户按整段描述的 0–100 色标，线性映射到可见流光段（0–70%）：
 * 缩放而不是截断，`30` 保持「可见段的前三分之一」的观感。
 */
const getMappedBeamColorStopPercent = (percent: number): number =>
  Number(((Math.min(Math.max(percent, 0), 100) / 100) * MAX_BEAM_COLOR_STOP_PERCENT).toFixed(2));

const normalizeGradientItems = (items: BorderBeamGradient[]): BorderBeamGradient[] =>
  fillGradientEnd(items).map((item) => ({
    ...item,
    percent: getMappedBeamColorStopPercent(item.percent),
  }));

/** 由纯色或显式色标构建流光渐变（尾部保留淡出段）。 */
export const getBorderBeamGradient = (value: BorderBeamColor | undefined): string | undefined => {
  const normalizedStops = normalizeGradientItems(normalizeBorderBeamColor(value));
  return normalizedStops.length
    ? getLinearGradient(...normalizedStops.map((item) => `${item.color} ${item.percent}%`))
    : undefined;
};

/** 4 元组同值比较（useBorderSize 的去重判据）。 */
export const isSameBorderWidth = (left: readonly number[], right: readonly number[]): boolean =>
  left[0] === right[0] && left[1] === right[1] && left[2] === right[2] && left[3] === right[3];
