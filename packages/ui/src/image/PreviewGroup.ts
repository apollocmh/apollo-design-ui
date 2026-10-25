/**
 * PreviewGroup —— antd `components/image/PreviewGroup.tsx`（160 行）+ rc-image
 * `PreviewGroup.js`（110 行）的 Vue 版。
 *
 * 组内只挂**一个** Preview（portal），切换 `current` 时更新 src 与 mousePosition；
 * `items` 优先，其次用注册收集到的 Image。
 */
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import {
  createImageRegistry,
  filterPreviewable,
  providePreviewGroup,
  type RegisteredImage,
} from './context';
import type {
  GroupPreviewConfig,
  ImageCommonProps,
  ImageSemanticType,
  PreviewGroupProps,
  TransformInfo,
} from './interface';
import Preview from './Preview';

type SemanticClassNames = NonNullable<ImageSemanticType['classNames']>;
type SemanticStyles = NonNullable<ImageSemanticType['styles']>;

const COMMON_KEYS: Array<keyof ImageCommonProps> = [
  'alt',
  'crossOrigin',
  'decoding',
  'loading',
  'referrerPolicy',
  'sizes',
  'srcSet',
  'useMap',
  'draggable',
];

const PreviewGroup = defineComponent({
  name: 'AImagePreviewGroup',
  emits: {
    change: (_current: number, _prevCurrent: number) => true,
    'update:current': (_current: number) => true,
    openChange: (_open: boolean, _prevOpen: boolean) => true,
    transform: (_info: TransformInfo) => true,
    'update:open': (_open: boolean) => true,
  },
  props: {
    previewPrefixCls: { type: String, default: undefined },
    items: { type: Array as PropType<PreviewGroupProps['items']>, default: undefined },
    preview: { type: [Boolean, Object] as PropType<boolean | GroupPreviewConfig>, default: true },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: false },
    current: { type: Number, default: undefined },
    defaultCurrent: { type: Number, default: 0 },
    classNames: { type: Object as PropType<SemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<SemanticStyles>, default: undefined },
  },
  setup(props, { slots, emit }) {
    const config = useComponentConfig('image');
    const { direction } = config;
    const prefixCls = computed(() => config.getPrefixCls('image'));
    const previewPrefixCls = computed(() => props.previewPrefixCls ?? `${prefixCls.value}-preview`);

    const previewConfig = computed<GroupPreviewConfig | null>(() => {
      if (props.preview === false) return null;
      if (props.preview === true || props.preview === undefined) return {};
      return props.preview;
    });

    const { images, register } = createImageRegistry();

    // items 模式优先（rc 的 mergedItems）
    const mergedItems = computed<Array<RegisteredImage & { id?: string }>>(() => {
      if (props.items) {
        return props.items.map((item) => {
          if (typeof item === 'string') return { data: { src: item }, canPreview: true };
          const data: ImageCommonProps & { src?: string } = {};
          for (const key of COMMON_KEYS) {
            const v = (item as Record<string, unknown>)[key];
            if (v !== undefined) (data as Record<string, unknown>)[key] = v;
          }
          if (item.src !== undefined) data.src = item.src;
          return { data, canPreview: true };
        });
      }
      return filterPreviewable(images.value);
    });

    const innerCurrent = ref(props.defaultCurrent ?? 0);
    const current = computed(() => props.current ?? innerCurrent.value);
    const setCurrent = (next: number, prev: number): void => {
      if (next < 0 || next > mergedItems.value.length - 1) return;
      if (props.current === undefined) innerCurrent.value = next;
      emit('change', next, prev);
      emit('update:current', next);
    };

    const innerOpen = ref(props.defaultOpen);
    const isPreviewOpen = computed(() => props.open ?? innerOpen.value);
    watch(
      () => props.open,
      (open) => {
        if (open !== undefined) innerOpen.value = open;
      },
      { immediate: true },
    );
    const setOpen = (next: boolean): void => {
      const previous = isPreviewOpen.value;
      if (props.open === undefined) innerOpen.value = next;
      emit('openChange', next, previous);
      emit('update:open', next);
    };
    const mousePosition = ref<{ x: number; y: number } | null>(null);

    providePreviewGroup({
      register,
      onPreview: (id, _src, left, top) => {
        if (!previewConfig.value) return;
        mousePosition.value = { x: left, y: top };
        const index = mergedItems.value.findIndex((item) => item.id === id);
        if (index >= 0) setCurrent(index, current.value);
        setOpen(true);
      },
      isPreviewOpen,
      mousePosition,
      current,
    });

    const currentItem = computed(() => mergedItems.value[current.value]);

    // ⚠️ popup 是嵌套语义组 ⇒ 走 `useMergeSemantic` 的 schema 档
    //（`popup: { _default: 'root' }`，§1.7b 已补）：字符串形态 `popup = 'x'` 归到
    // `popup.root`，字符串 + 对象混用不再产垃圾键。
    // 另：antd 的 PreviewGroup 还会把 `contextClassNames` / `contextStyles` 并入，
    // 本仓库的 ConfigProvider 目前不提供组件级 classNames/styles（staged），
    // 所以来源只有 props 与 previewConfig（`preview.rootClassName` / `maskClassName`）。
    const { classNames: mergedGroupClassNames } = useMergeSemantic<
      Record<string, unknown>,
      SemanticClassNames,
      Record<string, never>
    >([() => props.classNames], [], {} as never, { popup: { _default: 'root' }, placeholder: {} });
    const popupClassNames = computed(() => {
      const p = (mergedGroupClassNames.value as { popup?: Record<string, string | undefined> })
        .popup;
      const cfg = previewConfig.value;
      const mask = cfg?.mask;
      return {
        root: [p?.root, cfg?.rootClassName].filter(Boolean).join(' ') || undefined,
        mask:
          [
            p?.mask,
            cfg?.maskClassName,
            mask === false ? `${previewPrefixCls.value}-mask-hidden` : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined,
        body: p?.body,
        footer: p?.footer,
        actions: p?.actions,
        close: p?.close,
      };
    });

    // rtl：left/right 互换（antd 同款）
    const icons = computed(() => {
      const base = previewConfig.value?.icons ?? {};
      if (direction !== 'rtl') return base;
      const { left, right, ...rest } = base;
      return { ...rest, left: right, right: left };
    });

    return () => {
      const children = slots.default?.() as VNodeChild;
      if (!previewConfig.value) {
        return h(
          'div',
          null,
          [children].filter((c) => c !== null && c !== undefined),
        );
      }

      return h(
        'div',
        { class: `${prefixCls.value}-preview-group` },
        [
          children,
          h(Preview, {
            prefixCls: previewPrefixCls.value,
            src: currentItem.value?.data.src,
            alt: currentItem.value?.data.alt,
            imageInfo: {
              width: (currentItem.value?.data as Record<string, unknown> | undefined)
                ?.width as never,
              height: (currentItem.value?.data as Record<string, unknown> | undefined)
                ?.height as never,
            },
            imgCommonProps: currentItem.value?.data,
            open: isPreviewOpen.value,
            inGroup: true,
            current: current.value,
            count: mergedItems.value.length,
            movable: previewConfig.value.movable,
            maskClosable: previewConfig.value.maskClosable,
            minScale: previewConfig.value.minScale,
            maxScale: previewConfig.value.maxScale,
            scaleStep: previewConfig.value.scaleStep,
            zIndex: previewConfig.value.zIndex,
            mousePosition: mousePosition.value,
            icons: icons.value,
            rootClassName: previewConfig.value.rootClassName,
            classNames: popupClassNames.value,
            styles: props.styles?.popup,
            onClose: () => setOpen(false),
            afterOpenChange: previewConfig.value.afterOpenChange,
            onTransform: (info: TransformInfo) => emit('transform', info),
            onActive: (offset: number) => setCurrent(current.value + offset, current.value),
          }),
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default PreviewGroup;
