/** Reactive breakpoint snapshots. Browser observation starts after mount;
 * SSR keeps defaultScreens. Enabling a getter publishes the latest snapshot. */
import { onMounted, onScopeDispose, type Ref, ref, watch } from 'vue';
import { type Screens, useResponsiveObserver } from '../../_internal/responsive-observer';

/**
 * @param refreshOnChange 断点变化时是否刷新 `screens`。
 *
 * 🚨 **可以传取值函数**（`() => needResponsive.value`）—— 这是必须的：
 * 传**裸布尔**时它会被 `onMounted` 的订阅闭包**捕获一次**，此后 `size` 变成响应式
 * （如 `<Avatar :size="{ xs: 'small' }">`）也**永不刷新**（registry `VNA-AVATAR-01`）。
 * 取值函数随 props 变化切换发布；重新启用立即发布当前快照，无需等待下一次resize。
 */
export function useBreakpoint(
  refreshOnChange: boolean | (() => boolean) = true,
  defaultScreens: Screens | null = {},
): Ref<Screens | null> {
  const screensRef: Ref<Screens | null> = ref(defaultScreens);
  const { subscribe } = useResponsiveObserver();

  let unsubscribe: (() => void) | undefined;
  let latestScreens: Screens | null = defaultScreens;
  const enabled = () =>
    typeof refreshOnChange === 'function' ? refreshOnChange() : refreshOnChange;

  // Keep the live snapshot while publication is paused. Enabling a getter must
  // publish the current viewport without waiting for another media-query event.
  watch(
    enabled,
    (refresh) => {
      if (refresh) screensRef.value = latestScreens;
    },
    { flush: 'sync' },
  );

  // Browser observation starts after mount; SSR keeps defaultScreens untouched.
  onMounted(() => {
    unsubscribe = subscribe((supportScreens) => {
      latestScreens = supportScreens;
      if (enabled()) screensRef.value = supportScreens;
    });
  });

  onScopeDispose(() => unsubscribe?.());

  return screensRef;
}

export default useBreakpoint;
