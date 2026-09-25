/**
 * Preview —— rc-image `Preview/index.js`（360 行）+ Footer/PrevNext/CloseBtn 的
 * Vue 版合并实现。
 *
 * portal 浮层：`{p}-preview` 根（role=dialog / aria-modal）> mask / body > img /
 * close / switch-prev|next / footer(progress + actions)。
 *
 * v1 边界（登记于 README §4）：
 * - 手势：滚轮缩放 + 鼠标拖拽 + 双击（触摸双指缩放 PENDING）；
 * - `focusTrap`：仅做「打开时聚焦根 + 关闭时还原焦点」（rc 的完整焦点循环
 *   PENDING —— 与 modal/message 的 focus 基建一起回归）；
 * - 变换内核在 `hooks/useImageTransform.ts`（纯逻辑，oracle 单测覆盖）。
 */

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
import { Portal, useZIndex } from '@apollo-design/portal';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import { useImageTransform } from './hooks/useImageTransform';
import { useStatus } from './hooks/useStatus';
import type { ImageCommonProps, PreviewConfig, PreviewIcons, TransformInfo } from './interface';
import { imageTokenValues } from './style/token';

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
    minScale: { type: Number, default: 1 },
    maxScale: { type: Number, default: 50 },
    scaleStep: { type: Number, default: 0.5 },
    zIndex: { type: Number, default: undefined },
    current: { type: Number, default: 0 },
    count: { type: Number, default: 1 },
    /** 组内模式（>1 时显示 prev/next 与计数）。 */
    inGroup: { type: Boolean, default: false },
    mousePosition: { type: Object as PropType<{ x: number; y: number } | null>, default: null },
    motionName: { type: String, default: 'fade' },
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
    onTransform: { type: Function as PropType<(info: TransformInfo) => void>, default: undefined },
  },
  setup(props) {
    const zIndex = useZIndex('ImagePreview', () => props.zIndex, {
      zIndexPopupBase: imageTokenValues().zIndexPopup,
    });

    const { transform, updateTransform, dispatchZoomChange, resetTransform } = useImageTransform(
      props.minScale,
      props.maxScale,
      props.onTransform,
    );

    const { status, getImgRef, srcAndOnload } = useStatus({
      src: () => props.src,
      fallback: () => props.fallback,
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

    // ---------------------- 手势（v1：滚轮 + 拖拽 + 双击） ----------------------
    const moving = ref(false);
    let startX = 0;
    let startY = 0;
    let startTX = 0;
    let startTY = 0;

    const onWheel = (e: WheelEvent): void => {
      if (!props.open) return;
      e.preventDefault();
      const ratio = e.deltaY > 0 ? -0.1 : 0.1;
      dispatchZoomChange(ratio, 'wheel', e.clientX, e.clientY);
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (!props.open || !props.movable) return;
      e.preventDefault();
      moving.value = true;
      startX = e.clientX;
      startY = e.clientY;
      startTX = transform.value.x;
      startTY = transform.value.y;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
    const onMouseMove = (e: MouseEvent): void => {
      if (!moving.value) return;
      updateTransform({
        x: startTX + (e.clientX - startX),
        y: startTY + (e.clientY - startY),
      });
    };
    const onMouseUp = (): void => {
      moving.value = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    const onDoubleClick = (e: MouseEvent): void => {
      if (!props.open) return;
      if (transform.value.scale !== 1) {
        updateTransform({ x: 0, y: 0, scale: 1 });
      } else {
        dispatchZoomChange(0.1 + props.scaleStep, 'zoomIn', e.clientX, e.clientY);
      }
    };

    // ------------------------------ 键盘 ------------------------------
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!props.open) return;
      const key = e.key;
      if (key === 'Escape') {
        props.onClose?.();
        return;
      }
      if (!showSwitch.value) return;
      if (key === 'ArrowLeft') props.onActive?.(-1);
      if (key === 'ArrowRight') props.onActive?.(1);
    };

    const onVisibleChanged = (next: boolean): void => {
      props.afterOpenChange?.(next);
    };

    const onMaskClick = (): void => {
      if (props.maskClosable) props.onClose?.();
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
          renderAction('flipY', icons.value.flipY, () =>
            updateTransform({ flipY: !transform.value.flipY }),
          ),
          renderAction('flipX', icons.value.flipX, () =>
            updateTransform({ flipX: !transform.value.flipX }),
          ),
          renderAction('rotateLeft', icons.value.rotateLeft, () =>
            updateTransform({ rotate: transform.value.rotate - 90 }),
          ),
          renderAction('rotateRight', icons.value.rotateRight, () =>
            updateTransform({ rotate: transform.value.rotate + 90 }),
          ),
          renderAction(
            'zoomOut',
            icons.value.zoomOut,
            () => dispatchZoomChange(-0.1, 'zoomOut'),
            scale <= props.minScale,
          ),
          renderAction(
            'zoomIn',
            icons.value.zoomIn,
            () => dispatchZoomChange(0.1, 'zoomIn'),
            scale === props.maxScale,
          ),
        ],
      );

      return h(
        'div',
        {
          class: [`${props.prefixCls}-footer`, props.classNames?.footer],
          style: props.styles?.footer,
        },
        [progressNode, actionsNode].filter((c) => c !== null),
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
            class: [cls, `${cls}-prev`, prevDisabled ? `${cls}-disabled` : undefined],
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
        alt: props.alt,
        style: {
          transform: `translate3d(${t.x}px, ${t.y}px, 0) scale3d(${t.flipX ? '-' : ''}${t.scale}, ${t.flipY ? '-' : ''}${t.scale}, 1) rotate(${t.rotate}deg)`,
        },
        ref: (el: unknown) => getImgRef(el as HTMLImageElement | null),
        ...(srcAndOnload.value as Record<string, unknown>),
        onWheel,
        onMousedown: onMouseDown,
        onDblclick: onDoubleClick,
      });

      void status.value;

      return h(
        Portal,
        { open: portalRender.value && props.open, autoDestroy: false },
        {
          default: () =>
            h(
              CSSMotion,
              {
                motionName: props.motionName,
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
                      class: [
                        props.prefixCls,
                        props.rootClassName,
                        props.classNames?.root,
                        motion.className,
                        props.movable ? `${props.prefixCls}-movable` : undefined,
                        moving.value ? `${props.prefixCls}-moving` : undefined,
                      ],
                      style: {
                        ...(props.styles?.root ?? {}),
                        ...(motion.style ?? {}),
                        zIndex: zIndex.value,
                      },
                      role: 'dialog',
                      'aria-modal': 'true',
                      'aria-label': props.alt,
                      tabindex: -1,
                      onKeydown: onKeyDown,
                    },
                    [
                      h('div', {
                        class: [`${props.prefixCls}-mask`, props.classNames?.mask],
                        style: props.styles?.mask,
                        onClick: onMaskClick,
                      }),
                      h(
                        'div',
                        {
                          class: [`${props.prefixCls}-body`, props.classNames?.body],
                          style: bodyStyle,
                        },
                        [imgNode],
                      ),
                      h(
                        'button',
                        {
                          class: [`${props.prefixCls}-close`, props.classNames?.close],
                          style: props.styles?.close,
                          onClick: () => props.onClose?.(),
                        },
                        [icons.value.close].filter((c) => c !== null && c !== undefined),
                      ),
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
