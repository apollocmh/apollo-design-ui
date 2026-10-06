/**
 * Image —— rc-image `Image.js`（190 行）+ antd `index.tsx`（325 行）的 Vue 版。
 *
 * 结构（SSR 可见部分，L4 的目标）：
 * ```html
 * <div class="{p} [{p}-error]" role="button" tabindex="0" aria-label="alt" style="width;height">
 *   <img class="{p}-img [{p}-img-placeholder]" … />
 *   <div aria-hidden="true" class="{p}-placeholder">{placeholder}</div>   <!-- loading 时 -->
 *   <div class="{p}-cover {p}-cover-{center|top|bottom}">{cover}</div>
 * </div>
 * ```
 * Preview 是 portal —— SSR 不可见（与 tooltip/popover 同判）。
 */
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { nextImageId, type RegisteredImage, usePreviewGroup } from './context';
import { useStatus } from './hooks/useStatus';
import type {
  CoverPlacement,
  ImageProps,
  ImageSemanticType,
  MaskNode,
  PlaceholderType,
  PreviewConfig,
} from './interface';
import Preview from './Preview';
import Progress from './Progress';
import { toCssSize } from './util';

type SemanticClassNames = NonNullable<ImageSemanticType['classNames']>;
type SemanticStyles = NonNullable<ImageSemanticType['styles']>;

/** antd 的 isPlaceholderConfig（plain object 且不是 VNode）。 */
function isPlaceholderConfig(placeholder: unknown): boolean {
  if (!placeholder || typeof placeholder !== 'object') return false;
  const obj = placeholder as Record<string, unknown>;
  // VNode 有 __v_isVNode / type / props 等标记
  return !('__v_isVNode' in obj) && !('type' in obj && 'props' in obj);
}

function normalizeCover(cover: MaskNode | undefined): {
  placement: CoverPlacement;
  coverNode: VNodeChild;
  isFalse: boolean;
} {
  if (cover === false) return { placement: 'center', coverNode: undefined, isFalse: true };
  if (cover === undefined || cover === true) {
    return { placement: 'center', coverNode: undefined, isFalse: false };
  }
  if (typeof cover === 'boolean')
    return { placement: 'center', coverNode: undefined, isFalse: false };
  const obj = cover as Record<string, unknown>;
  const placement = (obj.placement as CoverPlacement) || 'center';
  const coverNode = (obj.coverNode as VNodeChild) ?? (cover as VNodeChild);
  return { placement, coverNode, isFalse: false };
}

