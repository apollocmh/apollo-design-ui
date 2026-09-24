/**
 * Upload —— antd `es/upload/Upload.js` 的 Vue 等价物（431 行）。
 *
 * 判据（analysis §2）：fileList 受控/非受控 + maxCount 裁剪协议；
 * beforeUpload 的 false / LIST_IGNORE / 替换三态；batchStart 逐个触发
 * onChange（React18 flushSync 语义在 Vue 侧天然同步等价，D 登记 P3）；
 * 删除可被 onRemove 阻止且 abort 请求；受控模式自动补 uid；drag 态
 * -drag-uploading/-drag-hover；picture-card/circle 的上传按钮跟随
 * children 可见性动效。
 */

import { useLocale } from '@apollo-design/locale';
import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  shallowRef,
  type VNode as VNodeLike,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { AjaxUploader, type RcFile } from './engine/AjaxUploader';
import type {
  ShowUploadListInterface,
  UploadChangeParam,
  UploadFile,
  UploadListType,
  UploadLocale,
  UploadProps,
  UploadSemanticType,
  UploadType,
  VNodeChild,
} from './interface';
import { UploadList } from './UploadList';
import { file2Obj, getFileItem, removeFileItem, updateFileList } from './utils';

export const LIST_IGNORE = `__LIST_IGNORE_${Date.now()}__`;

type CSSStyleLike = Record<string, string | number>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

