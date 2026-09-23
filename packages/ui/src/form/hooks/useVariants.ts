/**
 * `form/hooks/useVariants` —— 输入族组件的 variant 解析链。
 *
 * 契约来源：antd 6.6.4 的 `es/form/hooks/useVariants.js`（45 行，行为规格逐条对齐）：
 *
 * ```
 * props.variant > legacyBordered===false('borderless') > Form.Item 的 VariantContext
 *   > ConfigProvider 组件级 variant（components.inputNumber.variant）> 全局 variant
 *   > 默认 'outlined'
 * ```
 *
 * `enableVariantCls`：合并结果在 `Variants` 枚举内才加 `-{variant}` 类
 * （antd 返回的第三个值 `isVariantConfigured` 当前无消费方，不导出）。
 *
 * ⚠️ 这是 Form 的叶子模块（registry `form/hooks/useVariants`），Input / Select
 * 落地时直接复用，语义不再改。
 */

import { computed, inject, type MaybeRefOrGetter, type Ref, toValue } from 'vue';
import { useConfigContext, type Variant } from '../../config-provider/context';
import { variantContextKey } from '../context';

const VARIANTS: readonly Variant[] = ['outlined', 'borderless', 'filled', 'underlined'];

export interface UseVariantOptions {
  /**
   * ConfigProvider 组件级配置键（如 `'inputNumber'`）—— 读
   * `components.inputNumber.variant`。
   */
  component: string;
  /** 组件自身的 `variant` prop（响应式）。 */
  variant?: MaybeRefOrGetter<Variant | undefined>;
  /** deprecated `bordered` prop（响应式）。`false` ⇒ 'borderless'。 */
  legacyBordered?: MaybeRefOrGetter<boolean | undefined>;
}

/** `[mergedVariant, enableVariantCls]`（用对象形态返回，调用方解构命名）。 */
export function useVariant(options: UseVariantOptions): {
  variant: Ref<Variant>;
  enableVariantCls: Ref<boolean>;
} {
  const context = useConfigContext();
  // 组件级配置：`components.inputNumber.variant`
  const componentConfig = context.components?.[options.component] as
    | { variant?: Variant }
    | undefined;
  const ctxVariant = inject(variantContextKey, undefined);

  const variant = computed<Variant>(() => {
    const custom = toValue(options.variant);
    const legacyBordered = toValue(options.legacyBordered);
    if (typeof custom !== 'undefined') {
      return custom;
    }
    if (legacyBordered === false) {
      return 'borderless';
    }
    // form variant > 组件级全局配置 > 全局 variant > 默认
    return ctxVariant?.value ?? componentConfig?.variant ?? context.variant ?? 'outlined';
  });

  const enableVariantCls = computed(() => VARIANTS.includes(variant.value));

  return { variant, enableVariantCls };
}
