/**
 * `Dialog` —— `@rc-component/dialog@1.10.0` `es/Dialog/index.js`（175 行）的 Vue 版。
 *
 * 渲染树（逐条对齐上游，L4/L6 的判据）：
 *
 * ```
 * <div class="{p}-root [rootClassName]" style={rootStyle} {...data-*}>
 *   ├─ Mask(visible = mask && visible, motionName = {p}-{maskAnimation|maskTransitionName},
 *   │       style={{zIndex, ...maskStyle, ...styles.mask}}, className={classNames.mask})
 *   └─ <div class="{p}-wrap [wrapClassName] [classNames.wrapper]" ref={wrapperRef}
 *          style={{zIndex, ...wrapStyle, ...styles.wrapper, display: animatedVisible ? null : 'none'}}
 *          onClick={maskClosable ? onWrapperClick : null} onMouseDown={onWrapperMouseDown} {...wrapProps}>
 *        └─ Content(visible = visible && animatedVisible, motionName = {p}-{animation|transitionName},
 *                   onClose = onInternalClose, onVisibleChanged = onDialogVisibleChanged)
 * ```
 *
 * 关键判据：
 *   1. **`display: none` 而不是卸载**：`animatedVisible === false` 时 wrap 靠 inline
 *      `display: none` 隐藏 —— `afterClose` 之后节点仍在（除非 `destroyOnHidden`）；
 *   2. **`onWrapperClick` 三个条件**：`maskClosable` 且 `e.target === wrapper` 且
 *      `mouseDownOnMaskRef`（mousedown 也落在 wrap 上）—— **拖选文字后松开不关**；
 *   3. **mask 的可见性用原始 `visible`**（不是 `visible && animatedVisible`）；
 *   4. **`doClose` 的时序**：`animatedVisible=false` → 焦点归还 → `afterClose()`；
 *      ⚠️ 本仓把它做成**幂等**（`animatedVisible` 已假则直接返回），因为兜底路径也会调它；
 *   5. `isFixedPos` 读 wrap 的 `computedStyle.position === 'fixed'`，是**焦点陷阱的门控之一**；
 *      ⚠️ 它在渲染**之后**才可读 ⇒ 本仓在 `nextTick` 里同步（门是响应式的，晚一帧不影响）；
 *   6. `focusDialogContent` 只在 `onVisibleChanged(true)` 时调（开启动效结束才移焦点）。
 *
 * ⚠️ 与上游的一处**实现差异**（`focusDialogContent` 的 `preventScroll`）：
 *    上游的 `contentRef.current.focus()` 最终落到 Panel 的
 *    `internalRef.current.focus({ preventScroll: true })`；本仓的
 *    `useFocusRestore.focusContent()` 是裸 `focus()`（其契约文档已注明）。
 *    这里**不用** `focusContent()`，改为本地实现同一道门 + `preventScroll: true`，
 *    与 Panel 的行为逐字一致。
 */
import { useFocusRestore } from '@apollo-design/a11y';
import { contains, pickAttrs, useId } from '@apollo-design/utils';
import { defineComponent, h, nextTick, onMounted, type PropType, provide, ref, watch } from 'vue';

import type { ModalSemanticType } from '../interface';
import Content from './Content';
import { dialogRefContextKey } from './context';
import Mask from './Mask';
import { clsx, getMotionName } from './util';

