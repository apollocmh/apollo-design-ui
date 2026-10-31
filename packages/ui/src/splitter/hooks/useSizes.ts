/**
 * `useSizes` —— 尺寸状态：px/百分比 → 归一化百分比 → px。
 * 契约来源：antd 6.6.4 `es/splitter/hooks/useSizes.js`（逐行对拍）。
 */

import { isNonNullable } from '@apollo-design/utils';
import { type Ref, shallowReactive, toRef } from 'vue';
import { autoPtgSizes, getPtg, isPtg } from './sizeUtil';
import type { PanelKey, SplitterItem } from './useItems';

export interface UseSizesResult {
  /** SSR / 未测量容器时给开发者的原值；测量后为 px。 */
  panelSizes: Ref<(number | string | undefined)[]>;
  pxSizes: Ref<number[]>;
  ptgSizes: Ref<number[]>;
  ptgMinSizes: Ref<number[]>;
  ptgMaxSizes: Ref<number[]>;
  /** 非受控尺寸写入（拖拽 / 折叠后）。 */
  setInnerSizes: (sizes: (number | string | undefined)[]) => void;
  rememberAccepted: () => void;
  rememberInitial: (key: PanelKey, size: number | string | undefined) => void;
  forget: (key: PanelKey) => void;
}

export function useSizes(
  items: Ref<SplitterItem[]>,
  containerSize: Ref<number | undefined>,
): UseSizesResult {
  // Panel identity owns its accepted/local size; slot order is only the current layout.
  const innerSizes = shallowReactive(new Map<PanelKey, number | string | undefined>());
  const propSizes = toRef(() => items.value.map((item) => item.size));
  const controlled = () => propSizes.value.some(isNonNullable);
  const setInnerSizes = (sizes: (number | string | undefined)[]): void => {
    if (controlled()) return;
    items.value.forEach((item, index) => {
      innerSizes.set(item.key, sizes[index]);
    });
  };
  const rememberAccepted = (): void => {
    if (!controlled()) return;
    items.value.forEach((item) => {
      if (!innerSizes.has(item.key) || innerSizes.get(item.key) !== item.size) {
        innerSizes.set(item.key, item.size);
      }
    });
  };
  const itemsCount = toRef(() => items.value.length);
  const mergedContainerSize = toRef(() => containerSize.value || 0);
  const sizes = toRef((): (number | string | undefined)[] =>
    controlled()
      ? propSizes.value
      : items.value.map((item) =>
          innerSizes.has(item.key) ? innerSizes.get(item.key) : item.defaultSize,
        ),
  );

  const postPercentMinSizes = toRef((): number[] =>
    items.value.map((item) => {
      if (isPtg(item.min)) {
        return getPtg(item.min);
      }
      return (item.min || 0) / mergedContainerSize.value;
    }),
  );

  const postPercentMaxSizes = toRef((): number[] =>
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
  const postPercentSizes = toRef((): number[] => {
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

  const postPxSizes = toRef((): number[] =>
    postPercentSizes.value.map((ptg) => ptg * mergedContainerSize.value),
  );

  // If ssr, we will use the size from developer config first.
  const panelSizes = toRef((): (number | string | undefined)[] =>
    containerSize.value ? postPxSizes.value : sizes.value,
  );

  return {
    panelSizes,
    pxSizes: postPxSizes,
    ptgSizes: postPercentSizes,
    ptgMinSizes: postPercentMinSizes,
    ptgMaxSizes: postPercentMaxSizes,
    setInnerSizes,
    rememberAccepted,
    rememberInitial: (key, size) => {
      if (!innerSizes.has(key)) innerSizes.set(key, size);
    },
    forget: (key) => innerSizes.delete(key),
  };
}
