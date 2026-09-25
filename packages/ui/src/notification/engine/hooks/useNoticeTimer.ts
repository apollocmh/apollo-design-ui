/**
 * `useNoticeTimer` —— rc `hooks/useNoticeTimer.js` 的 Vue 版。
 *
 * 自动关闭计时器 + 进度上报。判据（逐条对齐上游）：
 *   - `duration` **只认 number**（`false` / `null` / 未传 ⇒ 0 ⇒ 不自动关）；
 *   - 走 `raf` 累加**真实经过时间**（不是 setInterval 计数），所以暂停/恢复精确；
 *   - 恢复时 `lastRafTime` 重置为当前时刻，避免把暂停时长算进去；
 *   - 到点先 `onUpdate(1)` 再 `onClose()`（进度条走满才关）；
 *   - `duration` 变化时清零重来。
 *
 * ⚠️ 组件卸载必须 `cancelRaf`，否则 notice 关掉后 raf 还在跑（jsdom 里会让用例挂住）。
 */
import { cancelRaf, raf } from '@apollo-design/utils';
import { type MaybeRefOrGetter, onBeforeUnmount, ref, toValue, watch } from 'vue';

export interface UseNoticeTimerResult {
  /** 恢复计时（hover 离开 / stack 展开）。 */
  onResume: () => void;
  /** 暂停计时（hover 进入 / stack 折叠）。 */
  onPause: () => void;
}

export function useNoticeTimer(
  duration: MaybeRefOrGetter<number | false | null | undefined>,
  onClose: () => void,
  onUpdate: (percent: number) => void,
): UseNoticeTimerResult {
  const durationMs = () => {
    const d = toValue(duration);
    return Math.max(typeof d === 'number' ? d : 0, 0) * 1000;
  };

  const walking = ref(durationMs() > 0);
  let passTime = 0;
  let lastRafTime: number | null = null;
  let rafId: number | null = null;

  function syncPassTime(): void {
    const now = Date.now();
    if (lastRafTime !== null) {
      passTime += now - lastRafTime;
    }
    lastRafTime = now;
  }

  function stop(): void {
    if (rafId !== null) {
      cancelRaf(rafId);
      rafId = null;
    }
  }

  function step(): void {
    const ms = durationMs();
    syncPassTime();
    if (passTime >= ms) {
      onUpdate(1);
      onClose();
      return;
    }
    onUpdate(Math.min(passTime / ms, 1));
    rafId = raf(step);
  }

  function start(): void {
    stop();
    if (!walking.value) return;
    step();
  }

  const onPause = (): void => {
    syncPassTime();
    walking.value = false;
  };

  const onResume = (): void => {
    if (durationMs() > 0) {
      lastRafTime = Date.now();
      walking.value = true;
    } else {
      onUpdate(0);
    }
  };

  // walking 变化 ⇒ 起停 raf；duration 变化 ⇒ 清零重来
  watch(walking, (v) => (v ? start() : stop()), { immediate: true });
  watch(durationMs, () => {
    passTime = 0;
    lastRafTime = null;
    walking.value = durationMs() > 0;
  });

  onBeforeUnmount(stop);

  return { onResume, onPause };
}
