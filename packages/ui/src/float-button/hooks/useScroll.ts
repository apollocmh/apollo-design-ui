/**
 * antd `float-button/hooks/useScroll.ts` 的 Vue 移植 —— BackTop 的滚动可见性
 * 与 showProgress 进度（0..1）。
 *
 * antd 逐字：`useState(visibilityHeight === 0)`；滚动/resize 都走
 * throttleByAnimationFrame；scrollProgress = scrollTop / maxScroll。
 */

import {
  getScroll,
  isDocument,
  isHTMLElement,
  isWindow,
  type ScrollTarget,
  throttleByAnimationFrame,
} from '@apollo-design/utils';
import { onMounted, onScopeDispose, ref, watch } from 'vue';

type ScrollTargetLike = HTMLElement | Window | Document;

interface ScrollOptions {
  getTarget: () => ScrollTargetLike | null;
  showProgress: boolean;
  visibilityHeight: number;
}

const getScrollProgress = (target: ScrollTargetLike | null): number => {
  const scrollTop = getScroll(target as ScrollTarget) ?? 0;

  let scrollElement: HTMLElement | null = null;

  if (isWindow(target)) {
    scrollElement = (target as Window).document.documentElement;
  } else if (isDocument(target)) {
    scrollElement = (target as Document).documentElement;
  } else if (isHTMLElement(target)) {
    scrollElement = target;
  }

  if (!scrollElement) {
    return 0;
  }

  const maxScroll = Math.max(scrollElement.scrollHeight - scrollElement.clientHeight, 0);

  return maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
};

export function useScroll(options: ScrollOptions): {
  scrollProgress: ReturnType<typeof ref<number>>;
  visible: ReturnType<typeof ref<boolean>>;
} {
  const { getTarget, showProgress, visibilityHeight } = options;

  const visible = ref(visibilityHeight === 0);
  const scrollProgress = ref(0);

  const syncScrollState = (): void => {
    const container = getTarget();
    const scrollTop = getScroll(container as ScrollTarget) ?? 0;
    visible.value = scrollTop >= visibilityHeight;
    if (showProgress) {
      scrollProgress.value = getScrollProgress(container);
    }
  };

  const handleScroll = throttleByAnimationFrame(syncScrollState);
  const handleResize = throttleByAnimationFrame(syncScrollState);

  let currentContainer: ScrollTargetLike | null = null;

  const bind = (): void => {
    currentContainer = getTarget();
    syncScrollState();
    (currentContainer as EventTarget | null)?.addEventListener(
      'scroll',
      handleScroll as unknown as EventListener,
    );
    window.addEventListener('resize', handleResize as unknown as EventListener);
  };

  const unbind = (): void => {
    handleScroll.cancel();
    handleResize.cancel();
    (currentContainer as EventTarget | null)?.removeEventListener(
      'scroll',
      handleScroll as unknown as EventListener,
    );
    window.removeEventListener('resize', handleResize as unknown as EventListener);
    currentContainer = null;
  };

  onMounted(bind);
  onScopeDispose(unbind);
  // antd 的 useEffect 依赖 [getTarget, showProgress, visibilityHeight] —— 变化重绑
  watch(
    () => [getTarget, showProgress, visibilityHeight] as const,
    () => {
      unbind();
      bind();
    },
  );

  return { scrollProgress, visible };
}

export default useScroll;
