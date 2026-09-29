/**
 * 页签偏移表（rc `hooks/useOffsets.js` 的纯函数等价物）。
 *
 * 每个 key → `{ width, height, left, top, right }`，其中 `right` 是**相对列表右端的距离**
 * （`rightOffset - left - width`，`rightOffset` 取**第一个**页签的 `left + width`）。
 *
 * ⚠️ 两条容易漏的判据：
 *   1. **缺项复用前一项的尺寸**（`tabSizes.get(tabs[i-1]?.key)`）—— 新插入的页签还没测到时，
 *      用邻居的尺寸占位，避免整排跳一下；
 *   2. `right` 的基准是**第一个页签**的右边界（`lastOffset` 变量名有误导性，它就是 `tabs[0]`），
 *      不是列表总宽 —— 所以 RTL 的 `scrollToTab` 用 `right + width` 才是「离右端多远」。
 */

import type { TabSizeTuple } from '../util';

/** 一个页签的偏移记录。 */
export interface TabOffset {
  width: number;
  height: number;
  left: number;
  top: number;
  /** 相对列表右端的距离（RTL 的横向滚动与可见区间都用它）。 */
  right: number;
}

const DEFAULT_SIZE: Omit<TabOffset, 'right'> = { width: 0, height: 0, left: 0, top: 0 };

/** 尺寸测量结果（`Map<key, [w, h, left, top]>` 的等价形态）。 */
export type TabSizeMap = ReadonlyMap<string, TabSizeTuple>;

/**
 * 生成偏移表。
 *
 * @param keys         页签 key 列表（顺序即渲染顺序）
 * @param tabSizes     测量结果
 * @param holderWidth  列表容器的滚动宽度（仅作为依赖项参与上游的 memo，不影响取值）
 */
export function getTabOffsets(
  keys: readonly string[],
  tabSizes: TabSizeMap,
  holderWidth: number,
): Map<string, TabOffset> {
  void holderWidth;
  const map = new Map<string, TabOffset>();

  const first = keys[0] !== undefined ? tabSizes.get(keys[0]) : undefined;
  const lastOffset: Omit<TabOffset, 'right'> = first
    ? { width: first[0], height: first[1], left: first[2], top: first[3] }
    : DEFAULT_SIZE;
  const rightOffset = lastOffset.left + lastOffset.width;

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (key === undefined) continue;

    let data = tabSizes.get(key);

    // Reuse last one when not exist yet
    if (!data) {
      const prevKey = keys[i - 1];
      data = (prevKey !== undefined ? tabSizes.get(prevKey) : undefined) ?? undefined;
    }

    const size: Omit<TabOffset, 'right'> = data
      ? { width: data[0], height: data[1], left: data[2], top: data[3] }
      : DEFAULT_SIZE;

    // `right` 先占位再算（上游也是先展开尺寸、再赋值 `entity.right`）
    const entity: TabOffset = { ...(map.get(key) ?? size), right: 0 };

    // Right
    entity.right = rightOffset - entity.left - entity.width;

    map.set(key, entity);
  }

  return map;
}

/** 缺省偏移（`scrollToTab` 拿不到 key 时的兜底）。 */
export const EMPTY_TAB_OFFSET: TabOffset = {
  width: 0,
  height: 0,
  left: 0,
  top: 0,
  right: 0,
};
