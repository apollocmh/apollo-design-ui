/**
 * message 的工具 —— antd `components/message/util.ts` 的 Vue 版。
 */
import type { MessageType } from './interface';

/** 消息的动效名：实例传的 `transitionName` 优先，否则 `{p}-fade`。 */
export function getMotion(prefixCls: string, transitionName?: string): { motionName: string } {
  return {
    motionName: transitionName ?? `${prefixCls}-fade`,
  };
}

/**
 * 把「打开一条消息」包成 `MessageType`：**可调用**（调用即关闭）+ **thenable**
 * （关闭时 resolve `true`）+ `.promise`。
 *
 * 判据（逐字对齐上游）：
 *   1. `closeFn` 由 `openFn` 通过参数回传 —— 首次调用前 `closeFn` 可能是 `undefined`，
 *      所以用 `closeFn?.()`（对应「消息还没渲染就被关掉」的竞态，见 `immediately.test`）；
 *   2. `then` 直接转发到底层 Promise（不重新包装，保持同一个 Promise 身份）。
 */
export function wrapPromiseFn(openFn: (resolve: VoidFunction) => VoidFunction): MessageType {
  let closeFn: VoidFunction | undefined;

  const closePromise = new Promise<boolean>((resolve) => {
    closeFn = openFn(() => {
      resolve(true);
    });
  });

  const result = (() => {
    closeFn?.();
  }) as MessageType;

  // biome-ignore lint/suspicious/noThenProperty: 这是**有意的 thenable** —— 上游契约就是「可调用 + PromiseLike」（）
  result.then = (filled, rejected) => closePromise.then(filled, rejected);
  result.promise = closePromise;

  return result;
}
