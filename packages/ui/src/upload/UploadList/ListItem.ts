/**
 * ListItem —— antd `es/upload/UploadList/ListItem.js` 的 Vue 等价物（181 行）。
 *
 * 判据：图片族 uploading 或无 thumb/url ⇒ thumbnail div；否则 `<a>` 缩略图；
 * 文件名带 url ⇒ `<a target=_blank>`，否则 span[role=button]（Enter/Space
 * 预览）；remove 图标跟随 disabled（issue 46171）；downloadIcon 仅 done；
 * picture-card/circle 的操作不含 download（在 actions 里且 done 才有）；
 * 进度条延迟 300ms 出现（useDelayState）；error 项外层 title 提示（P2：
 * tooltip 未落地，D 登记差异）。
 */

import { DeleteOutlined, DownloadOutlined, EyeOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  type Ref,
  ref,
  watch,
} from 'vue';
import type {
  ItemRender,
  UploadFile,
  UploadListProgressProps,
  UploadListType,
  UploadLocale,
  VNodeChild,
} from '../interface';
import { MiniProgress } from './MiniProgress';

type CSSStyleLike = Record<string, string | number>;

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/** rc `useDelayState` 的最小等价：300ms 后置 true。 */
function useDelayShow(ms = 300): { visible: Ref<boolean> } {
  const visible = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  onMounted(() => {
    timer = setTimeout(() => {
      visible.value = true;
    }, ms);
  });
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
  });
  return { visible };
}

