/**
 * ItemHolder —— Form.Item 的响应式行布局与校验状态。
 *
 * 判据：
 * 1. margin 联动：hasError 时实测 `-item` 的 marginBottom → `marginBottom` state →
 *    additional minHeight + 外层 `-margin-offset`（marginBottom 取负）—— 错误出现/
 *    消失时布局不跳；
 * 2. 状态类：`-with-help` / `-has-feedback` / `-has-success|warning|error` /
 *    `-is-validating` / `-hidden` / `-${layout}`；
 * 3. Row 包 Label + Input；StatusProvider 包 children 并注入 FormItemInputContext；
 * 4. NoStyleItemContext 在 children 外层 provide（noStyle 子项错误上抛）。
 */

import type { InternalNamePath, Meta, MetaEvent } from '@apollo-design/form-core';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, onMounted, onUpdated, provide, ref, watch } from 'vue';
import { Row } from '../../grid';
import { formItemPrefixContextKey, noStyleItemContextKey, useFormContext } from '../context';
import FormItemInput from '../FormItemInput';
import FormItemLabel from '../FormItemLabel';
import { useDebounce } from '../hooks/use-debounce';
import type {
  ColProps,
  FormItemLayout,
  FormItemProps,
  RequiredMark,
  ValidateStatus,
} from '../interface';
import { getStatus } from '../util';
import StatusProvider from './StatusProvider';

