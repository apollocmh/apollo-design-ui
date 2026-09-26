/**
 * `useFocusable` —— `@rc-component/drawer@1.4.2` `es/hooks/useFocusable.js` 的 Vue 版。
 *
 * 契约（逐条对齐上游）：
 *   1. `mergedFocusTrap = focusTrap ?? mask !== false` —— **默认跟着 mask 走**：
 *      有遮罩就做焦点陷阱，没遮罩（`mask: false`）就不做；
 *   2. 焦点陷阱用本仓 `@apollo-design/utils` 的 `useLockFocus`（rc-util `Dom/focus` 的对应物），
 *      返回的 `ignoreElement` 由调用方在 `onFocus` 里用（焦点跑到面板外时拉回来）；
 *   3. `autoFocus === true`（**严格 true**）时，打开后把焦点移到面板容器
 *      （`preventScroll: true`，避免页面跳动）。
 */
import { useLockFocus } from '@apollo-design/utils';
import { computed, type MaybeRefOrGetter, toValue, watch } from 'vue';

export function useFocusable(
  getContainer: () => HTMLElement | null,
  open: MaybeRefOrGetter<boolean>,
  autoFocus: MaybeRefOrGetter<boolean | undefined>,
  focusTrap: MaybeRefOrGetter<boolean | undefined>,
  mask: MaybeRefOrGetter<unknown>,
): (ele: HTMLElement) => void {
  const mergedFocusTrap = computed(() => toValue(focusTrap) ?? toValue(mask) !== false);

  const [ignoreElement] = useLockFocus(
    () => !!toValue(open) && mergedFocusTrap.value,
    () => getContainer(),
  );

  watch(
    () => !!toValue(open),
    (isOpen) => {
      if (isOpen && toValue(autoFocus) === true) {
        getContainer()?.focus({ preventScroll: true });
      }
    },
  );

  return ignoreElement;
}
