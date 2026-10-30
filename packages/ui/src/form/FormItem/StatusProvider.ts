import type { Meta } from '@apollo-design/form-core';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined,
} from '@apollo-design/icons';
import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUpdate,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
  toValue,
  type VNodeChild,
} from 'vue';
import {
  type FormItemInputContextValue,
  formItemInputContextKey,
  useFormContext,
  variantContextKey,
} from '../context';
import type { FormItemSlots, ValidateStatus } from '../interface';
import { getStatus } from '../util';

const iconMap = {
  success: CheckCircleFilled,
  warning: ExclamationCircleFilled,
  error: CloseCircleFilled,
  validating: LoadingOutlined,
};

export default defineComponent({
  name: 'AFormItemStatusProvider',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    meta: { type: Object as PropType<Meta>, required: true },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    hasFeedback: { type: Boolean, default: undefined },
    validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
    noStyle: { type: Boolean, default: false },
    name: { type: null as unknown as PropType<unknown>, default: undefined },
  },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    feedbackIcon?: FormItemSlots['feedbackIcon'];
  }>,
  setup(props, { slots }) {
    const formContext = useFormContext();
    const variant = inject(variantContextKey, undefined);
    const parent = inject(formItemInputContextKey, undefined);
    const feedbackIcon = shallowRef(slots.feedbackIcon);
    onBeforeUpdate(() => {
      feedbackIcon.value = slots.feedbackIcon;
    });
    const status = computed(() =>
      getStatus(
        props.errors,
        props.warnings,
        props.meta,
        null,
        props.hasFeedback,
        props.validateStatus,
      ),
    );
    const FeedbackIcon = defineComponent({
      name: 'AFormFeedbackIcon',
      slots: Object as SlotsType<{ default?: FormItemSlots['feedbackIcon'] }>,
      setup:
        (_props, { slots: contentSlots }) =>
        () => {
          const current = status.value;
          if (!props.hasFeedback || !current) return null;
          const renderIcon = contentSlots.default;
          const content = renderIcon
            ? renderIcon({ status: current, errors: props.errors, warnings: props.warnings })
            : h(iconMap[current]);
          return h(
            'span',
            {
              class: `${props.prefixCls}-item-feedback-icon ${props.prefixCls}-item-feedback-icon-${current}`,
              'aria-hidden': true,
            },
            [content],
          );
        },
    });
    const contextValue = computed<FormItemInputContextValue>(() => {
      const parentValue = toValue(parent);
      const renderIcon = feedbackIcon.value ?? formContext.feedbackIcon;
      const next: FormItemInputContextValue = {
        status: status.value || undefined,
        errors: props.errors,
        warnings: props.warnings,
        hasFeedback: props.hasFeedback || undefined,
        get feedbackIcon() {
          if (props.noStyle && props.hasFeedback === undefined) return parentValue?.feedbackIcon;
          return props.hasFeedback && status.value
            ? h(FeedbackIcon, {}, renderIcon ? { default: renderIcon } : {})
            : undefined;
        },
        isFormItemInput: true,
        variant: variant?.value,
        name: props.name,
      };
      if (props.noStyle) {
        next.status = status.value || parentValue?.status;
        next.isFormItemInput = parentValue?.isFormItemInput;
        next.hasFeedback = props.hasFeedback ?? parentValue?.hasFeedback;
        next.name = props.name ?? parentValue?.name;
      }
      return next;
    });
    provide(formItemInputContextKey, contextValue);
    return () => slots.default?.();
  },
});