export const ListItem = defineComponent({
  name: 'AUploadListItem',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    rootPrefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSStyleLike | null>, default: undefined },
    classNames: { type: Object as PropType<Record<string, string>>, default: undefined },
    styles: { type: Object as PropType<Record<string, CSSStyleLike>>, default: undefined },
    locale: { type: Object as PropType<UploadLocale>, required: true },
    listType: { type: String as PropType<UploadListType>, required: true },
    file: { type: Object as PropType<UploadFile>, required: true },
    items: { type: Array as PropType<UploadFile[]>, default: () => [] },
    progress: { type: Object as PropType<UploadListProgressProps>, default: undefined },
    iconRender: {
      type: Function as PropType<(file: UploadFile, listType?: UploadListType) => VNodeChild>,
      required: true,
    },
    actionIconRender: { type: Function as PropType<unknown>, required: true },
    itemRender: { type: Function as PropType<ItemRender>, default: undefined },
    isImgUrl: { type: Function as PropType<(file: UploadFile) => boolean>, required: true },
    showPreviewIcon: {
      type: [Boolean, Function] as PropType<boolean | ((file: UploadFile) => boolean)>,
      default: true,
    },
    showRemoveIcon: {
      type: [Boolean, Function] as PropType<boolean | ((file: UploadFile) => boolean)>,
      default: true,
    },
    showDownloadIcon: {
      type: [Boolean, Function] as PropType<boolean | ((file: UploadFile) => boolean)>,
      default: false,
    },
    removeIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    previewIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    downloadIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    extra: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    onPreview: {
      type: Function as PropType<(file: UploadFile, e?: Event) => void>,
      required: true,
    },
    onDownload: { type: Function as PropType<(file: UploadFile) => void>, required: true },
    onClose: { type: Function as PropType<(file: UploadFile) => void>, required: true },
  },
  setup(props) {
    // Status: which will ignore `removed` status
    const mergedStatus = ref(props.file.status);
    watch(
      () => props.file.status,
      (status) => {
        if (status !== 'removed') {
          mergedStatus.value = status;
        }
      },
    );

    // Delay to show the progress bar
    const { visible: showProgress } = useDelayShow(300);

    const iconNode = computed(() => props.iconRender(props.file, props.listType));

    const isPictureLike = computed(() =>
      ['picture', 'picture-card', 'picture-circle'].includes(props.listType),
    );

    const icon = computed<VNodeChild>(() => {
      const file = props.file;
      if (isPictureLike.value) {
        if (mergedStatus.value === 'uploading' || (!file.thumbUrl && !file.url)) {
          const uploadingClassName = [
            `${props.prefixCls}-list-item-thumbnail`,
            { [`${props.prefixCls}-list-item-file`]: mergedStatus.value !== 'uploading' },
          ];
          return h('div', { class: uploadingClassName }, [iconNode.value]);
        }
        const thumbnail = props.isImgUrl(file)
          ? h('img', {
              src: file.thumbUrl || file.url,
              alt: file.name,
              class: `${props.prefixCls}-list-item-image`,
              crossOrigin: file.crossOrigin ?? undefined,
            })
          : iconNode.value;
        const aClassName = [
          `${props.prefixCls}-list-item-thumbnail`,
          { [`${props.prefixCls}-list-item-file`]: props.isImgUrl && !props.isImgUrl(file) },
        ];
        return h(
          'a',
          {
            class: aClassName,
            onClick: (e: MouseEvent) => props.onPreview(file, e),
            href: file.url || file.thumbUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          [thumbnail],
        );
      }
      return h('div', { class: `${props.prefixCls}-icon` }, [iconNode.value]);
    });

    const listItemClassName = computed(() => [
      `${props.prefixCls}-list-item`,
      `${props.prefixCls}-list-item-${mergedStatus.value}`,
      props.classNames?.item,
    ]);

    const resolveIcon = (
      custom: VNodeChild | ((file: UploadFile) => VNodeChild) | undefined,
      fallback: VNodeChild,
    ): VNodeChild =>
      (isFunction(custom) ? (custom(props.file) as VNodeChild) : (custom as VNodeChild)) ??
      fallback;

    const removeIcon = computed<VNodeChild>(() => {
      const show = isFunction(props.showRemoveIcon)
        ? props.showRemoveIcon(props.file)
        : props.showRemoveIcon;
      if (!show) return null;
      return (
        props.actionIconRender as (
          customIcon: VNodeChild,
          callback: () => void,
          prefixCls: string,
          title: string | undefined,
          acceptUploadDisabled: boolean,
        ) => VNodeChild
      )(
        resolveIcon(props.removeIcon, h(DeleteOutlined)),
        () => props.onClose(props.file),
        props.prefixCls,
        props.locale.removeFile,
        // acceptUploadDisabled is true, only remove icon will follow Upload disabled prop
        // https://github.com/ant-design/ant-design/issues/46171
        true,
      );
    });

    const downloadIcon = computed<VNodeChild>(() => {
      const show = isFunction(props.showDownloadIcon)
        ? props.showDownloadIcon(props.file)
        : props.showDownloadIcon;
      if (!(show && mergedStatus.value === 'done')) return null;
      return (
        props.actionIconRender as (
          customIcon: VNodeChild,
          callback: () => void,
          prefixCls: string,
          title: string | undefined,
          acceptUploadDisabled: boolean,
        ) => VNodeChild
      )(
        resolveIcon(props.downloadIcon, h(DownloadOutlined)),
        () => props.onDownload(props.file),
        props.prefixCls,
        props.locale.downloadFile,
        false,
      );
    });

    const downloadOrDelete = computed<VNodeChild>(() => {
      if (props.listType === 'picture-card' || props.listType === 'picture-circle') {
        return null;
      }
      return h(
        'span',
        {
          class: [
            `${props.prefixCls}-list-item-actions`,
            { picture: props.listType === 'picture' },
          ],
        },
        [downloadIcon.value, removeIcon.value],
      );
    });

    const extra = computed<VNodeChild>(() => {
      const extraContent = isFunction(props.extra) ? props.extra(props.file) : props.extra;
      return extraContent
        ? h('span', { class: `${props.prefixCls}-list-item-extra` }, [extraContent as VNodeChild])
        : null;
    });

    const listItemNameClass = `${props.prefixCls}-list-item-name`;

    const onPreviewKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        props.onPreview(props.file, e);
      }
    };

    const fileName = computed<VNodeChild>(() => {
      const file = props.file;
      if (file.url) {
        const linkProps =
          typeof file.linkProps === 'string'
            ? (JSON.parse(file.linkProps) as Record<string, unknown>)
            : (file.linkProps as Record<string, unknown> | undefined);
        return h(
          'a',
          {
            target: '_blank',
            rel: 'noopener noreferrer',
            class: listItemNameClass,
            title: file.name,
            ...linkProps,
            href: file.url,
            onClick: (e: MouseEvent) => props.onPreview(file, e),
          },
          [file.name, extra.value],
        );
      }
      return h(
        'span',
        {
          role: 'button',
          tabindex: 0,
          class: listItemNameClass,
          onClick: (e: MouseEvent) => props.onPreview(file, e),
          onKeydown: onPreviewKeyDown,
          title: file.name,
        },
        [file.name, extra.value],
      );
    });

    const previewIcon = computed<VNodeChild>(() => {
      const show = isFunction(props.showPreviewIcon)
        ? props.showPreviewIcon(props.file)
        : props.showPreviewIcon;
      const file = props.file;
      if (!(show && (file.url || file.thumbUrl))) return null;
      return h(
        'a',
        {
          href: file.url || file.thumbUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          onClick: (e: MouseEvent) => props.onPreview(file, e),
          title: props.locale.previewFile,
          'aria-label': props.locale.previewFile || undefined,
        },
        [
          isFunction(props.previewIcon)
            ? props.previewIcon(file)
            : ((props.previewIcon || h(EyeOutlined)) as VNodeChild),
        ] as never,
      );
    });

    const pictureCardActions = computed<VNodeChild>(() => {
      if (
        !(props.listType === 'picture-card' || props.listType === 'picture-circle') ||
        mergedStatus.value === 'uploading'
      ) {
        return null;
      }
      return h('span', { class: `${props.prefixCls}-list-item-actions` }, [
        previewIcon.value,
        mergedStatus.value === 'done' ? downloadIcon.value : null,
        removeIcon.value,
      ]);
    });

    const dom = computed<VNodeChild>(() => {
      return h('div', { class: listItemClassName.value, style: props.styles?.item }, [
        icon.value,
        fileName.value,
        downloadOrDelete.value,
        pictureCardActions.value,
        showProgress.value
          ? h(
              CSSMotion,
              {
                motionName: `${props.rootPrefixCls}-fade`,
                visible: mergedStatus.value === 'uploading',
                motionDeadline: 2000,
                supportMotion: true,
              },
              {
                default: (motion: { className: string }) => {
                  // show loading icon if upload progress listener is disabled
                  const loadingProgress =
                    'percent' in props.file
                      ? h(MiniProgress, {
                          percent: props.file.percent,
                          'aria-label': props.file['aria-label'],
                          'aria-labelledby': props.file['aria-labelledby'],
                          ...props.progress,
                        } as never)
                      : null;
                  return h(
                    'div',
                    {
                      class: [`${props.prefixCls}-list-item-progress`, motion.className],
                    },
                    [loadingProgress],
                  );
                },
              },
            )
          : null,
      ]);
    });

    // P2（tooltip 未落地）：antd 用 Tooltip 包 error 项，但 Tooltip 的 SSR 产物就是
    // 裸 children（popup 运行时才挂）—— DOM 契约上与裸渲染一致。error 提示文本
    // 等 tooltip 落地后接入（analysis §4 P2，D 登记）。
    const item = computed<VNodeChild>(() => dom.value);

    return () => {
      const file = props.file;
      const itemRender = props.itemRender;
      return h(
        'div',
        {
          class: [`${props.prefixCls}-list-item-container`, props.className],
          style: props.style ?? undefined,
        },
        [
          itemRender
            ? itemRender(item.value, file, props.items, {
                download: props.onDownload.bind(null, file),
                preview: props.onPreview.bind(null, file),
                remove: props.onClose.bind(null, file),
              })
            : item.value,
        ],
      );
    };
  },
});
