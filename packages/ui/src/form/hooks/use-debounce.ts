/**
 * useDebounce —— antd `es/form/hooks/useDebounce.js` 的 Vue 等价物。
 *
 * antd 逐字：value 变化时 `setCacheValue(value, { ms: value.length ? 0 : 10 })` ——
 * 有内容立即（0ms）更新、清空延迟 10ms（防动画闪烁，ref ant-design#36336）。
 * ⚠️ 用 setTimeout 而非 rAF：jsdom 的 rAF 不自动触发，错误列表会永远不渲染。
 */

import type { Ref } from 'vue';
import { onBeforeUnmount, ref, type WatchSource, watch } from 'vue';

export function useDebounce<T>(source: WatchSource<T[]>): Ref<T[]> {
  const timer = ref<ReturnType<typeof setTimeout> | null>(null);
  const state = ref<T[]>([]) as Ref<T[]>;

  watch(
    source,
    (value) => {
      if (timer.value !== null) {
        clearTimeout(timer.value);
        timer.value = null;
      }
      timer.value = setTimeout(
        () => {
          state.value = value;
          timer.value = null;
        },
        value.length ? 0 : 10,
      );
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (timer.value !== null) {
      clearTimeout(timer.value);
      timer.value = null;
    }
  });

  return state;
}
