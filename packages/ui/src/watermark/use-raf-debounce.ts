/**
 * 下一帧读取最新状态，同帧的请求合并为一次，并随组件作用域取消。
 */

import { raf } from '@apollo-design/utils';
import { onScopeDispose } from 'vue';

export function useRafDebounce(callback: () => void): () => void {
  let pending: number | undefined;
  onScopeDispose(() => {
    if (pending !== undefined) raf.cancel(pending);
    pending = undefined;
  });
  return () => {
    if (pending !== undefined) return;
    pending = raf(() => {
      pending = undefined;
      callback();
    });
  };
}
