/**
 * `useStackConfig` —— antd `notification/hooks/useStackConfig.ts` 的 Vue 版。
 *
 * 把「实例传入的 stack」与「默认 stack」合并成 `false | StackConfig`：
 *   - 两者都为假值 ⇒ `false`（不堆叠）；
 *   - 否则**对象部分浅合并**（默认在前、实例在后），`true` 只用来「启用」。
 *
 * ⚠️ message 与 notification 共用（registry 的 leafModules 里有它），
 * 返回 `ComputedRef`（本仓既定判据，D39 同判）。
 */
import { isPlainObject } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { StackConfig } from '../engine/interface';

export type StackConfigInput = boolean | StackConfig | undefined;

export function useStackConfig(
  stackConfig: MaybeRefOrGetter<StackConfigInput>,
  defaultStackConfig: MaybeRefOrGetter<StackConfigInput>,
): ComputedRef<false | StackConfig> {
  return computed(() => {
    const mergedStackConfig = toValue(stackConfig) ?? toValue(defaultStackConfig);
    if (!mergedStackConfig) return false;

    const defaultConfig = toValue(defaultStackConfig);
    return {
      ...(isPlainObject(defaultConfig) ? (defaultConfig as StackConfig) : {}),
      ...(isPlainObject(mergedStackConfig) ? (mergedStackConfig as StackConfig) : {}),
    };
  });
}

export default useStackConfig;
