import type { AlignPoint, HorizontalPoint, Rect, VerticalPoint } from './types';

/**
 * 把 'tl' 这样的两字符点拆成 [垂直, 水平] 两个分量。
 *
 * antd 的实现是 `splitPoints(points = '')` → `[points[0], points[1]]`，
 * 对空串会返回 [undefined, undefined]，靠后续 fallthrough 到 center。
 * 这里显式兜底为 'c'，语义等价但类型安全。
 */
export function splitPoints(point: string): [VerticalPoint, HorizontalPoint] {
  const v = point[0] as VerticalPoint | undefined;
  const h = point[1] as HorizontalPoint | undefined;
  return [v ?? 'c', h ?? 'c'];
}

export interface Point {
  x: number;
  y: number;
}

/**
 * 求矩形上某个对齐点的坐标。
 *
 * 't' → 上边，'b' → 下边，其它（含 'c'）→ 垂直中心
 * 'l' → 左边，'r' → 右边，其它（含 'c'）→ 水平中心
 */
export function getAlignPoint(rect: Rect, point: readonly [VerticalPoint, HorizontalPoint]): Point {
  const [vertical, horizontal] = point;

  let y: number;
  if (vertical === 't') y = rect.y;
  else if (vertical === 'b') y = rect.y + rect.height;
  else y = rect.y + rect.height / 2;

  let x: number;
  if (horizontal === 'l') x = rect.x;
  else if (horizontal === 'r') x = rect.x + rect.width;
  else x = rect.x + rect.width / 2;

  return { x, y };
}

/** 从矩形按点取坐标的便捷重载：直接传 'tl' 这样的字符串。 */
export function alignPointOf(rect: Rect, point: AlignPoint | string): Point {
  return getAlignPoint(rect, splitPoints(point));
}

const REVERSE_MAP = { t: 'b', b: 't', l: 'r', r: 'l' } as const;

/**
 * 翻转某个分量：t↔b，l↔r，c 保持 c。
 *
 * @param point 长度为 2 的分量数组
 * @param index 0 = 垂直分量，1 = 水平分量
 */
export function reversePoint(
  point: readonly [VerticalPoint, HorizontalPoint],
  index: 0 | 1,
): [VerticalPoint, HorizontalPoint] {
  const current = point[index];
  const reversed = REVERSE_MAP[current as 't' | 'b' | 'l' | 'r'] ?? 'c';
  return index === 0
    ? [reversed as VerticalPoint, point[1]]
    : [point[0], reversed as HorizontalPoint];
}

/** ['t','c'] → 'tc' */
export function flatPoint(point: readonly [VerticalPoint, HorizontalPoint]): string {
  return `${point[0]}${point[1]}`;
}
