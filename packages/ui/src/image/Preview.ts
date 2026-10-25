/**
 * Preview —— rc-image `Preview/index.js`（360 行）+ Footer/PrevNext/CloseBtn 的
 * Vue 版合并实现。
 *
 * portal 浮层：`{p}-preview` 根（role=dialog / aria-modal）> mask / body > img /
 * close / switch-prev|next / footer(progress + actions)。
 *
 * v1 边界（登记于 README §4）：
 * - 手势：滚轮缩放 + 鼠标拖拽 + 双击（触摸双指缩放 PENDING）；
 * - 焦点：真实弹层挂载后入焦，Tab 循环与外部焦点约束，关闭/卸载后归还；
 * - 变换内核在 `hooks/useImageTransform.ts`（纯逻辑，oracle 单测覆盖）。
 */

import { getFocusNodeList, useFocusRestore, useLockFocus } from '@apollo-design/a11y';
import {
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import { type GetContainer, Portal, useZIndex } from '@apollo-design/portal';
import { KeyCode } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onBeforeUpdate,
  onMounted,
  onScopeDispose,
  onUpdated,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import { useImageTheme } from './hooks/useImageTheme';
import { useImageTransform } from './hooks/useImageTransform';
import { useStatus } from './hooks/useStatus';
import type {
  ImageCommonProps,
  MaskType,
  PreviewActions,
  PreviewConfig,
  PreviewGroupSlots,
  PreviewIcons,
  TransformInfo,
} from './interface';

export const DEFAULT_ICONS: Required<PreviewIcons> = {
  rotateLeft: h(RotateLeftOutlined),
  rotateRight: h(RotateRightOutlined),
  zoomIn: h(ZoomInOutlined),
  zoomOut: h(ZoomOutOutlined),
  close: h(CloseOutlined),
  left: h(LeftOutlined),
  right: h(RightOutlined),
  flipX: h(SwapOutlined),
  flipY: h(SwapOutlined, { rotate: 90 }),
};

const Preview = defineComponent({
  name: 'AImagePreview',
  inheritAttrs: false,
  slots: Object as SlotsType<Omit<PreviewGroupSlots, 'default'>>,
  emits: { transform: (_info: TransformInfo) => true },
  props: {
    prefixCls: { type: String, required: true },
    src: { type: String, default: undefined },
    alt: { type: String, default: undefined },
    imageInfo: {
      type: Object as PropType<{ width?: number | string; height?: number | string }>,
      default: undefined,
    },
    fallback: { type: String, default: undefined },
    imgCommonProps: { type: Object as PropType<ImageCommonProps>, default: undefined },
    open: { type: Boolean, default: false },
    movable: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: true },
    mask: { type: [Boolean, Object] as PropType<MaskType>, default: true },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<GetContainer>,
      default: undefined,
    },
    closable: { type: Boolean, default: true },
    closeIcon: {
      type: [Object, String, Number, Boolean, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    minScale: { type: Number, default: 1 },
    maxScale: { type: Number, default: 50 },
    scaleStep: { type: Number, default: 0.5 },
    zIndex: { type: Number, default: undefined },
    current: { type: Number, default: 0 },
    count: { type: Number, default: 1 },
    /** 组内模式（>1 时显示 prev/next 与计数）。 */
    inGroup: { type: Boolean, default: false },
    mousePosition: { type: Object as PropType<{ x: number; y: number } | null>, default: null },
    motionName: { type: String, default: undefined },
    icons: { type: Object as PropType<PreviewIcons>, default: undefined },
    rootClassName: { type: String, default: undefined },
    classNames: {
      type: Object as PropType<
        NonNullable<PreviewConfig['rootClassName']> extends never
          ? Record<string, string>
          : {
              root?: string;
              mask?: string;
              body?: string;
              footer?: string;
              actions?: string;
              close?: string;
            }
      >,
      default: undefined,
    },
    styles: {
      type: Object as PropType<{
        root?: Record<string, string | number>;
        mask?: Record<string, string | number>;
        body?: Record<string, string | number>;
        footer?: Record<string, string | number>;
        actions?: Record<string, string | number>;
        close?: Record<string, string | number>;
      }>,
      default: undefined,
    },
    onClose: { type: Function as PropType<() => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onActive: { type: Function as PropType<(offset: number) => void>, default: undefined },
  },
  setup(props, { emit, slots }) {
    const theme = useImageTheme();
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    const previewElement = ref<HTMLElement | null>(null);
    const moving = ref(false);
    let dragWindow: Window | null = null;
    let startX = 0;
    let startY = 0;
    let startTX = 0;
    let startTY = 0;
    const stopDrag = (): void => {
      moving.value = false;
      const owner = dragWindow;
      dragWindow = null;
      if (!owner) return;
      owner.removeEventListener('mousemove', onMouseMove);
      owner.removeEventListener('mouseup', stopDrag);
      owner.removeEventListener('blur', stopDrag);
    };
    onScopeDispose(stopDrag);
    watch(
      [() => props.open, () => props.movable, () => previewElement.value?.ownerDocument],
      ([open, movable, doc]) => {
        if (!open || !movable || (dragWindow && doc?.defaultView !== dragWindow)) stopDrag();
      },
    );
    useLockFocus(() => props.open, previewElement);
    // Vue scope cleanup runs in registration order: release the lock, restore its
    // opener, then let useFocusRestore discard the saved element. Unmounting an
    // open preview must follow the same order as completing a normal close.
    onScopeDispose(() => focusRestore.restore());
    const focusRestore = useFocusRestore(() => previewElement.value);
    const focusPreview = (): void => {
      const element = previewElement.value;
      if (props.open && element && !element.contains(element.ownerDocument.activeElement)) {
        element.focus({ preventScroll: true });
      }
    };
    let hadFocusBeforeUpdate = false;
    onBeforeUpdate(() => {
      const element = previewElement.value;
      hadFocusBeforeUpdate = !!element?.contains(element.ownerDocument.activeElement);
    });
    onUpdated(() => {
      // Disabling the focused navigation button can blur it to body without focusin.
      // Only repair focus that this preview owned before its Vue update.
      if (hadFocusBeforeUpdate) focusPreview();
    });
    watch(
      () => props.open,
      (open) => {
        if (open) focusRestore.save();
      },
      { immediate: true },
    );
    watch([() => props.open, previewElement], focusPreview, { flush: 'post' });

    const zIndex = useZIndex('ImagePreview', () => props.zIndex);

    const { transform, limits, updateTransform, dispatchZoomChange, resetTransform } =
      useImageTransform(
        () => props.minScale,
        () => props.maxScale,
        (info) => emit('transform', info),
      );
    const step = computed(() =>
      Number.isFinite(props.scaleStep) && props.scaleStep > 0 ? props.scaleStep : 0.5,
    );
    const zoomOutRatio = () => 1 / (1 + step.value) - 1;

    const { status, getImgRef, srcAndOnload } = useStatus({
      src: () => props.src,
      fallback: () => props.fallback,
      srcSet: () => props.imgCommonProps?.srcSet,
      sizes: () => props.imgCommonProps?.sizes,
    });

    // 打开时 portal 才渲染（rc 的 portalRender 语义）
    const portalRender = ref(false);
    watch(
      () => props.open,
      (open) => {
        if (open) portalRender.value = true;
      },
      { immediate: true },
    );

    // 关闭时复位变换（rc 的 useEffect([open]) 同款）
    watch(
      () => props.open,
      (open) => {
        if (!open) resetTransform();
      },
    );

    const icons = computed<Required<PreviewIcons>>(() => ({
      ...DEFAULT_ICONS,
      ...(props.icons ?? {}),
    }));

    const showSwitch = computed(() => props.inGroup && props.count > 1);
    const showProgress = computed(() => props.inGroup && props.count >= 1);

    const actions: PreviewActions = {
      flipX: () => updateTransform({ flipX: !transform.value.flipX }),
      flipY: () => updateTransform({ flipY: !transform.value.flipY }),
      rotateLeft: () => updateTransform({ rotate: transform.value.rotate - 90 }),
      rotateRight: () => updateTransform({ rotate: transform.value.rotate + 90 }),
      zoomIn: () => dispatchZoomChange(step.value, 'zoomIn'),
      zoomOut: () => dispatchZoomChange(zoomOutRatio(), 'zoomOut'),
      reset: () => resetTransform(),
      close: () => props.onClose?.(),
    };
    const currentImage = () => ({ src: srcAndOnload.value.src, alt: props.alt });

    // ---------------------- 手势（v1：滚轮 + 拖拽 + 双击） ----------------------
    const onWheel = (e: WheelEvent): void => {
      if (!props.open) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      const ratio = e.deltaY > 0 ? zoomOutRatio() : step.value;
      dispatchZoomChange(ratio, 'wheel', e.clientX, e.clientY);
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (!props.open || !props.movable || e.button !== 0) return;
      const owner = previewElement.value?.ownerDocument.defaultView;
      if (!owner) return;
      stopDrag();
      e.preventDefault();
      dragWindow = owner;
      moving.value = true;
      startX = e.clientX;
      startY = e.clientY;
      startTX = transform.value.x;
      startTY = transform.value.y;
      owner.addEventListener('mousemove', onMouseMove);
      owner.addEventListener('mouseup', stopDrag);
      owner.addEventListener('blur', stopDrag);
    };
    const onMouseMove = (e: MouseEvent): void => {
      if (!moving.value || !props.open || !props.movable || (e.buttons & 1) === 0) {
        stopDrag();
        return;
      }
      updateTransform({
        x: startTX + (e.clientX - startX),
        y: startTY + (e.clientY - startY),
      });
    };

    const onDoubleClick = (e: MouseEvent): void => {
      if (!props.open) return;
      if (transform.value.scale !== 1) {
        updateTransform({ x: 0, y: 0, scale: 1 });
      } else {
        dispatchZoomChange(step.value, 'zoomIn', e.clientX, e.clientY);
      }
    };

    // ------------------------------ 键盘 ------------------------------
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!props.open || e.defaultPrevented) return;
      const key = e.key;
      if (key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const element = previewElement.value;
        if (!element) return;
        const focusable = getFocusNodeList(element);
        const first = focusable[0];
        const last = focusable.at(-1);
        const active = element.ownerDocument.activeElement;
        const boundary = e.shiftKey ? active === first || active === element : active === last;
        if (!first || boundary) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus({ preventScroll: true });
          if (!first) element.focus({ preventScroll: true });
        }
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        props.onClose?.();
        return;
      }
      if (!showSwitch.value || KeyCode.isEditableTarget(e)) return;
      if (key === 'ArrowLeft') props.onActive?.(-1);
      if (key === 'ArrowRight') props.onActive?.(1);
    };

    const onVisibleChanged = (next: boolean): void => {
      if (next) focusPreview();
      else if (!props.open) focusRestore.restore();
      props.afterOpenChange?.(next);
    };

    const onMaskClick = (): void => {
      if (props.mask !== false && props.maskClosable) props.onClose?.();
    };

    // ------------------------------ 渲染 ------------------------------
    const renderAction = (
      type: string,
      icon: VNodeChild,
      onClick: () => void,
      disabled = false,
    ): VNodeChild => {
      const cls = `${props.prefixCls}-actions-action`;
      return h(
        'button',
        {
          type: 'button',
          class: [cls, `${cls}-${type}`, disabled ? `${cls}-disabled` : undefined],
          onClick,
          disabled,
          'aria-label': type,
        },
        [icon].filter((c) => c !== null && c !== undefined),
      );
    };

    const renderFooter = (): VNodeChild => {
      const progressNode = showProgress.value
        ? h('div', { class: `${props.prefixCls}-progress` }, [
            h('bdi', null, `${props.current + 1} / ${props.count}`),
          ])
        : null;

      const { scale } = transform.value;
      const actionsNode = h(
        'div',
        {
          class: [`${props.prefixCls}-actions`, props.classNames?.actions],
          style: props.styles?.actions,
        },
        [
          renderAction('flipY', icons.value.flipY, actions.flipY),
          renderAction('flipX', icons.value.flipX, actions.flipX),
          renderAction('rotateLeft', icons.value.rotateLeft, actions.rotateLeft),
          renderAction('rotateRight', icons.value.rotateRight, actions.rotateRight),
          renderAction(
            'zoomOut',
            icons.value.zoomOut,
            actions.zoomOut,
            scale <= limits.value.minScale,
          ),
          renderAction(
            'zoomIn',
            icons.value.zoomIn,
            actions.zoomIn,
            scale >= limits.value.maxScale,
          ),
        ],
      );

      const progressContent =
        progressNode && slots.previewCount
          ? slots.previewCount({
              originNode: progressNode,
              current: props.current,
              total: props.count,
            })
          : progressNode;
      const actionsContent = slots.previewActions
        ? slots.previewActions({
            originNode: actionsNode,
            icons: icons.value,
            actions,
            transform: { ...transform.value },
            current: props.current,
            total: props.count,
            image: currentImage(),
            disabled: {
              zoomIn: scale >= limits.value.maxScale,
              zoomOut: scale <= limits.value.minScale,
            },
          })
        : actionsNode;

      return h(
        'div',
        {
          class: [`${props.prefixCls}-footer`, props.classNames?.footer],
          style: props.styles?.footer,
        },
        [progressContent, actionsContent],
      );
    };

    const renderSwitch = (): VNodeChild => {
      if (!showSwitch.value) return null;
      const cls = `${props.prefixCls}-switch`;
      const prevDisabled = props.current === 0;
      const nextDisabled = props.current === props.count - 1;
      return [
        h(
          'button',
          {
            type: 'button',
            class: [cls, `${cls}-prev`, prevDisabled ? `${cls}-disabled` : undefined],
            'aria-label': 'Previous image',
            onClick: () => props.onActive?.(-1),
            disabled: prevDisabled,
          },
          [icons.value.left].filter((c) => c !== null && c !== undefined),
        ),
        h(
          'button',
          {
            type: 'button',
            class: [cls, `${cls}-next`, nextDisabled ? `${cls}-disabled` : undefined],
            'aria-label': 'Next image',
            onClick: () => props.onActive?.(1),
            disabled: nextDisabled,
          },
          [icons.value.right].filter((c) => c !== null && c !== undefined),
        ),
      ];
    };

    return () => {
      const t = transform.value;
      const bodyStyle: Record<string, string | number> = { ...(props.styles?.body ?? {}) };
      if (props.mousePosition) {
        bodyStyle.transformOrigin = `${props.mousePosition.x}px ${props.mousePosition.y}px`;
      }

      const imgNode = h('img', {
        ...(props.imgCommonProps ?? {}),
        class: `${props.prefixCls}-img`,
        width: props.imageInfo?.width,
        height: props.imageInfo?.height,
        alt: props.alt ?? '',
        style: {
          transform: `translate3d(${t.x}px, ${t.y}px, 0) scale3d(${t.flipX ? '-' : ''}${t.scale}, ${t.flipY ? '-' : ''}${t.scale}, 1) rotate(${t.rotate}deg)`,
        },
        ref: (el: unknown) => getImgRef(el instanceof HTMLImageElement ? el : null),
        ...srcAndOnload.value,
        onWheel,
        onMousedown: onMouseDown,
        onDblclick: onDoubleClick,
      });

      void status.value;

      return h(
        Portal,
        {
          open: mounted.value && portalRender.value && props.open,
          autoDestroy: false,
          getContainer: props.getContainer,
        },
        {
          default: () =>
            h(
              CSSMotion,
              {
                motionName: props.motionName ?? `${props.prefixCls}-fade`,
                motionDeadline: 500,
                visible: portalRender.value && props.open,
                motionAppear: true,
                motionEnter: true,
                motionLeave: true,
                onVisibleChanged,
              },
              {
                default: (motion: { className?: string; style?: Record<string, string> }) =>
                  h(
                    'div',
                    {
                      ref: (element: unknown) => {
                        previewElement.value = element instanceof HTMLElement ? element : null;
                      },
                      class: [
                        props.prefixCls,
                        props.rootClassName,
                        props.classNames?.root,
                        motion.className,
                        props.movable ? `${props.prefixCls}-movable` : undefined,
                        moving.value ? `${props.prefixCls}-moving` : undefined,
                      ],
                      style: {
                        ...theme.styles.value,
                        ...(props.styles?.root ?? {}),
                        ...(motion.style ?? {}),
                        zIndex: props.zIndex ?? props.styles?.root?.zIndex ?? zIndex.value,
                      },
                      role: 'dialog',
                      'aria-modal': 'true',
                      'aria-label': props.alt?.trim() || 'Image preview',
                      tabindex: -1,
                      onKeydown: onKeyDown,
                    },
                    [
                      h('div', {
                        class: [
                          `${props.prefixCls}-mask`,
                          props.mask === false ? `${props.prefixCls}-mask-hidden` : undefined,
                          typeof props.mask === 'object' && props.mask?.blur
                            ? `${props.prefixCls}-mask-blur`
                            : undefined,
                          props.classNames?.mask,
                          typeof props.mask === 'object' ? props.mask?.className : undefined,
                        ],
                        style: [
                          typeof props.mask === 'object' ? props.mask?.style : undefined,
                          props.styles?.mask,
                        ],
                        onClick: onMaskClick,
                      }),
                      h(
                        'div',
                        {
                          class: [`${props.prefixCls}-body`, props.classNames?.body],
                          style: bodyStyle,
                        },
                        [
                          slots.previewImage
                            ? slots.previewImage({
                                originNode: imgNode,
                                ...currentImage(),
                                transform: { ...transform.value },
                                current: props.current,
                                total: props.count,
                              })
                            : imgNode,
                        ],
                      ),
                      props.closable
                        ? h(
                            'button',
                            {
                              type: 'button',
                              class: [`${props.prefixCls}-close`, props.classNames?.close],
                              'aria-label': 'Close preview',
                              style: props.styles?.close,
                              onClick: () => props.onClose?.(),
                            },
                            slots.previewCloseIcon
                              ? [slots.previewCloseIcon()]
                              : [
                                  props.closeIcon !== undefined
                                    ? props.closeIcon
                                    : icons.value.close,
                                ].filter((c) => c !== null && c !== undefined),
                          )
                        : null,
                      renderSwitch(),
                      renderFooter(),
                    ],
                  ),
              },
            ),
        },
      );
    };
  },
});

export default Preview;
