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
import { defineComponent, h, type PropType, ref, type VNode as VNodeLike, watch } from 'vue';
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

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

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
      // biome-ignore lint/suspicious/noConfusingVoidType: `void | boolean` 是 antd 的公开契约 —— 语句体回调（不写 return）的推断返回类型是 void，换 undefined 会破坏用户代码
      type: Function as PropType<(file: UploadFile) => void | boolean>,
      default: undefined,
    },
    locale: { type: Object as PropType<UploadLocale>, required: true },
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
    progress: {
      type: Object as PropType<UploadListProgressProps>,
      default: () => ({ size: [-1, 2], showInfo: false }) as UploadListProgressProps,
    },
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
    // useForceUpdate：thumbUrl 异步生成后强制刷新
    const forceTick = ref(0);
    const isPictureCardOrCircle = ref(['picture-card', 'picture-circle'].includes(props.listType));
    watch(
      () => props.listType,
      (listType) => {
        isPictureCardOrCircle.value = ['picture-card', 'picture-circle'].includes(listType);
      },
    );

    // ============================= Effect =============================
    watch(
      () => [props.listType, props.items],
      () => {
        if (!props.listType.startsWith('picture')) {
          return;
        }
        (props.items ?? []).forEach((file) => {
          const origin = file.originFileObj as File | Blob | undefined;
          if (!(origin instanceof File || origin instanceof Blob) || file.thumbUrl !== undefined) {
            return;
          }
          file.thumbUrl = '';
          (props.previewFile ?? defaultPreviewImage)(origin).then((previewDataUrl) => {
            // Need append '' to avoid dead loop
            file.thumbUrl = previewDataUrl || '';
            forceTick.value += 1;
          });
        });
      },
      { deep: true },
    );

    // ============================= Events =============================
    const onInternalPreview = (file: UploadFile, e?: Event): void => {
      if (!props.onPreview) {
        return;
      }
      e?.preventDefault();
      props.onPreview(file);
    };
    const onInternalDownload = (file: UploadFile): void => {
      if (isFunction(props.onDownload)) {
        props.onDownload(file);
      } else if (file.url) {
        window.open(file.url, '_blank', 'noopener');
      }
    };
    const onInternalClose = (file: UploadFile): void => {
      props.onRemove?.(file);
    };

    const internalIconRender = (file: UploadFile): VNodeChild => {
      if (props.iconRender) {
        return props.iconRender(file, props.listType);
      }
      const isLoading = file.status === 'uploading';
      if (props.listType.startsWith('picture')) {
        const loadingIcon =
          props.listType === 'picture'
            ? h(LoadingOutlined)
            : (props.locale.uploading as VNodeChild);
        const fileIcon = (props.isImageUrl ?? defaultIsImageUrl)(file)
          ? h(PictureOutlined)
          : h(FileOutlined);
        return isLoading ? loadingIcon : fileIcon;
      }
      return isLoading ? h(LoadingOutlined) : h(PaperClipOutlined);
    };

    const actionIconRender = (
      customIcon: VNodeChild,
      callback: () => void,
      prefixCls: string,
      title: string | undefined,
      acceptUploadDisabled: boolean,
    ): VNodeChild => {
      const isVNodeIcon = customIcon !== null && typeof customIcon === 'object';
      return h(
        Button,
        {
          type: 'text',
          size: 'small',
          title,
          'aria-label': title || undefined,
          onClick: (e: MouseEvent) => {
            callback();
            const node = customIcon as { props?: { onClick?: (ev: MouseEvent) => void } };
            node?.props?.onClick?.(e);
          },
          class: `${prefixCls}-list-item-action`,
          disabled: acceptUploadDisabled ? props.disabled : false,
          // antd：icon 是有效元素时走 icon prop（得到 -icon-only 类 + -btn-icon 包裹），
          // 否则包 <span> 作 children
          ...(isVNodeIcon ? { icon: customIcon } : {}),
        } as never,
        isVNodeIcon ? undefined : { default: () => [h('span', customIcon as never)] },
      );
    };

    // ============================== Render =============================
    return () => {
      void forceTick.value; // 依赖收集：thumbUrl 异步生成后重渲染
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
        keys: (props.items ?? []).map((file) => ({
          key: file.uid,
          file,
        })),
        motionAppear: false,
      };

      // uid → file 查找表（MotionList 槽只回传 itemKey）
      const fileByUid = new Map<string, UploadFile>();
      for (const file of props.items ?? []) {
        fileByUid.set(file.uid, file);
      }

      const listNode = h('div', { class: listClassNames, style: props.styles?.list }, [
        h(
          MotionList,
          {
            ...motionConfig,
            component: null,
            supportMotion: true,
          } as never,
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
                items: props.items ?? [],
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
              } as never);
            },
          },
        ),
        props.appendAction
          ? h(
              CSSMotion,
              {
                ...motionConfig,
                visible: props.appendActionVisible,
                forceRender: true,
                supportMotion: true,
              } as never,
              {
                default: (motion: { className: string; style: CSSStyleLike | null }) => {
                  // cloneElement 等价：重建 appendAction vnode，把 motion 类名/样式并进根
                  const vnode = props.appendAction as VNodeLike;
                  const originProps = (vnode.props ?? {}) as {
                    class?: unknown;
                    style?: CSSStyleLike;
                  };
                  return h(
                    vnode.type as never,
                    {
                      ...originProps,
                      class: [originProps.class, motion.className],
                      style: {
                        ...motion.style,
                        // prevent the element has hover css pseudo-class that may cause animation to end prematurely.
                        pointerEvents: motion.className ? 'none' : undefined,
                        ...originProps.style,
                      },
                    },
                    vnode.children as never,
                  );
                },
              },
            )
          : null,
      ]);
      return listNode;
    };
  },
});
