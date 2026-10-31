/**
 * Listy 引擎（registry `dependencies.json` 登记的 `@rc-component/listy` 替换落点，
 * strategy=in-ui → `packages/ui/src/listy/engine/`）。
 *
 * 契约来源：`@rc-component/listy@1.2.3/es/`（逐文件对拍，H2/H3 合规——行为判据，
 * 非代码搬运）。组成：
 *
 * | 本文件                       | 上游来源                     |
 * |------------------------------|------------------------------|
 * | `toTaggedKey`                | `util.js`                    |
 * | `collectGroupSegments`       | `hooks/useGroupSegments.js`  |
 * | `flattenRows`                | `VirtualList/useFlattenRows.js` |
 * | `scrollRawList` / `scrollTargetIntoView` / `getStickyHeaderHeight` | `RawList/useRawListScroll.js` |
 * | `findActiveHeaderIndex` / `stickyPush` | `VirtualList/useStickyGroupHeader.js` |
 */

import type { ListyGroup, ListyKey, ListyRowKey, ListyScrollAlign } from '../interface';

// ============================== tagged key ==============================

/** 行的类型标签（项 / 组）。 */
export type ListyKeyType = 'item' | 'group';

/**
 * 类型标签键（`item:x` / `group:x`）——虚拟行键、滚动目标、Raw 的 `data-key`
 * 共用它，保证项键与组键永不冲突。只整体构造与比较，**永不解析回去**（上游如此）。
 */
export const toTaggedKey = (oriKey: ListyKey, type: ListyKeyType): string =>
  `${type}:${typeof oriKey}:${oriKey}`;

// ============================== group segments ==============================

/** 组内条目（原始项 + 原始下标）。 */
export interface GroupSegmentItem<T> {
  item: T;
  index: number;
}

/**
 * 组键 → 组内全部条目。**按 key 聚合、不要求同 key 连续**；Map 的插入顺序
 * （组首次出现顺序）即渲染顺序。
 */
export function collectGroupSegments<T, K extends ListyKey>(
  data: T[],
  group: ListyGroup<T, K> | undefined,
): Map<K, GroupSegmentItem<T>[]> {
  const map = new Map<K, GroupSegmentItem<T>[]>();
  if (!group) {
    return map;
  }
  data.forEach((item, index) => {
    const groupKey = group.key(item);
    const groupItems = map.get(groupKey);
    const segmentItem: GroupSegmentItem<T> = { item, index };
    if (groupItems) {
      groupItems.push(segmentItem);
    } else {
      map.set(groupKey, [segmentItem]);
    }
  });
  return map;
}

/** 取项键（`rowKey` 是字段名或函数；antd `useItemKey`）。 */
export function resolveItemKey<T>(rowKey: ListyRowKey<T>, item: T): ListyKey {
  const value = typeof rowKey === 'function' ? rowKey(item) : item[rowKey];
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError('Listy rowKey must resolve to a string or number');
  }
  return value;
}

// ============================== flatten rows ==============================

/** 虚拟路径的扁平行。 */
export type FlatRow<T, K extends ListyKey = ListyKey> =
  | { type: 'group'; groupKey: K; taggedKey: string }
  | { type: 'item'; item: T; index: number; taggedKey: string };

/**
 * 分组数据扁平化：组头行 + 项行（按组首次出现顺序，保留原始下标）。
 * 上游 `useFlattenRows`——注意 `groupKeyToItems` 的值是**原始项数组**（供 title 用）。
 */
export function flattenRows<T, K extends ListyKey>(
  data: T[],
  group: ListyGroup<T, K> | undefined,
  getItemKey: (item: T) => ListyKey,
): {
  rows: FlatRow<T, K>[];
  groupKeys: K[];
  groupKeyToItems: Map<K, T[]>;
  /** 项行 taggedKey → 所属组键（吸顶偏移用；只记录扁平化时命中的组）。 */
  itemKeyToGroupKey: Map<string, K>;
} {
  const rows: FlatRow<T, K>[] = [];
  const groupKeys: K[] = [];
  const groupKeyToItems = new Map<K, T[]>();
  const itemKeyToGroupKey = new Map<string, K>();

  const itemRow = (item: T, index: number): FlatRow<T, K> => {
    const taggedKey = toTaggedKey(getItemKey(item), 'item');
    return { type: 'item', item, index, taggedKey };
  };

  if (!group) {
    data.forEach((item, index) => {
      rows.push(itemRow(item, index));
    });
    return { rows, groupKeys, groupKeyToItems, itemKeyToGroupKey };
  }

  const groupData = collectGroupSegments(data, group);
  groupData.forEach((groupItems, groupKey) => {
    groupKeyToItems.set(
      groupKey,
      groupItems.map(({ item }) => item),
    );
    groupKeys.push(groupKey);
    rows.push({ type: 'group', groupKey, taggedKey: toTaggedKey(groupKey, 'group') });
    groupItems.forEach(({ item, index }) => {
      itemKeyToGroupKey.set(toTaggedKey(getItemKey(item), 'item'), groupKey);
      rows.push(itemRow(item, index));
    });
  });

  return { rows, groupKeys, groupKeyToItems, itemKeyToGroupKey };
}

