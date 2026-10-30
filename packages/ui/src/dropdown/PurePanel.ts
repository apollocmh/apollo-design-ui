/** Static Dropdown panel: the same current Menu, styles and content without a Trigger. */
import { computed, defineComponent, h, type PropType, type SlotsType } from 'vue';
import { useConsumerZIndex } from '../_internal/use-consumer-z-index';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import DropdownMenu from './DropdownMenu';
import type {
  DropdownClassNames,
  DropdownProps,
  DropdownSemanticType,
  DropdownSlots,
  DropdownStyles,
} from './interface';
import { useDropdownTheme } from './use-dropdown-theme';

const PurePanel = defineComponent({
  name: 'ADropdownPurePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<Pick<DropdownSlots, 'popupRender'>>,
  props: {
    prefixCls: { type: String, default: undefined },
    menu: { type: Object as PropType<DropdownProps['menu']>, default: undefined },
    classNames: { type: [Object, Function] as PropType<DropdownClassNames>, default: undefined },
    styles: { type: [Object, Function] as PropType<DropdownStyles>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<
      ComponentStyleConfig & { classNames?: DropdownClassNames; styles?: DropdownStyles }
    >('dropdown');
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('dropdown'));
    const direction = useDirection();
    const theme = useDropdownTheme();
    const semantic = useMergeSemantic<
      DropdownProps,
      NonNullable<DropdownSemanticType['classNames']>,
      NonNullable<DropdownSemanticType['styles']>
    >(
      [() => config.classNames, () => props.classNames],
      [
        () => config.styles,
        () => (config.style ? { root: config.style } : undefined),
        () => props.styles,
      ],
      () => props,
    );
    const zIndex = useConsumerZIndex(
      'Dropdown',
      () => semantic.styles.value.root?.zIndex,
      () => theme.componentToken.value.zIndexPopup,
    );
    return () => {
      const { class: nativeClass, style: nativeStyle, ...restAttrs } = attrs;
      return h(
        'div',
        {
          ...restAttrs,
          class: [prefixCls.value, config.className, semantic.classNames.value.root, nativeClass],
          style: [
            {
              position: 'relative',
              top: 'auto',
              left: 'auto',
              display: 'inline-block',
              direction: direction.value,
              zIndex: zIndex.value,
            },
            theme.style.value,
            semantic.styles.value.root,
            nativeStyle,
          ],
        },
        [
          h(
            DropdownMenu,
            {
              prefixCls: prefixCls.value,
              rtl: direction.value === 'rtl',
              menu: props.menu,
              classNames: semantic.classNames.value,
              styles: semantic.styles.value,
            },
            slots.popupRender ? { popupRender: slots.popupRender } : {},
          ),
        ],
      );
    };
  },
});
export default PurePanel;
