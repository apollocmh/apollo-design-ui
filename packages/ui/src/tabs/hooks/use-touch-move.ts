/**
 * 触摸拖动（rc `hooks/useTouchMove.js` 的等价物）。
 *
 * 上游是 145 行的惯性滑动实现：`touchstart` 记起点 → `touchmove` 反复回调
 * `onOffset(dx, dy)` → `touchend` 按「速度 × 阻尼」继续滑一段（`motionRef` 用
 * `setInterval(REFRESH_INTERVAL)` 递减）。
 *
 * ── 本仓的实现范围（**明确的取舍，不是漏做**）──────────────────────────────────
 *
 * 保留：
 *   - `touchstart/move/end` 的位移回调（`onOffset` 返回 `false` 时**不拦截事件**）；
 *   - 松手后的惯性滑动（同样的 `MIN_SWIPE_DISTANCE` / `STOP_SWIPE_DISTANCE` /
 *     `REFRESH_INTERVAL` / `SPEED_OFF_MULTIPLE` 四个常量）。
 *
 * 未保留：
 *   - `lastTimestamp` 这类只用于「两次 move 之间的时间差」的中间量被合并成局部变量
 *     （行为等价：仍然用「本次与上次 move 的时间差」算速度）。
 *
 * ⚠️ 不拦截事件的判据很关键：`needScroll` 为假时 `onOffset` 返回 `false`，
 *    此时**不能** `preventDefault`，否则整页的手势会被吃掉。
 *    （上游把 `e.preventDefault()` 注释掉了 —— 保持注释掉的行为。）
 */

import { onBeforeUnmount, type Ref, ref, watch } from 'vue';

const MIN_SWIPE_DISTANCE = 0.1;
const STOP_SWIPE_DISTANCE = 0.01;
const REFRESH_INTERVAL = 20;
const SPEED_OFF_MULTIPLE = 0.995 ** REFRESH_INTERVAL;

/**
 * 在 `target` 上监听触摸拖动。
 *
 * @param target   可拖动区域（`{p}-nav-wrap`）
 * @param onOffset 位移回调；返回 `false` 表示「不需要滚动」，此时不处理
 */
export function useTouchMove(
  target: Ref<HTMLElement | null>,
  // biome-ignore lint/suspicious/noConfusingVoidType: 上游逐字契约（rc-tabs 的 onOffset 就是 boolean | void）；改成 undefined 会放宽写法、与上游分叉
  onOffset: (offsetX: number, offsetY: number) => boolean | void,
): void {
  const touchPosition = ref<{ x: number; y: number } | null>(null);
  let lastTimestamp = 0;
  let lastTimeDiff = 0;
  let lastOffset: { x: number; y: number } | null = null;
  let motionTimer: ReturnType<typeof setInterval> | undefined;

  const clearMotion = (): void => {
    if (motionTimer !== undefined) {
      clearInterval(motionTimer);
      motionTimer = undefined;
    }
  };

  const onTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    touchPosition.value = { x: touch.screenX, y: touch.screenY };
    clearMotion();
  };

  const onTouchMove = (e: TouchEvent): void => {
    if (!touchPosition.value) return;
    const touch = e.touches[0];
    if (!touch) return;

    const prev = touchPosition.value;
    touchPosition.value = { x: touch.screenX, y: touch.screenY };

    const offsetX = touch.screenX - prev.x;
    const offsetY = touch.screenY - prev.y;
    onOffset(offsetX, offsetY);

    const now = Date.now();
    lastTimeDiff = now - lastTimestamp;
    lastTimestamp = now;
    lastOffset = { x: offsetX, y: offsetY };
  };

  const onTouchEnd = (): void => {
    if (!touchPosition.value) return;
    touchPosition.value = null;

    // Swipe if needed
    if (lastOffset && lastTimeDiff) {
      const distanceX = lastOffset.x / lastTimeDiff;
      const distanceY = lastOffset.y / lastTimeDiff;
      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);

      // Skip swipe if low distance
      if (Math.max(absX, absY) > MIN_SWIPE_DISTANCE) {
        let currentX = distanceX;
        let currentY = distanceY;

        motionTimer = setInterval(() => {
          if (
            Math.abs(currentX) > STOP_SWIPE_DISTANCE ||
            Math.abs(currentY) > STOP_SWIPE_DISTANCE
          ) {
            currentX *= SPEED_OFF_MULTIPLE;
            currentY *= SPEED_OFF_MULTIPLE;
            onOffset(currentX * REFRESH_INTERVAL, currentY * REFRESH_INTERVAL);
          } else {
            clearMotion();
          }
        }, REFRESH_INTERVAL);
      }
    }
    lastOffset = null;
    lastTimeDiff = 0;
  };

  const attach = (): void => {
    const el = target.value;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
  };

  const detach = (): void => {
    const el = target.value;
    if (el) {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    }
    clearMotion();
  };

  // ⚠️ 与 `useResizeObserver` 同判：`flush: 'post'` 保证 DOM 就绪后再挂监听
  watch(
    target,
    () => {
      detach();
      attach();
    },
    { immediate: true, flush: 'post' },
  );

  onBeforeUnmount(detach);
}
