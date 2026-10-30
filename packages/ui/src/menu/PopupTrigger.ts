import { computed, defineComponent, h, type PropType, type SlotsType } from 'vue';
import { Trigger } from '../_internal/trigger';
import { useConsumerZIndex } from '../_internal/use-consumer-z-index';
import { useMenuTheme } from './use-menu-theme';

type TriggerProps = InstanceType<typeof Trigger>['$props'];

/** Only a mounted popup creates a numeric layer; inline lists retain their parent context. */
export default defineComponent({
  name: 'AMenuPopupTrigger',
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: () => import('vue').VNodeChild }>,
  props: {
    prefixCls: { type: String, required: true },
    popup: {
      type: [Object, String, Number, Function] as PropType<TriggerProps['popup']>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    placement: { type: String, default: undefined },
    builtinPlacements: {
      type: Object as PropType<TriggerProps['builtinPlacements']>,
      required: true,
    },
    popupAlign: { type: Object as PropType<TriggerProps['popupAlign']>, default: undefined },
    popupClassName: { type: String, default: undefined },
    popupStyle: { type: Object as PropType<TriggerProps['popupStyle']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<TriggerProps['getPopupContainer']>,
      default: undefined,
    },
    motion: { type: Object as PropType<TriggerProps['motion']>, default: undefined },
    forceRender: { type: Boolean, default: undefined },
  },
  setup(props, { slots }) {
    const theme = useMenuTheme();
    const zIndex = useConsumerZIndex(
      'Dropdown',
      () => props.popupStyle?.zIndex,
      () => theme.componentToken.value.zIndexPopup,
    );
    const popupStyle = computed(() => ({
      ...theme.style.value,
      ...props.popupStyle,
      zIndex: zIndex.value ?? props.popupStyle?.zIndex,
    }));
    return () =>
      h(
        Trigger,
        {
          ...props,
          placement: props.placement ?? 'top',
          action: [],
          fresh: true,
          destroyOnHidden: false,
          popupStyle: popupStyle.value,
          zIndex: zIndex.value,
        },
        { default: () => slots.default?.() },
      );
  },
});
