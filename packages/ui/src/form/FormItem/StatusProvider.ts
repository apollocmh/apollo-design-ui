/**
 * StatusProvider —— 向 input 族组件广播校验状态（antd `es/form/FormItem/StatusProvider.js`
 * 的 Vue 等价物）。
 *
 * ── 关键判据 ────────────────────────────────────────────────────────────────
 * 1. 状态取值：`getStatus(errors, warnings, meta, null, !!hasFeedback, validateStatus)`
 *    —— ⚠️ 用**未 debounce** 的 errors（ItemHolder 传下来的已是 meta 源头）；
 * 2. 反馈图标：`hasFeedback` 为真时
 *    `customIcons = (hasFeedback !== true && hasFeedback.icons) || formFeedbackIcons`
 *    ⇒ `customIcons({status, errors, warnings})?.[status]`；
 *    再包一层 `<span class="{item}-feedback-icon {item}-feedback-icon-{status}">`，
 *    默认图标是 antd 的 iconMap（success/warning/error/validating 四件）；
 *    `customIconNode === false` 或状态为空 ⇒ 不渲染图标；
 * 3. `noStyle`：**跟随父上下文**（status / isFormItemInput / hasFeedback / feedbackIcon / name
 *    都从 FormItemInputContext 继承）；
 * 4. **不产出任何 DOM**：只 provide（antd 6.6.4 无包裹元素 —— 早期版本误加了
 *    `-item-status-provider` div，那是自造的类名，会污染 L4 契约）。
 */

import type { Meta } from '@apollo-design/form-core';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LoadingOutlined,
} from '@apollo-design/icons';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, inject, provide, toValue } from 'vue';
import {
  type FormItemInputContextValue,
  formItemInputContextKey,
  useFormContext,
  variantContextKey,
} from '../context';
import type { ValidateStatus } from '../interface';
import { getStatus } from '../util';

/** antd 的 iconMap（`StatusProvider.js`）。 */
const iconMap: Record<string, unknown> = {
  success: CheckCircleFilled,
  warning: ExclamationCircleFilled,
  error: CloseCircleFilled,
  validating: LoadingOutlined,
};

const StatusProvider = defineComponent({
  name: 'AFormItemStatusProvider',
  props: {
    prefixCls: { type: String, required: true },
    meta: { type: Object as PropType<Meta>, required: true },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    hasFeedback: {
      type: [Boolean, Object] as PropType<boolean | { icons: unknown }>,
      default: undefined,
    },
    validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
    noStyle: { type: Boolean, default: false },
    name: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  },
  setup(props, { slots }) {
    const formContext = useFormContext();
    const variantInjected = inject(variantContextKey, undefined);
    const parent = inject(formItemInputContextKey, undefined);

    const mergedHasFeedback = computed(() => !!props.hasFeedback);

    const status = computed<ValidateStatus>(() =>
      getStatus(
        props.errors,
        props.warnings,
        props.meta,
        null,
        mergedHasFeedback.value,
        props.validateStatus,
      ),
    );

    const feedbackIcon = computed<VNodeChild>(() => {
      if (!mergedHasFeedback.value) return undefined;
      // antd 逐字：Item 级 icons 优先（hasFeedback 为对象时才有），否则 Form 级
      // feedbackIcons（函数形态）。`hasFeedback === true` 时没有 icons ⇒ 直接用 Form 级。
      const itemIcons =
        typeof props.hasFeedback === 'object' && props.hasFeedback
          ? props.hasFeedback.icons
          : undefined;
      const customIcons = itemIcons || (formContext.feedbackIcons as unknown);
      const customIconNode = (
        customIcons as ((info: unknown) => Record<string, VNodeChild> | undefined) | undefined
      )?.({
        status: status.value,
        errors: props.errors,
        warnings: props.warnings,
      })?.[status.value];
      const IconNode = (status.value ? iconMap[status.value] : undefined) as
        | (() => VNodeChild)
        | undefined;
      if (customIconNode === false || !IconNode) return null;
      const itemPrefixCls = `${props.prefixCls}-item`;
      return h(
        'span',
        { class: `${itemPrefixCls}-feedback-icon ${itemPrefixCls}-feedback-icon-${status.value}` },
        [customIconNode || h(IconNode)],
      );
    });

    const variant = computed(
      () => variantInjected?.value as FormItemInputContextValue['variant'] | undefined,
    );

    const contextValue = computed<FormItemInputContextValue>(() => {
      // ⚠️ 父级可能是 ComputedRef（本组件的产物）/ 裸对象（Form 外的 NoFormStyle）⇒ 解包
      const parentValue = toValue(parent) as FormItemInputContextValue | undefined;
      const next: FormItemInputContextValue = {
        status: status.value || undefined,
        errors: props.errors,
        warnings: props.warnings,
        hasFeedback: mergedHasFeedback.value || undefined,
        feedbackIcon: feedbackIcon.value,
        isFormItemInput: true,
        variant: variant.value,
        name: props.name,
      };
      if (props.noStyle) {
        next.status = (status.value || parentValue?.status) as ValidateStatus | undefined;
        next.isFormItemInput = parentValue?.isFormItemInput;
        next.hasFeedback = !!(props.hasFeedback ?? parentValue?.hasFeedback);
        next.feedbackIcon =
          props.hasFeedback !== undefined ? next.feedbackIcon : parentValue?.feedbackIcon;
        next.name = props.name ?? parentValue?.name;
      }
      return next;
    });
    provide(formItemInputContextKey, contextValue as never);

    // ⚠️ 只 provide，不渲染任何包裹元素（antd 6.6.4 逐字）
    return () => slots.default?.();
  },
});

export default StatusProvider;