const Image = defineComponent({
  name: 'AImage',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    src: { type: String, default: undefined },
    width: { type: [Number, String] as PropType<number | string>, default: undefined },
    height: { type: [Number, String] as PropType<number | string>, default: undefined },
    alt: { type: String, default: undefined },
    fallback: { type: String, default: undefined },
    placeholder: { type: [Object, String] as PropType<PlaceholderType>, default: undefined },
    preview: { type: [Boolean, Object] as PropType<boolean | PreviewConfig>, default: true },
    wrapperStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    classNames: { type: Object as PropType<SemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<SemanticStyles>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onError: { type: Function as PropType<(e: Event) => void>, default: undefined },
    // img 透传（COMMON_PROPS 子集）
    crossOrigin: { type: String as PropType<ImageProps['crossOrigin']>, default: undefined },
    decoding: { type: String as PropType<ImageProps['decoding']>, default: undefined },
    loading: { type: String as PropType<ImageProps['loading']>, default: undefined },
    referrerPolicy: { type: String, default: undefined },
    sizes: { type: String, default: undefined },
    srcSet: { type: String, default: undefined },
    useMap: { type: String, default: undefined },
    draggable: { type: Boolean, default: undefined },
  },
  setup(props, { attrs, emit }) {
    // antd 逐字（image/index.js:33-41）：ConfigProvider 组件级 `classNames` /
    // `styles`（`components.image.*`）是语义合并的**最外层**来源（2026-10-04 接上）。
    const {
      getPrefixCls,
      classNames: contextClassNames,
      styles: contextStyles,
    } = useComponentConfig('image');
    const prefixCls = props.prefixCls ?? getPrefixCls('image');

    // ============================ Preview =============================
    const previewConfig = computed<PreviewConfig | null>(() => {
      if (props.preview === false) return null;
      if (props.preview === true || props.preview === undefined) return {};
      return props.preview;
    });
    const canPreview = computed(() => previewConfig.value !== null);

    // deprecated：visible → open（antd 的 onVisibleChange 二参）
    const previewOpenProp = computed(() => {
      const cfg = previewConfig.value;
      if (!cfg) return undefined;
      return cfg.open ?? cfg.visible;
    });

    const innerOpen = ref(false);
    const previewOpen = computed(() => previewOpenProp.value ?? innerOpen.value);

    // 关闭时复位（受控方自己负责）
    watch(previewOpenProp, (v) => {
      if (v !== undefined) innerOpen.value = v;
    });

    const setPreviewOpen = (next: boolean): void => {
      const cfg = previewConfig.value;
      if (previewOpenProp.value === undefined) innerOpen.value = next;
      cfg?.onOpenChange?.(next, previewOpen.value);
      cfg?.onVisibleChange?.(next, previewOpen.value);
      emit('update:open', next);
    };

    const mousePosition = ref<{ x: number; y: number } | null>(null);

    // ⚠️ previewSrc 必须早于注册块定义（registerData 依赖它 —— TDZ 只在
    //    组内路径暴露，组外不触发，容易漏）
    const previewSrc = computed(() => previewConfig.value?.src ?? props.src);

    // ======================= PreviewGroup 注册 ========================
    const groupContext = usePreviewGroup();
    const imageId = nextImageId();
    let unregister: (() => void) | undefined;

    const registerData = computed<RegisteredImage>(() => ({
      data: {
        alt: props.alt,
        crossOrigin: props.crossOrigin,
        decoding: props.decoding,
        loading: props.loading,
        referrerPolicy: props.referrerPolicy,
        sizes: props.sizes,
        srcSet: props.srcSet,
        useMap: props.useMap,
        draggable: props.draggable,
        src: previewSrc.value,
      },
      canPreview: canPreview.value,
    }));

    if (groupContext) {
      watch(
        registerData,
        (data) => {
          unregister?.();
          unregister = groupContext.register(imageId, { ...data, id: imageId });
        },
        { immediate: true },
      );
      onBeforeUnmount(() => unregister?.());
    }

    /** 组内：交给 group 统一开预览；组外：自己开。 */
    const openPreviewAt = (target: HTMLElement | null): void => {
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        mousePosition.value = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      if (groupContext) {
        groupContext.onPreview(
          imageId,
          previewSrc.value,
          mousePosition.value?.x ?? 0,
          mousePosition.value?.y ?? 0,
        );
        return;
      }
      setPreviewOpen(true);
    };

    // ============================ Status ==============================
    const isCustomPlaceholder = computed(() => {
      const p = props.placeholder;
      return Boolean(p) && p !== true;
    });
    const { status, getImgRef, srcAndOnload } = useStatus({
      src: () => props.src,
      isCustomPlaceholder: () => isCustomPlaceholder.value,
      fallback: () => props.fallback,
    });

    // =========================== Semantic =============================
    // ⚠️ antd 第四参 `{ popup: { _default: 'root' }, placeholder: {} }`（§1.7b 已补）。
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      ImageProps,
      SemanticClassNames,
      SemanticStyles
    >(
      [
        () => contextClassNames as Record<string, never>,
        () => props.classNames,
        () => ({ root: props.wrapperStyle ? undefined : undefined }),
      ],
      [
        () => contextStyles as Record<string, never>,
        () => props.styles,
        () => (props.wrapperStyle ? { root: props.wrapperStyle } : undefined),
      ],
      {} as ImageProps,
      { popup: { _default: 'root' }, placeholder: {} },
    );

    // ========================== Placeholder ===========================
    const progressConfig = computed<{ percent?: number; render?: unknown } | undefined>(() => {
      const p = props.placeholder;
      if (!p || !isPlaceholderConfig(p)) return undefined;
      const cfg = (p as { progress?: boolean | { percent?: number; render?: unknown } }).progress;
      if (typeof cfg === 'boolean') return cfg ? {} : undefined;
      return cfg;
    });
    const showProgressOverlay = computed(() => progressConfig.value !== undefined);

    const placeholderNode = computed<VNodeChild>(() =>
      isPlaceholderConfig(props.placeholder) ? undefined : (props.placeholder as VNodeChild),
    );
    const shouldRenderPlaceholderOverlay = computed(
      () => Boolean(placeholderNode.value) && !props.src,
    );

    // ============================ Render ==============================
    // ⚠️ popup 是**嵌套语义组** —— 合并结果来自 useMergeSemantic 的 schema 档
    //（`popup: { _default: 'root' }`，§1.7b 已补）：字符串形态 `popup = 'x'` 已被
    // 归到 `popup.root`，这里只读合并结果；`previewConfig` 的两条是本仓既有的附加项。
    const popupClassNames = computed(() => {
      const p = (mergedClassNames.value as { popup?: Record<string, string | undefined> }).popup;
      const mask = previewConfig.value?.mask;
      return {
        root: [p?.root, previewConfig.value?.rootClassName].filter(Boolean).join(' ') || undefined,
        mask:
          [p?.mask, mask === false ? `${prefixCls}-preview-mask-hidden` : undefined]
            .filter(Boolean)
            .join(' ') || undefined,
        body: p?.body,
        footer: p?.footer,
        actions: p?.actions,
        close: p?.close,
      };
    });

    const coverInfo = computed(() => normalizeCover(previewConfig.value?.cover as MaskNode));

    const onInternalClick = (e: MouseEvent): void => {
      if (!canPreview.value) {
        props.onClick?.(e);
        return;
      }
      openPreviewAt(e.target as HTMLElement | null);
      props.onClick?.(e);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (!canPreview.value) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPreviewAt(e.target as HTMLElement | null);
      }
    };

    return () => {
      const commonProps = {
        alt: props.alt,
        crossOrigin: props.crossOrigin,
        decoding: props.decoding,
        loading: props.loading,
        referrerPolicy: props.referrerPolicy,
        sizes: props.sizes,
        srcSet: props.srcSet,
        useMap: props.useMap,
        draggable: props.draggable,
      };

      // 进度层 / 纯占位 overlay：只渲染 Progress（带尺寸）
      if (showProgressOverlay.value || shouldRenderPlaceholderOverlay.value) {
        const cfg = progressConfig.value ?? {};
        return h(Progress, {
          prefixCls,
          percent: (cfg as { percent?: number }).percent,
          render: shouldRenderPlaceholderOverlay.value
            ? ((() => placeholderNode.value) as never)
            : ((cfg as { render?: never }).render ?? undefined),
          classNames: mergedClassNames.value?.placeholder?.progress,
          styles: mergedStyles.value?.placeholder?.progress as never,
          // Progress 已迁移到「根 class 走原生 attrs」⇒ 这里必须用 `class`
          class: [props.rootClassName, props.className].filter(Boolean).join(' '),
          rootStyle: mergedStyles.value?.root,
          width: props.width,
          height: props.height,
        });
      }

      const isError = status.value === 'error';

      return h(
        'div',
        {
          ...attrs,
          class: [
            prefixCls,
            props.rootClassName,
            mergedClassNames.value?.root,
            isError ? `${prefixCls}-error` : undefined,
            typeof attrs.class === 'string' ? attrs.class : undefined,
          ],
          style: {
            width: toCssSize(props.width),
            height: toCssSize(props.height),
            ...(mergedStyles.value?.root ?? {}),
          },
          role: canPreview.value ? 'button' : undefined,
          tabindex: canPreview.value ? 0 : undefined,
          'aria-label': canPreview.value ? (props.alt ?? undefined) : undefined,
          onClick: canPreview.value ? onInternalClick : props.onClick,
          onKeydown: canPreview.value ? onKeyDown : undefined,
        },
        [
          h('img', {
            ...commonProps,
            class: [
              `${prefixCls}-img`,
              props.placeholder === true ? `${prefixCls}-img-placeholder` : undefined,
              mergedClassNames.value?.image,
              props.className,
            ],
            style: {
              // ⚠️ 必须 toCssSize：Vue 的 `style` 数字值**不会**自动补 px（rc 在 React
              // 里靠这层自动补），`{height: 100}` 会被静默丢弃 ⇒ 落到 CSS 的
              // `height:auto`，图片按原始比例撑成正方形（L6 才暴露，contract 档丢 style）。
              height: toCssSize(props.height),
              ...(mergedStyles.value?.image ?? {}),
              ...(props.style ?? {}),
            },
            width: props.width,
            height: props.height,
            ref: (el: unknown) => getImgRef(el as HTMLImageElement | null),
            ...(srcAndOnload.value as Record<string, unknown>),
            onError: props.onError,
          }),
          status.value === 'loading'
            ? h(
                'div',
                { 'aria-hidden': 'true', class: `${prefixCls}-placeholder` },
                [placeholderNode.value as VNodeChild].filter((c) => c !== null && c !== undefined),
              )
            : null,
          !coverInfo.value.isFalse && canPreview.value
            ? h(
                'div',
                {
                  class: [
                    `${prefixCls}-cover`,
                    mergedClassNames.value?.cover,
                    `${prefixCls}-cover-${coverInfo.value.placement}`,
                  ],
                  style: {
                    display: props.style?.display === 'none' ? 'none' : undefined,
                    ...(mergedStyles.value?.cover ?? {}),
                  },
                },
                [coverInfo.value.coverNode as VNodeChild].filter(
                  (c) => c !== null && c !== undefined,
                ),
              )
            : null,
          canPreview.value && !groupContext
            ? h(Preview, {
                prefixCls: `${prefixCls}-preview`,
                src: previewSrc.value,
                alt: props.alt,
                imageInfo: { width: props.width, height: props.height },
                fallback: props.fallback,
                imgCommonProps: commonProps,
                open: previewOpen.value,
                movable: previewConfig.value?.movable,
                maskClosable: previewConfig.value?.maskClosable,
                minScale: previewConfig.value?.minScale,
                maxScale: previewConfig.value?.maxScale,
                scaleStep: previewConfig.value?.scaleStep,
                zIndex: previewConfig.value?.zIndex,
                mousePosition: mousePosition.value,
                icons: previewConfig.value?.icons,
                rootClassName: previewConfig.value?.rootClassName,
                classNames: popupClassNames.value,
                styles: props.styles?.popup,
                onClose: () => setPreviewOpen(false),
                afterOpenChange: previewConfig.value?.afterOpenChange,
              })
            : null,
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default Image;
