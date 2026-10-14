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
import {
  type MaybeRefOrGetter,
  onMounted,
  onScopeDispose,
  type Ref,
  ref,
  toValue,
  watch,
} from 'vue';

type ScrollTargetLike = HTMLElement | Window | Document;

interface ScrollOptions {
  getTarget: () => ScrollTargetLike | null;
  /**
   * ⚠️ 必须是 **getter / ref**：原来是裸值 ⇒ 解构后是 setup 期快照，父级动态改
   *    `visibilityHeight` / `showProgress` 完全不生效（Issue #27.4）。
   */
  showProgress: MaybeRefOrGetter<boolean>;
  visibilityHeight: MaybeRefOrGetter<number>;
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
  scrollProgress: Ref<number>;
  visible: Ref<boolean>;
} {
  const { getTarget } = options;

  const visible = ref(toValue(options.visibilityHeight) === 0);
  const scrollProgress = ref(0);

  const syncScrollState = (): void => {
    const container = getTarget();
    const scrollTop = getScroll(container as ScrollTarget) ?? 0;
    visible.value = scrollTop >= toValue(options.visibilityHeight);
    if (toValue(options.showProgress)) {
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
  // antd 的 useEffect 依赖 [getTarget, showProgress, visibilityHeight] —— 变化重绑。
  // ⚠️ 依赖必须是**求值后**的结果：写 `[getTarget, showProgress, visibilityHeight]`
  //    比较的是函数/常量引用 ⇒ 永不变化（Issue #27.4）。
  watch(
    () => [getTarget(), toValue(options.showProgress), toValue(options.visibilityHeight)] as const,
    () => {
      unbind();
      bind();
    },
  );

  return { scrollProgress, visible };
}

export default useScroll;
