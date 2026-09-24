/**
 * PurePanel —— antd `components/tooltip/PurePanel.tsx` 的 Vue 版。
 * `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板（demo / 文档用）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { TooltipSemanticType } from './interface';
import { clsx, parseTooltipColor } from './util';

type StyleLike = Record<string, string | number>;

function stripClassStyle(attrs: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...attrs };
  delete rest.class;
  delete rest.style;
  return rest;
}

const PurePanel = defineComponent({
  name: 'ATooltipPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    color: { type: String, default: undefined },
    placement: { type: String, default: 'top' },
    title: {
      type: [Object, String, Number, Function] as PropType<VNodeChild>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    classNames: { type: Object as PropType<TooltipSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<TooltipSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    const { getPrefixCls } = useComponentConfig('tooltip');
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      Record<string, never>,
      NonNullable<TooltipSemanticType['classNames']>,
      NonNullable<TooltipSemanticType['styles']>
    >([() => props.classNames], [() => props.styles], {} as Record<string, never>);

    return () => {
      const prefixCls = props.prefixCls ?? getPrefixCls('tooltip');
      const colorInfo = parseTooltipColor(prefixCls, props.color);
      const placement = props.placement ?? 'top';

      return h(
        'div',
        {
          class: clsx(
            attrs.class as string | undefined,
            prefixCls,
            `${prefixCls}-pure`,
            `${prefixCls}-placement-${placement}`,
            colorInfo.className,
            mergedClassNames.value.root,
            props.className,
          ),
          style: {
            ...(colorInfo.arrowStyle as StyleLike),
            ...(mergedStyles.value.root ?? {}),
            ...(props.style ?? {}),
            ...((attrs.style as StyleLike | undefined) ?? {}),
          },
          ...stripClassStyle(attrs),
        },
        [
          h('div', { class: `${prefixCls}-arrow` }),
          h(
            'div',
            {
              class: clsx(`${prefixCls}-container`, mergedClassNames.value.container),
              style: {
                ...(mergedStyles.value.container ?? {}),
                ...(colorInfo.overlayStyle as StyleLike),
              },
              role: 'tooltip',
            },
            [props.title as VNodeChild].filter((c) => c !== null && c !== undefined),
          ),
        ],
      );
    };
  },
});

export default PurePanel;
