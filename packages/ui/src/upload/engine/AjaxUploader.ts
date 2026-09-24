/**
 * rc `AjaxUploader.js` 的 Vue 等价物 —— 上传引擎（隐藏 input + 触发入口）。
 *
 * 判据（analysis §2.1-3）：accept 双形态过滤；onChange 后重置 uid（同选同文件
 * 可再触发）；根 role=button + tabIndex=0（无内部控件时）；Enter 打开文件框；
 * BUTTON 内点击先 focus 父级再 blur 目标；input click stopPropagation
 * （issue 19948）；pastable 挂 document paste；directory 走 traverseFileTree。
 */

import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue';
import attrAccept from './attr-accept';
import defaultRequest, {
  type UploadRequestOptionLike,
  type UploadRequestReturnLike,
} from './request';
import traverseFileTree from './traverse-file-tree';
import uid from './uid';

export type RcFile = File & { uid: string };

export interface AcceptConfigLike {
  format: string;
  filter?: 'native' | ((file: RcFile) => boolean);
}

export interface AjaxUploaderProps {
  component?: string;
  prefixCls: string;
  className?: unknown;
  classNames?: { input?: string };
  styles?: { input?: CSSProperties };
  disabled?: boolean;
  id?: string;
  name?: string;
  style?: CSSProperties;
  multiple?: boolean;
  accept?: string | AcceptConfigLike;
  capture?: string | 'user' | 'environment' | boolean | null;
  directory?: boolean;
  openFileDialogOnClick?: boolean;
  hasControlInside?: boolean;
  pastable?: boolean;
  method?: string;
  action?: string | ((file: RcFile) => string | PromiseLike<string>);
  data?: Record<string, unknown> | ((file: RcFile) => Record<string, unknown>);
  headers?: Record<string, string>;
  withCredentials?: boolean;
  // biome-ignore lint/suspicious/noConfusingVoidType: rc 的契约就是「可返回 { abort } 或什么都不返回」—— 语句体 customRequest 的推断返回类型是 void，换 undefined 会破坏用户代码
  customRequest?: (option: UploadRequestOptionLike) => UploadRequestReturnLike | void;
  beforeUpload?: ((file: RcFile, fileList: RcFile[]) => unknown) | null;
  onStart?: (file: RcFile) => void;
  onError?: (error: Error, ret: unknown, file: RcFile) => void;
  onSuccess?: (response: unknown, file: RcFile, xhr: XMLHttpRequest) => void;
  onProgress?: (event: { percent?: number }, file: RcFile) => void;
  /**
   * ⚠️ `parsedFile` 可能是 **null** —— `beforeUpload` 返回 false / LIST_IGNORE 时
   * rc 依然把该项放进 batch（上层据此补发一次 onChange 但不进上传队列），
   * 只有 `post()` 前才过滤 null。类型必须带上 null，否则调用方会被迫断言。
   */
  onBatchStart?: (fileList: { file: RcFile; parsedFile: File | string | Blob | null }[]) => void;
  onClick?: ((event: MouseEvent | KeyboardEvent) => void) | null;
  onMouseEnter?: ((event: MouseEvent) => void) | null;
  onMouseLeave?: ((event: MouseEvent) => void) | null;
}

type CSSProperties = Record<string, string | number>;

