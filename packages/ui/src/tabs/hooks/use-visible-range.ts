/**
 * 可见区间（rc `hooks/useVisibleRange.js` 的纯函数等价物）。
 *
 * 返回 `[startIndex, endIndex]`（**闭区间**）。两个特殊值：
 *   - `tabs` 为空 ⇒ `[0, 0]`
 *   - `startIndex > endIndex` ⇒ `[0, -1]`（**空区间**的哨兵，不是 `[0, 0]`）
 *
 * ⚠️ 三个字段随方向切换（这是最容易抄错的地方）：
 *
 * | 方向 | `charUnit` | `position` | `transformSize` |
 * |---|---|---|---|
 * | 横向（top/bottom） | `'width'` | **RTL 用 `'right'`、LTR 用 `'left'`** | `abs(transform)` |
 * | 纵向（left/right） | `'height'` | `'top'` | `-transform` |
 *
 * ⚠️ 判据用的是 **`Math.floor` 之后的比较**（`floor(offset[pos] + offset[unit]) >
 *    floor(transformSize + visible)`）—— 不是浮点直接比较。去掉 floor 会让
 *    「刚好贴边」的页签在缩放/小数尺寸下忽隐忽现。
 */

import type { TabPosition } from '../interface';
import { isTopOrBottom } from '../util';
import type { TabOffset } from './use-offsets';

const DEFAULT_SIZE: TabOffset = { width: 0, height: 0, left: 0, top: 0, right: 0 };

export interface VisibleRangeOptions {
  keys: readonly string[];
  tabPosition: TabPosition;
  rtl: boolean;
}

/** 可见区间（闭区间）。 */
export type VisibleRange = [number, number];

/**
 * 计算可见区间。
 *
 * @param tabOffsets              偏移表
 * @param visibleTabContentValue  可用于显示页签的宽度/高度（已扣掉 extra / operation / add）
 * @param transform               当前位移
 * @param tabContentSizeValue     页签内容的总宽度/高度
 * @param addNodeSizeValue        「+」按钮的尺寸
 * @param operationNodeSizeValue  溢出下拉触发器的尺寸
 */
export function getVisibleRange(
  tabOffsets: ReadonlyMap<string, TabOffset>,
  visibleTabContentValue: number,
  transform: number,
  tabContentSizeValue: number,
  addNodeSizeValue: number,
  operationNodeSizeValue: number,
  { keys, tabPosition, rtl }: VisibleRangeOptions,
): VisibleRange {
  if (!keys.length) return [0, 0];

  const topOrBottom = isTopOrBottom(tabPosition);
  const charUnit: 'width' | 'height' = topOrBottom ? 'width' : 'height';
  const position: 'left' | 'right' | 'top' = topOrBottom ? (rtl ? 'right' : 'left') : 'top';
  const transformSize = topOrBottom ? Math.abs(transform) : -transform;

  // 下面两个参数只参与上游的 memo 依赖（判据里不出现），显式 void 掉以免被误当成漏用。
  void tabContentSizeValue;
  void addNodeSizeValue;
  void operationNodeSizeValue;

  const len = keys.length;

  let endIndex = len;
  for (let i = 0; i < len; i += 1) {
    const key = keys[i];
    const offset = (key !== undefined ? tabOffsets.get(key) : undefined) ?? DEFAULT_SIZE;
    if (
      Math.floor(offset[position] + offset[charUnit]) >
      Math.floor(transformSize + visibleTabContentValue)
    ) {
      endIndex = i - 1;
      break;
    }
  }

  let startIndex = 0;
  for (let i = len - 1; i >= 0; i -= 1) {
    const key = keys[i];
    const offset = (key !== undefined ? tabOffsets.get(key) : undefined) ?? DEFAULT_SIZE;
    if (offset[position] < transformSize) {
      startIndex = i + 1;
      break;
    }
  }

  return startIndex > endIndex ? [0, -1] : [startIndex, endIndex];
}

/**
 * 位移到目标页签（rc `scrollToTab` 的纯函数部分）。
 *
 * 横向：LTR 看 `left`、RTL 看 `right + width`；纵向看 `top + height`。
 * 只有当页签**跑出可视区间**时才改位移，否则保持原值（避免微小抖动）。
 *
 * 返回值是**未夹取**的新位移（夹取由调用方用 `alignInRange` 做，与上游同构）。
 */
export function getScrollToTabTransform(
  offset: TabOffset,
  transform: number,
  visibleTabContentValue: number,
  topOrBottom: boolean,
  rtl: boolean,
): number {
  if (topOrBottom) {
    let newTransform = transform;
    if (rtl) {
      if (offset.right < transform) {
        newTransform = offset.right;
      } else if (offset.right + offset.width > transform + visibleTabContentValue) {
        newTransform = offset.right + offset.width - visibleTabContentValue;
      }
    } else if (offset.left < -transform) {
      newTransform = -offset.left;
    } else if (offset.left + offset.width > -transform + visibleTabContentValue) {
      newTransform = -(offset.left + offset.width - visibleTabContentValue);
    }
    return newTransform;
  }

  let newTransform = transform;
  if (offset.top < -transform) {
    newTransform = -offset.top;
  } else if (offset.top + offset.height > -transform + visibleTabContentValue) {
    newTransform = -(offset.top + offset.height - visibleTabContentValue);
  }
  return newTransform;
}
