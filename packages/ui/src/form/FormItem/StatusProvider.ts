/**
 * StatusProvider —— 向 input 族组件广播校验状态（antd `es/form/FormItem/StatusProvider.js`
 * 78 行的 Vue 等价物）。
 *
 * 判据：
 * 1. 读取链：props.validateStatus > meta 状态（getStatus）；
 * 2. hasFeedback：bool 或 {icons}；feedbackIcons（Form 级）优先于 Item 级 icons；
 * 3. variant：Item 级覆盖（VariantContext）> Form 级 variant；
 * 4. provide FormItemInputContext：{ status, hasFeedback, feedbackIcon,
 *    isFormItemInput: true, variant } —— input 系组件的消费入口；
 * 5. noStyle 模式只 provide（不渲染包裹元素）。
 */

import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, inject, provide, type Ref } from 'vue';
import { formItemInputContextKey, formItemPrefixContextKey, variantContextKey } from '../context';
import type { ValidateStatus } from '../interface';
import { getStatus } from '../util';

const StatusProvider = defineComponent({
  name: 'AFormItemStatusProvider',
  props: {
    prefixCls: { type: String, required: true },
    meta: {
      type: Object as PropType<{
        touched?: boolean;
        validating?: boolean;
        validated?: boolean;
      }>,
      required: true,
    },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    hasFeedback: {
      type: [Boolean, Object] as PropType<boolean | { icons: unknown }>,
      default: undefined,
    },
    validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
    parentVariant: {
      type: String as PropType<'outlined' | 'borderless' | 'filled' | 'underlined' | undefined>,
      default: undefined,
    },
    parentContextStatus: {
      type: String as PropType<ValidateStatus | undefined>,
      default: undefined,
    },
    noStyle: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // Form 级 feedbackIcons 由 FormContext 传下（经 ItemHolder 透传）
    const formIcons = inject<Record<string, { icons?: unknown } | undefined>>(
      'apolloFormFeedbackIcons' as never,
      {} as Record<string, { icons?: unknown } | undefined>,
    );
    const variantInjected = inject(variantContextKey, undefined);

    const mergedHasFeedback = computed(() => !!props.hasFeedback);
    const itemIcons = computed(() =>
      props.hasFeedback && typeof props.hasFeedback === 'object'
        ? props.hasFeedback.icons
        : undefined,
    );

    const status = computed<ValidateStatus>(() =>
      getStatus(
        props.errors,
        props.warnings,
        {
          touched: !!props.meta.touched,
          validating: !!props.meta.validating,
          errors: props.errors as never[],
          warnings: props.warnings as never[],
          name: [],
          validated: !!props.meta.validated,
        },
        '',
        mergedHasFeedback.value,
        props.validateStatus ?? props.parentContextStatus,
      ),
    );

    const feedbackIcon = computed(() => {
      if (!mergedHasFeedback.value) return undefined;
      const icons = (itemIcons.value ?? formIcons?.icons) as Record<string, VNodeChild> | undefined;
      return icons?.[status.value] ?? icons?.validating ?? true;
    });

    const variant = computed(() => props.parentVariant ?? variantInjected?.value ?? undefined);

    const contextValue = computed(() => ({
      status: status.value || undefined,
      hasFeedback: mergedHasFeedback.value || undefined,
      feedbackIcon: feedbackIcon.value,
      isFormItemInput: true,
      variant: variant.value,
    }));
    provide(formItemInputContextKey, contextValue as never);

    return () => {
      const prefix = props.prefixCls;
      if (props.noStyle) {
        return slots.default?.();
      }
      return h('div', { class: `${prefix}-item-status-provider` }, slots.default?.());
    };
  },
});

// StatusProvider 同时承担 FormItemPrefixContext 的 provide（antd 经 ItemHolder 的
// FormItemPrefixContext.Provider 传入 prefix + status）
export function provideFormItemPrefix(prefixCls: string, status: ValidateStatus | undefined): void {
  provide(formItemPrefixContextKey as never, { prefixCls, status } as never);
}

export default StatusProvider;
