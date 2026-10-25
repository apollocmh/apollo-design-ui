/**
 * PreviewGroup —— antd `components/image/PreviewGroup.tsx`（160 行）+ rc-image
 * `PreviewGroup.js`（110 行）的 Vue 版。
 *
 * 组内只挂**一个** Preview（portal），切换 `current` 时更新 src 与 mousePosition；
 * `items` 优先，其次用注册收集到的 Image。
 */
import {
  computed,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import {
  createImageRegistry,
  filterPreviewable,
  providePreviewGroup,
  type RegisteredImage,
} from './context';
import { useImageTheme } from './hooks/useImageTheme';
import type {
  GroupPreviewConfig,
  ImageSemanticType,
  PreviewActionsInfo,
  PreviewCountInfo,
  PreviewGroupProps,
  PreviewGroupSemanticType,
  PreviewGroupSlots,
  PreviewImageInfo,
  TransformInfo,
} from './interface';
import Preview, { DEFAULT_ICONS } from './Preview';
import { getImageCommonProps } from './util';

type SemanticClassNames = NonNullable<PreviewGroupSemanticType['classNames']>;
type SemanticStyles = NonNullable<PreviewGroupSemanticType['styles']>;

const PreviewGroup = defineComponent({
  name: 'AImagePreviewGroup',
  slots: Object as SlotsType<PreviewGroupSlots>,
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
    const config = useComponentConfig<ImageSemanticType>('image');
    const theme = useImageTheme();
    const element = shallowRef<HTMLElement | null>(null);
    const triggerElement = shallowRef<HTMLElement | null>(null);
    const prefixCls = computed(() => config.getPrefixCls('image'));
    const previewPrefixCls = computed(() => props.previewPrefixCls ?? `${prefixCls.value}-preview`);

    const previewConfig = computed<GroupPreviewConfig | null>(() => {
      if (props.preview === false) return null;
      if (props.preview === true || props.preview === undefined) return {};
      return props.preview;
    });
    const getPreviewContainer = computed(() => {
      if (previewConfig.value?.getContainer) return previewConfig.value.getContainer;
      const provider = config.getPopupContainer;
      return provider
        ? () =>
            provider(
              triggerElement.value?.isConnected
                ? triggerElement.value
                : (element.value ?? undefined),
            )
        : undefined;
    });

    const { images, register } = createImageRegistry();

    // items 模式优先（rc 的 mergedItems）
    const mergedItems = computed<Array<RegisteredImage & { id?: string }>>(() => {
      if (props.items) {
        return props.items.map((item) => {
          if (typeof item === 'string') return { data: { src: item }, canPreview: true };
          const data: RegisteredImage['data'] = {
            ...getImageCommonProps(item),
            src: item.src,
            width: item.width,
            height: item.height,
            fallback: item.fallback,
          };
          return { data, canPreview: true };
        });
      }
      return filterPreviewable(images.value);
    });

    const innerCurrent = ref(props.defaultCurrent ?? 0);
    const current = computed(() => {
      if (props.current !== undefined) return props.current;
      if (!mergedItems.value.length) return innerCurrent.value;
      const value = Number.isInteger(innerCurrent.value) ? innerCurrent.value : 0;
      return Math.max(0, Math.min(mergedItems.value.length - 1, value));
    });
    watch(
      () => props.current,
      (value) => {
        if (value !== undefined) innerCurrent.value = value;
      },
      { immediate: true },
    );
    const normalizeCurrent = () => {
      if (props.current === undefined && mergedItems.value.length)
        innerCurrent.value = current.value;
    };
    onMounted(normalizeCurrent);
    watch([() => props.current, () => mergedItems.value.length], normalizeCurrent, {
      flush: 'post',
    });
    const setCurrent = (next: number, prev: number): void => {
      if (!Number.isInteger(next) || next < 0 || next > mergedItems.value.length - 1) return;
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
      canPreview: computed(() => previewConfig.value !== null && mergedItems.value.length > 0),
      onPreview: (id, _src, left, top, trigger) => {
        if (!previewConfig.value || !mergedItems.value.length) return;
        triggerElement.value = trigger ?? null;
        mousePosition.value = { x: left, y: top };
        const index = mergedItems.value.findIndex((item) => item.id === id);
        if (index >= 0) setCurrent(index, current.value);
        else if (!mergedItems.value[current.value]) setCurrent(0, current.value);
        setOpen(true);
      },
      isPreviewOpen,
      mousePosition,
      current,
    });

    const currentItem = computed(() => mergedItems.value[current.value]);

    // Read current provider objects; popup style fields keep the shared shallow
    // precedence while class names merge through the nested semantic schema.
    const { classNames: mergedGroupClassNames, styles: mergedGroupStyles } = useMergeSemantic<
      PreviewGroupProps,
      SemanticClassNames,
      SemanticStyles
    >(
      [() => ({ popup: config.classNames?.popup }), () => props.classNames],
      [() => ({ popup: config.styles?.popup }), () => props.styles],
      () => props,
      { popup: { _default: 'root' } },
    );
    const popupClassNames = computed(() => {
      const p = mergedGroupClassNames.value.popup;
      const cfg = previewConfig.value;
      return {
        root: p?.root,
        mask: [p?.mask, cfg?.maskClassName].filter(Boolean).join(' ') || undefined,
        body: p?.body,
        footer: p?.footer,
        actions: p?.actions,
        close: p?.close,
      };
    });

    // Resolve defaults before mirroring the current provider's navigation icons.
    const icons = computed(() => {
      const base = { ...DEFAULT_ICONS, ...previewConfig.value?.icons };
      if (config.direction !== 'rtl') return base;
      const { left, right, ...rest } = base;
      return { ...rest, left: right, right: left };
    });

    return () => {
      const children = slots.default?.();
      return h(
        'div',
        {
          class: [`${prefixCls.value}-preview-group`, mergedGroupClassNames.value.root],
          style: [theme.styles.value, mergedGroupStyles.value.root],
          ref: (node: unknown) => {
            element.value = node instanceof HTMLElement ? node : null;
          },
        },
        [
          children,
          previewConfig.value && currentItem.value
            ? h(
                Preview,
                {
                  prefixCls: previewPrefixCls.value,
                  src: currentItem.value?.data.src,
                  alt: currentItem.value?.data.alt,
                  imageInfo: {
                    width: currentItem.value.data.width,
                    height: currentItem.value.data.height,
                  },
                  imgCommonProps: getImageCommonProps(currentItem.value.data),
                  fallback: currentItem.value.data.fallback,
                  open: isPreviewOpen.value,
                  inGroup: true,
                  current: current.value,
                  count: mergedItems.value.length,
                  movable: previewConfig.value.movable,
                  maskClosable: previewConfig.value.maskClosable,
                  mask: previewConfig.value.mask,
                  getContainer: getPreviewContainer.value,
                  closable: previewConfig.value.closable,
                  closeIcon: previewConfig.value.closeIcon,
                  minScale: previewConfig.value.minScale,
                  maxScale: previewConfig.value.maxScale,
                  scaleStep: previewConfig.value.scaleStep,
                  zIndex: previewConfig.value.zIndex,
                  mousePosition: mousePosition.value,
                  icons: icons.value,
                  rootClassName: previewConfig.value.rootClassName,
                  classNames: popupClassNames.value,
                  styles: mergedGroupStyles.value.popup,
                  onClose: () => setOpen(false),
                  afterOpenChange: previewConfig.value.afterOpenChange,
                  onTransform: (info: TransformInfo) => emit('transform', info),
                  onActive: (offset: number) => setCurrent(current.value + offset, current.value),
                },
                {
                  ...(slots.previewImage
                    ? { previewImage: (info: PreviewImageInfo) => slots.previewImage?.(info) }
                    : {}),
                  ...(slots.previewActions
                    ? { previewActions: (info: PreviewActionsInfo) => slots.previewActions?.(info) }
                    : {}),
                  ...(slots.previewCloseIcon
                    ? { previewCloseIcon: () => slots.previewCloseIcon?.() }
                    : {}),
                  ...(slots.previewCount
                    ? { previewCount: (info: PreviewCountInfo) => slots.previewCount?.(info) }
                    : {}),
                },
              )
            : null,
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default PreviewGroup;
