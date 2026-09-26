/**
 * `DialogWrap` —— `@rc-component/dialog@1.10.0` `es/DialogWrap.js`（80 行）的 Vue 版。
 *
 * ```
 * Portal(open = visible || forceRender || animatedVisible,
 *        onEsc = 只有 top && keyboard 时才 stopPropagation + onClose,
 *        autoDestroy = false, getContainer, autoLock = scrollLock && (visible || animatedVisible))
 *   └─ Dialog(...restProps, destroyOnHidden, afterClose = closable.afterClose?.() + afterClose?.() + setAnimatedVisible(false))
 * ```
 *
 * 关键判据：
 *   1. **`autoDestroy: false`** —— 关掉之后 Portal 的容器**留在 DOM 里**（配合 Dialog 的
 *      `display: none`）；
 *   2. **`autoLock`** 的门是 `scrollLock && (visible || animatedVisible)`（动效期间仍锁滚动）；
 *   3. **`onEsc` 只在 `top` 且 `keyboard` 时才关**，并 `stopPropagation()`；
 *   4. **`afterClose` 的三步**：`closable.afterClose?.()` → `afterClose?.()` →
 *      `setAnimatedVisible(false)`（顺序不能换）；
 *   5. `destroyOnHidden && !forceRender && !animatedVisible` ⇒ **直接返回 null**
 *      （连 Portal 都不渲染）。
 *
 * ⚠️ 与上游的一处差异：上游用 `RefContext.Provider` 把 antd 的 `panelRef` 透给 Panel；
 *    本仓的 ref-context 由 **Dialog** 自己 provide（用于把面板**元素**回传给焦点归还），
 *    antd 的 `panelRef` 则作为普通 prop 一路透到 Panel 再合并 —— 两者互不干扰。
 */
import { Portal } from '@apollo-design/portal';
import { defineComponent, h, type PropType, ref, watch } from 'vue';
import type { ModalSemanticType } from '../interface';
import Dialog from './Dialog';

export default defineComponent({
  name: 'ADialogWrap',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-modal' },
    visible: { type: Boolean, default: false },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<unknown>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    destroyOnHidden: { type: Boolean, default: false },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    panelRef: { type: [Object, Function] as PropType<unknown>, default: undefined },
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
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    classNames: { type: Object as PropType<ModalSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    title: { type: null as unknown as PropType<unknown>, default: undefined },
    footer: { type: null as unknown as PropType<unknown>, default: undefined },
    closeIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    modalRender: { type: Function as PropType<unknown>, default: undefined },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    mousePosition: {
      type: Object as PropType<{ x: number; y: number } | null>,
      default: undefined,
    },
    focusTrap: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
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
          getContainer: props.getContainer as never,
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
                modalRender: props.modalRender,
                width: props.width,
                height: props.height,
                forceRender: props.forceRender,
                destroyOnHidden: props.destroyOnHidden,
                mousePosition: props.mousePosition,
                focusTrap: props.focusTrap,
                panelRef: props.panelRef,
                className: props.className,
                style: props.style,
              } as never,
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
