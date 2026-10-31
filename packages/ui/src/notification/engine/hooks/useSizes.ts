/**
 * `useSizes` —— rc `hooks/useListPosition/useSizes.js` 的 Vue 版。
 *
 * 按 key 记录**实测**节点尺寸（`offsetWidth/offsetHeight`），供堆叠定位使用。
 * 判据（逐字对齐上游）：
 *   - 节点卸载（`null`）⇒ 删除该 key；不存在则不触发更新；
 *   - 尺寸与上次相同 ⇒ **不触发更新**（否则每次测量都会引发一轮重渲染）。
 */
import { type Ref, shallowRef } from 'vue';

import type { NoticeKey } from '../interface';

export interface NodeSize {
  width: number;
  height: number;
}

export interface UseSizesResult {
  sizeMap: Ref<Map<NoticeKey, NodeSize>>;
  setNodeSize: (key: NoticeKey, node: { offsetWidth: number; offsetHeight: number } | null) => void;
}

export function useSizes(): UseSizesResult {
  const sizeMap = shallowRef(new Map<NoticeKey, NodeSize>());

  const setNodeSize = (
    key: NoticeKey,
    node: { offsetWidth: number; offsetHeight: number } | null,
  ): void => {
    if (!node) {
      if (!sizeMap.value.has(key)) return;
      const next = new Map(sizeMap.value);
      next.delete(key);
      sizeMap.value = next;
      return;
    }
    const nextSize = { width: node.offsetWidth, height: node.offsetHeight };
    const prevSize = sizeMap.value.get(key);
    if (prevSize && prevSize.width === nextSize.width && prevSize.height === nextSize.height) {
      return;
    }
    sizeMap.value = new Map(sizeMap.value).set(key, nextSize);
  };

  return { sizeMap, setNodeSize };
}
