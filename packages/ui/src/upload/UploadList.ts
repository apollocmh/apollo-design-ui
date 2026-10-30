/**
 * UploadList —— antd `es/upload/UploadList/index.js` 的 Vue 等价物（209 行）。
 *
 * 判据：容器 `.{p}-list .{p}-list-{listType}`；picture 族异步生成 thumbUrl
 * （previewImage，需 originFileObj 为 File/Blob 且无 thumbUrl）；图标渲染
 * （text ⇒ PaperClip/Loading；picture ⇒ Picture/File；picture-card/circle
 * uploading ⇒ locale.uploading 文本）；操作按钮走 Button text+small；
 * 列表动效：非 picture 族用 collapse motion（高度），picture 族无位移动效，
 * motionName `{p}-animate` / `{p}-animate-inline`，deadline 2000；
 * appendAction（上传按钮）跟随 appendActionVisible 动效且
 * pointerEvents 在动画期间禁用。
 */

import {
  FileOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  PictureOutlined,
} from '@apollo-design/icons';
import { CSSMotion, initCollapseMotion, MotionList } from '@apollo-design/motion';
import {
  cloneVNode,
  defineComponent,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue';
import { Button } from '../button';
import type {
  ItemRender,
  UploadFile,
  UploadListProgressProps,
  UploadListType,
  UploadLocale,
  UploadSemanticType,
  VNodeChild,
} from './interface';
import { ListItem } from './UploadList/ListItem';
import { isImageUrl as defaultIsImageUrl, previewImage as defaultPreviewImage } from './utils';

type CSSStyleLike = Record<string, string | number>;

export const UploadList = defineComponent({
  name: 'AUploadList',
  props: {
    listType: { type: String as PropType<UploadListType>, default: 'text' as UploadListType },
    previewFile: {
      type: Function as PropType<(file: File | Blob) => PromiseLike<string>>,
      default: undefined,
    },
    onPreview: { type: Function as PropType<(file: UploadFile) => void>, default: undefined },
    onDownload: { type: Function as PropType<(file: UploadFile) => void>, default: undefined },
    onRemove: {
      type: Function as PropType<(file: UploadFile) => void | Promise<void>>,
      default: undefined,
    },
    locale: { type: Object as PropType<UploadLocale>, required: true },
    // 内部：由 Upload 的 scoped slot 包装而来（#iconRender）
    iconRender: {
      type: Function as PropType<(file: UploadFile, listType?: UploadListType) => VNodeChild>,
      default: undefined,
    },
    isImageUrl: {
      type: Function as PropType<(file: UploadFile) => boolean>,
      default: undefined,
    },
    prefixCls: { type: String, default: undefined },
    items: { type: Array as PropType<UploadFile[]>, default: () => [] },
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
    // 内部：由 Upload 的 scoped slot 包装而来（#removeIcon）
    removeIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    // 内部：由 Upload 的 scoped slot 包装而来（#previewIcon）
    previewIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    // 内部：由 Upload 的 scoped slot 包装而来（#downloadIcon）
    downloadIcon: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    // 内部：由 Upload 的 scoped slot 包装而来（#extra）
    extra: {
      type: null as unknown as PropType<VNodeChild | ((file: UploadFile) => VNodeChild)>,
      default: undefined,
    },
    progress: {
      type: Object as PropType<UploadListProgressProps>,
      default: (): UploadListProgressProps => ({ size: [-1, 2], showInfo: false }),
    },
    // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（#appendAction slot 或默认上传按钮）
    appendAction: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    appendActionVisible: { type: Boolean, default: true },
    itemRender: { type: Function as PropType<ItemRender>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<UploadSemanticType['classNames']>, default: undefined },
    styles: {
      type: Object as PropType<UploadSemanticType['styles']>,
      default: undefined,
    },
    rootPrefixCls: { type: String, default: 'apollo' },
  },
  setup(props) {
    const previewTick = ref(0);
    type Preview = {
      origin: File;
      handler: typeof props.previewFile;
      controller: AbortController;
      url?: string;
    };
    const previews = new Map<string, Preview>();
    let mounted = false;
    const updatePreviews = async (): Promise<void> => {
      if (!mounted) return;
      const tasks: Promise<void>[] = [];
      const current = new Set<string>();
      if (props.listType.startsWith('picture')) {
        for (const file of props.items) {
          const origin = file.originFileObj;
          if (!origin || file.thumbUrl !== undefined) continue;
          current.add(file.uid);
          const previous = previews.get(file.uid);
          if (previous?.origin === origin && previous.handler === props.previewFile) continue;
          previous?.controller.abort();
          const preview: Preview = {
            origin,
            handler: props.previewFile,
            controller: new AbortController(),
          };
          previews.set(file.uid, preview);
          const result = preview.handler
            ? preview.handler(origin)
            : defaultPreviewImage(origin, preview.controller.signal);
          tasks.push(
            Promise.resolve(result).then((url) => {
              if (!mounted || previews.get(file.uid) !== preview) return;
              preview.url = url;
              previewTick.value += 1;
            }),
          );
        }
      }
      for (const [key, preview] of previews) {
        if (!current.has(key)) {
          previews.delete(key);
          preview.controller.abort();
        }
      }
      await Promise.all(tasks);
    };
    watch(() => [props.listType, props.items, props.previewFile], updatePreviews, { deep: true });
    onMounted(() => {
      mounted = true;
      return updatePreviews();
    });
    onBeforeUnmount(() => {
      mounted = false;
      for (const preview of previews.values()) preview.controller.abort();
      previews.clear();
    });

    // ============================= Events =============================
    const onInternalPreview = (file: UploadFile, e?: Event): void => {
      if (!props.onPreview) {
        return;
      }
      e?.preventDefault();
      props.onPreview(file);
    };
    const onInternalDownload = (file: UploadFile): void => {
      if (props.onDownload) {
        props.onDownload(file);
      } else if (file.url) {
        window.open(file.url, '_blank', 'noopener');
      }
    };
    const onInternalClose = (file: UploadFile): void | Promise<void> => props.onRemove?.(file);

    const internalIconRender = (file: UploadFile): VNodeChild => {
      if (props.iconRender) {
        return props.iconRender(file, props.listType);
      }
      const isLoading = file.status === 'uploading';
      if (props.listType.startsWith('picture')) {
        const loadingIcon =
          props.listType === 'picture' ? h(LoadingOutlined) : props.locale.uploading;
        const fileIcon = (props.isImageUrl ?? defaultIsImageUrl)(file)
          ? h(PictureOutlined)
          : h(FileOutlined);
        return isLoading ? loadingIcon : fileIcon;
      }
      return isLoading ? h(LoadingOutlined) : h(PaperClipOutlined);
    };

    const actionIconRender = (
      customIcon: VNodeChild,
      callback: () => void | Promise<void>,
      prefixCls: string,
      title: string | undefined,
      acceptUploadDisabled: boolean,
    ): VNodeChild =>
      h(
        Button,
        {
          type: 'text',
          size: 'small',
          title,
          'aria-label': title,
          onClick: () => callback(),
          class: `${prefixCls}-list-item-action`,
          disabled: acceptUploadDisabled ? props.disabled : false,
        },
        { icon: () => customIcon },
      );

    // ============================== Render =============================
    return () => {
      void previewTick.value;
      const files = props.items.map((file) => {
        const preview = previews.get(file.uid);
        return file.thumbUrl === undefined && preview?.url !== undefined
          ? { ...file, thumbUrl: preview.url }
          : file;
      });
      const prefixCls = props.prefixCls ?? 'apollo-upload';
      const rootPrefixCls = props.rootPrefixCls;
      const listClassNames = [
        `${prefixCls}-list`,
        `${prefixCls}-list-${props.listType}`,
        props.classNames?.list,
      ];
      const collapsePreset = initCollapseMotion(rootPrefixCls);
      const isPictureCardOrCirle = ['picture-card', 'picture-circle'].includes(props.listType);
      // ⚠️ antd 把 initCollapseMotion 的 9 个 handler 直接摊进 motionConfig，
      //    因为 rc-motion 的 CSSMotion 收独立 prop（onAppearStart …）；
      //    本包 CSSMotion 的契约是**单个 `hooks` 对象**（css-motion.ts §2：
      //    handler 返回值有意义，不能用 emit）。若沿用摊平写法，Vue 会把
      //    onXxx 当成事件监听器 —— 组件根是 fragment 时既报
      //    "Extraneous non-emits event listeners" 警告，collapse 的高度
      //    测量也会静默失效（PITFALL: handler 静默丢弃）。
      const listItemMotion = isPictureCardOrCirle
        ? {}
        : {
            onAppearStart: collapsePreset.onAppearStart,
            onEnterStart: collapsePreset.onEnterStart,
            onAppearActive: collapsePreset.onAppearActive,
            onEnterActive: collapsePreset.onEnterActive,
            onLeaveStart: collapsePreset.onLeaveStart,
            onLeaveActive: collapsePreset.onLeaveActive,
            // onAppearEnd / onEnterEnd / onLeaveEnd 被 antd 显式 omit（用
            // motionDeadline 兜底），这里同样不传
          };
      const motionConfig = {
        hooks: listItemMotion,
        motionDeadline: 2000,
        motionName: `${prefixCls}-${isPictureCardOrCirle ? 'animate-inline' : 'animate'}`,
        keys: files.map((file) => ({
          key: file.uid,
          file,
        })),
        motionAppear: false,
      };

      // uid → file 查找表（MotionList 槽只回传 itemKey）
      const fileByUid = new Map<string, UploadFile>();
      for (const file of files) {
        fileByUid.set(file.uid, file);
      }

      const listNode = h('div', { class: listClassNames, style: props.styles?.list }, [
        h(
          MotionList,
          {
            ...motionConfig,
            component: false,
            supportMotion: true,
          },
          {
            default: (slot: { className: string; style: CSSStyleLike | null; itemKey: string }) => {
              const file = fileByUid.get(slot.itemKey);
              if (!file) return null;
              return h(ListItem, {
                key: slot.itemKey,
                locale: props.locale,
                prefixCls,
                rootPrefixCls,
                className: slot.className,
                style: slot.style,
                classNames: props.classNames,
                styles: props.styles,
                file,
                items: files,
                progress: props.progress,
                listType: props.listType,
                isImgUrl: props.isImageUrl ?? defaultIsImageUrl,
                showPreviewIcon: props.showPreviewIcon,
                showRemoveIcon: props.showRemoveIcon,
                showDownloadIcon: props.showDownloadIcon,
                removeIcon: props.removeIcon,
                previewIcon: props.previewIcon,
                downloadIcon: props.downloadIcon,
                extra: props.extra,
                iconRender: internalIconRender,
                actionIconRender,
                itemRender: props.itemRender,
                onPreview: onInternalPreview,
                onDownload: onInternalDownload,
                onClose: onInternalClose,
              });
            },
          },
        ),
        props.appendAction !== undefined && props.appendAction !== null
          ? h(
              CSSMotion,
              {
                ...motionConfig,
                visible: props.appendActionVisible,
                forceRender: true,
                supportMotion: true,
              },
              {
                default: (motion: { className: string; style: CSSStyleLike | null }) => {
                  const action = props.appendAction;
                  const motionProps = {
                    class: motion.className,
                    style: {
                      ...motion.style,
                      pointerEvents: motion.className ? 'none' : undefined,
                    },
                  };
                  return isVNode(action)
                    ? cloneVNode(action, motionProps)
                    : h('span', motionProps, [action]);
                },
              },
            )
          : null,
      ]);
      return listNode;
    };
  },
});
