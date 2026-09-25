/**
 * `useListPosition` —— rc `hooks/useListPosition/index.js` 的 Vue 版。
 *
 * 从**最新到最旧**倒着走一遍，算出每条 notice 的 `--notification-y` 偏移与列表总高。
 * 三条必须逐字保留的判据：
 *   1. **倒序遍历**（`slice().reverse()`）—— 每条要排在「它下面的那些」之后；
 *   2. 堆叠态下 `y = offsetY + stack.offset - height`（往上叠，露出 offset 像素），
 *      非堆叠态 `offsetY += height + gap`（gap 是列表的 CSS `row-gap` 实测值）；
 *   3. `index === 0`（即**最新**那条）的高度/宽度写入 `--top-notificiation-*`
 *      —— 折叠占位条靠它算宽度。
 *   4. 总高只累加「阈值内」的条目（`index < stackThreshold`）—— 折叠后列表不占满高度。
 */
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { NoticeListConfig, StackConfig } from '../interface';
import { type NodeSize, useSizes } from './useSizes';

export interface UseListPositionResult {
  position: ComputedRef<Map<string, number>>;
  setNodeSize: (key: string, node: { offsetWidth: number; offsetHeight: number } | null) => void;
  totalHeight: ComputedRef<number>;
  topNoticeHeight: ComputedRef<number>;
  topNoticeWidth: ComputedRef<number>;
}

export function useListPosition(
  configList: MaybeRefOrGetter<NoticeListConfig[]>,
  stack: MaybeRefOrGetter<StackConfig | undefined>,
  gap: MaybeRefOrGetter<number>,
): UseListPositionResult {
  const { sizeMap, setNodeSize } = useSizes();

  const layout = computed(() => {
    let offsetY = 0;
    let totalHeight = 0;
    const stackValue = toValue(stack);
    const stackThreshold = stackValue?.threshold ?? 0;
    const position = new Map<string, number>();
    let topNoticeHeight = 0;
    let topNoticeWidth = 0;
    const gapValue = toValue(gap);

    const list = toValue(configList);
    for (let index = 0; index < list.length; index += 1) {
      // 倒序：index 0 是**最新**的一条
      const config = list[list.length - 1 - index];
      if (!config) continue;
      const key = String(config.key);
      const size: NodeSize | undefined = sizeMap.value[key];
      const height = size?.height ?? 0;
      const y = stackValue && index > 0 ? offsetY + (stackValue.offset ?? 0) - height : offsetY;
      position.set(key, y);
      if (index === 0) {
        topNoticeHeight = height;
        topNoticeWidth = size?.width ?? 0;
      }
      if (!stackValue || index < stackThreshold) {
        totalHeight = Math.max(totalHeight, y + height);
      }
      if (stackValue) {
        offsetY = y + height;
      } else {
        offsetY += height + gapValue;
      }
    }

    return { position, totalHeight, topNoticeHeight, topNoticeWidth };
  });

  return {
    position: computed(() => layout.value.position),
    setNodeSize,
    totalHeight: computed(() => layout.value.totalHeight),
    topNoticeHeight: computed(() => layout.value.topNoticeHeight),
    topNoticeWidth: computed(() => layout.value.topNoticeWidth),
  };
}