const ItemHolder = defineComponent({
  name: 'AFormItemHolder',
  props: {
    prefixCls: { type: String, required: true },
    help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
    meta: { type: Object as PropType<Meta>, required: true },
    hasFeedback: { type: Boolean, default: undefined },
    hidden: { type: Boolean, default: undefined },
    fieldId: { type: String, default: undefined },
    required: { type: Boolean, default: undefined },
    isRequired: { type: Boolean, default: undefined },
    layout: { type: String as PropType<FormItemLayout | undefined>, default: undefined },
    htmlFor: { type: String, default: undefined },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    labelCol: { type: Object as PropType<ColProps>, default: undefined },
    wrapperCol: { type: Object as PropType<ColProps>, default: undefined },
    labelAlign: { type: String as PropType<FormItemProps['labelAlign']>, default: undefined },
    colon: { type: Boolean, default: undefined },
    tooltip: { type: null as unknown as PropType<FormItemProps['tooltip']>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    requiredMark: { type: [Boolean, String] as PropType<RequiredMark>, default: undefined },
    /** `name`（StatusProvider 的 name 通道）。 */
    name: { type: null as unknown as PropType<unknown>, default: undefined },
  },
  emits: { subItemMetaChange: (_meta: MetaEvent, _keys: InternalNamePath) => true },
  setup(props, { slots, emit }) {
    const formContext = useFormContext();
    const itemPrefixCls = computed(() => `${props.prefixCls}-item`);
    const layout = computed(() => props.layout ?? formContext.layout);
    const vertical = computed(() => layout.value === 'vertical');

    // ── margin 联动 ──
    const itemRef = ref<HTMLElement | null>(null);
    const debounceErrors = useDebounce(computed(() => props.errors));
    const debounceWarnings = useDebounce(computed(() => props.warnings));
    const hasHelp = computed(() => props.help !== undefined && props.help !== null);
    const hasError = computed(
      () => !!(hasHelp.value || debounceErrors.value.length || debounceWarnings.value.length),
    );
    const marginBottom = ref<number | null>(null);
    const measureMargin = (): void => {
      if (hasError.value && itemRef.value) {
        const itemStyle = getComputedStyle(itemRef.value);
        const margin = Number.parseFloat(itemStyle.marginBottom);
        marginBottom.value = Number.isFinite(margin) ? margin : 0;
      }
    };
    onMounted(measureMargin);
    onUpdated(measureMargin);
    // Prefix/layout switches can select different preloaded static CSS margins.
    // Measure after the new classes reach the DOM, even while the same help stays visible.
    watch(
      [hasError, () => props.errors, () => props.warnings, () => props.prefixCls, layout],
      measureMargin,
      { flush: 'post' },
    );
    /** ErrorList 的显隐回调：错误彻底消失后把 margin 占位清掉。 */
    const onErrorVisibleChanged = (nextVisible: boolean): void => {
      if (!nextVisible && !hasError.value) {
        marginBottom.value = null;
      }
    };

    // ── 状态 ──
    // ⚠️ 状态取 **meta.errors / meta.warnings**（未 debounce 的那一份），
    //    只有「渲染错误文字」才走 debounce —— antd 的 getValidateState() 默认
    //    isDebounce=false。用 debounce 值会让 `-has-error` 类跟着延迟，
    //    与 antd 的状态切换时机错开（L4 契约能发现）。
    const mergedValidateStatus = computed<ValidateStatus>(() =>
      getStatus(
        props.meta.errors,
        props.meta.warnings,
        props.meta,
        '',
        !!props.hasFeedback,
        props.validateStatus,
      ),
    );

    provide(formItemPrefixContextKey, {
      get prefixCls() {
        return props.prefixCls;
      },
      get status() {
        return mergedValidateStatus.value;
      },
    });

    const hasWithHelp = computed(
      () => hasHelp.value || debounceErrors.value.length > 0 || debounceWarnings.value.length > 0,
    );

    const itemClassName = computed(() =>
      [
        itemPrefixCls.value,
        hasWithHelp.value ? `${itemPrefixCls.value}-with-help` : '',
        // Status
        mergedValidateStatus.value && props.hasFeedback
          ? `${itemPrefixCls.value}-has-feedback`
          : '',
        ['success', 'warning', 'error'].includes(mergedValidateStatus.value)
          ? `${itemPrefixCls.value}-has-${mergedValidateStatus.value}`
          : '',
        mergedValidateStatus.value === 'validating' ? `${itemPrefixCls.value}-is-validating` : '',
        props.hidden ? `${itemPrefixCls.value}-hidden` : '',
        // Layout
        layout.value ? `${itemPrefixCls.value}-${layout.value}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );

    // noStyle 子项错误上抛（children 外层 provide）
    provide(noStyleItemContextKey, (meta, keys) => emit('subItemMetaChange', meta, keys));

    return () => {
      const labelNode = h(
        FormItemLabel,
        {
          htmlFor: props.htmlFor ?? props.fieldId,
          label: props.label,
          requiredMark: props.requiredMark,
          required: props.required ?? props.isRequired,
          prefixCls: props.prefixCls,
          vertical: vertical.value,
          labelAlign: props.labelAlign,
          labelCol: props.labelCol,
          colon: props.colon,
          tooltip: props.tooltip,
        },
        {
          ...(slots.label ? { default: slots.label } : {}),
          ...(slots.tooltip ? { tooltip: slots.tooltip } : {}),
        },
      );

      const inputNode = h(
        FormItemInput,
        {
          prefixCls: props.prefixCls,
          status: mergedValidateStatus.value,
          help: props.help,
          extra: props.extra,
          fieldId: props.fieldId,
          errors: debounceErrors.value,
          warnings: debounceWarnings.value,
          marginBottom: marginBottom.value,
          labelCol: props.labelCol,
          wrapperCol: props.wrapperCol,
          label: props.label,
          // ErrorList 的显隐回调回收 margin 占位。
          onVisibleChanged: onErrorVisibleChanged,
        },
        {
          default: () =>
            h(
              StatusProvider,
              {
                prefixCls: props.prefixCls,
                meta: props.meta,
                errors: props.meta.errors,
                warnings: props.meta.warnings,
                hasFeedback: props.hasFeedback,
                validateStatus: mergedValidateStatus.value,
                name: props.name,
              },
              {
                default: () => slots.default?.(),
                ...(slots.feedbackIcon ? { feedbackIcon: slots.feedbackIcon } : {}),
              },
            ),
        },
      );

      const row = h(
        Row,
        { class: `${itemPrefixCls.value}-row` },
        { default: () => [labelNode, inputNode] },
      );

      return h('div', { class: itemClassName.value, ref: itemRef }, [
        row,
        !!marginBottom.value &&
          h('div', {
            class: `${itemPrefixCls.value}-margin-offset`,
            style: { marginBottom: `-${marginBottom.value}px` },
          }),
      ]);
    };
  },
});

export default ItemHolder;
