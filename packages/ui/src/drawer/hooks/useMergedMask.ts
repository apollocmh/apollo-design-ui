/**
 * `useMergedMask` / `normalizeMaskConfig` —— antd `_util/hooks/useMergedMask.ts` 的 Vue 版。
 *
 * 契约（逐条对齐上游）：
 *   1. `normalizeMaskConfig(mask, maskClosable)`：对象 ⇒ **拷贝**（不写回用户的 `mask`）；
 *      布尔 ⇒ `{ enabled: mask }`；`closable` 未给时用 `maskClosable` 补；
 *   2. 合并顺序 `{ blur: false, ...contextMaskConfig, ...maskConfig }`（**props 赢**），
 *      `closable` 单独算：`maskConfig.closable ?? maskClosable ?? contextMaskConfig.closable ?? true`
 *      （**`maskClosable` 优先于 context 的 closable**）；
 *   3. 返回 `[enabled !== false, { mask: blur ? '{p}-mask-blur' : undefined }, !!closable]`
 *      —— ⚠️ 第一个是**布尔**（`enabled !== false`），不是配置对象。
 *
 * ⚠️ 本仓暂放在 `drawer/hooks/`：按三次法则（modal 也会用），第三个消费者出现时提到
 *    `packages/ui/src/_internal/`。
 */
import { isPlainObject } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

export interface MaskConfig {
  enabled?: boolean;
  blur?: boolean;
  closable?: boolean;
}

export type MaskType = MaskConfig | boolean;

export function normalizeMaskConfig(mask?: MaskType, maskClosable?: boolean): MaskConfig {
  let maskConfig: MaskConfig = {};

  if (isPlainObject(mask)) {
    maskConfig = { ...(mask as MaskConfig) };
  }
  if (typeof mask === 'boolean') {
    maskConfig = { enabled: mask };
  }
  if (maskConfig.closable === undefined && maskClosable !== undefined) {
    maskConfig.closable = maskClosable;
  }

  return maskConfig;
}

export function useMergedMask(
  mask: MaybeRefOrGetter<MaskType | undefined>,
  contextMask: MaybeRefOrGetter<MaskType | undefined>,
  prefixCls: MaybeRefOrGetter<string | undefined>,
  maskClosable: MaybeRefOrGetter<boolean | undefined>,
): {
  enabled: ComputedRef<boolean>;
  classNames: ComputedRef<Record<string, string | undefined>>;
  closable: ComputedRef<boolean>;
} {
  return {
    enabled: computed(() => {
      const maskConfig = normalizeMaskConfig(toValue(mask), toValue(maskClosable));
      const contextMaskConfig = normalizeMaskConfig(toValue(contextMask));
      const mergedConfig: MaskConfig = {
        blur: false,
        ...contextMaskConfig,
        ...maskConfig,
        closable:
          maskConfig.closable ?? toValue(maskClosable) ?? contextMaskConfig.closable ?? true,
      };
      return mergedConfig.enabled !== false;
    }),
    classNames: computed(() => {
      const maskConfig = normalizeMaskConfig(toValue(mask), toValue(maskClosable));
      const contextMaskConfig = normalizeMaskConfig(toValue(contextMask));
      const mergedConfig: MaskConfig = {
        blur: false,
        ...contextMaskConfig,
        ...maskConfig,
        closable:
          maskConfig.closable ?? toValue(maskClosable) ?? contextMaskConfig.closable ?? true,
      };
      return {
        mask: mergedConfig.blur ? `${toValue(prefixCls)}-mask-blur` : undefined,
      };
    }),
    closable: computed(() => {
      const maskConfig = normalizeMaskConfig(toValue(mask), toValue(maskClosable));
      const contextMaskConfig = normalizeMaskConfig(toValue(contextMask));
      const mergedConfig: MaskConfig = {
        blur: false,
        ...contextMaskConfig,
        ...maskConfig,
        closable:
          maskConfig.closable ?? toValue(maskClosable) ?? contextMaskConfig.closable ?? true,
      };
      return !!mergedConfig.closable;
    }),
  };
}
