/**
 * useDisplaySteps —— maxCount 折叠算法（G4 产物）。
 *
 * 契约来源：antd 6.6.4 `components/steps/useDisplaySteps.ts`（151 行，纯算法逐字移植）。
 * 规则：首 / 末 / 当前恒保留；其余槽位按「当前左侧、当前右侧、首右侧、末左侧」的
 * 距离优先补齐；非连续下标之间插入 `originIndex: -1` 的 ellipsis 占位（渲染层转成
 * 禁用省略步，status 反映隐藏区段的进度/error）。
 */

import type { StepItem, StepsStatus } from './interface';

export interface DisplayStep {
  item: StepItem;
  originIndex: number;
}

export interface UseDisplayStepsResult {
  canApplyMaxCount: boolean;
  displaySteps: DisplayStep[];
  mappedDisplayCurrent: number;
  displayItems: StepItem[];
}

/** 折叠省略步：title 空、icon 在渲染层注入（EllipsisOutlined）、disabled。 */
function getEllipsisStep(
  items: StepItem[],
  currentIndex: number,
  prevIndex: number,
  nextIndex: number,
  prefixCls: string,
): DisplayStep {
  const prevKey = items[prevIndex]?.key ?? prevIndex;
  const nextKey = items[nextIndex]?.key ?? nextIndex;
  const hasError = items.slice(prevIndex + 1, nextIndex).some((step) => step.status === 'error');
  const ellipsisStatus: StepsStatus = hasError
    ? 'error'
    : nextIndex - 1 < currentIndex
      ? 'finish'
      : 'wait';

  return {
    item: {
      key: `ellipsis-${prevKey}-${nextKey}`,
      title: '',
      status: ellipsisStatus,
      disabled: true,
      className: `${prefixCls}-item-ellipsis`,
    },
    originIndex: -1,
  };
}

/** 折叠保留的下标集合（null 占位由调用方插入）。单测直接消费。 */
export function getCollapsedIndexes(
  total: number,
  currentIndex: number,
  maxCount: number,
): Array<number | null> {
  const safeCurrent = Math.min(Math.max(currentIndex, 0), total - 1);
  const targetCount = Math.min(maxCount, total);
  const indexes = new Set<number>([0, safeCurrent, total - 1]);

  for (let distance = 1; indexes.size < targetCount && distance < total; distance += 1) {
    const candidates = [
      safeCurrent - distance,
      safeCurrent + distance,
      distance,
      total - 1 - distance,
    ];

    for (const index of candidates) {
      if (indexes.size >= targetCount) {
        break;
      }
      if (index >= 0 && index < total) {
        indexes.add(index);
      }
    }
  }

  return Array.from(indexes)
    .sort((a, b) => a - b)
    .flatMap((index, order, sortedIndexes) =>
      order > 0 && index - (sortedIndexes[order - 1] as number) > 1 ? [null, index] : [index],
    );
}

export function useDisplaySteps(
  mergedItems: StepItem[],
  current: number,
  initial: number,
  maxCount: number | undefined,
  prefixCls: string,
): UseDisplayStepsResult {
  const canApplyMaxCount = maxCount !== undefined && maxCount >= 3 && mergedItems.length > maxCount;

  const mappedCurrent = current - initial;

  const displaySteps: DisplayStep[] = (() => {
    if (!canApplyMaxCount) {
      return mergedItems.map((item, originIndex) => ({ item, originIndex }));
    }

    const collapsedIndexes = getCollapsedIndexes(mergedItems.length, mappedCurrent, maxCount);

    return collapsedIndexes.map((index, collapsedIndex) =>
      index === null
        ? getEllipsisStep(
            mergedItems,
            mappedCurrent,
            collapsedIndexes[collapsedIndex - 1] as number,
            collapsedIndexes[collapsedIndex + 1] as number,
            prefixCls,
          )
        : {
            // index 来自折叠集合，必在 [0, len) 内
            item: {
              ...mergedItems[index]!,
              key: mergedItems[index]!.key ?? index,
            },
            originIndex: index,
          },
    );
  })();

  const displayCurrent = displaySteps.findIndex((step) => step.originIndex === mappedCurrent);

  return {
    canApplyMaxCount,
    displaySteps,
    mappedDisplayCurrent: displayCurrent >= 0 ? displayCurrent : mappedCurrent,
    displayItems: displaySteps.map((step) => step.item),
  };
}
