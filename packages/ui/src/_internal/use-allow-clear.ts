/**
 * `_util/hooks/useAllowClear` 的本仓实现。
 *
 * 契约来源：antd 6.6.4 `es/_util/hooks/useAllowClear.js`（30 行）+ `_util/fallbackProp`。
 *
 * 三条判据：
 *  1. `mergedAllowClear = allowClear ?? contextAllowClear ?? defaultAllowClear`；
 *     假值 ⇒ 返回 `false`（不渲染 clear 按钮）。
 *  2. `clearIcon` 的回退顺序：allowClear 对象里的 clearIcon → 独立的 `clearIcon`
 *     prop（deprecated）→ context 的 clearIcon → **默认 `CloseCircleFilled`**。
 *  3. `clearIcon` prop 是 deprecated（用 `allowClear={{ clearIcon }}`）⇒ 告警。
 */

import { CloseCircleFilled } from '@apollo-design/icons';
import { useDevWarning } from '@apollo-design/utils';
import {
  type ComputedRef,
  computed,
  h,
  type MaybeRefOrGetter,
  toValue,
  type VNodeChild,
} from 'vue';

export interface AllowClearConfig {
  clearIcon?: VNodeChild;
  disabled?: boolean;
}

/**
 * ⚠️ 所有输入都是 `MaybeRefOrGetter`（ref / getter / 裸值都行）。
 *
 * 此前这里是裸值，组件在 setup 期把 `props.allowClear` 拷进来 ⇒ 内部 `computed`
 * 追踪不到 props 变化，`allowClear: false → true` 不生效（Issue #3.1）。
 * 判据与 `useCompactItemContext` / `useSize` 一致：**要响应性就传 getter**。
 * 裸值仍然可用（`toValue` 对非 ref 非函数原样返回），所以既有调用点不会静默失效。
 */
export interface UseAllowClearOptions {
  allowClear?: MaybeRefOrGetter<boolean | AllowClearConfig | undefined>;
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: MaybeRefOrGetter<VNodeChild>;
  contextAllowClear?: MaybeRefOrGetter<boolean | AllowClearConfig | undefined>;
  contextClearIcon?: MaybeRefOrGetter<VNodeChild>;
  defaultAllowClear?: MaybeRefOrGetter<boolean>;
  componentName: string;
}

/** 第一个非 undefined 值；null/false/0 都是显式内容。 */
function fallbackProp<T>(...values: (T | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

export function useAllowClear(
  options: UseAllowClearOptions,
): ComputedRef<false | AllowClearConfig> {
  const devWarning = useDevWarning(options.componentName);
  // ⚠️ Vue 的 props 恒含全部声明键 ⇒ 判据是「值是否给出」，不是 `'x' in props`
  devWarning.deprecated(
    toValue(options.clearIcon) === undefined,
    'clearIcon',
    'allowClear={{ clearIcon: VNode }}',
  );

  return computed<false | AllowClearConfig>(() => {
    const allowClear = toValue(options.allowClear);
    const contextAllowClear = toValue(options.contextAllowClear);
    const clearIcon = toValue(options.clearIcon);
    const contextClearIcon = toValue(options.contextClearIcon);

    const mergedAllowClear = allowClear ?? contextAllowClear ?? toValue(options.defaultAllowClear);
    if (!mergedAllowClear) {
      return false;
    }
    return {
      clearIcon: fallbackProp(
        allowClear && typeof allowClear === 'object' ? allowClear.clearIcon : undefined,
        clearIcon,
        contextAllowClear && typeof contextAllowClear === 'object'
          ? contextAllowClear.clearIcon
          : undefined,
        contextClearIcon,
        h(CloseCircleFilled),
      ),
      disabled:
        (allowClear && typeof allowClear === 'object' ? allowClear.disabled : undefined) ??
        (contextAllowClear && typeof contextAllowClear === 'object'
          ? contextAllowClear.disabled
          : undefined),
    };
  });
}