export default defineComponent({
  name: 'ADialogRc',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-modal' },
    /** ⚠️ rc 侧叫 `visible`；antd 侧叫 `open`。 */
    visible: { type: Boolean, default: false },
    zIndex: { type: Number, default: undefined },
    focusTriggerAfterClose: { type: Boolean, default: true },
    wrapStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    wrapClassName: { type: String, default: undefined },
    wrapProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    transitionName: { type: String, default: undefined },
    animation: { type: String, default: undefined },
    closable: { type: [Boolean, Object] as PropType<unknown>, default: true },
    // >>> Mask
    mask: { type: Boolean, default: true },
    maskTransitionName: { type: String, default: undefined },
    maskAnimation: { type: String, default: undefined },
    maskClosable: { type: Boolean, default: true },
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    // >>> 语义槽
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    classNames: { type: Object as PropType<ModalSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    // >>> Content 侧透传
    title: { type: null as unknown as PropType<unknown>, default: undefined },
    footer: { type: null as unknown as PropType<unknown>, default: undefined },
    closeIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    modalRender: { type: Function as PropType<unknown>, default: undefined },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    forceRender: { type: Boolean, default: false },
    destroyOnHidden: { type: Boolean, default: false },
    mousePosition: {
      type: Object as PropType<{ x: number; y: number } | null>,
      default: undefined,
    },
    focusTrap: { type: Boolean, default: undefined },
    panelRef: { type: [Object, Function] as PropType<unknown>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const wrapperRef = ref<HTMLElement | null>(null);
    const panelElRef = ref<HTMLElement | null>(null);
    const animatedVisible = ref(props.visible);
    const isFixedPos = ref(false);
    const ariaId = useId();
    const mouseDownOnMaskRef = ref(false);
    /** 离场动效是否已启动（Content 会在 `visible` 变假时回调）。 */
    const leaving = ref(false);

    // 把面板元素引用交给 Panel 写入（焦点归还要 `focus()` 它）
    provide(dialogRefContextKey, { panel: panelElRef });

    const focusRestore = useFocusRestore(() => panelElRef.value, {
      mask: () => !!props.mask,
      enabled: () => props.focusTriggerAfterClose,
    });

    /** 焦点若不在面板内 ⇒ 移到面板上（⚠️ `preventScroll: true`，同 Panel 的 `focus()`）。 */
    const focusDialogContent = (): void => {
      const panel = panelElRef.value;
      if (!panel) return;
      if (!contains(wrapperRef.value, document.activeElement)) {
        panel.focus({ preventScroll: true });
      }
    };

    /** 幂等的关闭收尾（上游只在离场动效结束时调；本仓兜底路径也会调）。 */
    const doClose = (): void => {
      if (!animatedVisible.value) return;
      animatedVisible.value = false;
      focusRestore.restore();
      props.afterClose?.();
    };

    const onDialogVisibleChanged = (newVisible: boolean): void => {
      if (newVisible) focusDialogContent();
      else doClose();
      props.afterOpenChange?.(newVisible);
    };

    const onInternalClose = (e: Event): void => {
      props.onClose?.(e);
    };

    const onWrapperMouseDown = (e: MouseEvent): void => {
      mouseDownOnMaskRef.value = e.target === wrapperRef.value;
    };

    const onWrapperClick = (e: MouseEvent): void => {
      if (wrapperRef.value === e.target && mouseDownOnMaskRef.value) {
        onInternalClose(e);
      }
    };

    const syncIsFixedPos = (): void => {
      if (!wrapperRef.value) return;
      isFixedPos.value = getComputedStyle(wrapperRef.value).position === 'fixed';
    };

    watch(
      () => props.visible,
      (visible) => {
        if (visible) {
          mouseDownOnMaskRef.value = false;
          animatedVisible.value = true;
          leaving.value = false;
          focusRestore.save();
          void nextTick(syncIsFixedPos);
          return;
        }

        if (animatedVisible.value) {
          // 兜底：Content 的离场动效若没启动（例如受控在下一 tick 立刻关），
          // 它的 `onVisibleChanged` 不会来 —— 在本次 flush 之后补一次 doClose（幂等）。
          void nextTick(() => {
            if (animatedVisible.value && !leaving.value) doClose();
          });
        }
      },
      { immediate: true },
    );

    onMounted(() => {
      if (props.visible) void nextTick(syncIsFixedPos);
    });

    return () => {
      const prefixCls = props.prefixCls;
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};

      const mergedWrapStyle: Record<string, unknown> = {
        ...(props.zIndex !== undefined ? { zIndex: props.zIndex } : {}),
        ...props.wrapStyle,
        ...st.wrapper,
        display: animatedVisible.value ? undefined : 'none',
      };

      const maskNode = h(Mask, {
        prefixCls,
        visible: props.mask && props.visible,
        motionName: getMotionName(prefixCls, props.maskTransitionName, props.maskAnimation),
        style: {
          ...(props.zIndex !== undefined ? { zIndex: props.zIndex } : {}),
          ...props.maskStyle,
          ...st.mask,
        },
        maskProps: props.maskProps,
        className: cn.mask,
      });

      const contentNode = h(
        Content,
        {
          prefixCls,
          title: props.title,
          ariaId,
          footer: props.footer,
          closable: props.closable as never,
          closeIcon: props.closeIcon,
          onClose: onInternalClose,
          bodyStyle: props.bodyStyle,
          bodyProps: props.bodyProps,
          modalRender: props.modalRender as never,
          width: props.width,
          height: props.height,
          forceRender: props.forceRender,
          destroyOnHidden: props.destroyOnHidden,
          mousePosition: props.mousePosition,
          classNames: cn,
          styles: st,
          isFixedPos: isFixedPos.value,
          focusTrap: props.focusTrap,
          panelRef: props.panelRef,
          className: props.className,
          style: props.style,
          visible: props.visible && animatedVisible.value,
          motionName: getMotionName(prefixCls, props.transitionName, props.animation),
          onVisibleChanged: onDialogVisibleChanged,
          onLeaveStart: () => {
            leaving.value = true;
          },
        } as never,
        { default: () => slots.default?.() },
      );

      return h(
        'div',
        {
          class: clsx(`${prefixCls}-root`, props.rootClassName),
          style: props.rootStyle,
          ...pickAttrs(attrs as Record<string, unknown>, { data: true }),
        },
        [
          maskNode,
          h(
            'div',
            {
              class: clsx(`${prefixCls}-wrap`, props.wrapClassName, cn.wrapper),
              ref: wrapperRef,
              onClick: props.maskClosable ? onWrapperClick : undefined,
              onMousedown: onWrapperMouseDown,
              style: mergedWrapStyle,
              ...props.wrapProps,
            },
            [contentNode],
          ),
        ],
      );
    };
  },
});
