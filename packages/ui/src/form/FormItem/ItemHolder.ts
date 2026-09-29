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
import type { FormItemLayout, FormItemProps, ValidateStatus } from '../interface';
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
    tooltip: { type: null as unknown as PropType<FormItemProps['tooltip']>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    requiredMark: { type: null as unknown as PropType<unknown>, default: undefined },
    onSubItemMetaChange: {
      type: Function as PropType<(meta: unknown, keys: unknown) => void>,
      required: true,
    },
    /** `name`（StatusProvider 的 name 通道，antd 逐字透传）。 */
    name: { type: null as unknown as PropType<unknown>, default: undefined },
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
    /** ErrorList 的显隐回调（antd 逐字）：错误彻底消失后把 margin 占位清掉。 */
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
        (props.meta.errors ?? []) as unknown[],
        (props.meta.warnings ?? []) as unknown[],
        props.meta,
        '',
        !!props.hasFeedback,
        props.validateStatus,
      ),
    );

    const hasWithHelp = computed(
      () => hasHelp.value || debounceErrors.value.length > 0 || debounceWarnings.value.length > 0,
    );

    const itemClassName = computed(() =>
      [
        itemPrefixCls,
        props.className,
        props.rootClassName,
        hasWithHelp.value ? `${itemPrefixCls}-with-help` : '',
        // Status
        mergedValidateStatus.value && props.hasFeedback ? `${itemPrefixCls}-has-feedback` : '',
        ['success', 'warning', 'error'].includes(mergedValidateStatus.value)
          ? `${itemPrefixCls}-has-${mergedValidateStatus.value}`
          : '',
        mergedValidateStatus.value === 'validating' ? `${itemPrefixCls}-is-validating` : '',
        props.hidden ? `${itemPrefixCls}-hidden` : '',
        // Layout
        layout.value ? `${itemPrefixCls}-${layout.value}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    );

    // noStyle 子项错误上抛（children 外层 provide）
    provide(noStyleItemContextKey, props.onSubItemMetaChange as never);

    return () => {
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
          // antd 逐字：ErrorList 的显隐回调（margin 占位回收）
          onVisibleChanged: onErrorVisibleChanged,
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
                name: props.name as never,
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
