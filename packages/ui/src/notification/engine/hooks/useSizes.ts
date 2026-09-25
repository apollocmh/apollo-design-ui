/**
 * `useSizes` —— rc `hooks/useListPosition/useSizes.js` 的 Vue 版。
 *
 * 按 key 记录**实测**节点尺寸（`offsetWidth/offsetHeight`），供堆叠定位使用。
 * 判据（逐字对齐上游）：
 *   - 节点卸载（`null`）⇒ 删除该 key；不存在则不触发更新；
 *   - 尺寸与上次相同 ⇒ **不触发更新**（否则每次测量都会引发一轮重渲染）。
 */
import { type Ref, ref } from 'vue';

export interface NodeSize {
  width: number;
  height: number;
}

export interface UseSizesResult {
  sizeMap: Ref<Record<string, NodeSize>>;
  setNodeSize: (key: string, node: { offsetWidth: number; offsetHeight: number } | null) => void;
}

export function useSizes(): UseSizesResult {
  const sizeMap = ref<Record<string, NodeSize>>({});

  const setNodeSize = (
    key: string,
    node: { offsetWidth: number; offsetHeight: number } | null,
  ): void => {
    if (!node) {
      if (!(key in sizeMap.value)) return;
      const next = { ...sizeMap.value };
      delete next[key];
      sizeMap.value = next;
      return;
    }
    const nextSize = { width: node.offsetWidth, height: node.offsetHeight };
    const prevSize = sizeMap.value[key];
    if (prevSize && prevSize.width === nextSize.width && prevSize.height === nextSize.height) {
      return;
    }
    sizeMap.value = { ...sizeMap.value, [key]: nextSize };
  };

  return { sizeMap, setNodeSize };
}
