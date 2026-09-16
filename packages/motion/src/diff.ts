/**
 * 多元素的 key 四态 diff。
 *
 * **机械移植**自 `@rc-component/motion@1.3.3` `es/util/diff.js`
 * （保留 `currentIndex` 游标、`hit` 标志与「重复 key 合并」那段的就地改 status）。
 *
 * 四态：
 * | 状态 | 含义 | 下一步 |
 * |---|---|---|
 * | `add` | 本次新增 | 播放 appear/enter |
 * | `keep` | 两次都在 | 不动 |
 * | `remove` | 本次移除，**还在 DOM 里** | 播放 leave |
 * | `removed` | leave 播完 | 从列表里摘掉 |
 *
 * `remove → removed` 这一步由 `CSSMotion` 的 `onVisibleChanged` 回调驱动，
 * 不在本文件里。
 */

export const STATUS_ADD = 'add';
export const STATUS_KEEP = 'keep';
export const STATUS_REMOVE = 'remove';
export const STATUS_REMOVED = 'removed';

export type MotionKeyStatus =
  | typeof STATUS_ADD
  | typeof STATUS_KEEP
  | typeof STATUS_REMOVE
  | typeof STATUS_REMOVED;

export interface KeyObject {
  key: string;
  [extra: string]: unknown;
}

export interface KeyEntity extends KeyObject {
  status: MotionKeyStatus;
}

/** 字符串与 `{ key }` 对象都收；key 一律 `String()` 化 —— 上游就这么干的。 */
export function wrapKeyToObject(key: unknown): KeyObject {
  let keyObj: KeyObject;
  if (key && typeof key === 'object' && 'key' in key) {
    keyObj = { ...(key as Record<string, unknown>) } as KeyObject;
  } else {
    keyObj = { key } as unknown as KeyObject;
  }
  return { ...keyObj, key: String(keyObj.key) };
}

export function parseKeys(keys: readonly unknown[] = []): KeyObject[] {
  return keys.map(wrapKeyToObject);
}

export function diffKeys(
  prevKeys: readonly unknown[] = [],
  currentKeys: readonly unknown[] = [],
): KeyEntity[] {
  let list: KeyEntity[] = [];
  let currentIndex = 0;
  const currentLen = currentKeys.length;
  const prevKeyObjects = parseKeys(prevKeys);
  const currentKeyObjects = parseKeys(currentKeys);

  // Check prev keys to insert or keep
  prevKeyObjects.forEach((keyObj) => {
    let hit = false;
    for (let i = currentIndex; i < currentLen; i += 1) {
      const currentKeyObj = currentKeyObjects[i];
      if (currentKeyObj?.key === keyObj.key) {
        // New added keys should add before current key
        if (currentIndex < i) {
          list = list.concat(
            currentKeyObjects.slice(currentIndex, i).map((obj) => ({ ...obj, status: STATUS_ADD })),
          );
          currentIndex = i;
        }
        list.push({ ...currentKeyObj, status: STATUS_KEEP });
        currentIndex += 1;
        hit = true;
        break;
      }
    }

    // If not hit, it means key is removed
    if (!hit) {
      list.push({ ...keyObj, status: STATUS_REMOVE });
    }
  });

  // Add rest to the list
  if (currentIndex < currentLen) {
    list = list.concat(
      currentKeyObjects.slice(currentIndex).map((obj) => ({ ...obj, status: STATUS_ADD })),
    );
  }

  /**
   * Merge same key when it remove and add again:
   *    [1 - add, 2 - keep, 1 - remove] -> [1 - keep, 2 - keep]
   */
  const keys: Record<string, number> = {};
  list.forEach(({ key }) => {
    keys[key] = (keys[key] || 0) + 1;
  });
  const duplicatedKeys = Object.keys(keys).filter((key) => (keys[key] ?? 0) > 1);
  duplicatedKeys.forEach((matchKey) => {
    // Remove `STATUS_REMOVE` node.
    list = list.filter(({ key, status }) => key !== matchKey || status !== STATUS_REMOVE);

    // Update `STATUS_ADD` to `STATUS_KEEP`
    list.forEach((node) => {
      if (node.key === matchKey) {
        node.status = STATUS_KEEP;
      }
    });
  });

  return list;
}
