/**
 * FormItemLabel —— Form.Item 的 label 列（antd `es/form/FormItemLabel.js` 100 行）。
 *
 * 判据：
 * 1. label 为空（null/undefined）不渲染整列；
 * 2. colon：`colon===true || (ctx!==false && colon!==false)`；vertical 布局无 colon；
 *    用户 label 尾部冒号去重（正则 `/[:|：]\s*$/`）；
 * 3. tooltip：convertToTooltipProps（bool ⇒ {title: bool}）；默认图标
 *    QuestionCircleOutlined，tabIndex=-1，onClick preventDefault；
 * 4. requiredMark 四形态：true/undefined ⇒ 红 *（CSS before）；'optional' ⇒ 非必填加
 *    `(optional)` 文案；fn ⇒ 自定义；false ⇒ `-item-required-mark-hidden`；
 * 5. label htmlFor=fieldId；title 仅 string label。
 */

import { QuestionCircleOutlined } from '@apollo-design/icons';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h } from 'vue';
import { Col } from '../grid';
import { useFormContext } from './context';
import type { ColProps, FormLabelAlign, RequiredMark } from './interface';

/** antd `convertToTooltipProps`：bool ⇒ {title: bool}；对象原样。 */
function convertToTooltipProps(
  tooltip: unknown,
  contextTooltip: { title?: unknown; icon?: unknown } | undefined,
): { title?: unknown; icon?: unknown } | null {
  if (tooltip === undefined) {
    return contextTooltip ? { ...contextTooltip } : null;
  }
  if (typeof tooltip === 'object' && tooltip !== null) {
    return { ...(contextTooltip ?? {}), ...(tooltip as Record<string, unknown>) };
  }
  return { title: tooltip };
}

const FormItemLabel = defineComponent({
  name: 'AFormItemLabel',
  props: {
    prefixCls: { type: String, required: true },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    htmlFor: { type: String, default: undefined },
    labelCol: { type: Object as PropType<ColProps>, default: undefined },
    labelAlign: { type: String as PropType<FormLabelAlign>, default: undefined },
    colon: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    requiredMark: {
      type: [Boolean, String, Function] as PropType<RequiredMark>,
      default: undefined,
    },
    tooltip: { type: null as unknown as PropType<unknown>, default: undefined },
    vertical: { type: Boolean, default: false },
    labelClassName: { type: String, default: undefined },
    labelStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup(props) {
    const formContext = useFormContext();
    const isRenderable = computed(
      () => props.label !== null && props.label !== undefined && props.label !== false,
    );
    return () => {
      if (!isRenderable.value) return null;
      const formLocaleOptional = 'optional';

      const mergedLabelCol = props.labelCol ?? formContext.labelCol ?? {};
      const mergedLabelAlign = props.labelAlign ?? formContext.labelAlign;
      const labelClsBasic = `${props.prefixCls}-item-label`;
      const labelColClassName = [
        labelClsBasic,
        mergedLabelAlign === 'left' ? `${labelClsBasic}-left` : '',
        (mergedLabelCol as { className?: string }).className ?? '',
        { [`${labelClsBasic}-wrap`]: !!formContext.labelWrap },
      ]
        .map((c) => (typeof c === 'string' ? c : ''))
        .filter(Boolean)
        .join(' ');

      let labelChildren: VNodeChild = props.label;
      // Keep label is original where there should have no colon
      const computedColon =
        props.colon === true || (formContext.colon !== false && props.colon !== false);
      const haveColon = computedColon && !props.vertical;
      if (haveColon && typeof props.label === 'string' && props.label.trim()) {
        labelChildren = props.label.replace(/[:|：]\s*$/, '');
      }

      const tooltipProps = convertToTooltipProps(props.tooltip, formContext.tooltip);
      if (tooltipProps) {
        const tooltipNode = h(
          'span',
          {
            class: `${props.prefixCls}-item-tooltip`,
            onClick: (e: MouseEvent) => {
              e.preventDefault();
            },
            tabindex: -1,
          },
          (tooltipProps.icon as VNodeChild) ??
            (tooltipProps.title as VNodeChild) ??
            h(QuestionCircleOutlined),
        );
        labelChildren = [labelChildren, tooltipNode];
      }

      // Required Mark
      const isOptionalMark = props.requiredMark === 'optional';
      const isRenderMark = typeof props.requiredMark === 'function';
      const hideRequiredMark = props.requiredMark === false;
      if (isRenderMark) {
        labelChildren = (
          props.requiredMark as (l: VNodeChild, i: { required: boolean }) => VNodeChild
        )(labelChildren, { required: !!props.required });
      } else if (isOptionalMark && !props.required) {
        labelChildren = [
          labelChildren,
          h('span', { class: `${props.prefixCls}-item-optional` }, formLocaleOptional),
        ];
      }

      let markType: string | undefined;
      if (hideRequiredMark) {
        markType = 'hidden';
      } else if (isOptionalMark || isRenderMark) {
        markType = 'optional';
      }

      const labelClassName = [
        props.labelClassName,
        {
          [`${props.prefixCls}-item-required`]: props.required,
          [`${props.prefixCls}-item-required-mark-${markType ?? ''}`]: !!markType,
          [`${props.prefixCls}-item-no-colon`]: !computedColon,
        },
      ]
        .map((c) => (typeof c === 'string' ? c : ''))
        .filter(Boolean)
        .join(' ');

      return h(
        Col,
        {
          ...(mergedLabelCol as Record<string, unknown>),
          className: labelColClassName,
        },
        {
          default: () =>
            h(
              'label',
              {
                for: props.htmlFor,
                class: labelClassName,
                style: props.labelStyle,
                title: typeof props.label === 'string' ? props.label : undefined,
              },
              [labelChildren],
            ),
        },
      );
    };
  },
});

export default FormItemLabel;
