import { Portal } from '@apollo-design/portal';
import type { SlotsType, StyleValue, VNodeChild } from 'vue';
import { defineComponent, h, type PropType, ref, watch } from 'vue';
import type { ModalGetContainer, ModalSemanticType } from '../interface';
import Dialog from './Dialog';
import type { DialogClosable, DialogSlots, ModalPanelRef } from './interface';

export default defineComponent({
  name: 'ADialogWrap',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-modal' },
    visible: { type: Boolean, default: false },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<ModalGetContainer>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    destroyOnHidden: { type: Boolean, default: false },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<DialogClosable>, default: undefined },
    panelRef: { type: [Object, Function] as PropType<ModalPanelRef>, default: undefined },
    keyboard: { type: Boolean, default: true },
    scrollLock: { type: Boolean, default: true },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    zIndex: { type: Number, default: undefined },
    focusTriggerAfterClose: { type: Boolean, default: true },
    wrapStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    wrapClassName: { type: String, default: undefined },
    wrapProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    transitionName: { type: String, default: undefined },
    animation: { type: String, default: undefined },
    mask: { type: Boolean, default: true },
    maskTransitionName: { type: String, default: undefined },
    maskAnimation: { type: String, default: undefined },
    maskClosable: { type: Boolean, default: true },
    maskStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    classNames: { type: Object as PropType<ModalSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    bodyStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    mousePosition: {
      type: Object as PropType<{ x: number; y: number } | null>,
      default: undefined,
    },
    focusTrap: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [Object, Array, String] as PropType<StyleValue>, default: undefined },
  },
  slots: {} as SlotsType<DialogSlots>,
  setup(props, { attrs, slots }) {
    const animatedVisible = ref(props.visible);

    watch(
      () => props.visible,
      (visible) => {
        if (visible) animatedVisible.value = true;
      },
      { immediate: true },
    );

    const handleAfterClose = (): void => {
      const closableObj =
        props.closable && typeof props.closable === 'object'
          ? (props.closable as { afterClose?: () => void })
          : null;
      closableObj?.afterClose?.();
      props.afterClose?.();
      animatedVisible.value = false;
    };

    return () => {
      if (!props.forceRender && props.destroyOnHidden && !animatedVisible.value) {
        return null;
      }

      const portalOpen = props.visible || props.forceRender || animatedVisible.value;

      return h(
        Portal,
        {
          open: portalOpen,
          autoDestroy: false,
          getContainer: props.getContainer,
          autoLock: props.scrollLock && (props.visible || animatedVisible.value),
          onEsc: ({ top, event }: { top: boolean; event: KeyboardEvent }) => {
            if (top && props.keyboard) {
              event.stopPropagation();
              props.onClose?.(event);
            }
          },
        },
        {
          default: () =>
            h(
              Dialog,
              {
                ...(attrs as Record<string, unknown>),
                prefixCls: props.prefixCls,
                visible: props.visible,
                zIndex: props.zIndex,
                focusTriggerAfterClose: props.focusTriggerAfterClose,
                wrapStyle: props.wrapStyle,
                wrapClassName: props.wrapClassName,
                wrapProps: props.wrapProps,
                onClose: props.onClose,
                afterOpenChange: props.afterOpenChange,
                afterClose: handleAfterClose,
                transitionName: props.transitionName,
                animation: props.animation,
                closable: props.closable,
                mask: props.mask,
                maskTransitionName: props.maskTransitionName,
                maskAnimation: props.maskAnimation,
                maskClosable: props.maskClosable,
                maskStyle: props.maskStyle,
                maskProps: props.maskProps,
                rootClassName: props.rootClassName,
                rootStyle: props.rootStyle,
                classNames: props.classNames,
                styles: props.styles,
                title: props.title,
                footer: props.footer,
                closeIcon: props.closeIcon,
                bodyStyle: props.bodyStyle,
                bodyProps: props.bodyProps,
                width: props.width,
                height: props.height,
                forceRender: props.forceRender,
                destroyOnHidden: props.destroyOnHidden,
                mousePosition: props.mousePosition,
                focusTrap: props.focusTrap,
                panelRef: props.panelRef,
                className: props.className,
                style: props.style,
              },
              slots,
            ),
        },
      );
    };
  },
});