export const AjaxUploader = defineComponent({
  name: 'AAjaxUploader',
  inheritAttrs: false,
  props: {
    component: { type: String, default: 'span' },
    prefixCls: { type: String, required: true },
    className: { type: null as unknown as PropType<unknown>, default: undefined },
    classNames: { type: Object as PropType<{ input?: string }>, default: undefined },
    styles: { type: Object as PropType<{ input?: CSSProperties }>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    id: { type: String, default: undefined },
    name: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    multiple: { type: Boolean, default: undefined },
    accept: { type: [String, Object] as PropType<string | AcceptConfigLike>, default: undefined },
    capture: {
      type: [String, Boolean] as PropType<string | 'user' | 'environment' | boolean | null>,
      default: undefined,
    },
    directory: { type: Boolean, default: undefined },
    openFileDialogOnClick: { type: Boolean, default: undefined },
    hasControlInside: { type: Boolean, default: undefined },
    pastable: { type: Boolean, default: undefined },
    method: { type: String, default: undefined },
    action: {
      type: [String, Function] as PropType<
        string | ((file: RcFile) => string | PromiseLike<string>)
      >,
      default: undefined,
    },
    data: {
      type: [Object, Function] as PropType<
        Record<string, unknown> | ((file: RcFile) => Record<string, unknown>)
      >,
      default: undefined,
    },
    headers: { type: Object as PropType<Record<string, string>>, default: undefined },
    withCredentials: { type: Boolean, default: undefined },
    customRequest: {
      type: Function as unknown as PropType<
        // biome-ignore lint/suspicious/noConfusingVoidType: 同上 —— rc 契约允许语句体回调返回 void
        (option: UploadRequestOptionLike) => UploadRequestReturnLike | void>,
      default: undefined,
    },
    beforeUpload: {
      type: Function as unknown as PropType<((file: RcFile, fileList: RcFile[]) => unknown) | null>,
      default: undefined,
    },
    onStart: { type: Function as PropType<(file: RcFile) => void>, default: undefined },
    onError: {
      type: Function as PropType<(error: Error, ret: unknown, file: RcFile) => void>,
      default: undefined,
    },
    onSuccess: {
      type: Function as PropType<(response: unknown, file: RcFile, xhr: XMLHttpRequest) => void>,
      default: undefined,
    },
    onProgress: {
      type: Function as PropType<(event: { percent?: number }, file: RcFile) => void>,
      default: undefined,
    },
    onBatchStart: {
      type: Function as PropType<
        (fileList: { file: RcFile; parsedFile: File | string | Blob | null }[]) => void
      >,
      default: undefined,
    },
    onClick: {
      type: Function as unknown as PropType<((event: MouseEvent | KeyboardEvent) => void) | null>,
      default: undefined,
    },
    onMouseEnter: {
      type: Function as unknown as PropType<((event: MouseEvent) => void) | null>,
      default: undefined,
    },
    onMouseLeave: {
      type: Function as unknown as PropType<((event: MouseEvent) => void) | null>,
      default: undefined,
    },
  },
  setup(props, { slots, expose }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const uidRef = ref(uid());
    // biome-ignore lint/suspicious/noConfusingVoidType: 值就是 customRequest 的返回值（可能为 void），与上面的契约类型保持一致
    const reqs: Record<string, UploadRequestReturnLike | void> = {};
    let isMountedFlag = false;

    const filterFile = (file: File, force = false): boolean => {
      let filterFn: ((file: RcFile) => boolean) | undefined;
      let acceptFormat: string | undefined;
      if (typeof props.accept === 'string') {
        acceptFormat = props.accept;
      } else {
        const { filter, format } = props.accept ?? ({} as AcceptConfigLike);
        acceptFormat = format;
        if (filter === 'native') {
          filterFn = () => true;
        } else {
          filterFn = filter;
        }
      }
      const mergedFilter =
        filterFn ??
        (props.directory || force
          ? (currentFile) => attrAccept(currentFile, acceptFormat)
          : () => true);
      return mergedFilter(file as RcFile);
    };

    const uploadFiles = (files: File[]): void => {
      const originFiles = [...files] as RcFile[];
      const postFiles = originFiles.map((file) => {
        file.uid = uid();
        return processFile(file, originFiles);
      });

      // Batch upload files
      // ⚠️ onBatchStart 收**全量**列表（含 beforeUpload=false 的 parsedFile=null 项，
      // 上层据此触发一次 onChange 而不进上传）；只有 post() 过滤 null。
      Promise.all(postFiles)
        .then((fileList) => {
          props.onBatchStart?.(
            fileList.map(({ origin, parsedFile }) => ({ file: origin, parsedFile })),
          );
          const readyList = fileList.filter(
            (file): file is typeof file & { parsedFile: File | string | Blob } =>
              file.parsedFile !== null,
          );
          readyList.forEach((file) => {
            post(file);
          });
        })
        .catch(() => {
          // 与 rc 同判：上传前阶段异常静默（processFile 已兜底 beforeUpload 抛错）
        });
    };

    /** Process file before upload. When all the file is ready, we start upload. */
    const processFile = async (
      file: RcFile,
      fileList: RcFile[],
    ): Promise<{
      origin: RcFile;
      data: Record<string, unknown> | undefined;
      parsedFile: File | string | Blob | null;
      action: string | undefined;
    }> => {
      let transformedFile: unknown = file;
      if (props.beforeUpload) {
        try {
          transformedFile = await props.beforeUpload(file, fileList);
        } catch {
          // Rejection will also trade as false
          transformedFile = false;
        }
        if (transformedFile === false) {
          return { origin: file, parsedFile: null, action: undefined, data: undefined };
        }
      }

      // Get latest action
      let mergedAction: string | undefined;
      if (typeof props.action === 'function') {
        mergedAction = await props.action(file);
      } else {
        mergedAction = props.action;
      }

      // Get latest data
      let mergedData: Record<string, unknown> | undefined;
      if (typeof props.data === 'function') {
        mergedData = await props.data(file);
      } else {
        mergedData = props.data;
      }
      const parsedData =
        (typeof transformedFile === 'object' || typeof transformedFile === 'string') &&
        transformedFile
          ? transformedFile
          : file;
      let parsedFile: File;
      if (parsedData instanceof File) {
        parsedFile = parsedData;
      } else {
        parsedFile = new File([parsedData as BlobPart], file.name, { type: file.type });
      }
      const mergedParsedFile = parsedFile as RcFile;
      mergedParsedFile.uid = file.uid;
      return { origin: file, data: mergedData, parsedFile: mergedParsedFile, action: mergedAction };
    };

    function post({
      data,
      origin,
      action,
      parsedFile,
    }: {
      data: Record<string, unknown> | undefined;
      origin: RcFile;
      action: string | undefined;
      parsedFile: File | string | Blob;
    }): void {
      if (!isMountedFlag) {
        return;
      }
      const { uid: fileUid } = origin;
      const request = props.customRequest || defaultRequest;
      const requestOption: UploadRequestOptionLike = {
        action: action ?? '',
        filename: props.name,
        data,
        file: parsedFile,
        headers: props.headers,
        withCredentials: props.withCredentials,
        method: props.method || 'post',
        onProgress: (e) => {
          props.onProgress?.(e, parsedFile as RcFile);
        },
        onSuccess: (ret, xhr) => {
          props.onSuccess?.(ret, parsedFile as RcFile, xhr as XMLHttpRequest);
          delete reqs[fileUid];
        },
        onError: (err, ret) => {
          props.onError?.(err as Error, ret, parsedFile as RcFile);
          delete reqs[fileUid];
        },
      };
      props.onStart?.(origin);
      reqs[fileUid] = request(requestOption);
    }

    const onChange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      const { files } = target;
      const acceptedFiles = [...(files ?? [])].filter((file) => filterFile(file));
      uploadFiles(acceptedFiles);
      reset();
    };

    const reset = (): void => {
      uidRef.value = uid();
    };

    const onClick = (event: MouseEvent | KeyboardEvent): void => {
      const el = inputRef.value;
      if (!el) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'BUTTON') {
        const parent = el.parentNode as HTMLElement | null;
        parent?.focus();
        target.blur();
      }
      el.click();
      props.onClick?.(event);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        onClick(e);
      }
    };

    const onDataTransferFiles = async (
      dataTransfer: DataTransfer,
      existFileCallback?: () => void,
    ): Promise<void> => {
      const items = [...(dataTransfer.items ?? [])];
      let files = [...(dataTransfer.files ?? [])];
      if (files.length > 0 || items.some((item) => item.kind === 'file')) {
        existFileCallback?.();
      }
      if (props.directory) {
        files = await traverseFileTree(items, (file) => filterFile(file));
        uploadFiles(files);
      } else {
        let acceptFiles = [...files].filter((file) => filterFile(file, true));
        if (props.multiple === false) {
          acceptFiles = files.slice(0, 1);
        }
        uploadFiles(acceptFiles);
      }
    };

    const onFilePaste = (e: ClipboardEvent): void => {
      if (!props.pastable) {
        return;
      }
      if (e.type === 'paste') {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;
        void onDataTransferFiles(clipboardData as unknown as DataTransfer, () => {
          e.preventDefault();
        });
      }
    };

    const onFileDragOver = (e: DragEvent): void => {
      e.preventDefault();
    };

    const onFileDrop = (e: DragEvent): void => {
      e.preventDefault();
      if (e.type === 'drop') {
        const dataTransfer = e.dataTransfer;
        if (!dataTransfer) return;
        void onDataTransferFiles(dataTransfer);
      }
    };

    const abort = (file?: RcFile | string): void => {
      if (file) {
        const fileUid = typeof file === 'string' ? file : file.uid;
        if (reqs[fileUid] && (reqs[fileUid] as UploadRequestReturnLike)?.abort) {
          (reqs[fileUid] as UploadRequestReturnLike).abort();
        }
        delete reqs[fileUid];
      } else {
        Object.keys(reqs).forEach((key) => {
          if (reqs[key] && (reqs[key] as UploadRequestReturnLike)?.abort) {
            (reqs[key] as UploadRequestReturnLike).abort();
          }
          delete reqs[key];
        });
      }
    };

    onMounted(() => {
      isMountedFlag = true;
      if (props.pastable) {
        document.addEventListener('paste', onFilePaste);
      }
    });
    onBeforeUnmount(() => {
      isMountedFlag = false;
      abort();
      document.removeEventListener('paste', onFilePaste);
    });
    watch(
      () => props.pastable,
      (pastable, prev) => {
        if (pastable && !prev) {
          document.addEventListener('paste', onFilePaste);
        } else if (!pastable && prev) {
          document.removeEventListener('paste', onFilePaste);
        }
      },
    );

    expose({
      abort,
      /** 测试面：直接注入文件（跳过 input 事件），与 antd ref.upload.uploadFiles 对齐 */
      uploadFiles,
      getInputRef: () => inputRef.value,
    });

    const events = computed(() => {
      if (props.disabled) {
        return {};
      }
      return {
        onClick: props.openFileDialogOnClick === false ? () => {} : onClick,
        onKeydown: props.openFileDialogOnClick === false ? () => {} : onKeyDown,
        onMouseenter: props.onMouseEnter ?? undefined,
        onMouseleave: props.onMouseLeave ?? undefined,
        onDrop: onFileDrop,
        onDragover: onFileDragOver,
        tabindex: props.hasControlInside ? undefined : '0',
      };
    });

    return () => {
      const Tag = props.component ?? 'span';
      const acceptFormat = typeof props.accept === 'string' ? props.accept : props.accept?.format;
      const cls = [
        props.prefixCls,
        {
          [`${props.prefixCls}-disabled`]: props.disabled,
          ...(typeof props.className === 'string' && props.className
            ? { [props.className]: true }
            : null),
        },
      ];
      // because input don't have directory/webkitdirectory type declaration
      const dirProps = props.directory
        ? { directory: 'directory', webkitdirectory: 'webkitdirectory' }
        : {};

      return h(
        Tag,
        {
          ...events.value,
          class: cls,
          role: props.hasControlInside ? undefined : 'button',
          style: props.style,
        },
        [
          h('input', {
            id: props.id,
            name: props.name,
            disabled: props.disabled,
            type: 'file',
            ref: inputRef,
            onClick: (e: MouseEvent) => e.stopPropagation(), // https://github.com/ant-design/ant-design/issues/19948
            key: uidRef.value,
            style: [{ display: 'none' }, props.styles?.input],
            class: props.classNames?.input,
            accept: acceptFormat,
            ...dirProps,
            multiple: props.multiple,
            onChange,
            ...(props.capture != null ? { capture: props.capture as string } : {}),
          }),
          slots.default?.(),
        ],
      );
    };
  },
});
