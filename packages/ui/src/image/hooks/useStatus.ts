/** Image state follows its actual DOM resource; SSR does not create preload images. */
import { computed, type MaybeRefOrGetter, type Ref, ref, shallowRef, toValue, watch } from 'vue';

import type { ImageStatus } from '../interface';

export interface UseStatusOptions {
  src?: MaybeRefOrGetter<string | undefined>;
  isCustomPlaceholder?: MaybeRefOrGetter<boolean | undefined>;
  fallback?: MaybeRefOrGetter<string | undefined>;
  srcSet?: MaybeRefOrGetter<string | undefined>;
  sizes?: MaybeRefOrGetter<string | undefined>;
}

export interface UseStatusResult {
  status: Ref<ImageStatus>;
  image: Ref<HTMLImageElement | null>;
  /** 绑到 img 的 ref（元素挂载/更新时调用）。 */
  getImgRef: (img: HTMLImageElement | null) => void;
  /** Owned source/events, including candidate suppression while displaying fallback. */
  srcAndOnload: Ref<{
    onLoad?: () => void;
    onError: () => void;
    src?: string;
    srcSet?: undefined;
    sizes?: undefined;
  }>;
}

export function useStatus(options: UseStatusOptions): UseStatusResult {
  const status = ref<ImageStatus>(toValue(options.isCustomPlaceholder) ? 'loading' : 'normal');
  const image = shallowRef<HTMLImageElement | null>(null);

  watch(
    [
      () => toValue(options.src),
      () => toValue(options.srcSet),
      () => toValue(options.sizes),
      () => toValue(options.isCustomPlaceholder),
    ] as const,
    ([src, srcSet, sizes, placeholder], previous) => {
      const changed = src !== previous[0] || srcSet !== previous[1] || sizes !== previous[2];
      if (changed || status.value !== 'error') {
        status.value = placeholder ? 'loading' : 'normal';
        const node = image.value;
        if (!changed && node?.complete && (node.naturalWidth || node.naturalHeight))
          status.value = 'normal';
      }
    },
    { immediate: true },
  );

  const srcAndOnload = computed(() => {
    if (status.value === 'error' && toValue(options.fallback)) {
      return {
        src: toValue(options.fallback),
        srcSet: undefined,
        sizes: undefined,
        onError: onErrorHandler,
      };
    }
    return { onLoad: onLoadHandler, onError: onErrorHandler, src: toValue(options.src) };
  });

  function onLoadHandler(): void {
    status.value = 'normal';
  }
  function onErrorHandler(): void {
    status.value = 'error';
  }

  const getImgRef = (img: HTMLImageElement | null): void => {
    image.value = img;
    if (img?.complete) {
      if (status.value === 'loading' && (img.naturalWidth || img.naturalHeight)) onLoadHandler();
      else if (
        !img.naturalWidth &&
        !img.naturalHeight &&
        (img.currentSrc || img.getAttribute('src') || img.getAttribute('srcset'))
      )
        onErrorHandler();
    }
  };

  return { status, image, getImgRef, srcAndOnload };
}
