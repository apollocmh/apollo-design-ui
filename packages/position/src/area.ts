import type { Area, Rect } from './types';

/**
 * 浮层按 (offsetX, offsetY) 位移后，与 `area` 的相交面积。
 *
 * 这是判断「翻转后是否更好」的唯一度量 —— 翻转只在**可见面积变大**
 * （或相等但推荐区面积更大）时才被接受。
 *
 * ⚠️ 与 antd 的**有意差异**（登记为开放决策 `intersection-area-clamp`）：
 * antd 的实现是 `Math.max(0, (right - left) * (bottom - top))`，
 * 当浮层**整体**落在区域外侧时，两个差值同为负数，乘积为正 —— 于是
 * 「完全不可见」被算成一个巨大的正面积，翻转判定会据此接受一个更差的位置。
 * 这里改为**逐轴先夹到 0 再相乘**，数学上正确，且与 antd 在所有
 * 「部分相交」的常见情形下结果完全一致（两条轴都非负时两式等价）。
 *
 * 为什么改而不是复刻：本项目的规则是「antd 自身的缺陷 → 登记差异，不复刻」。
 * 且该差异只在退化情形（目标远离可视区）下才可能改变翻转结果，
 * 而那种情形 antd 自己也会因 `isVisible(target)` 为假而提前返回。
 */
export function getIntersectionArea(
  rect: Rect,
  offsetX: number,
  offsetY: number,
  area: Area,
): number {
  const left = rect.x + offsetX;
  const top = rect.y + offsetY;
  const right = left + rect.width;
  const bottom = top + rect.height;

  const width = Math.min(right, area.right) - Math.max(left, area.left);
  const height = Math.min(bottom, area.bottom) - Math.max(top, area.top);

  return Math.max(0, width) * Math.max(0, height);
}

/**
 * 用滚动容器逐级裁剪区域（antd `getVisibleArea` 的**纯数据**部分）。
 *
 * antd 版直接读 `getComputedStyle` 与 `offsetWidth/clientWidth` 来扣除边框与滚动条；
 * 这里改为接收已经算好的裁剪矩形 `clip`，使几何部分保持可测。
 * 调用方（overlay 包）负责从 DOM 计算 `clip`。
 *
 * @param initArea 初始区域（视口或文档滚动区）
 * @param clips 每个滚动容器的可视矩形，自内向外
 */
export function clipArea(initArea: Area, clips: readonly Area[]): Area {
  const visibleArea: Area = { ...initArea };
  for (const clip of clips) {
    visibleArea.left = Math.max(visibleArea.left, clip.left);
    visibleArea.top = Math.max(visibleArea.top, clip.top);
    visibleArea.right = Math.min(visibleArea.right, clip.right);
    visibleArea.bottom = Math.min(visibleArea.bottom, clip.bottom);
  }
  return visibleArea;
}

/**
 * 构造一个矩形的区域表示。
 * 与 DOMRect 的区别：DOMRect 是 x/y/width/height，溢出判定用 left/top/right/bottom 更直接。
 */
export function rectToArea(rect: Rect): Area {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  };
}
