/**
 * `useResize` —— 拖拽 / 折叠状态机。
 * 契约来源：antd 6.6.4 `es/splitter/hooks/useResize.js`（逐行对拍）。
 */

import { computed, type Ref, ref } from 'vue';
import { getPtg } from './sizeUtil';
import type { SplitterItem } from './useItems';
import type { ResizableInfo } from './useResizable';

export interface MovingIndex {
  index: number;
  confirmed: boolean;
}

export interface UseResizeResult {
  onOffsetStart: (index: number) => void;
  /** 返回拖拽后的 pxSizes（供 onResize / lazyEnd 的 onResizeEnd 用）。 */
  onOffsetUpdate: (index: number, offset: number) => number[];
  onOffsetEnd: () => void;
  /** 折叠：返回折叠后的 pxSizes（type 来自 SplitBar 的折叠按钮方向）。 */
  onCollapse: (index: number, type: 'start' | 'end') => number[];
  movingIndex: Ref<number | undefined>;
}

export function useResize(
  items: Ref<SplitterItem[]>,
  resizableInfos: Ref<ResizableInfo[]>,
  percentSizes: Ref<number[]>,
  containerSize: Ref<number | undefined>,
  updateSizes: (sizes: (number | string | undefined)[]) => void,
  reverse: Ref<boolean>,
): UseResizeResult {
  const limitSizes = computed(() => items.value.map((item) => [item.min, item.max]));
  const mergedContainerSize = computed(() => containerSize.value || 0);

  function getLimitSize(str: number | string | undefined, defaultLimit: number): number {
    if (typeof str === 'string') {
      return getPtg(str) * mergedContainerSize.value;
    }
    return str ?? defaultLimit;
  }

  // Real px sizes
  const cacheSizes = ref<number[]>([]);
  const cacheCollapsedSize = ref<number[]>([]);
  const moving = ref<MovingIndex | null>(null);

  const getPxSizes = (): number[] =>
    percentSizes.value.map((ptg) => ptg * mergedContainerSize.value);

  const onOffsetStart = (index: number): void => {
    cacheSizes.value = getPxSizes();
    moving.value = { index, confirmed: false };
  };

  const onOffsetUpdate = (index: number, offset: number): number[] => {
    // First time trigger move index update is not sync in the state
    let confirmedIndex: number | null = null;
    // We need to know what the real index is.
    if ((!moving.value || !moving.value.confirmed) && offset !== 0) {
      // Search for the real index
      if (offset > 0) {
        confirmedIndex = index;
        moving.value = { index, confirmed: true };
      } else {
        for (let i = index; i >= 0; i -= 1) {
          if (
            (cacheSizes.value[i] ?? 0) > 0 &&
            (resizableInfos.value[i] as ResizableInfo | undefined)?.resizable
          ) {
            confirmedIndex = i;
            moving.value = { index: i, confirmed: true };
            break;
          }
        }
      }
    }

    const mergedIndex = confirmedIndex ?? moving.value?.index ?? index;
    const numSizes = [...cacheSizes.value];
    const nextIndex = mergedIndex + 1;

    // Get boundary
    const startMinSize = getLimitSize(limitSizes.value[mergedIndex]?.[0], 0);
    const endMinSize = getLimitSize(limitSizes.value[nextIndex]?.[0], 0);
    const startMaxSize = getLimitSize(
      limitSizes.value[mergedIndex]?.[1],
      mergedContainerSize.value,
    );
    const endMaxSize = getLimitSize(limitSizes.value[nextIndex]?.[1], mergedContainerSize.value);

    let mergedOffset = offset;
    // Align with the boundary
    if ((numSizes[mergedIndex] ?? 0) + mergedOffset < startMinSize) {
      mergedOffset = startMinSize - (numSizes[mergedIndex] ?? 0);
    }
    if ((numSizes[nextIndex] ?? 0) - mergedOffset < endMinSize) {
      mergedOffset = (numSizes[nextIndex] ?? 0) - endMinSize;
    }
    if ((numSizes[mergedIndex] ?? 0) + mergedOffset > startMaxSize) {
      mergedOffset = startMaxSize - (numSizes[mergedIndex] ?? 0);
    }
    if ((numSizes[nextIndex] ?? 0) - mergedOffset > endMaxSize) {
      mergedOffset = (numSizes[nextIndex] ?? 0) - endMaxSize;
    }

    // Do offset
    numSizes[mergedIndex] = (numSizes[mergedIndex] ?? 0) + mergedOffset;
    numSizes[nextIndex] = (numSizes[nextIndex] ?? 0) - mergedOffset;
    updateSizes(numSizes);
    return numSizes;
  };

  const onOffsetEnd = (): void => {
    moving.value = null;
  };

  // ======================= Collapse =======================
  const onCollapse = (index: number, type: 'start' | 'end'): number[] => {
    const currentSizes = getPxSizes();
    // RTL 时方向镜像（上游 adjustedType 同式）
    const adjustedType = reverse.value ? (type === 'start' ? 'end' : 'start') : type;
    const currentIndex = adjustedType === 'start' ? index : index + 1;
    const targetIndex = adjustedType === 'start' ? index + 1 : index;
    const currentSize = currentSizes[currentIndex] ?? 0;
    const targetSize = currentSizes[targetIndex] ?? 0;

    if (currentSize !== 0 && targetSize !== 0) {
      // Collapse directly
      currentSizes[currentIndex] = 0;
      currentSizes[targetIndex] = targetSize + currentSize;
      cacheCollapsedSize.value[index] = currentSize;
    } else {
      const totalSize = currentSize + targetSize;
      const currentSizeMin = getLimitSize(limitSizes.value[currentIndex]?.[0], 0);
      const currentSizeMax = getLimitSize(
        limitSizes.value[currentIndex]?.[1],
        mergedContainerSize.value,
      );
      const targetSizeMin = getLimitSize(limitSizes.value[targetIndex]?.[0], 0);
      const targetSizeMax = getLimitSize(
        limitSizes.value[targetIndex]?.[1],
        mergedContainerSize.value,
      );

      const limitStart = Math.max(currentSizeMin, totalSize - targetSizeMax);
      const limitEnd = Math.min(currentSizeMax, totalSize - targetSizeMin);

      const halfOffset = targetSizeMin || (limitEnd - limitStart) / 2;

      const targetCacheCollapsedSize = cacheCollapsedSize.value[index];
      const currentCacheCollapsedSize = totalSize - (targetCacheCollapsedSize ?? 0);

      const shouldUseCache =
        !!targetCacheCollapsedSize &&
        targetCacheCollapsedSize <= targetSizeMax &&
        targetCacheCollapsedSize >= targetSizeMin &&
        currentCacheCollapsedSize <= currentSizeMax &&
        currentCacheCollapsedSize >= currentSizeMin;

      if (shouldUseCache) {
        currentSizes[targetIndex] = targetCacheCollapsedSize;
        currentSizes[currentIndex] = currentCacheCollapsedSize;
      } else {
        currentSizes[currentIndex] = currentSize - halfOffset;
        currentSizes[targetIndex] = targetSize + halfOffset;
      }
    }

    updateSizes(currentSizes);
    return currentSizes;
  };

  return {
    onOffsetStart,
    onOffsetUpdate,
    onOffsetEnd,
    onCollapse,
    movingIndex: computed(() => moving.value?.index),
  };
}
