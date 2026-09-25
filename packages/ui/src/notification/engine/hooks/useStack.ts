/**
 * `useStack` —— rc `hooks/useStack.js` 的 Vue 版。
 *
 * 只做一件事：把 `boolean | StackConfig` 归一化成
 * 「是否启用 + `{ offset: 8, threshold: 3 }`」。默认值必须逐字保留 ——
 * 它们是**堆叠折叠的可见契约**（阈值 3 意味着第 4 条开始折叠）。
 *
 * ⚠️ 返回 `ComputedRef`：`stack` 是 prop，可能在 notice 存活期间变化
 * （本仓既定判据，D39 同判）。
 */
import { isPlainObject } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { StackConfig } from '../interface';

const DEFAULT_OFFSET = 8;
const DEFAULT_THRESHOLD = 3;

export interface UseStackResult {
  enabled: ComputedRef<boolean>;
  params: ComputedRef<Required<StackConfig>>;
}

export function useStack(
  stack: MaybeRefOrGetter<boolean | StackConfig | undefined>,
): UseStackResult {
  const enabled = computed(() => !!toValue(stack));
  const params = computed<Required<StackConfig>>(() => {
    const result: Required<StackConfig> = {
      offset: DEFAULT_OFFSET,
      threshold: DEFAULT_THRESHOLD,
    };
    const config = toValue(stack);
    if (isPlainObject(config)) {
      const cfg = config as StackConfig;
      result.offset = cfg.offset ?? DEFAULT_OFFSET;
      result.threshold = cfg.threshold ?? DEFAULT_THRESHOLD;
    }
    return result;
  });

  return { enabled, params };
}
