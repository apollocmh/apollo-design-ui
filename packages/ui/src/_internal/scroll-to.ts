/**
 * 滚动工具集 —— antd `es/_util/{scrollTo,easings}.js` 的逐字移植
 * （ScrollList / FloatButton.BackTop 将来复用，三次法则内收进 _internal）。
 *
 * `throttleByAnimationFrame` / `getScroll` / `raf` / `isWindow` 已在
 * `@apollo-design/utils`（affix 期移植），本文件不重复定义。
 */

import { getScroll, isDocument, isWindow, raf, type ScrollTarget } from '@apollo-design/utils';

/** antd `es/_util/easings.js` 逐字。 */
export function easeInOutCubic(t: number, b: number, c: number, d: number): number {
  const cc = c - b;
  t /= d / 2;
  if (t < 1) {
    return (cc / 2) * t * t * t + b;
  }
  return (cc / 2) * ((t -= 2) * t * t + 2) + b;
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
 * antd `es/_util/scrollTo.js` 逐字：easeInOutCubic + raf 逐帧。
 * 返回取消函数（duration<=0 时返回空函数 —— 与上游一致）。
 */
export function scrollTo(y: number, options: ScrollToOptions = {}): () => void {
  const { getContainer = () => window, callback, duration = 450 } = options;
  const container = getContainer() as ScrollTarget;
  const scrollTop = getScroll(container) ?? 0;

  // 判据与上游逐字：isWindow / isDocument / 其它（HTMLElement 及测试形状）
  const scroll = (top: number) => {
    if (isWindow(container)) {
      container.scrollTo(container.pageXOffset, top);
    } else if (isDocument(container)) {
      container.documentElement.scrollTop = top;
    } else if (container) {
      (container as HTMLElement).scrollTop = top;
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