// ============================== raw scroll ==============================

/** Height of the preceding real group header in the flat Raw list. */
export function getStickyHeaderHeight(
  targetElement: HTMLElement,
  prefixCls: string,
  stickyGroup: boolean,
): number {
  if (!stickyGroup) return 0;
  let previous: Element | null = targetElement.previousElementSibling;
  while (previous && !previous.classList.contains(`${prefixCls}-group-header`)) {
    previous = previous.previousElementSibling;
  }
  if (!(previous instanceof HTMLElement)) return 0;
  return previous.getBoundingClientRect().height || previous.offsetHeight;
}

/** Scroll only this holder; scrollIntoView would also move outer scroll containers. */
export function scrollTargetIntoView(
  holder: HTMLElement,
  targetElement: HTMLElement,
  align: ListyScrollAlign,
  offset: number,
  isItem: boolean,
  prefixCls: string,
  stickyGroup: boolean,
): void {
  const header =
    isItem && align !== 'bottom' ? getStickyHeaderHeight(targetElement, prefixCls, stickyGroup) : 0;
  // A sticky header's visual rect is no longer its natural scroll target.
  const anchor = targetElement.classList.contains(`${prefixCls}-group-header`)
    ? targetElement.previousElementSibling
    : null;
  const target = (anchor ?? targetElement).getBoundingClientRect();
  const viewportTop = holder.getBoundingClientRect().top + holder.clientTop;
  const top = target.top - viewportTop + holder.scrollTop;
  const bottom = target.bottom - viewportTop + holder.scrollTop;
  let next = holder.scrollTop;
  if (align === 'top' || (align === 'auto' && top < next + header + offset)) {
    next = top - header - offset;
  } else if (
    align === 'bottom' ||
    (align === 'auto' && bottom > next + holder.clientHeight - offset)
  ) {
    next = bottom - holder.clientHeight + offset;
  }
  holder.scrollTop = Math.max(0, next);
}

export function scrollRawList<K extends ListyKey>(
  holder: HTMLElement | null,
  config: import('../interface').ListyScrollToConfig<K> | undefined,
  prefixCls: string,
  stickyGroup: boolean,
): void {
  if (!holder || config == null) return;
  if (typeof config === 'number') {
    holder.scrollTop = config;
    return;
  }
  if ('key' in config || 'groupKey' in config) {
    const targetKey =
      'key' in config ? toTaggedKey(config.key, 'item') : toTaggedKey(config.groupKey, 'group');
    const target = holder.querySelector<HTMLElement>(`[data-key="${CSS.escape(targetKey)}"]`);
    if (target) {
      scrollTargetIntoView(
        holder,
        target,
        config.align ?? 'auto',
        config.offset ?? 0,
        'key' in config,
        prefixCls,
        stickyGroup,
      );
    }
    return;
  }
  if (config.left !== undefined) holder.scrollLeft = config.left;
  if (config.top !== undefined) holder.scrollTop = config.top;
}

// ============================== virtual sticky ==============================

/** 吸顶判定容差（上游 `HEADER_TOP_TOLERANCE`）。 */
const HEADER_TOP_TOLERANCE = 1;

/**
 * 视口顶所在组的下标（二分；上游 `findActiveHeaderIndex`）。
 * `getHeaderTop` 返回组头行的 top。
 */
export function findActiveHeaderIndex<K extends ListyKey>(
  groupKeys: K[],
  getHeaderTop: (groupKey: K) => number,
  scrollTop: number,
): number {
  let left = 0;
  let right = groupKeys.length - 1;
  let activeIndex = 0;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const key = groupKeys[mid];
    if (key !== undefined && getHeaderTop(key) <= scrollTop + HEADER_TOP_TOLERANCE) {
      activeIndex = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return activeIndex;
}

/**
 * 吸顶头的 push 偏移（上游逻辑）：下一组头顶到视口顶时，把当前组头顶上去。
 * 返回 holder 坐标系的 `top`（≤ 0）；没有下一组 ⇒ 0。
 */
export function stickyPush(
  nextGroupTop: number | undefined,
  headerHeight: number,
  scrollTop: number,
): number {
  if (nextGroupTop === undefined) {
    return 0;
  }
  // 显式 undefined 判断：假值组键（0、''）也是组（上游注释原文）
  return Math.min(0, nextGroupTop - headerHeight - scrollTop);
}
