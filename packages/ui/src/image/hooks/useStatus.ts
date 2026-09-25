/**
 * `useStatus` —— rc-image `hooks/useStatus.js` 的 Vue 版。
 *
 * 状态机：`normal` / `loading` / `error`。
 * - 有自定义占位（isCustomPlaceholder）时初值为 `loading`；
 * - 图片加载失败 ⇒ `error`；`error` 且给了 `fallback` ⇒ img 的 src 换 fallback；
 * - img 的 ref 回调里若已完成加载（`complete` + 有尺寸）⇒ 立即置 `normal`
 *   （rc 的 PR#187 / antd#44948 同款时序补偿）。
 *
 * ⚠️ rc 的 `isImageValid` 对**空 src 不 resolve**（保持 loading，不发请求）
 * —— 本仓逐字保留该语义（否则空 src 会瞬间变 error）。
 */
import { computed, type MaybeRefOrGetter, type Ref, ref, toValue, watch } from 'vue';

import type { ImageStatus } from '../interface';

export interface UseStatusOptions {
  src?: MaybeRefOrGetter<string | undefined>;
  isCustomPlaceholder?: MaybeRefOrGetter<boolean | undefined>;
  fallback?: MaybeRefOrGetter<string | undefined>;
}

export interface UseStatusResult {
  status: Ref<ImageStatus>;
  /** 绑到 img 的 ref（元素挂载/更新时调用）。 */
  getImgRef: (img: HTMLImageElement | null) => void;
  /** 展开到 img 上的 `{ src, onLoad }`。 */
  srcAndOnload: Ref<{ onLoad?: () => void; src?: string }>;
}

/** rc 的 isImageValid：空 src ⇒ Promise 恒 pending。 */
function isImageValid(src?: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!src) {
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export function useStatus(options: UseStatusOptions): UseStatusResult {
  const status = ref<ImageStatus>(toValue(options.isCustomPlaceholder) ? 'loading' : 'normal');
  const isLoaded = { value: false };

  // src 变化：重新校验。旧 src 的校验结果作废（antd#44948）
  let validToken = 0;
  watch(
    () => toValue(options.src),
    (src) => {
      const token = ++validToken;
      isImageValid(src).then((isValid) => {
        if (!isValid && token === validToken) {
          status.value = 'error';
        }
      });
      if (toValue(options.isCustomPlaceholder) && !isLoaded.value) {
        status.value = 'loading';
      } else if (status.value === 'error') {
        status.value = 'normal';
      }
    },
    { immediate: true },
  );

  const srcAndOnload = computed<{ onLoad?: () => void; src?: string }>(() => {
    if (status.value === 'error' && toValue(options.fallback)) {
      return { src: toValue(options.fallback) };
    }
    return { onLoad: onLoadHandler, src: toValue(options.src) };
  });

  function onLoadHandler(): void {
    status.value = 'normal';
  }

  const getImgRef = (img: HTMLImageElement | null): void => {
    isLoaded.value = false;
    if (status.value === 'loading' && img?.complete && (img.naturalWidth || img.naturalHeight)) {
      isLoaded.value = true;
      onLoadHandler();
    }
  };

  return { status, getImgRef, srcAndOnload };
}
