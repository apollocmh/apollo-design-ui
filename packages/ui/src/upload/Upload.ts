import { useLocale } from '@apollo-design/locale';
import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { AjaxUploader, type AjaxUploaderRef, type RcFile } from './engine/AjaxUploader';
import type {
  ShowUploadListInterface,
  UploadChangeParam,
  UploadConfig,
  UploadFile,
  UploadListType,
  UploadLocale,
  UploadProps,
  UploadSemanticType,
  UploadSlots,
  UploadType,
  VNodeChild,
} from './interface';
import { UploadList } from './UploadList';
import { useUploadTheme } from './use-upload-theme';
import { file2Obj, getFileItem, removeFileItem, updateFileList } from './utils';

export { LIST_IGNORE } from './constants';

export const uploadProps = {
  prefixCls: { type: String, default: undefined },
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
  headers: { type: Object as PropType<UploadProps['headers']>, default: undefined },
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
  disabled: { type: Boolean, default: undefined },
  customRequest: { type: Function as PropType<UploadProps['customRequest']>, default: undefined },
  withCredentials: { type: Boolean, default: undefined },
  openFileDialogOnClick: { type: Boolean, default: undefined },
  locale: { type: Object as PropType<UploadLocale>, default: undefined },
  id: { type: String, default: undefined },
  previewFile: { type: Function as PropType<UploadProps['previewFile']>, default: undefined },
  isImageUrl: { type: Function as PropType<UploadProps['isImageUrl']>, default: undefined },
  progress: { type: Object as PropType<UploadProps['progress']>, default: undefined },
  maxCount: { type: Number, default: undefined },
  capture: {
    type: [String, Boolean] as PropType<string | 'user' | 'environment' | boolean | null>,
    default: undefined,
  },
  hasControlInside: { type: Boolean, default: true },
  pastable: { type: Boolean, default: undefined },
};

export const uploadEmits = {
  'update:fileList': (_fileList: UploadFile[]) => true,
  change: (_info: UploadChangeParam) => true,
  drop: (_event: DragEvent) => true,
};

