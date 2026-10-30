import { QuestionCircleOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { defineComponent, h, isVNode, type PropType, type SlotsType, type VNodeChild } from 'vue';
import { Col } from '../grid';
import Tooltip from '../tooltip';
import { useFormContext } from './context';
import type {
  ColProps,
  FormItemProps,
  FormLabelAlign,
  FormTooltipProps,
  RequiredMark,
} from './interface';

function isRenderableNode(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

function tooltipProps(
  tooltip: FormItemProps['tooltip'],
  defaults: FormTooltipProps | undefined,
): FormTooltipProps | null {
  if (!isRenderableNode(tooltip)) return null;
  if (isVNode(tooltip) || Array.isArray(tooltip) || typeof tooltip !== 'object') {
    return { ...defaults, title: tooltip };
  }
  return { ...defaults, ...tooltip };
}

export default defineComponent({
  name: 'AFormItemLabel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    htmlFor: { type: String, default: undefined },
    labelCol: { type: Object as PropType<ColProps>, default: undefined },
    labelAlign: { type: String as PropType<FormLabelAlign>, default: undefined },
    colon: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    requiredMark: { type: [Boolean, String] as PropType<RequiredMark>, default: undefined },
    tooltip: { type: null as unknown as PropType<FormItemProps['tooltip']>, default: undefined },
    vertical: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild; tooltip?: () => VNodeChild }>,
  setup(props, { slots }) {
    const context = useFormContext();
    const [locale] = useLocale('Form');
    const colon = () => props.colon ?? context.colon ?? true;
    const labelContent = (): VNodeChild => {
      let label: VNodeChild = slots.default ? slots.default() : props.label;
      if (colon() && !props.vertical && typeof label === 'string' && label.trim()) {
        label = label.replace(/[:：]\s*$/, '');
      }
      return label;
    };
    const renderTooltip = (): VNodeChild => {
      const configured = tooltipProps(props.tooltip, context.tooltip);
      const tooltip = slots.tooltip ? { ...configured, title: slots.tooltip() } : configured;
      if (!tooltip) return null;
      const { icon, ...options } = tooltip;
      const indicator = icon ?? h(QuestionCircleOutlined);
      return h(
        Tooltip,
        { ...options, trigger: options.trigger ?? ['hover', 'focus'] },
        {
          default: () =>
            h(
              'button',
              {
                type: 'button',
                class: `${props.prefixCls}-item-tooltip`,
                'aria-label':
                  typeof tooltip.title === 'string' ? tooltip.title : 'Field information',
                onClick: (event: MouseEvent) => event.preventDefault(),
              },
              [indicator],
            ),
        },
      );
    };
    // A component handle lets Vue templates reuse arbitrary original label content.
    const Label = defineComponent({ name: 'AFormRequiredLabel', setup: () => labelContent });

    return () => {
      if (!slots.default && !isRenderableNode(props.label)) return null;
      const labelCol = props.labelCol ?? context.labelCol ?? {};
      const align = props.labelAlign ?? context.labelAlign;
      const labelClass = `${props.prefixCls}-item-label`;
      const renderMark = context.requiredMarkSlot;
      const optional = props.requiredMark === 'optional';
      const hidden = props.requiredMark === false;
      let content = renderMark
        ? renderMark({ label: Label, required: Boolean(props.required) })
        : labelContent();
      if (!renderMark && optional && !props.required) {
        content = [
          content,
          h('span', { class: `${props.prefixCls}-item-optional` }, locale.value.optional),
        ];
      }
      const markType = hidden ? 'hidden' : optional || renderMark ? 'optional' : undefined;
      return h(
        Col,
        {
          ...labelCol,
          class: [
            labelClass,
            align === 'left' ? `${labelClass}-left` : '',
            labelCol.class,
            context.labelWrap ? `${labelClass}-wrap` : '',
          ],
        },
        {
          default: () => [
            h(
              'label',
              {
                for: props.htmlFor,
                class: [
                  context.classNames?.label,
                  props.required ? `${props.prefixCls}-item-required` : '',
                  markType ? `${props.prefixCls}-item-required-mark-${markType}` : '',
                  !colon() ? `${props.prefixCls}-item-no-colon` : '',
                ],
                style: context.styles?.label,
                title: typeof props.label === 'string' && !slots.default ? props.label : undefined,
              },
              [content],
            ),
            renderTooltip(),
          ],
        },
      );
    };
  },
});
