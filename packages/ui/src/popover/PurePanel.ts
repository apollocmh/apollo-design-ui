/**
 * PurePanel —— antd `components/popover/PurePanel.tsx` 的 Vue 版。
 * `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板（demo / 文档用）。
 *
 * 与 tooltip PurePanel 的结构差异（antd 源逐条对齐）：root 额外带
 * `{p}-placement-{placement}` 类；内容是 Overlay（title + content 两块）。
 */
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  provide,
  type SlotsType,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { tooltipInjectKey } from '../tooltip/Tooltip';
import { parseTooltipColor } from '../tooltip/util';
import type {
  PopoverClassNames,
  PopoverProps,
  PopoverSemanticType,
  PopoverSlots,
  PopoverStyles,
  TooltipPlacement,
} from './interface';
import { usePopoverTheme } from './use-popover-theme';

function stripClassStyle(attrs: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...attrs };
  delete rest.class;
  delete rest.style;
  return rest;
}

/** antd `isReactRenderable`（`0` 合法）。 */
function isRenderable(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

const PurePanel = defineComponent({
  name: 'APopoverPurePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<Omit<PopoverSlots, 'default'>>,
  props: {
    prefixCls: { type: String, default: undefined },
    color: { type: String, default: undefined },
    placement: { type: String as PropType<TooltipPlacement>, default: 'top' },
    title: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopoverProps['title']>,
      default: undefined,
    },
    content: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopoverProps['content']>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<PopoverClassNames>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<PopoverStyles>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const inheritedOwner = inject(tooltipInjectKey, undefined);
    if (inheritedOwner) provide(tooltipInjectKey, undefined);
    const context = useComponentConfig<{
      classNames?: PopoverClassNames;
      styles?: PopoverStyles;
      className?: string;
      style?: CSSProperties;
    }>('popover');
    const ownedContext: Partial<typeof context> = inheritedOwner ? {} : context;
    const popoverTheme = usePopoverTheme(() => !inheritedOwner);
    const semanticProps = computed<PopoverProps>(() => ({ ...props }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      PopoverProps,
      NonNullable<PopoverSemanticType['classNames']>,
      NonNullable<PopoverSemanticType['styles']>
    >(
      [() => ownedContext.classNames, () => props.classNames],
      [
        () => ownedContext.styles,
        () => (ownedContext.style ? { root: ownedContext.style } : undefined),
        () => props.styles,
      ],
      semanticProps,
    );

    return () => {
      const prefixCls = props.prefixCls ?? context.getPrefixCls('popover');
      const colorInfo = parseTooltipColor(prefixCls, props.color);
      const placement = props.placement ?? 'top';
      const title = slots.title ? slots.title() : props.title;
      const content = slots.content ? slots.content() : props.content;

      return h(
        'div',
        {
          class: [
            attrs.class,
            prefixCls,
            `${prefixCls}-pure`,
            `${prefixCls}-placement-${placement}`,
            context.direction === 'rtl' && `${prefixCls}-rtl`,
            ownedContext.className,
            colorInfo.className,
            mergedClassNames.value.root,
          ],
          style: [
            popoverTheme.style.value,
            colorInfo.arrowStyle,
            mergedStyles.value.root,
            attrs.style,
          ],
          ...stripClassStyle(attrs),
        },
        [
          h('div', {
            class: [`${prefixCls}-arrow`, mergedClassNames.value.arrow],
            style: [colorInfo.arrowStyle, mergedStyles.value.arrow],
          }),
          h(
            'div',
            {
              class: clsx(`${prefixCls}-container`, mergedClassNames.value.container),
              // 原生 style 只作用于根；容器保持独立的语义样式。
              style: [mergedStyles.value.container, colorInfo.overlayStyle],
              role: 'tooltip',
            },
            [
              isRenderable(title)
                ? h(
                    'div',
                    {
                      key: 'title',
                      class: clsx(`${prefixCls}-title`, mergedClassNames.value.title),
                      style: mergedStyles.value.title,
                    },
                    [title],
                  )
                : null,
              isRenderable(content)
                ? h(
                    'div',
                    {
                      key: 'content',
                      class: clsx(`${prefixCls}-content`, mergedClassNames.value.content),
                      style: mergedStyles.value.content,
                    },
                    [content],
                  )
                : null,
            ],
          ),
        ],
      );
    };
  },
});

export default PurePanel;
