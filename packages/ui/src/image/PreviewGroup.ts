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
  props: {
    previewPrefixCls: { type: String, default: undefined },
    items: { type: Array as PropType<PreviewGroupProps['items']>, default: undefined },
    preview: { type: [Boolean, Object] as PropType<boolean | GroupPreviewConfig>, default: true },
    current: { type: Number, default: undefined },
    defaultCurrent: { type: Number, default: 0 },
    onChange: {
      type: Function as PropType<(current: number, prev: number) => void>,
      default: undefined,
    },
    classNames: { type: Object as PropType<SemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<SemanticStyles>, default: undefined },
  },
  setup(props, { slots, emit }) {
    const { getPrefixCls, direction } = useComponentConfig('image');
    const prefixCls = getPrefixCls('image');
    const previewPrefixCls = props.previewPrefixCls ?? `${prefixCls}-preview`;

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
      props.onChange?.(next, prev);
      emit('update:current', next);
    };

    const isPreviewOpen = ref(false);
    const mousePosition = ref<{ x: number; y: number } | null>(null);

    providePreviewGroup({
      register,
      onPreview: (id, _src, left, top) => {
        mousePosition.value = { x: left, y: top };
        const index = mergedItems.value.findIndex((item) => item.id === id);
        if (index >= 0) setCurrent(index, current.value);
        isPreviewOpen.value = true;
      },
      isPreviewOpen,
      mousePosition,
      current,
    });

    // deprecated：visible（受控）
    const openProp = computed(() => previewConfig.value?.open ?? previewConfig.value?.visible);
    watch(openProp, (v) => {
      if (v !== undefined) isPreviewOpen.value = v;
    });

    const setOpen = (next: boolean): void => {
      if (openProp.value === undefined) isPreviewOpen.value = next;
      previewConfig.value?.onOpenChange?.(next, isPreviewOpen.value);
      previewConfig.value?.onVisibleChange?.(next, isPreviewOpen.value, current.value);
    };

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      PreviewGroupProps,
      SemanticClassNames,
      SemanticStyles
    >(
      [
        () => props.classNames,
        () =>
          ({
            popup: {
              root: previewConfig.value?.rootClassName,
              mask: previewConfig.value?.maskClassName,
            },
            cover: previewConfig.value?.maskClassName,
          }) as SemanticClassNames,
      ],
      [() => props.styles],
      {} as PreviewGroupProps,
    );

    const currentItem = computed(() => mergedItems.value[current.value]);

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
        { class: `${prefixCls}-preview-group` },
        [
          children,
          h(Preview, {
            prefixCls: previewPrefixCls,
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
            classNames: mergedClassNames.value?.popup as never,
            styles: mergedStyles.value?.popup as never,
            onClose: () => setOpen(false),
            afterOpenChange: previewConfig.value.afterOpenChange,
            onActive: (offset: number) => setCurrent(current.value + offset, current.value),
          }),
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default PreviewGroup;
