/**
 * Mount-gated Portal ownership and motion-aware destruction for Drawer.
 * Historical reference: @rc-component/drawer 1.4.2 es/Drawer.js.
 */
import { type GetContainer, Portal } from '@apollo-design/portal';
import { computed, defineComponent, h, onMounted, type PropType, ref, watch } from 'vue';
import type { DrawerPlacement } from '../interface';
import DrawerPopup, { type DrawerPopupRef } from './DrawerPopup';

export default defineComponent({
  name: 'ADrawerRc',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: false },
    prefixCls: { type: String, default: 'apollo-drawer' },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    autoFocus: { type: Boolean, default: true },
    keyboard: { type: Boolean, default: true },
    mask: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: true },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<GetContainer>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    destroyOnHidden: { type: Boolean, default: false },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    onClose: { type: Function as PropType<(event: Event) => void>, default: undefined },
  },
  setup(props, { attrs, slots, expose }) {
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    const animatedVisible = ref(false);
    const mergedOpen = computed(() => mounted.value && props.open);
    watch(
      mergedOpen,
      (open) => {
        if (open) animatedVisible.value = true;
      },
      { flush: 'sync' },
    );
    const popup = ref<DrawerPopupRef | null>(null);
    expose({
      nativeElement: computed(() => popup.value?.nativeElement ?? null),
      focus: (options?: FocusOptions) => popup.value?.focus(options),
    });

    const afterOpenChange = (visible: boolean) => {
      animatedVisible.value = visible;
      if (!visible) popup.value?.restoreFocus();
      props.afterOpenChange?.(visible);
    };

    return () => {
      if (
        !props.forceRender &&
        !animatedVisible.value &&
        !mergedOpen.value &&
        props.destroyOnHidden
      )
        return null;
      return h(
        Portal,
        {
          open: mergedOpen.value || props.forceRender || animatedVisible.value,
          autoDestroy: false,
          getContainer: props.getContainer,
          autoLock: props.mask && (mergedOpen.value || animatedVisible.value),
          onEsc:
            mergedOpen.value || animatedVisible.value
              ? ({ top, event }) => {
                  if (top && mergedOpen.value && props.keyboard) {
                    event.stopPropagation();
                    props.onClose?.(event);
                  }
                }
              : undefined,
        },
        {
          default: () =>
            h(
              DrawerPopup,
              {
                ...attrs,
                ref: popup,
                prefixCls: props.prefixCls,
                placement: props.placement,
                autoFocus: props.autoFocus,
                mask: props.mask,
                maskClosable: props.maskClosable,
                forceRender: props.forceRender,
                focusTriggerAfterClose: props.focusTriggerAfterClose,
                onClose: props.onClose,
                open: mergedOpen.value,
                afterOpenChange,
              },
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
