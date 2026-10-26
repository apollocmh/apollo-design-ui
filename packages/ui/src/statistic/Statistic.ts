/** Numeric presentation with complete native Vue content and current configuration. */
import { isEmptyVNode, mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import { computed, defineComponent, h, type SlotsType, shallowRef } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import Skeleton from '../skeleton';
import type {
  StatisticConfig,
  StatisticProps,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  StatisticSlots,
} from './interface';
import StatisticNumber, { numberParts } from './Number';
import { statisticPresentationProps } from './props';
import { useStatisticTheme } from './use-statistic-theme';

export default defineComponent({
  name: 'AStatistic',
  inheritAttrs: false,
  props: {
    ...statisticPresentationProps,
    precision: { type: Number, default: undefined },
    decimalSeparator: { type: String, default: '.' },
    groupSeparator: { type: String, default: ',' },
  },
  slots: Object as SlotsType<StatisticSlots>,
  setup(props, { attrs, expose, slots }) {
    const context = useComponentConfig<StatisticConfig>('statistic');
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('statistic', props.prefixCls));
    const theme = useStatisticTheme(() => prefix.value);
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });
    const warning = useDevWarning('Statistic');
    warning.deprecated(props.valueStyle === undefined, 'valueStyle', 'styles.content');
    const semantic = useMergeSemantic<
      StatisticProps,
      StatisticSemanticClassNames,
      StatisticSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    return () => {
      const cls = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const title = slots.title ? slots.title() : props.title;
      const before = slots.prefix ? slots.prefix() : props.prefix;
      const after = slots.suffix ? slots.suffix() : props.suffix;
      const value = h(
        StatisticNumber,
        {
          key: 'value',
          prefixCls: cls,
          value: props.value,
          precision: props.precision,
          decimalSeparator: props.decimalSeparator,
          groupSeparator: props.groupSeparator,
          class: [`${cls}-content-value`, classes.value],
          style: styles.value,
        },
        slots.value
          ? {
              default: () =>
                slots.value?.({ value: props.value, text: numberParts(props.value, props).text }),
            }
          : undefined,
      );
      const content = h(
        'div',
        { class: [`${cls}-content`, classes.content], style: [props.valueStyle, styles.content] },
        [
          !isEmptyVNode(before)
            ? h(
                'span',
                {
                  key: 'prefix',
                  class: [`${cls}-content-prefix`, classes.prefix],
                  style: styles.prefix,
                },
                [h(NodeRenderer, { node: before })],
              )
            : null,
          value,
          !isEmptyVNode(after)
            ? h(
                'span',
                {
                  key: 'suffix',
                  class: [`${cls}-content-suffix`, classes.suffix],
                  style: styles.suffix,
                },
                [h(NodeRenderer, { node: after })],
              )
            : null,
        ],
      );
      return h(
        'div',
        mergeDomAttrs(
          {
            ref: rootRef,
            class: [
              cls,
              { [`${cls}-rtl`]: direction.value === 'rtl' },
              context.className,
              classes.root,
            ],
            style: [theme.styles.value, styles.root],
            onMouseenter: props.onMouseenter,
            onMouseleave: props.onMouseleave,
          },
          attrs,
        ),
        [
          !isEmptyVNode(title)
            ? h(
                'div',
                { key: 'header', class: [`${cls}-header`, classes.header], style: styles.header },
                [
                  h('div', { class: [`${cls}-title`, classes.title], style: styles.title }, [
                    h(NodeRenderer, { node: title }),
                  ]),
                ],
              )
            : null,
          h(
            Skeleton,
            {
              key: 'content',
              paragraph: false,
              loading: props.loading,
              class: `${cls}-skeleton`,
              active: true,
            },
            { default: () => content },
          ),
        ],
      );
    };
  },
});
