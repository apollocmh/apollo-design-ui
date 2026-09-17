/**
 * 列表差异定位。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/utils/algorithmUtil.js:39-80`
 * （`findListDiffIndex`）。**机械移植**，保留变量名与求值顺序。
 *
 * ⚠️ 同文件的 `getIndexByStartLoc` **不移植** —— 在 1.5.1 里它没有任何调用者
 *    （死导出）。移植死代码只会增加未被测试覆盖的面。见契约文档 §6.3。
 */

import type { GetKey, ItemKey } from './types';

export interface ListDiffResult {
  /** 第一个不同的下标 */
  index: number;
  /** 是否「不止一处差异」（长度差 > 1，或下一项也不同） */
  multiple: boolean;
}

/**
 * 哨兵：表示「这个位置没有项」。
 *
 * ⚠️ **必须是模块级唯一对象**。`shortList` 与 `longList` 在同一下标都可能缺项，
 *    那时两者都取到**同一个**哨兵，`!==` 才成立（即「这一位不算差异」）。
 *    改成每次新建对象，`shortKey !== longKey` 会恒为真，函数立刻失效。
 */
const NOT_EXIST_KEY = { __EMPTY_ITEM__: true } as const;

type DiffKey = ItemKey | typeof NOT_EXIST_KEY;

/**
 * 假设两个列表**只有一个项不同、其余保持顺序**，用一次线性扫描找出那个项。
 *
 * 注意几处「看起来可以简化但不能改」的地方：
 *
 *   1. 长度相等时 `longList = originList`（`originLen < targetLen` 才交换）——
 *      相等时选谁当 long 会影响「先比到哪一位」，进而在「多个差异」时给出不同答案。
 *   2. `multiple` 的初值是 **`Math.abs(originLen - targetLen) !== 1`** ——
 *      「长度差不是 1」本身就意味着多处差异，不需要扫。
 *   3. `multiple` 的二次判定比的是 **`shortList[i]` vs `longList[i + 1]`**（跨一位），
 *      不是 `longList[i]` —— 这是「插入/删除一项」与「替换一项」的区分方式。
 *   4. 两个空列表返回 `null`；非空但无差异也返回 `null`。
 */
export function findListDiffIndex<T>(
  originList: readonly T[],
  targetList: readonly T[],
  getKey: GetKey<T>,
): ListDiffResult | null {
  const originLen = originList.length;
  const targetLen = targetList.length;

  if (originLen === 0 && targetLen === 0) {
    return null;
  }

  let shortList: readonly (T | undefined)[];
  let longList: readonly (T | undefined)[];
  if (originLen < targetLen) {
    shortList = originList;
    longList = targetList;
  } else {
    shortList = targetList;
    longList = originList;
  }

  const getItemKey = (item: T | undefined): DiffKey =>
    item !== undefined ? getKey(item) : NOT_EXIST_KEY;

  let diffIndex: number | null = null;
  // 长度差不是 1 ⇒ 一定是多处差异
  let multiple = Math.abs(originLen - targetLen) !== 1;

  for (let i = 0; i < longList.length; i += 1) {
    const shortKey = getItemKey(shortList[i]);
    const longKey = getItemKey(longList[i]);
    if (shortKey !== longKey) {
      diffIndex = i;
      multiple = multiple || shortKey !== getItemKey(longList[i + 1]);
      break;
    }
  }

  return diffIndex === null ? null : { index: diffIndex, multiple };
}
