/**
 * ItemHolder —— Form.Item 的行布局（antd `es/form/FormItem/ItemHolder.js` 125 行）。
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

import type { Meta } from '@apollo-design/form-core';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, onMounted, provide, ref, watch } from 'vue';
import { Row } from '../../grid';
import { noStyleItemContextKey, useFormContext } from '../context';
import FormItemInput from '../FormItemInput';
import FormItemLabel from '../FormItemLabel';
import { useDebounce } from '../hooks/use-debounce';
import type { FormItemLayout, ValidateStatus } from '../interface';
import { getStatus } from '../util';
import StatusProvider from './StatusProvider';

const ItemHolder = defineComponent({
  name: 'AFormItemHolder',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    validateStatus: { type: String as PropType<ValidateStatus>, default: undefined },
    meta: { type: Object as PropType<Meta>, required: true },
    hasFeedback: { type: [Boolean, Object], default: undefined },
    hidden: { type: Boolean, default: undefined },
    fieldId: { type: String, default: undefined },
    required: { type: Boolean, default: undefined },
    isRequired: { type: Boolean, default: undefined },
    layout: { type: String as PropType<FormItemLayout | undefined>, default: undefined },
    htmlFor: { type: String, default: undefined },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    labelCol: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    wrapperCol: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    labelAlign: { type: String, default: undefined },
    colon: { type: Boolean, default: undefined },
    tooltip: { type: null as unknown as PropType<unknown>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    requiredMark: { type: null as unknown as PropType<unknown>, default: undefined },
    onSubItemMetaChange: {
      type: Function as PropType<(meta: unknown, keys: unknown) => void>,
      required: true,
    },
    labelClassName: { type: String, default: undefined },
    labelStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    contentClassName: { type: String, default: undefined },
    contentStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    extraClassName: { type: String, default: undefined },
    extraStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup(props, { slots }) {
    const formContext = useFormContext();
    const itemPrefixCls = `${props.prefixCls}-item`;
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
        marginBottom.value = Number.parseInt(itemStyle.marginBottom, 10);
      }
    };
    onMounted(measureMargin);
    watch([hasError, () => props.errors, () => props.warnings], measureMargin, { flush: 'post' });
    const onErrorVisibleChanged = (nextVisible: boolean): void => {
      if (!nextVisible && !hasError.value) {
        marginBottom.value = null;
      }
    };

    // ── 状态 ──
    const mergedValidateStatus = computed<ValidateStatus>(() =>
      getStatus(
        debounceErrors.value,
        debounceWarnings.value,
        props.meta,
        '',
        props.hasFeedback !== undefined && props.hasFeedback !== false,
        props.validateStatus,
      ),
    );

    const itemClassName = computed(() =>
      [
        itemPrefixCls,
        props.className,
        props.rootClassName,
        `${itemPrefixCls}-with-help`,
        `${itemPrefixCls}-has-feedback`,
        `${itemPrefixCls}-has-${mergedValidateStatus.value || 'none'}`,
        `${itemPrefixCls}-is-validating`,
        `${itemPrefixCls}-hidden`,
        `${itemPrefixCls}-${layout.value}`,
      ]
        .filter(
          (c, i) =>
            !!c &&
            // 0/1/2 是无条件基础类；3+ 是条件类，非真值条件时剔除
            (i < 3 ||
              (i === 3 &&
                (hasHelp.value || debounceErrors.value.length || debounceWarnings.value.length)) ||
              (i === 4 && !!mergedValidateStatus.value && !!props.hasFeedback) ||
              (i === 5 && ['success', 'warning', 'error'].includes(mergedValidateStatus.value)) ||
              (i === 6 && mergedValidateStatus.value === 'validating') ||
              (i === 7 && !!props.hidden) ||
              (i === 8 && !!layout.value)),
        )
        .join(' '),
    );

    // noStyle 子项错误上抛（children 外层 provide）
    provide(noStyleItemContextKey, props.onSubItemMetaChange as never);

    return () => {
      if (import.meta.env?.DEV) {
        console.log(
          'DBG-HOLDER-ERRORS:',
          props.errors.length,
          'debounced:',
          debounceErrors.value.length,
          'status:',
          mergedValidateStatus.value,
        );
      }
      const labelNode = h(
        FormItemLabel as never,
        {
          htmlFor: props.fieldId,
          label: props.label,
          requiredMark: props.requiredMark as never,
          required: props.required ?? props.isRequired,
          prefixCls: props.prefixCls,
          vertical: vertical.value,
          labelAlign: props.labelAlign,
          labelCol: props.labelCol as never,
          colon: props.colon,
          tooltip: props.tooltip,
          labelClassName: props.labelClassName,
          labelStyle: props.labelStyle,
        } as never,
      );

      const inputNode = h(
        FormItemInput as never,
        {
          prefixCls: props.prefixCls,
          status: mergedValidateStatus.value,
          help: props.help,
          extra: props.extra,
          fieldId: props.fieldId,
          errors: debounceErrors.value,
          warnings: debounceWarnings.value,
          marginBottom: marginBottom.value,
          labelCol: props.labelCol as never,
          wrapperCol: props.wrapperCol as never,
          label: props.label,
          contentClassName: props.contentClassName,
          contentStyle: props.contentStyle,
          extraClassName: props.extraClassName,
          extraStyle: props.extraStyle,
        },
        {
          default: () =>
            h(
              StatusProvider as never,
              {
                prefixCls: props.prefixCls,
                meta: props.meta,
                errors: props.meta.errors as never[],
                warnings: props.meta.warnings as never[],
                hasFeedback: props.hasFeedback as never,
                validateStatus: mergedValidateStatus.value,
              },
              { default: () => slots.default?.() },
            ),
        },
      );

      const row = h(
        Row as never,
        { class: `${itemPrefixCls}-row` } as never,
        { default: () => [labelNode, inputNode] } as never,
      );

      return h('div', { class: itemClassName.value, style: props.style, ref: itemRef }, [
        row,
        !!marginBottom.value &&
          h('div', {
            class: `${itemPrefixCls}-margin-offset`,
            style: { marginBottom: `-${marginBottom.value}px` },
          }),
      ]);
    };
  },
});

export default ItemHolder;
