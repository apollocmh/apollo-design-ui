/**
 * 读取 `FormItemPrefixContext`（ErrorList / Form.List 内部的 prefix + 状态）。
 */

import { type ComputedRef, computed, inject } from 'vue';
import { type FormItemPrefixContextValue, formItemPrefixContextKey } from '../context';

export function useFormItemPrefixContext(): FormItemPrefixContextValue {
  const injected = inject(formItemPrefixContextKey, undefined);
  if (injected) return injected;
  // 无 Provider（独立使用）时退化为 form 前缀默认值
  const fallback: ComputedRef<FormItemPrefixContextValue> = computed(() => ({
    prefixCls: 'apollo-form',
    status: undefined,
  }));
  return fallback.value ?? { prefixCls: 'apollo-form' };
}
