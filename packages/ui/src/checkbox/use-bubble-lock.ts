/**
 * `useBubbleLock` —— antd 的 `es/checkbox/useBubbleLock.js` 对应物。
 *
 * 点击 label 时事件会「label click → input click → label click」再回来，
 * 锁住 raf 一帧内的 input click 的 stopPropagation，防止外层 onClick 触发两次。
 */

import { raf } from '@apollo-design/utils';
import { onScopeDispose, ref } from 'vue';

export function useBubbleLock(onOriginInputClick?: (e: MouseEvent) => void): {
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
    onOriginInputClick?.(e);
  };

  onScopeDispose(clearLock);

  return { onLabelClick, onInputClick };
}
