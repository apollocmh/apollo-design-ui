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
import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import { type ComputedRef, computed, getCurrentInstance, type VNodeChild } from 'vue';

export interface AllowClearConfig {
  clearIcon?: VNodeChild;
  disabled?: boolean;
}

export interface UseAllowClearOptions {
  allowClear?: boolean | AllowClearConfig;
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: VNodeChild;
  contextAllowClear?: boolean | AllowClearConfig;
  contextClearIcon?: VNodeChild;
  defaultAllowClear?: boolean;
  componentName: string;
}

/** 第一个「非 undefined 非空」的值（antd 的 `fallbackProp`）。 */
function fallbackProp<T>(...values: (T | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
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
    options.clearIcon === undefined,
    'clearIcon',
    'allowClear={{ clearIcon: VNode }}',
  );

  void getCurrentInstance();

  return computed<false | AllowClearConfig>(() => {
    const mergedAllowClear =
      options.allowClear ?? options.contextAllowClear ?? options.defaultAllowClear;
    if (!mergedAllowClear) {
      return false;
    }
    return {
      clearIcon: fallbackProp(
        isPlainObject(options.allowClear)
          ? (options.allowClear as AllowClearConfig)?.clearIcon
          : options.clearIcon,
        isPlainObject(options.contextAllowClear)
          ? (options.contextAllowClear as AllowClearConfig)?.clearIcon
          : options.contextClearIcon,
        // 默认图标：antd 是 CloseCircleFilled 元素；本仓给组件对象（D42 归一化）
        // —— 由消费方 `asNode` 包一层。
        CloseCircleFilled as never,
      ),
      disabled:
        (isPlainObject(options.allowClear)
          ? (options.allowClear as AllowClearConfig)?.disabled
          : undefined) ??
        (isPlainObject(options.contextAllowClear)
          ? (options.contextAllowClear as AllowClearConfig)?.disabled
          : undefined),
    };
  });
}
