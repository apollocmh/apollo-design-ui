/**
 * `useMergedMask` / `normalizeMaskConfig` —— antd `_util/hooks/useMergedMask.ts` 的 Vue 版。
 *
 * 契约（逐条对齐上游）：
 *   1. `normalizeMaskConfig(mask, maskClosable)`：对象 ⇒ **拷贝**（不写回用户的 `mask`）；
 *      布尔 ⇒ `{ enabled: mask }`；`closable` 未给时用 `maskClosable` 补；
 *   2. 合并顺序 `{ blur: false, ...contextMaskConfig, ...maskConfig }`（**props 赢**），
 *      `closable` 单独算：`maskConfig.closable ?? maskClosable ?? contextMaskConfig.closable ?? true`
 *      （**`maskClosable` 优先于 context 的 closable**）；
 *   3. 返回 `{ enabled: enabled !== false, classNames: { mask: blur ? '{p}-mask-blur' : undefined },
 *      closable: !!closable }`
 *      —— ⚠️ `enabled` 是**布尔**（`enabled !== false`），不是配置对象。
 *
 * ⭐ **三次法则已满足**（drawer 第二个、modal 第三个）⇒ 2026-09-26 从
 *    `packages/ui/src/drawer/hooks/useMergedMask.ts` 提到 `_internal/`，drawer 与 modal 共用。
 *
 * ⚠️ 与搬家前的一处**实现**差异（语义完全等价，只是少算两遍）：
 *    旧版把同一段「normalize + merge」在三个 computed 里各写一遍；这里合并成
 *    一个 `mergedConfig` computed，三个返回值都从它派生。
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

export interface UseMergedMaskReturn {
  /** `enabled !== false` —— 是否渲染遮罩。 */
  enabled: ComputedRef<boolean>;
  /** 语义槽类名（目前只有 `mask`）。 */
  classNames: ComputedRef<Record<string, string | undefined>>;
  /** `!!closable` —— 点遮罩是否关闭。 */
  closable: ComputedRef<boolean>;
}

export function useMergedMask(
  mask: MaybeRefOrGetter<MaskType | undefined>,
  contextMask: MaybeRefOrGetter<MaskType | undefined>,
  prefixCls: MaybeRefOrGetter<string | undefined>,
  maskClosable: MaybeRefOrGetter<boolean | undefined>,
): UseMergedMaskReturn {
  const mergedConfig = computed<MaskConfig>(() => {
    const maskConfig = normalizeMaskConfig(toValue(mask), toValue(maskClosable));
    const contextMaskConfig = normalizeMaskConfig(toValue(contextMask));
    return {
      blur: false,
      ...contextMaskConfig,
      ...maskConfig,
      closable: maskConfig.closable ?? toValue(maskClosable) ?? contextMaskConfig.closable ?? true,
    };
  });

  return {
    enabled: computed(() => mergedConfig.value.enabled !== false),
    classNames: computed(() => ({
      mask: mergedConfig.value.blur ? `${toValue(prefixCls)}-mask-blur` : undefined,
    })),
    closable: computed(() => !!mergedConfig.value.closable),
  };
}
