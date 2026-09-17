/**
 * 项区间尺寸查询。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/hooks/useGetSize.js`。
 *
 * 上游是 React hook（靠 `useMemo` 持有缓存），这里抽成纯工厂 ——
 * **调用方负责在「数据 / 高度代次 / itemHeight」变化时重建**，与上游的
 * `useMemo(..., [mergedData, heights.id, itemHeight])` 等价。
 */

import type { GetKey, GetSize, HeightsLookup, ItemKey } from './types';

export interface CreateSizeGetterInput<T> {
  data: readonly T[];
  getKey: GetKey<T>;
  heights: HeightsLookup;
  itemHeight: number;
}

/**
 * 造一个 `getSize(startKey, endKey?)`。
 *
 * 缓存两份：
 *   - `key2Index`：键 → 下标
 *   - `bottomList`：**累计底边**数组（`bottomList[i]` = 第 0..i 项的总高）
 *
 * ⚠️ 三处不能改的细节：
 *   1. 增量填充的起点是 **`bottomList.length`** —— 已经算过的部分不重算。
 *   2. 命中两个 key 就 `break` —— 不是把整张表算完。
 *   3. `top` 取 **`bottomList[startIndex - 1] || 0`** —— 用 `||` 而不是 `??`，
 *      所以 `bottomList[-1]` 的 `undefined` 与「累计高度恰好是 0」都会得到 0。
 *
 * ⚠️ 与上游的一处**有意**差异：`bottom` 在「key 不在 `data` 里」时上游会返回
 *    `undefined`（它的 `.d.ts` 却声明成 `number`，是个谎言）。本包按声明返回 **0**，
 *    让类型是真的。见契约文档 §5 与 `COMPATIBILITY.md`。
 */
export function createSizeGetter<T>(input: CreateSizeGetterInput<T>): GetSize {
  const { data, getKey, heights, itemHeight } = input;
  const key2Index = new Map<ItemKey, number>();
  const bottomList: number[] = [];

  return (startKey: ItemKey, endKey: ItemKey = startKey): { top: number; bottom: number } => {
    let startIndex = key2Index.get(startKey);
    let endIndex = key2Index.get(endKey);

    if (startIndex === undefined || endIndex === undefined) {
      const len = data.length;
      for (let i = bottomList.length; i < len; i += 1) {
        const item = data[i];
        if (item === undefined) {
          continue;
        }
        const key = getKey(item);
        key2Index.set(key, i);
        const cacheHeight = heights.get(key) ?? itemHeight;
        bottomList[i] = (bottomList[i - 1] || 0) + cacheHeight;
        if (key === startKey) {
          startIndex = i;
        }
        if (key === endKey) {
          endIndex = i;
        }
        if (startIndex !== undefined && endIndex !== undefined) {
          break;
        }
      }
    }

    return {
      // `bottomList[-1]` 是 undefined ⇒ 0（上游的 `|| 0`）
      top: bottomList[(startIndex ?? 0) - 1] || 0,
      // ⚠️ 这里**不能**写 `bottomList[endIndex ?? 0]` —— 那会让「键不存在」误返回
      //    第 0 项的底（一个看起来很合理的错值）。上游返回 undefined，我们按声明返回 0。
      bottom: endIndex === undefined ? 0 : (bottomList[endIndex] ?? 0),
    };
  };
}
