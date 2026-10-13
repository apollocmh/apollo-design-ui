/**
 * `useBubbleLock` —— antd 的 `es/checkbox/useBubbleLock.js` 对应物。
 *
 * 点击 label 时事件会「label click → input click → label click」再回来，
 * 锁住 raf 一帧内的 input click 的 stopPropagation，防止外层 onClick 触发两次。
 */

import { raf } from '@apollo-design/utils';
import { type MaybeRefOrGetter, onScopeDispose, ref, toValue } from 'vue';

/**
 * @param onOriginInputClick 原始的 input click 回调。
 *
 * 🚨 **收 `MaybeRefOrGetter` 而不是裸值**（Issue #9.2）：裸值是在 setup 期捕获的，
 *    父级替换 `onClick` 之后这里仍会调**旧**函数。调用方传 `() => attrs.onClick`
 *    即可每次取到最新的 —— 与全仓 `useAllowClear` / `useMergeSemantic` / `useDisabled`
 *    的处置一致（React 之所以不踩，是它每次渲染都重新调用这个 hook）。
 */
export function useBubbleLock(
  onOriginInputClick?: MaybeRefOrGetter<((e: MouseEvent) => void) | undefined>,
): {
  onLabelClick: () => void;
  onInputClick: (e: MouseEvent) => void;
} {
  const labelClickLockRef = ref<number | null>(null);

  const clearLock = () => {
    if (labelClickLockRef.value !== null) {
      raf.cancel(labelClickLockRef.value);
      labelClickLockRef.value = null;
    }
  };

  const onLabelClick = () => {
    clearLock();
    labelClickLockRef.value = raf(() => {
      labelClickLockRef.value = null;
    }) as unknown as number;
  };

  const onInputClick = (e: MouseEvent) => {
    if (labelClickLockRef.value !== null) {
      e.stopPropagation();
      clearLock();
    }
    // ⚠️ 每次触发时现读（`toValue` 打在 reactive 的 `attrs` 上）
    toValue(onOriginInputClick)?.(e);
  };

  onScopeDispose(clearLock);

  return { onLabelClick, onInputClick };
}
