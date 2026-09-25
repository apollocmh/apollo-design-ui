/**
 * `useClosable` —— rc `hooks/useClosable.js` 的 Vue 版。
 *
 * 三条判据（逐字对齐）：
 *   1. `closable === false` ⇒ `{ closeIcon: null, disabled: true }`；
 *   2. 对象形态原样使用；
 *   3. 默认 `closeIcon: '×'`、`disabled: false`（用 `'closeIcon' in obj` 判据 ——
 *      显式传 `null` 是「不要图标」，与「未传」不同）。
 * 另外把 `closable` 里的 `aria-*` 透传给关闭按钮（`pickAttrs` 的第二参 = aria）。
 *
 * ⚠️ 三个返回值都是 `ComputedRef`（不是裸值）—— 本仓的既定判据：hook 里用裸值
 * 就等于 setup 期快照，props 变化不会重算（D39 同判）。
 */
import { pickAttrs } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { NoticeProps } from '../interface';

export type ClosableType = NoticeProps['closable'];

export interface ClosableConfig {
  closeIcon?: unknown;
  disabled?: boolean;
  onClose?: () => void;
  'aria-label'?: string;
}

export interface UseClosableResult {
  /** `!!closable` —— notice 根上的 `-notice-closable` 判据。 */
  closable: ComputedRef<boolean>;
  config: ComputedRef<ClosableConfig>;
  ariaProps: ComputedRef<Record<string, unknown>>;
}

export function useClosable(closable: MaybeRefOrGetter<ClosableType>): UseClosableResult {
  const closableObj = computed<ClosableConfig>(() => {
    const value = toValue(closable);
    if (value === false) return { closeIcon: null, disabled: true };
    if (value && typeof value === 'object') return value as ClosableConfig;
    return {};
  });

  const config = computed<ClosableConfig>(() => ({
    ...closableObj.value,
    closeIcon: 'closeIcon' in closableObj.value ? closableObj.value.closeIcon : '×',
    disabled: closableObj.value.disabled ?? false,
  }));

  const ariaProps = computed(
    () => pickAttrs(config.value as Record<string, unknown>, true) as Record<string, unknown>,
  );

  return {
    closable: computed(() => !!toValue(closable)),
    config,
    ariaProps,
  };
}
