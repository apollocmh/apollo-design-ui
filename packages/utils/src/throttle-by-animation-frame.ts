/**
 * `throttleByAnimationFrame` —— 按帧节流：一帧内最多执行一次。
 *
 * 契约来源：antd `es/_util/throttleByAnimationFrame.js`（antd 自己的 `_util`，
 * 被 `back-top` / `affix` 等滚动/尺寸场景使用）。
 *
 * 语义（与"合并一帧内参数"的直觉不同，必须精确）：
 *   - 第一次调用**不立即执行**，而是把 `fn` 排到下一帧
 *   - 同一帧内的后续调用被**直接丢弃**（连参数也不记录）
 *   - `fn` 收到的是**该帧内第一次调用**的实参，**不是**最后一次
 *     （`later(args)` 在第一帧就被捕获了；antd 的调用方传的都是常量实参，所以无影响）
 *   - `cancel()` 取消待执行的调用；取消后 wrapper 仍可继续使用
 *
 * ⚠️ `cancel()` 里 `raf.cancel` 只在 `requestId !== null` 时调用。
 *    上一帧已经执行过时 `requestId` 已是 `null`，此时必须安全返回。
 */

import raf from './raf';

export interface ThrottledByAnimationFrameFn<T extends unknown[]> {
  (...args: T): void;
  cancel(): void;
}

export default function throttleByAnimationFrame<T extends unknown[]>(
  fn: (...args: T) => void,
): ThrottledByAnimationFrameFn<T> {
  let requestId: number | null = null;

  const later = (args: T) => () => {
    requestId = null;
    fn(...args);
  };

  const throttled = ((...args: T) => {
    if (requestId === null) {
      requestId = raf(later(args));
    }
  }) as ThrottledByAnimationFrameFn<T>;

  throttled.cancel = () => {
    if (requestId !== null) {
      raf.cancel(requestId);
    }
    requestId = null;
  };

  return throttled;
}
