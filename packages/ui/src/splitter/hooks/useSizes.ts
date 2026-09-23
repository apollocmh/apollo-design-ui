/**
 * `useSizes` —— 尺寸状态：px/百分比 → 归一化百分比 → px。
 * 契约来源：antd 6.6.4 `es/splitter/hooks/useSizes.js`（逐行对拍）。
 */

import { isNonNullable } from '@apollo-design/utils';
import { computed, type Ref, ref } from 'vue';
import { autoPtgSizes, getPtg, isPtg } from './sizeUtil';
import type { SplitterItem } from './useItems';

export interface UseSizesResult {
  /** SSR / 未测量容器时给开发者的原值；测量后为 px。 */
  panelSizes: Ref<(number | string | undefined)[]>;
  pxSizes: Ref<number[]>;
  ptgSizes: Ref<number[]>;
  ptgMinSizes: Ref<number[]>;
  ptgMaxSizes: Ref<number[]>;
  /** 非受控尺寸写入（拖拽 / 折叠后）。 */
  setInnerSizes: (sizes: (number | string | undefined)[]) => void;
}

export function useSizes(
  items: Ref<SplitterItem[]>,
  containerSize: Ref<number | undefined>,
): UseSizesResult {
  const innerSizes = ref<(number | string | undefined)[]>(
    items.value.map((item) => item.defaultSize),
  );

  const setInnerSizes = (sizes: (number | string | undefined)[]): void => {
    innerSizes.value = sizes;
  };

  const propSizes = computed(() => items.value.map((item) => item.size));
  const itemsCount = computed(() => items.value.length);
  const mergedContainerSize = computed(() => containerSize.value || 0);

  const sizes = computed<(number | string | undefined)[]>(() => {
    // If any panel has a `size` passed as a prop, use `propSizes` and calculate
    // all other panel sizes that don't have a `size` defined by the prop.
    // If no panel has received a value for the `size` prop, use `innerSizes`.
    return propSizes.value.some(isNonNullable) ? propSizes.value : innerSizes.value;
  });

  const postPercentMinSizes = computed<number[]>(() =>
    items.value.map((item) => {
      if (isPtg(item.min)) {
        return getPtg(item.min);
      }
      return (item.min || 0) / mergedContainerSize.value;
    }),
  );

  const postPercentMaxSizes = computed<number[]>(() =>
    items.value.map((item) => {
      if (isPtg(item.max)) {
        return getPtg(item.max);
      }
      return (item.max || mergedContainerSize.value) / mergedContainerSize.value;
    }),
  );

  // Post handle the size. Will do:
  // 1. Convert all the px into percentage if not empty.
  // 2. Get rest percentage for exist percentage.
  // 3. Fill the rest percentage into empty item.
  const postPercentSizes = computed<number[]>(() => {
    const ptgList: (number | undefined)[] = [];
    // Fill default percentage
    for (let i = 0; i < itemsCount.value; i += 1) {
      const itemSize = sizes.value[i];
      if (isPtg(itemSize)) {
        ptgList[i] = getPtg(itemSize);
      } else if (itemSize || itemSize === 0) {
        const num = Number(itemSize);
        if (!Number.isNaN(num)) {
          ptgList[i] = num / mergedContainerSize.value;
        }
      } else {
        ptgList[i] = undefined;
      }
    }
    // Use autoPtgSizes to handle the undefined sizes
    return autoPtgSizes(ptgList, postPercentMinSizes.value, postPercentMaxSizes.value);
  });

  const postPxSizes = computed<number[]>(() =>
    postPercentSizes.value.map((ptg) => ptg * mergedContainerSize.value),
  );

  // If ssr, we will use the size from developer config first.
  const panelSizes = computed<(number | string | undefined)[]>(() =>
    containerSize.value ? postPxSizes.value : sizes.value,
  );

  return {
    panelSizes,
    pxSizes: postPxSizes,
    ptgSizes: postPercentSizes,
    ptgMinSizes: postPercentMinSizes,
    ptgMaxSizes: postPercentMaxSizes,
    setInnerSizes,
  };
}
