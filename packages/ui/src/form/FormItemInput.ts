/**
 * FormItemInput —— Form.Item 的 control 列（antd `es/form/FormItemInput.js` 127 行）。
 *
 * 判据：
 * 1. wrapperCol 合并：**label===null 且无自身 col 且 ctx.labelCol 存在时**
 *    `wrapper.offset = label.span`（responsive 逐档；label 不渲染时 control 顶格）；
 * 2. DOM：`-item-control` > `-control-input` > `-control-input-content`（semantic content）；
 * 3. ErrorList 渲染条件 `marginBottom !== null || errors.length || warnings.length`；
 * 4. extra 带独立 id `${fieldId}_extra`；
 * 5. errorListDom/extraDom 包进 `-item-additional`（minHeight = marginBottom +
 *    extraHeight —— 动效占位联动）；
 * 6. 向下透传 FormContext 时**剥离 col 配置**（嵌套 Item 不继承列宽）。
 */

import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Col } from '../grid';
import { provideFormContextShallow, useFormContext } from './context';
import ErrorList from './ErrorList';
import type { ColProps, ValidateStatus } from './interface';

// responsive 断点（antd responsiveArrayReversed：逐档自大向小；undefined = 基础档）
const RESPONSIVE_SIZES = ['xxl', 'xl', 'lg', 'md', 'sm', undefined] as const;
const GRID_MAX = 24;

const FormItemInput = defineComponent({
  name: 'AFormItemInput',
  props: {
    prefixCls: { type: String, required: true },
    status: { type: String as PropType<ValidateStatus | ''>, default: undefined },
    labelCol: { type: Object as PropType<ColProps>, default: undefined },
    wrapperCol: { type: Object as PropType<ColProps>, default: undefined },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    fieldId: { type: String, default: undefined },
    marginBottom: { type: Number, default: null },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    contentClassName: { type: String, default: undefined },
    contentStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    extraClassName: { type: String, default: undefined },
    extraStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup(props, { slots }) {
    const formContext = useFormContext();

    const mergedWrapperCol = computed<Record<string, unknown>>(() => {
      let mergedWrapper: Record<string, unknown> = {
        ...((props.wrapperCol ?? formContext.wrapperCol ?? {}) as Record<string, unknown>),
      };
      if (props.label === null && !props.labelCol && !props.wrapperCol && formContext.labelCol) {
        const list = [...RESPONSIVE_SIZES];
        list.forEach((size) => {
          const formLabel = size
            ? (formContext.labelCol as Record<string, unknown>)?.[size]
            : formContext.labelCol;
          const formLabelObj = (formLabel ?? {}) as Record<string, unknown>;
          const wrapper = size ? mergedWrapper[size] : mergedWrapper;
          const wrapperObj = (wrapper ?? {}) as Record<string, unknown>;
          if (
            'span' in formLabelObj &&
            !('offset' in wrapperObj) &&
            Number(formLabelObj.span) < GRID_MAX
          ) {
            if (size) {
              mergedWrapper[size] = { ...wrapperObj, offset: formLabelObj.span };
            } else {
              mergedWrapper = { ...mergedWrapper, offset: formLabelObj.span };
            }
          }
        });
      }
      return mergedWrapper;
    });

    // extra 高度实测（additional minHeight 联动）
    const extraRef = ref<HTMLElement | null>(null);
    const extraHeight = ref(0);
    const measureExtra = (): void => {
      extraHeight.value = props.extra && extraRef.value ? extraRef.value.clientHeight : 0;
    };
    onMounted(measureExtra);
    watch(
      () => props.extra,
      () => {
        measureExtra();
      },
      { flush: 'post' },
    );
    onBeforeUnmount(() => {});

    // ⚠️ provide 必须在 setup 同步阶段；剥离 col 配置（antd 逐字解构丢弃），
    //    值用 Proxy 桥（读时取最新 formContext —— cascader 同范式）。
    provideFormContextShallow(formContext);

    return () => {
      const baseClassName = `${props.prefixCls}-item`;
      const className = [
        `${baseClassName}-control`,
        (mergedWrapperCol.value as { className?: string }).className ?? '',
      ]
        .filter(Boolean)
        .join(' ');

      const inputDom = h(
        'div',
        { class: `${baseClassName}-control-input` },
        h(
          'div',
          {
            class: `${baseClassName}-control-input-content${props.contentClassName ? ` ${props.contentClassName}` : ''}`,
            style: props.contentStyle,
          },
          slots.default?.(),
        ),
      );

      const showExplain =
        props.marginBottom !== null || props.errors.length > 0 || props.warnings.length > 0;
      const errorListDom = showExplain
        ? h(ErrorList, {
            fieldId: props.fieldId,
            errors: props.errors,
            warnings: props.warnings,
            help: props.help,
            helpStatus: props.status,
            className: `${baseClassName}-explain-connected`,
          })
        : null;

      const extraDom = props.extra
        ? h(
            'div',
            {
              ...(props.fieldId ? { id: `${props.fieldId}_extra` } : {}),
              class: [`${baseClassName}-extra`, props.extraClassName].filter(Boolean).join(' '),
              style: props.extraStyle,
              ref: extraRef,
            },
            [props.extra],
          )
        : null;

      const additionalDom =
        errorListDom || extraDom
          ? h(
              'div',
              {
                class: `${baseClassName}-additional`,
                style: props.marginBottom
                  ? { minHeight: `${props.marginBottom + extraHeight.value}px` }
                  : undefined,
              },
              [errorListDom, extraDom],
            )
          : null;

      return h(Col, { ...(mergedWrapperCol.value as object), className } as never, {
        default: () => [inputDom, additionalDom],
      });
    };
  },
});

export default FormItemInput;