export const UploadComponent = defineComponent({
  name: 'AUpload',
  inheritAttrs: false,
  expose: [
    'nativeElement',
    'fileList',
    'upload',
    'onBatchStart',
    'onSuccess',
    'onProgress',
    'onError',
  ],
  props: uploadProps,
  emits: uploadEmits,
  slots: Object as SlotsType<UploadSlots>,
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<UploadConfig>('upload');
    let mounted = true;
    onBeforeUnmount(() => {
      mounted = false;
    });
    const direction = useDirection();
    const contextDisabled = useDisabled();

    const [contextLocale] = useLocale('Upload');

    const customDisabled = computed(() => props.disabled);
    const mergedDisabled = computed(() => customDisabled.value ?? contextDisabled.value);
    const customRequest = computed(() => props.customRequest ?? context.customRequest);
    const mergedProgress = computed(() => {
      const configProgress = context.progress;
      return configProgress || props.progress
        ? { ...configProgress, ...props.progress }
        : undefined;
    });
    const mergedAccept = computed(() => {
      const configAccept = context.accept;
      return props.accept ?? configAccept ?? '';
    });

    // ===================== fileList =====================
    const [internalFileList, setMergedFileList] = useControlledValue<UploadFile[]>({
      defaultValue: () => props.defaultFileList ?? [],
      getValue: () => props.fileList,
    });
    const mergedFileList = computed<UploadFile[]>(() => internalFileList.value ?? []);

    const onInternalChange = (
      file: UploadFile,
      changedFileList: UploadFile[],
      event?: { percent: number },
    ): void => {
      let cloneList = [...changedFileList];
      let exceedMaxCount = false;
      // Cut to match count
      if (props.maxCount === 1) {
        exceedMaxCount = cloneList.length > 1;
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
      }
    };

    const onBatchStart = (current: { file: RcFile; parsedFile: File | null }[]): void => {
      if (!mounted) return;
      if (current.length === 0) return;
      const files = current.map(({ file, parsedFile }) => ({
        ...file2Obj(file),
        ...(parsedFile ? { status: 'uploading' as const } : {}),
      }));
      let next = [...mergedFileList.value];
      for (const file of files) next = updateFileList(file, next);
      const retained =
        props.maxCount === 1
          ? next.slice(-1)
          : props.maxCount
            ? next.slice(0, props.maxCount)
            : next;
      for (const file of files) {
        if (!retained.some((item) => item.uid === file.uid)) uploadRef.value?.abort(file.uid);
      }
      for (const file of files) onInternalChange(file, next);
    };

    const onSuccess = (response: unknown, file: RcFile, xhr?: XMLHttpRequest): void => {
      if (!mounted) return;
      const current = getFileItem<UploadFile>(file, mergedFileList.value);
      if (!current) return;
      const parseResponse = (): unknown => {
        if (typeof response !== 'string') return response;
        try {
          return JSON.parse(response);
        } catch {
          return response;
        }
      };
      const target: UploadFile = {
        ...current,
        status: 'done',
        percent: 100,
        response: parseResponse(),
        xhr,
      };
      onInternalChange(target, updateFileList(target, mergedFileList.value));
    };
    const onProgress = (event: { percent?: number }, file: RcFile): void => {
      if (!mounted) return;
      const current = getFileItem<UploadFile>(file, mergedFileList.value);
      if (!current) return;
      const target: UploadFile = { ...current, status: 'uploading', percent: event.percent };
      onInternalChange(target, updateFileList(target, mergedFileList.value), {
        percent: event.percent ?? 0,
      });
    };
    const onError = (error: unknown, response: unknown, file: RcFile): void => {
      if (!mounted) return;
      const current = getFileItem<UploadFile>(file, mergedFileList.value);
      if (!current) return;
      const target: UploadFile = { ...current, error, response, status: 'error' };
      onInternalChange(target, updateFileList(target, mergedFileList.value));
    };
    const removing = new Set<string>();
    const handleRemove = async (file: UploadFile): Promise<void> => {
      const original = getFileItem(file, mergedFileList.value);
      if (!original || removing.has(original.uid)) return;
      removing.add(original.uid);
      try {
        const decision = await props.onRemove?.(original);
        const current = getFileItem(original, mergedFileList.value);
        if (
          !mounted ||
          decision === false ||
          !current ||
          (current !== original &&
            (!original.originFileObj || current.originFileObj !== original.originFileObj))
        )
          return;
        const next = removeFileItem(current, mergedFileList.value);
        if (next) onInternalChange({ ...current, status: 'removed' }, next);
      } finally {
        removing.delete(original.uid);
      }
    };

    const dragState = ref('drop');
    // ⚠️ `drop` 只走 emit —— **不要**再声明 `onDrop` prop 并调 `props.onDrop`：
    //    Vue 会把同一个 `onDrop` 既当 prop 又当 emit 监听器（emit 声明只影响
    //    attrs 剥离，不影响 prop 解析），于是回调被触发**两次**（PITFALL：
    //    prop + emit 同名双通道重复触发）。antd 的 onDrop 是 React props，
    //    在 Vue 里统一由 `@drop` / `:on-drop` 走 emit 通道承接（同 change）。
    const onFileDrop = (e: DragEvent): void => {
      if (mergedDisabled.value) return;
      dragState.value = e.type;
      if (e.type === 'drop') {
        emit('drop', e);
      }
    };

    const uploadRef = shallowRef<AjaxUploaderRef | null>(null);
    watch(
      () =>
        mergedFileList.value.map((file) => ({ uid: file.uid, originFileObj: file.originFileObj })),
      (next, previous) => {
        for (const file of previous) {
          const current = next.find((item) => item.uid === file.uid);
          if (!current || (file.originFileObj && current.originFileObj !== file.originFileObj)) {
            uploadRef.value?.abort(file.uid);
          }
        }
      },
      { flush: 'sync' },
    );
    const wrapRef = ref<HTMLElement | null>(null);

    // =========== Merged Props for Semantic ==========
    const mergedProps = computed(() => ({ ...props, disabled: mergedDisabled.value }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      UploadProps,
      NonNullable<UploadSemanticType['classNames']>,
      NonNullable<UploadSemanticType['styles']>
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      // ⚠️ 传 **computed 本身**（不是 `.value`）：函数式变体每次重算都要看到当前
      //    props；传 setup 期快照会让后续 props 变化在函数式里不可见（Issue #26.3）。
      mergedProps,
    );

    const rcUploadProps = () => {
      const { class: _class, style: _style, ...triggerAttrs } = attrs;
      return {
        ...triggerAttrs,
        prefixCls: prefixCls.value,
        name: props.name,
        id: props.id,
        action: props.action,
        method: props.method,
        data: props.data,
        headers: props.headers,
        withCredentials: props.withCredentials,
        customRequest: customRequest.value,
        multiple: props.multiple,
        accept: mergedAccept.value,
        directory: props.directory,
        capture: props.capture,
        pastable: props.pastable,
        openFileDialogOnClick: props.openFileDialogOnClick,
        disabled: mergedDisabled.value,
        beforeUpload: props.beforeUpload,
        hasControlInside: props.hasControlInside,
        onBatchStart,
        onError,
        onProgress,
        onSuccess,
        ref: uploadRef,
      };
    };

    const prefixCls = computed(() => context.getPrefixCls('upload', props.prefixCls));
    const themeStyle = useUploadTheme(() => prefixCls.value);
    const wrapperCls = computed(() => `${prefixCls.value}-wrapper`);
    const rootCls = () => [
      wrapperCls.value,
      // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
      attrs.class,
      context.className,
      mergedClassNames.value?.root,
      {
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
        [`${prefixCls.value}-picture-card-wrapper`]: props.listType === 'picture-card',
        [`${prefixCls.value}-picture-circle-wrapper`]: props.listType === 'picture-circle',
      },
    ];
    const rootStyle = () => [themeStyle.value, mergedStyles.value?.root, attrs.style];

    const showUploadListResolved = computed<ShowUploadListInterface | null>(() =>
      typeof props.showUploadList === 'boolean' || props.showUploadList === undefined
        ? null
        : props.showUploadList,
    );
    const showUploadListEnabled = computed(() => props.showUploadList !== false);

    const realShowRemoveIcon = computed(() => {
      const conf = showUploadListResolved.value;
      const showRemoveIcon = conf?.showRemoveIcon;
      // use showRemoveIcon if it is specified explicitly
      return typeof showRemoveIcon === 'undefined' ? !mergedDisabled.value : showRemoveIcon;
    });

    const renderUploadList = (button?: VNodeChild, buttonVisible?: boolean): VNodeChild => {
      if (!showUploadListEnabled.value) {
        return button;
      }
      // API 架构修正（H2）：下列 VNodeChild/fn 渲染入口原本是 React 式 `ReactNode | fn`
      // prop，已改为 Upload 的 scoped slot（#iconRender / #itemRender / #removeIcon /
      // #previewIcon / #downloadIcon / #extra），由 Upload 主组件把 slot 内容包装成
      // fn 传给内部 UploadList（内部 fn prop 合法，见 interface.ts / UploadList.ts）。
      type ItemRenderActions = {
        download: () => void;
        preview: () => void;
        remove: () => void;
      };
      const iconRender = slots.iconRender
        ? (file: UploadFile, listType?: UploadListType) => slots.iconRender?.({ file, listType })
        : undefined;
      const itemRender = slots.itemRender
        ? (
            originNode: VNodeChild,
            file: UploadFile,
            fileList: UploadFile[],
            actions: ItemRenderActions,
          ) => slots.itemRender?.({ originNode, file, fileList, actions })
        : undefined;
      const removeIcon = slots.removeIcon
        ? (file: UploadFile) => slots.removeIcon?.({ file })
        : undefined;
      const previewIcon = slots.previewIcon
        ? (file: UploadFile) => slots.previewIcon?.({ file })
        : undefined;
      const downloadIcon = slots.downloadIcon
        ? (file: UploadFile) => slots.downloadIcon?.({ file })
        : undefined;
      const extra = slots.extra ? (file: UploadFile) => slots.extra?.({ file }) : undefined;
      // appendAction：#appendAction slot 优先，否则默认上传按钮（picture-card/circle 形态）。
      const resolvedAppendAction = button;
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
        showRemoveIcon: realShowRemoveIcon.value,
        showPreviewIcon: showUploadListResolved.value?.showPreviewIcon ?? true,
        showDownloadIcon: showUploadListResolved.value?.showDownloadIcon ?? false,
        removeIcon,
        previewIcon,
        downloadIcon,
        iconRender,
        extra,
        locale: {
          ...contextLocale.value,
          ...props.locale,
        },
        isImageUrl: props.isImageUrl,
        progress: mergedProgress.value,
        appendAction: resolvedAppendAction,
        appendActionVisible: buttonVisible,
        itemRender,
        disabled: mergedDisabled.value,
      });
    };

    const renderUpload = () => {
      const p = prefixCls.value;
      const children =
        (props.listType === 'picture-card' || props.listType === 'picture-circle') &&
        slots.appendAction
          ? slots.appendAction()
          : slots.default?.();

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
        return h('span', { class: rootCls(), ref: wrapRef, style: rootStyle() }, [
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
                  ...rcUploadProps(),
                  className: `${p}-btn`,
                },
                {
                  default: () => [h('div', { class: `${p}-drag-container` }, [children])],
                },
              ),
            ],
          ),
          renderUploadList(),
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
            ...rcUploadProps(),
          },
          { default: () => children },
        ),
      ]);
      if (props.listType === 'picture-card' || props.listType === 'picture-circle') {
        return h('span', { class: rootCls(), ref: wrapRef, style: rootStyle() }, [
          renderUploadList(uploadButton, children !== undefined),
        ]);
      }
      return h('span', { class: rootCls(), ref: wrapRef, style: rootStyle() }, [
        uploadButton,
        renderUploadList(),
      ]);
    };
    return {
      nativeElement: wrapRef,
      fileList: mergedFileList,
      upload: uploadRef,
      onBatchStart,
      onSuccess,
      onProgress,
      onError,
      renderUpload,
    };
  },
  render() {
    return this.renderUpload();
  },
});
