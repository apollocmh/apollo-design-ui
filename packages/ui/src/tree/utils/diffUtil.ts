/**
 * Tree 的展开 motion diff 工具（rc `utils/diffUtil.js` 的逐字移植）。
 *
 * NodeList 在 expandedKeys 变化时用这两函数找「刚展开/收起的那一个 key」，
 * 在平铺数据里挖洞插入 MotionFlattenData 哨兵播放动画（rc 判据：长度差恒为 1）。
 */

/** 找出展开集变化的那个 key；`add` 表示展开，`false`+null 表示无单键 diff。 */
export function findExpandedKeys(
  prev: TreeKeyLike[] = [],
  next: TreeKeyLike[] = [],
): { add: boolean; key: TreeKeyLike | null } {
  const prevLen = prev.length;
  const nextLen = next.length;
  if (Math.abs(prevLen - nextLen) !== 1) {
    return { add: false, key: null };
  }
  function find(shorter: TreeKeyLike[], longer: TreeKeyLike[]): TreeKeyLike | null {
    const cache = new Map<TreeKeyLike, boolean>();
    shorter.forEach((key) => {
      cache.set(key, true);
    });
    const keys = longer.filter((key) => !cache.has(key));
    return keys.length === 1 ? (keys[0] ?? null) : null;
  }
  if (prevLen < nextLen) {
    return { add: true, key: find(prev, next) };
  }
  return { add: false, key: find(next, prev) };
}

type TreeKeyLike = string | number;

/** 取「刚展开/收起」的 key 在新数据里的可见子树范围（motion 动画只播可见段）。 */
export function getExpandRange<T extends { key: TreeKeyLike }>(
  shorter: T[],
  longer: T[],
  key: TreeKeyLike,
): T[] {
  const shorterStartIndex = shorter.findIndex((data) => data.key === key);
  const shorterEndNode = shorter[shorterStartIndex + 1];
  const longerStartIndex = longer.findIndex((data) => data.key === key);
  if (shorterEndNode) {
    const longerEndIndex = longer.findIndex((data) => data.key === shorterEndNode.key);
    return longer.slice(longerStartIndex + 1, longerEndIndex);
  }
  return longer.slice(longerStartIndex + 1);
}
