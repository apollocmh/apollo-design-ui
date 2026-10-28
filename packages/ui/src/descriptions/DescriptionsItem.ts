/** A real Vue item instance keeps its content and attrs while its layout changes. */
import { isEmptyVNode, mergeDomAttrs } from '@apollo-design/utils';
import { defineComponent, h, inject, type PropType, type SlotsType } from 'vue';
import { descriptionsContextKey } from './context';
import type { DescriptionsItemProps, DescriptionsItemSlots } from './interface';

export const DescriptionsItemComponent = defineComponent({
  name: 'ADescriptionsItem',
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    span: {
      type: [Number, String, Object] as PropType<DescriptionsItemProps['span']>,
      default: undefined,
    },
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    labelStyle: {
      type: Object as PropType<DescriptionsItemProps['labelStyle']>,
      default: undefined,
    },
    contentStyle: {
      type: Object as PropType<DescriptionsItemProps['contentStyle']>,
      default: undefined,
    },
    styles: { type: Object as PropType<DescriptionsItemProps['styles']>, default: undefined },
    classNames: {
      type: Object as PropType<DescriptionsItemProps['classNames']>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<DescriptionsItemSlots>,
  setup(props, { attrs, slots, expose }) {
    expose({});
    const context = inject(descriptionsContextKey, undefined);
    return () => {
      // Outside Descriptions this component remains a transparent content wrapper.
      if (!context) return slots.default?.() ?? null;
      const current = context.value;
      const p = props.prefixCls ?? current.prefixCls;
      const label = slots.label ? slots.label() : props.label;
      return h(
        'div',
        mergeDomAttrs(
          {
            class: [
              `${p}-item`,
              props.className,
              { [`${p}-item-without-label`]: isEmptyVNode(label) },
            ],
          },
          attrs,
        ),
        [
          h(
            'dt',
            {
              key: 'label',
              class: [
                `${p}-item-label`,
                current.classNames.label,
                props.classNames?.label,
                {
                  [`${p}-item-no-colon`]: !current.colon,
                  [`${p}-item-no-label`]: isEmptyVNode(label),
                },
              ],
              style: [current.styles.label, props.labelStyle, props.styles?.label],
            },
            [label],
          ),
          h(
            'dd',
            {
              key: 'content',
              class: [`${p}-item-content`, current.classNames.content, props.classNames?.content],
              style: [current.styles.content, props.contentStyle, props.styles?.content],
            },
            [slots.default?.()],
          ),
        ],
      );
    };
  },
});
export const DescriptionsItem = DescriptionsItemComponent;
export default DescriptionsItem;
