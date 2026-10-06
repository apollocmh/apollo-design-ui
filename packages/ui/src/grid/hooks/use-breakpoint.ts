/**
 * useBreakpoint —— 订阅断点，返回当前命中的 screens。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/hooks/useBreakpoint.js`（逐字对齐）。
 *
 * ── SSR 语义（B8 用真实 SSR 冒烟钉住的判据）──────────────────────────────────
 *
 * antd 的订阅发生在 `useLayoutEffect` 里 —— **仅在客户端执行**：SSR 时
 * `screensRef.current` 恒为 defaultScreens（Row 传 null），matchMedia 完全不被触碰。
 * Vue 侧对应物是 `onMounted`：订阅移入 mounted 钩子，setup 期间（含 SSR）
 * 不触碰 window。否则 `window is not defined`（2026-09-21 B8 实测）。
 *
 * 判据上「screens 为 null」与「空对象」是两条不同分支（useGutter 的兜底不同）：
 * SSR/挂载前 = defaultScreens（Row 传 null），挂载后 = 真实命中的 screens。
 */

import { onMounted, onScopeDispose, type Ref, ref } from 'vue';
import { type Screens, useResponsiveObserver } from '../../_internal/responsive-observer';

/**
 * @param refreshOnChange 断点变化时是否刷新 `screens`。
 *
 * 🚨 **可以传取值函数**（`() => needResponsive.value`）—— 这是必须的：
 * 传**裸布尔**时它会被 `onMounted` 的订阅闭包**捕获一次**，此后 `size` 变成响应式
 * （如 `<Avatar :size="{ xs: 'small' }">`）也**永不刷新**（registry `VNA-AVATAR-01`）。
 * 取值函数则每次回调都重新求值 ⇒ 订阅行为随 props 变化而切换。
 */
export function useBreakpoint(
  refreshOnChange: boolean | (() => boolean) = true,
  defaultScreens: Screens | null = {},
): Ref<Screens | null> {
  const screensRef = ref<Screens | null>(defaultScreens) as Ref<Screens | null>;
  const { subscribe } = useResponsiveObserver();

  let unsubscribe: (() => void) | undefined;

  // antd：useLayoutEffect（仅客户端）。SSR 不订阅、不触碰 matchMedia。
  onMounted(() => {
    unsubscribe = subscribe((supportScreens) => {
      // antd 用 forceUpdate 手动触发重渲染，refreshOnChange=false 时只改 ref 不渲染；
      // Vue 的响应式没有「改值但不触发」的开关 —— ref 更新即触发。grid 恒传 true，
      // 参数保留只为对齐调用面；若未来出现 false 的调用点，需改用 shallowRef + 手动 trigger。
      // ⚠️ 每次回调重新求值（支持取值函数）—— 否则裸布尔会被闭包固定住
      const shouldRefresh =
        typeof refreshOnChange === 'function' ? refreshOnChange() : refreshOnChange;
      if (shouldRefresh) {
        screensRef.value = supportScreens;
      }
    });
  });

  onScopeDispose(() => unsubscribe?.());

  return screensRef;
}

export default useBreakpoint;
