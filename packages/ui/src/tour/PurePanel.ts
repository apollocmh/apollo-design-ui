/** Static Tour preview uses the same native slots, Provider values and theme projection. */
import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { contentProp } from './content-prop';
import type {
  TourProps,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSlots,
  TourStepProps,
  TourType,
} from './interface';
import TourPanel, { type TourPanelStep } from './panel';
import { useTourTheme } from './use-tour-theme';

const PurePanel = defineComponent({
  name: 'ATourPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: String,
    current: { type: Number, default: 0 },
    total: { type: Number, default: 6 },
    type: String as PropType<TourType>,
    closable: {
      type: [Boolean, Object] as PropType<TourStepProps['closable']>,
      default: undefined,
    },
    closeIcon: contentProp,
    classNames: Object as PropType<TourSemanticClassNames>,
    styles: Object as PropType<TourSemanticStyles>,
    title: String,
    description: String,
    cover: String,
    nextButtonProps: Object as PropType<TourStepProps['nextButtonProps']>,
    prevButtonProps: Object as PropType<TourStepProps['prevButtonProps']>,
  },
  slots: Object as SlotsType<TourSlots>,
  setup(props, { slots, attrs }) {
    const context = useComponentConfig<
      ComponentStyleConfig & Pick<TourProps, 'classNames' | 'styles' | 'closeIcon'>
    >('tour');
    const theme = useTourTheme();
    const direction = useDirection();
    const [locale] = useLocale('global');
    const semanticProps = computed<TourProps>(() => ({ ...props }));
    const semantic = useMergeSemantic<TourProps, TourSemanticClassNames, TourSemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => (context.style ? { root: context.style } : undefined),
        () => props.styles,
      ],
      semanticProps,
    );
    return () => {
      const p = context.getPrefixCls('tour', props.prefixCls);
      const icon = slots.closeIcon ? slots.closeIcon() : props.closeIcon;
      const local = props.closable;
      const localProvided = local !== undefined || icon !== undefined;
      const disabled = !local && (local === false || icon === false || icon === null);
      const contextDisabled =
        !localProvided && (context.closeIcon === false || context.closeIcon === null);
      let closeIcon: VNodeChild =
        typeof local === 'object'
          ? local.closeIcon !== undefined
            ? local.closeIcon
            : icon
          : typeof icon === 'boolean'
            ? undefined
            : icon;
      if (closeIcon === undefined) closeIcon = context.closeIcon;
      if (closeIcon === undefined) closeIcon = h(CloseOutlined);
      if (isVNode(closeIcon))
        closeIcon = cloneVNode(closeIcon, {
          class: `${p}-close-icon`,
          'aria-label': locale.value.close,
        });
      const step: TourStepProps = { ...props };
      const panelStep: TourPanelStep = {
        title: props.title,
        description: props.description,
        cover: props.cover,
        nextButtonProps: props.nextButtonProps,
        prevButtonProps: props.prevButtonProps,
        prefixCls: p,
        total: props.total,
        current: props.current,
        type: props.type,
        closable:
          disabled || contextDisabled
            ? undefined
            : { ...(typeof local === 'object' ? local : {}), closeIcon },
      };
      return h(
        'div',
        mergeProps(
          {
            class: [
              p,
              `${p}-pure`,
              `${p}-placement-top`,
              `${p}-pure`,
              props.type && `${p}-${props.type}`,
              direction.value === 'rtl' && `${p}-rtl`,
              context.className,
              semantic.classNames.value.root,
            ],
            style: [theme.style.value, semantic.styles.value.root],
            dir: context.direction,
          },
          attrs,
        ),
        [
          h('div', { class: `${p}-arrow` }),
          h('div', { class: `${p}-container`, role: 'tooltip' }, [
            h(
              TourPanel,
              {
                prefixCls: p,
                stepProps: panelStep,
                slotStep: step,
                current: props.current,
                type: props.type,
                classNames: semantic.classNames.value,
                styles: semantic.styles.value,
              },
              slots,
            ),
          ]),
        ],
      );
    };
  },
});
export default PurePanel;
