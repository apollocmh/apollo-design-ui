/**
 * Shared scrolling for Anchor and both BackTop components.
 * Easing is based on antd `es/_util/{scrollTo,easings}.js`.
 *
 * `throttleByAnimationFrame` / `getScroll` / `raf` / `isWindow` 已在
 * `@apollo-design/utils`（affix 期移植），本文件不重复定义。
 */

import {
  getScroll,
  isDocument,
  isHTMLElement,
  isWindow,
  raf,
  type ScrollTarget,
} from '@apollo-design/utils';

/** antd `es/_util/easings.js` 逐字（`t -= 2` 拆成独立语句以满足 noAssignInExpressions，数值不变）。 */
export function easeInOutCubic(t: number, b: number, c: number, d: number): number {
  const cc = c - b;
  t /= d / 2;
  if (t < 1) {
    return (cc / 2) * t * t * t + b;
  }
  t -= 2;
  return (cc / 2) * (t * t * t + 2) + b;
}

export interface ScrollToOptions {
  /** 滚动容器（默认 window）。 */
  getContainer?: () => ScrollTarget;
  /** 滚动结束回调（duration<=0 时同步调用）。 */
  callback?: () => void;
  /** 动画时长（ms；<=0 直落）。 */
  duration?: number;
}

/**
 * easeInOutCubic + raf 逐帧。Each frame is immediate so a target's CSS
 * scroll-behavior cannot start a second animation (Issue #86).
 * 返回取消函数（duration<=0 时返回空函数 —— 与上游一致）。
 */
export function scrollTo(y: number, options: ScrollToOptions = {}): () => void {
  const { getContainer = () => window, callback, duration = 450 } = options;
  const container = getContainer();
  const scrollTop = getScroll(container) ?? 0;

  const scroll = (top: number) => {
    if (isWindow(container)) {
      container.scrollTo({ left: container.pageXOffset, top, behavior: 'instant' });
    } else {
      const target = isDocument(container) ? container.documentElement : container;
      if (isHTMLElement(target) && typeof target.scrollTo === 'function') {
        target.scrollTo({ left: target.scrollLeft, top, behavior: 'instant' });
      } else if (target) {
        // ScrollTarget also accepts plain scrollTop objects without DOM methods.
        target.scrollTop = top;
      }
    }
  };

  if (duration <= 0) {
    scroll(y);
    if (typeof callback === 'function') {
      callback();
    }
    return () => {};
  }

  const startTime = Date.now();
  let rafId = 0;
  const frameFunc = () => {
    const timestamp = Date.now();
    const time = timestamp - startTime;
    const nextScrollTop = easeInOutCubic(time > duration ? duration : time, scrollTop, y, duration);
    scroll(nextScrollTop);
    if (time < duration) {
      rafId = raf(frameFunc);
    } else if (typeof callback === 'function') {
      callback();
    }
  };
  rafId = raf(frameFunc);
  return () => {
    raf.cancel(rafId);
  };
}
