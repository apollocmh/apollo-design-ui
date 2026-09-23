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
export const toTaggedKey = (oriKey: ListyKey, type: ListyKeyType): string => `${type}:${oriKey}`;

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
export function collectGroupSegments<T>(
  data: T[],
  group: ListyGroup<T, ListyKey> | undefined,
): Map<ListyKey, GroupSegmentItem<T>[]> {
  const map = new Map<ListyKey, GroupSegmentItem<T>[]>();
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
  return typeof rowKey === 'function' ? rowKey(item) : (item as Record<string, ListyKey>)[rowKey];
}

// ============================== flatten rows ==============================

/** 虚拟路径的扁平行。 */
export type FlatRow<T> =
  | { type: 'group'; groupKey: ListyKey; taggedKey: string }
  | { type: 'item'; item: T; index: number; taggedKey: string };

/**
 * 分组数据扁平化：组头行 + 项行（按组首次出现顺序，保留原始下标）。
 * 上游 `useFlattenRows`——注意 `groupKeyToItems` 的值是**原始项数组**（供 title 用）。
 */
export function flattenRows<T>(
  data: T[],
  group: ListyGroup<T, ListyKey> | undefined,
  getItemKey: (item: T) => ListyKey,
): {
  rows: FlatRow<T>[];
  groupKeys: ListyKey[];
  groupKeyToItems: Map<ListyKey, T[]>;
  /** 项行 taggedKey → 所属组键（吸顶偏移用；只记录扁平化时命中的组）。 */
  itemKeyToGroupKey: Map<string, ListyKey>;
} {
  const rows: FlatRow<T>[] = [];
  const groupKeys: ListyKey[] = [];
  const groupKeyToItems = new Map<ListyKey, T[]>();
  const itemKeyToGroupKey = new Map<string, ListyKey>();

  const itemRow = (item: T, index: number): FlatRow<T> => {
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

/** Raw 吸顶：量目标项所在 section 的 sticky 组头高度（上游 `getStickyHeaderHeight`）。 */
export function getStickyHeaderHeight(
  targetElement: HTMLElement,
  prefixCls: string,
  stickyGroup: boolean,
): number {
  if (!stickyGroup) {
    return 0;
  }
  const groupSection = targetElement.closest(`.${CSS.escape(`${prefixCls}-group-section`)}`);
  const groupHeader = groupSection?.querySelector(`.${CSS.escape(`${prefixCls}-group-header`)}`);
  if (!groupHeader) {
    return 0;
  }
  const rect = groupHeader.getBoundingClientRect();
  const height = rect.height || rect.bottom - rect.top || (groupHeader as HTMLElement).offsetHeight;
  return Number.isFinite(height) ? height : 0;
}

/** 用 scrollMargin 占位 + scrollIntoView 实现「滚动到目标」（上游 `scrollTargetIntoView`）。 */
export function scrollTargetIntoView(
  targetElement: HTMLElement,
  align: ListyScrollAlign,
  offset: number,
  isItem: boolean,
  prefixCls: string,
  stickyGroup: boolean,
): void {
  const headerOffset =
    isItem && align !== 'bottom' ? getStickyHeaderHeight(targetElement, prefixCls, stickyGroup) : 0;
  const prevTop = targetElement.style.scrollMarginTop;
  const prevBottom = targetElement.style.scrollMarginBottom;
  targetElement.style.scrollMarginTop = `${headerOffset + offset}px`;
  targetElement.style.scrollMarginBottom = `${offset}px`;
  targetElement.scrollIntoView({
    block: align === 'bottom' ? 'end' : align === 'auto' ? 'nearest' : 'start',
    inline: 'nearest',
  });
  targetElement.style.scrollMarginTop = prevTop;
  targetElement.style.scrollMarginBottom = prevBottom;
}

/**
 * Raw 模式的 `scrollTo`（上游 `useRawListScroll` 的 scrollTo 主体）。
 * `config == null` ⇒ no-op。
 */
export function scrollRawList(
  holder: HTMLElement | null,
  config: Exclude<import('../interface').ListyScrollToConfig, null> | null | undefined,
  prefixCls: string,
  stickyGroup: boolean,
): void {
  if (!holder || config == null) {
    return;
  }
  if (typeof config === 'number') {
    holder.scrollTop = config;
    return;
  }
  if ('key' in config || 'groupKey' in config) {
    const { align = 'auto', offset = 0 } = config;
    const isItem = 'key' in config;
    const targetKey = isItem
      ? toTaggedKey((config as { key: ListyKey }).key, 'item')
      : toTaggedKey((config as { groupKey: ListyKey }).groupKey, 'group');
    const targetElement = holder.querySelector(`[data-key="${CSS.escape(targetKey)}"]`);
    if (targetElement) {
      scrollTargetIntoView(
        targetElement as HTMLElement,
        align,
        offset,
        isItem,
        prefixCls,
        stickyGroup,
      );
    }
    return;
  }
  const { left, top } = config as { left?: number; top?: number };
  if (left !== undefined) {
    holder.scrollLeft = left;
  }
  if (top !== undefined) {
    holder.scrollTop = top;
  }
}

// ============================== virtual sticky ==============================

/** 吸顶判定容差（上游 `HEADER_TOP_TOLERANCE`）。 */
const HEADER_TOP_TOLERANCE = 1;

/**
 * 视口顶所在组的下标（二分；上游 `findActiveHeaderIndex`）。
 * `getHeaderTop` 返回组头行的 top。
 */
export function findActiveHeaderIndex(
  groupKeys: ListyKey[],
  getHeaderTop: (groupKey: ListyKey) => number,
  scrollTop: number,
): number {
  let left = 0;
  let right = groupKeys.length - 1;
  let activeIndex = 0;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (getHeaderTop(groupKeys[mid] as ListyKey) <= scrollTop + HEADER_TOP_TOLERANCE) {
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
