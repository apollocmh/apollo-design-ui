/**
 * raf 节流：每次帧只执行最后一个回调（antd 的 `useRafDebounce.js` 机械移植）。
 * 帧用 `@apollo-design/utils` 的 `raf`（jsdom 退化 setTimeout(16)）。
 */

import { raf } from '@apollo-design/utils';

export function useRafDebounce(callback: () => void): () => void {
  let executeRef = false;
  let rafRef = 0;

  return () => {
    if (executeRef) {
      return;
    }
    executeRef = true;
    callback();
    rafRef = raf(() => {
      executeRef = false;
    }) as unknown as number;
    void rafRef;
  };
}