export const UploadComponent = defineComponent({
  name: 'AUpload',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSStyleLike>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<UploadProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<UploadProps['styles']>, default: undefined },
    type: { type: String as PropType<UploadType>, default: 'select' as UploadType },
    name: { type: String, default: undefined },
    defaultFileList: { type: Array as PropType<UploadFile[]>, default: undefined },
    fileList: { type: Array as PropType<UploadFile[]>, default: undefined },
    action: {
      type: [String, Function] as PropType<UploadProps['action']>,
      default: '',
    },
    directory: { type: Boolean, default: undefined },
    data: { type: [Object, Function] as PropType<UploadProps['data']>, default: () => ({}) },
    method: { type: String as PropType<UploadProps['method']>, default: undefined },
    headers: { type: Object as PropType<Record<string, string>>, default: undefined },
    showUploadList: {
      type: [Boolean, Object] as PropType<boolean | ShowUploadListInterface>,
      default: true,
    },
    multiple: { type: Boolean, default: false },
    accept: { type: [String, Object] as PropType<UploadProps['accept']>, default: undefined },
    beforeUpload: { type: Function as PropType<UploadProps['beforeUpload']>, default: undefined },
    listType: { type: String as PropType<UploadListType>, default: 'text' as UploadListType },
    onPreview: { type: Function as PropType<UploadProps['onPreview']>, default: undefined },
    onDownload: { type: Function as PropType<UploadProps['onDownload']>, default: undefined },
    onRemove: { type: Function as PropType<UploadProps['onRemove']>, default: undefined },
    supportServerRender: { type: Boolean, default: true },
    disabled: { type: Boolean, default: undefined },
    customRequest: { type: Function as PropType<UploadProps['customRequest']>, default: undefined },
    withCredentials: { type: Boolean, default: undefined },
    openFileDialogOnClick: { type: Boolean, default: undefined },
    locale: { type: Object as PropType<UploadLocale>, default: undefined },
    id: { type: String, default: undefined },
    previewFile: { type: Function as PropType<UploadProps['previewFile']>, default: undefined },
    iconRender: { type: Function as PropType<UploadProps['iconRender']>, default: undefined },
    isImageUrl: { type: Function as PropType<UploadProps['isImageUrl']>, default: undefined },
    progress: { type: Object as PropType<UploadProps['progress']>, default: undefined },
    itemRender: { type: Function as PropType<UploadProps['itemRender']>, default: undefined },
    maxCount: { type: Number, default: undefined },
    capture: {
      type: [String, Boolean] as PropType<string | 'user' | 'environment' | boolean | null>,
      default: undefined,
    },
    hasControlInside: { type: Boolean, default: true },
    pastable: { type: Boolean, default: undefined },
  },
  emits: {
    'update:fileList': (_fileList: UploadFile[]) => true,
    change: (_info: UploadChangeParam) => true,
    drop: (_event: DragEvent) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
    // antd 6.6.4 的 Upload.js 全文无 devWarning 调用（grep 0 处），本侧同样不设
    const context = useComponentConfig('upload');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();

    const [contextLocale] = useLocale('Upload');

    const customDisabled = computed(() => props.disabled);
    const mergedDisabled = computed(() => customDisabled.value ?? contextDisabled.value);
    const customRequest = computed(() => props.customRequest ?? context.customRequest);
    const mergedProgress = computed(() => {
      const configProgress = (context as { progress?: UploadProps['progress'] }).progress;
      return configProgress || props.progress
        ? { ...configProgress, ...props.progress }
        : undefined;
    });
    const mergedAccept = computed(() => {
      const configAccept = (context as { accept?: UploadProps['accept'] }).accept;
      return props.accept ?? configAccept ?? '';
    });

    // ===================== fileList =====================
    const [internalFileList, setMergedFileList] = useControlledValue<UploadFile[]>({
      defaultValue: () => props.defaultFileList ?? ([] as UploadFile[]),
      getValue: () => props.fileList,
    });
    const mergedFileList = computed<UploadFile[]>(() => internalFileList.value ?? []);

    // Control mode will auto fill file uid if not provided
    watch(
      () => props.fileList,
      (fileList) => {
        const timestamp = Date.now();
        (fileList ?? []).forEach((file, index) => {
          if (!file.uid && !Object.isFrozen(file)) {
            file.uid = `__AUTO__${timestamp}_${index}__`;
          }
        });
      },
      { immediate: true },
    );

    const onInternalChange = (
      file: UploadFile,
      changedFileList: UploadFile[],
      event?: { percent: number },
    ): void => {
      let cloneList = [...changedFileList];
      let exceedMaxCount = false;
      // Cut to match count
      if (props.maxCount === 1) {
        cloneList = cloneList.slice(-1);
      } else if (props.maxCount) {
        exceedMaxCount = cloneList.length > props.maxCount;
        cloneList = cloneList.slice(0, props.maxCount);
      }
      setMergedFileList(cloneList);
      const changeInfo: UploadChangeParam = {
        file,
        fileList: cloneList,
      };
      if (event) {
        changeInfo.event = event;
      }
      if (
        !exceedMaxCount ||
        file.status === 'removed' ||
        // We should ignore event if current file is exceed `maxCount`
        cloneList.some((f) => f.uid === file.uid)
      ) {
        emit('update:fileList', cloneList);
        emit('change', changeInfo);
        props.onChange?.(changeInfo);
      }
    };

    const mergedBeforeUpload = async (file: RcFile, fileListArgs: RcFile[]): Promise<unknown> => {
      const beforeUpload = props.beforeUpload;
      let parsedFile: unknown = file;
      if (beforeUpload) {
        const result = await beforeUpload(file, fileListArgs);
        if (result === false) {
          return false;
        }
        // Hack for LIST_IGNORE, we add additional info to remove from the list
        delete (file as unknown as Record<string, unknown>)[LIST_IGNORE];
        if (result === LIST_IGNORE) {
          Object.defineProperty(file, LIST_IGNORE, {
            value: true,
            configurable: true,
          });
          return false;
        }
        if (isPlainObject(result)) {
          parsedFile = result;
        }
      }
      return parsedFile;
    };

    // ⚠️ parsedFile 可能为 null（beforeUpload=false / LIST_IGNORE 的项也在 batch 里，
    //    见 AjaxUploaderProps.onBatchStart 注释）——下面 `!info?.parsedFile` 的分支
    //    正是为它准备的。
    const onBatchStart = (
      batchFileInfoList: {
        file: RcFile;
        parsedFile: File | string | Blob | null;
      }[],
    ): void => {
      // Skip file which marked as `LIST_IGNORE`, these file will not add to file list
      const filteredFileInfoList = batchFileInfoList.filter(
        (info) => !(info.file as unknown as Record<string, unknown>)[LIST_IGNORE],
      );
      // Nothing to do since no file need upload
      if (!filteredFileInfoList.length) {
        return;
      }
      const objectFileList = filteredFileInfoList.map((info) => file2Obj(info.file));
      // Concat new files with prev files
      let newFileList = [...mergedFileList.value];
      objectFileList.forEach((fileObj) => {
        // Replace file if exist
        newFileList = updateFileList(fileObj, newFileList);
      });
      objectFileList.forEach((fileObj, index) => {
        // Repeat trigger `onChange` event for compatible
        let triggerFileObj: UploadFile = fileObj;
        const info = filteredFileInfoList[index];
        if (!info?.parsedFile) {
          // `beforeUpload` return false
          const { originFileObj } = fileObj;
          if (!originFileObj) {
            onInternalChange(fileObj, newFileList);
            return;
          }
          let clone: File | (Blob & { name?: string; uid?: string });
          try {
            clone = new File([originFileObj], originFileObj.name, {
              type: originFileObj.type,
            }) as File;
          } catch {
            clone = new Blob([originFileObj], {
              type: originFileObj.type,
            }) as Blob & { name?: string };
            clone.name = originFileObj.name;
          }
          (clone as File & { uid?: string }).uid = fileObj.uid;
          triggerFileObj = clone as unknown as UploadFile;
        } else {
          // Inject `uploading` status
          fileObj.status = 'uploading';
        }
        onInternalChange(triggerFileObj, newFileList);
      });
    };

    const onSuccess = (response: unknown, file: RcFile, xhr: XMLHttpRequest): void => {
      let parsedResponse = response;
      try {
        if (typeof parsedResponse === 'string') {
          parsedResponse = JSON.parse(parsedResponse);
        }
      } catch {
        /* do nothing */
      }
      // removed
      if (!getFileItem(file as unknown as UploadFile, mergedFileList.value)) {
        return;
      }
      const targetItem = file2Obj(file);
      targetItem.status = 'done';
      targetItem.percent = 100;
      targetItem.response = parsedResponse;
      targetItem.xhr = xhr;
      const nextFileList = updateFileList(targetItem, mergedFileList.value);
      onInternalChange(targetItem, nextFileList);
    };

    const onProgress = (e: { percent?: number }, file: RcFile): void => {
      // removed
      if (!getFileItem(file as unknown as UploadFile, mergedFileList.value)) {
        return;
      }
      const targetItem = file2Obj(file);
      targetItem.status = 'uploading';
      targetItem.percent = e.percent;
      const nextFileList = updateFileList(targetItem, mergedFileList.value);
      onInternalChange(targetItem, nextFileList, { percent: e.percent ?? 0 });
    };

    const onError = (error: Error, response: unknown, file: RcFile): void => {
      // removed
      if (!getFileItem(file as unknown as UploadFile, mergedFileList.value)) {
        return;
      }
      const targetItem = file2Obj(file);
      targetItem.error = error;
      targetItem.response = response;
      targetItem.status = 'error';
      const nextFileList = updateFileList(targetItem, mergedFileList.value);
      onInternalChange(targetItem, nextFileList);
    };

    const handleRemove = (file: UploadFile): void => {
      Promise.resolve(props.onRemove?.(file)).then((ret) => {
        // Prevent removing file
        if (ret === false) {
          return;
        }
        const currentFileList = mergedFileList.value;
        const removedFileList = removeFileItem(file, currentFileList);
        if (removedFileList) {
          const currentFile: UploadFile = {
            ...file,
            status: 'removed',
          };
          currentFileList.forEach((item) => {
            const matchKey = currentFile.uid !== undefined ? 'uid' : 'name';
            if (item[matchKey] === currentFile[matchKey] && !Object.isFrozen(item)) {
              item.status = 'removed';
            }
          });
          uploadRef.value?.abort(currentFile);
          onInternalChange(currentFile, removedFileList);
        }
      });
    };

    const dragState = ref('drop');
    // ⚠️ `drop` 只走 emit —— **不要**再声明 `onDrop` prop 并调 `props.onDrop`：
    //    Vue 会把同一个 `onDrop` 既当 prop 又当 emit 监听器（emit 声明只影响
    //    attrs 剥离，不影响 prop 解析），于是回调被触发**两次**（PITFALL：
    //    prop + emit 同名双通道重复触发）。antd 的 onDrop 是 React props，
    //    在 Vue 里统一由 `@drop` / `:on-drop` 走 emit 通道承接（同 change）。
    const onFileDrop = (e: DragEvent): void => {
      dragState.value = e.type;
      if (e.type === 'drop') {
        emit('drop', e);
      }
    };

    const uploadRef = shallowRef<{ abort: (file?: unknown) => void } | null>(null);
    const wrapRef = ref<HTMLElement | null>(null);

    expose({
      onBatchStart,
      onSuccess,
      onProgress,
      onError,
      fileList: mergedFileList,
      upload: uploadRef,
      nativeElement: wrapRef,
    });

    // =========== Merged Props for Semantic ==========
    const mergedProps = computed(() => ({ ...props, disabled: mergedDisabled.value }));
    const contextTriggerStyle = semanticRootStyle(
      (context as { style?: CSSStyleLike }).style,
      'trigger',
    );
    const triggerStyle = semanticRootStyle(props.style, 'trigger');
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      UploadProps,
      NonNullable<UploadSemanticType['classNames']>,
      NonNullable<UploadSemanticType['styles']>
    >(
      [
        () => (context as { classNames?: UploadSemanticType['classNames'] }).classNames,
        () => props.classNames as UploadSemanticType['classNames'] | undefined,
      ],
      [
        () => (context as { styles?: UploadSemanticType['styles'] }).styles,
        () => contextTriggerStyle as UploadSemanticType['styles'] | undefined,
        () => props.styles as UploadSemanticType['styles'] | undefined,
        () => triggerStyle as UploadSemanticType['styles'] | undefined,
      ],
      mergedProps.value,
    );

    const rcUploadProps = computed(() => ({
      ...props,
      customRequest: customRequest.value,
      multiple: props.multiple,
      action: props.action,
      accept: mergedAccept.value,
      supportServerRender: props.supportServerRender,
      prefixCls: prefixCls.value,
      disabled: mergedDisabled.value,
      beforeUpload: mergedBeforeUpload,
      hasControlInside: props.hasControlInside,
      onBatchStart,
      onError,
      onProgress,
      onSuccess,
    }));

    const prefixCls = computed(() => getPrefixCls('upload', props.prefixCls));
    const wrapperCls = computed(() => `${prefixCls.value}-wrapper`);
    const rootCls = computed(() => [
      wrapperCls.value,
      props.className,
      props.rootClassName,
      (context as { className?: string }).className,
      mergedClassNames.value?.root,
      {
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
        [`${prefixCls.value}-picture-card-wrapper`]: props.listType === 'picture-card',
        [`${prefixCls.value}-picture-circle-wrapper`]: props.listType === 'picture-circle',
      },
    ]);
    const mergedRootStyle = computed(() => ({ ...mergedStyles.value?.root }));

    const showUploadListResolved = computed<ShowUploadListInterface | null>(() =>
      typeof props.showUploadList === 'boolean' || props.showUploadList === undefined
        ? null
        : (props.showUploadList as ShowUploadListInterface),
    );
    const showUploadListEnabled = computed(() => props.showUploadList !== false);

    const realShowRemoveIcon = computed(() => {
      const conf = showUploadListResolved.value;
      const showRemoveIcon = conf?.showRemoveIcon;
      // use showRemoveIcon if it is specified explicitly
      return typeof showRemoveIcon === 'undefined' ? !mergedDisabled.value : showRemoveIcon;
    });

    const renderUploadList = (button?: VNodeLike, buttonVisible?: boolean): VNodeChild => {
      if (!showUploadListEnabled.value) {
        return button;
      }
      return h(UploadList, {
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
        prefixCls: prefixCls.value,
        listType: props.listType,
        items: mergedFileList.value,
        previewFile: props.previewFile,
        onPreview: props.onPreview,
        onDownload: props.onDownload,
        onRemove: handleRemove,
        showRemoveIcon: realShowRemoveIcon.value as boolean,
        showPreviewIcon: showUploadListResolved.value?.showPreviewIcon ?? true,
        showDownloadIcon: showUploadListResolved.value?.showDownloadIcon ?? false,
        removeIcon: showUploadListResolved.value?.removeIcon,
        previewIcon: showUploadListResolved.value?.previewIcon,
        downloadIcon: showUploadListResolved.value?.downloadIcon,
        iconRender: props.iconRender,
        extra: showUploadListResolved.value?.extra,
        locale: {
          ...contextLocale,
          ...props.locale,
        } as UploadLocale,
        isImageUrl: props.isImageUrl,
        progress: mergedProgress.value,
        appendAction: button,
        appendActionVisible: buttonVisible,
        itemRender: props.itemRender,
        disabled: mergedDisabled.value,
      } as never);
    };

    return () => {
      const p = prefixCls.value;
      const children = slots.default?.();

      // ======================== Render ========================
      if (props.type === 'drag') {
        const dragCls = [
          p,
          `${p}-drag`,
          {
            [`${p}-drag-uploading`]: mergedFileList.value.some(
              (file) => file.status === 'uploading',
            ),
            [`${p}-drag-hover`]: dragState.value === 'dragover',
            [`${p}-disabled`]: mergedDisabled.value,
            [`${p}-rtl`]: direction.value === 'rtl',
          },
          mergedClassNames.value?.trigger,
        ];
        return h('span', { class: rootCls.value, ref: wrapRef, style: mergedRootStyle.value }, [
          h(
            'div',
            {
              class: dragCls,
              style: mergedStyles.value?.trigger,
              onDrop: onFileDrop,
              onDragover: onFileDrop,
              onDragleave: onFileDrop,
            },
            [
              h(
                AjaxUploader,
                {
                  ...(rcUploadProps.value as Record<string, unknown>),
                  ...(attrs as Record<string, unknown>),
                  ref: uploadRef as never,
                  className: `${p}-btn`,
                } as never,
                {
                  default: () => [h('div', { class: `${p}-drag-container` }, children)],
                },
              ),
            ],
          ),
          renderUploadList() as never,
        ]);
      }
      const uploadBtnCls = [
        p,
        `${p}-select`,
        {
          [`${p}-disabled`]: mergedDisabled.value,
          [`${p}-hidden`]: !children,
        },
        mergedClassNames.value?.trigger,
      ];
      const uploadButton = h('div', { class: uploadBtnCls, style: mergedStyles.value?.trigger }, [
        // ⚠️ 触发区内容必须作为 **slot** 传给 AjaxUploader：antd 里走的是
        //    `RcUpload` 的 `props.children`（`{...props}` 里带着 children），
        //    Vue 的等价物是 default slot —— 少了这一步，默认/ picture-card
        //    形态的触发区就是**空的**（子节点整体丢失）。
        //    ⚠️ L4 抓不到：DOM 契约只比对元素节点，纯文本子节点不在契约里
        //    （baseline 的 children 都是字符串）⇒ 只能靠 L6 视觉层发现。
        h(
          AjaxUploader,
          {
            ...(rcUploadProps.value as Record<string, unknown>),
            ...(attrs as Record<string, unknown>),
            ref: uploadRef as never,
          } as never,
          { default: () => children },
        ),
      ]);
      if (props.listType === 'picture-card' || props.listType === 'picture-circle') {
        return h('span', { class: rootCls.value, ref: wrapRef, style: mergedRootStyle.value }, [
          renderUploadList(uploadButton, !!children) as never,
        ]);
      }
      return h('span', { class: rootCls.value, ref: wrapRef, style: mergedRootStyle.value }, [
        uploadButton as never,
        renderUploadList() as never,
      ]);
    };
  },
});
