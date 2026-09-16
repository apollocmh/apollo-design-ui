/**
 * `useNextFrame()` —— 双 rAF，带取消。
 *
 * ## 为什么是**两**帧
 *
 * `motion-contract.md` §3.3：rc-motion 的 `useNextFrame.js` 是
 * `raf(raf(callback))`，即每次步进隔两帧。这不是性能浪费 ——
 * 浏览器必须**先在 `start` 态绘制一帧**，再切到 `active` 态，动画才会真的
 * 从初始值开始；单帧在部分浏览器下会被合并掉。
 *
 * ⚠️ 所以「两帧」是本包的一条**契约**，不是可调参数。测试里断言它
 * （见 `__tests__/driver.test.ts` 的「默认调度器」用例）。
 *
 * ## 为什么需要「带取消」
 *
 * 步进之间元素可能已被卸载（`visible` 中途翻回、容器被摘掉）。
 * 不取消的话回调会在已销毁的元素上写样式。
 */

import { onUnmounted } from 'vue';

export interface NextFrameHandle {
  /** 请求下一次「两帧后」执行。重复调用会取消上一次未执行的。 */
  request: (callback: () => void) => void;
  /** 取消挂起的回调。卸载时自动调用。 */
  cancel: () => void;
}

export function useNextFrame(): NextFrameHandle {
  let inner = 0;
  let outer = 0;

  function cancel(): void {
    if (inner) {
      cancelAnimationFrame(inner);
      inner = 0;
    }
    if (outer) {
      cancelAnimationFrame(outer);
      outer = 0;
    }
  }

  function request(callback: () => void): void {
    cancel();
    outer = requestAnimationFrame(() => {
      outer = 0;
      inner = requestAnimationFrame(() => {
        inner = 0;
        callback();
      });
    });
  }

  onUnmounted(cancel);

  return { request, cancel };
}
