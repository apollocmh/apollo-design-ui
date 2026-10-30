/** Native file input, preprocessing and request ownership for Upload. */
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue';
import { LIST_IGNORE } from '../constants';
import type { UploadProps } from '../interface';
import attrAccept from './attr-accept';
import defaultRequest, {
  type UploadRequestOptionLike,
  type UploadRequestReturnLike,
} from './request';
import traverseFileTree from './traverse-file-tree';
import uid from './uid';

export type RcFile = File & { uid: string; lastModifiedDate?: Date };
export interface AcceptConfigLike {
  format: string;
  filter?: 'native' | ((file: RcFile) => boolean);
}
export interface AjaxUploaderRef {
  abort: (file?: { uid: string } | string) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  getInputRef: () => HTMLInputElement | null;
}

interface UploadTask {
  file: RcFile;
  request?: UploadRequestReturnLike;
}
interface ProcessedFile {
  task: UploadTask;
  parsedFile: RcFile | null;
  action?: string;
  data?: Record<string, unknown>;
  error?: unknown;
  failed?: boolean;
  ignored?: boolean;
}

export const AjaxUploader = defineComponent({
  name: 'AAjaxUploader',
  inheritAttrs: false,
  props: {
    component: { type: String, default: 'span' },
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    id: { type: String, default: undefined },
    name: { type: String, default: 'file' },
    multiple: { type: Boolean, default: false },
    accept: { type: [String, Object] as PropType<UploadProps['accept']>, default: undefined },
    capture: { type: [String, Boolean] as PropType<UploadProps['capture']>, default: undefined },
    directory: { type: Boolean, default: false },
    openFileDialogOnClick: { type: Boolean, default: true },
    hasControlInside: { type: Boolean, default: true },
    pastable: { type: Boolean, default: false },
    method: { type: String as PropType<UploadProps['method']>, default: 'post' },
    action: { type: [String, Function] as PropType<UploadProps['action']>, default: '' },
    data: { type: [Object, Function] as PropType<UploadProps['data']>, default: undefined },
    headers: { type: Object as PropType<UploadProps['headers']>, default: undefined },
    withCredentials: { type: Boolean, default: false },
    customRequest: { type: Function as PropType<UploadProps['customRequest']>, default: undefined },
    beforeUpload: { type: Function as PropType<UploadProps['beforeUpload']>, default: undefined },
    onBatchStart: {
      type: Function as PropType<(files: { file: RcFile; parsedFile: File | null }[]) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: unknown, response: unknown, file: RcFile) => void>,
      default: undefined,
    },
    onSuccess: {
      type: Function as PropType<(response: unknown, file: RcFile, xhr?: XMLHttpRequest) => void>,
      default: undefined,
    },
    onProgress: {
      type: Function as PropType<(event: { percent?: number }, file: RcFile) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots, expose }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    const inputKey = ref(uid());
    const tasks = new Map<string, UploadTask>();
    let mounted = false;
    let transferVersion = 0;
    const active = (task: UploadTask) => mounted && tasks.get(task.file.uid) === task;

    const filterFile = (file: RcFile, force = false): boolean => {
      const accept = props.accept;
      if (typeof accept === 'object' && accept.filter === 'native') return true;
      if (typeof accept === 'object' && typeof accept.filter === 'function')
        return accept.filter(file);
      const format = typeof accept === 'string' ? accept : accept?.format;
      return props.directory || force ? attrAccept(file, format) : true;
    };

    const processFile = async (task: UploadTask, files: RcFile[]): Promise<ProcessedFile> => {
      const file = task.file;
      let transformed: Awaited<ReturnType<NonNullable<UploadProps['beforeUpload']>>>;
      try {
        transformed = await props.beforeUpload?.(file, files);
      } catch {
        // A rejected validation hook has the same cancellation meaning as false.
        transformed = false;
      }
      if (transformed === LIST_IGNORE) return { task, parsedFile: null, ignored: true };
      if (transformed === false || !active(task)) return { task, parsedFile: null };
      const parsedFile =
        transformed instanceof File
          ? Object.assign(transformed, { uid: file.uid })
          : transformed instanceof Blob || typeof transformed === 'string'
            ? Object.assign(new File([transformed], file.name, { type: file.type }), {
                uid: file.uid,
              })
            : file;
      try {
        const action = typeof props.action === 'function' ? await props.action(file) : props.action;
        if (!active(task)) return { task, parsedFile: null };
        const data = typeof props.data === 'function' ? await props.data(file) : props.data;
        return { task, parsedFile, action, data };
      } catch (error) {
        return { task, parsedFile, failed: true, error };
      }
    };

    const post = ({ task, parsedFile, action, data, failed, error }: ProcessedFile): void => {
      if (!active(task) || !parsedFile) return;
      if (failed) {
        tasks.delete(task.file.uid);
        props.onError?.(error, undefined, task.file);
        return;
      }
      const option: UploadRequestOptionLike = {
        action: action ?? '',
        method: props.method ?? 'post',
        filename: props.name,
        data,
        file: parsedFile,
        headers: props.headers,
        withCredentials: props.withCredentials,
        onProgress: (event) => {
          if (active(task)) props.onProgress?.(event, task.file);
        },
        onSuccess: (response, xhr) => {
          if (!active(task)) return;
          tasks.delete(task.file.uid);
          props.onSuccess?.(response, task.file, xhr);
        },
        onError: (requestError, response) => {
          if (!active(task)) return;
          tasks.delete(task.file.uid);
          props.onError?.(requestError, response, task.file);
        },
      };
      try {
        const request = props.customRequest
          ? props.customRequest(option, { defaultRequest })
          : defaultRequest(option);
        // A custom implementation may finish synchronously before returning its abort handle.
        if (active(task) && request) task.request = request;
      } catch (requestError) {
        if (!active(task)) throw requestError;
        tasks.delete(task.file.uid);
        props.onError?.(requestError, undefined, task.file);
      }
    };

    const uploadFiles = async (files: File[]): Promise<void> => {
      if (!mounted || props.disabled) return;
      const originFiles = files.map((file) => Object.assign(file, { uid: uid() }));
      const batch = originFiles.map((file) => {
        const task: UploadTask = { file };
        tasks.set(file.uid, task);
        return task;
      });
      const processed = await Promise.all(batch.map((task) => processFile(task, originFiles)));
      const current = processed.filter(({ task, ignored }) => {
        if (ignored) tasks.delete(task.file.uid);
        return !ignored && active(task);
      });
      if (current.length === 0) return;
      props.onBatchStart?.(
        current.map(({ task, parsedFile }) => ({ file: task.file, parsedFile })),
      );
      // Let a parent's v-model acceptance reach the actual Upload instance before callbacks.
      await nextTick();
      for (const file of current) {
        if (file.parsedFile) post(file);
        else tasks.delete(file.task.file.uid);
      }
    };

    const abort = (file?: { uid: string } | string): void => {
      if (file !== undefined) {
        const key = typeof file === 'string' ? file : file.uid;
        const task = tasks.get(key);
        tasks.delete(key);
        task?.request?.abort();
      } else {
        transferVersion += 1;
        const pending = [...tasks.values()];
        tasks.clear();
        for (const task of pending) task.request?.abort();
      }
    };

    const onChange = (event: Event): Promise<void> => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return Promise.resolve();
      const files = [...(target.files ?? [])].filter((file) =>
        filterFile(Object.assign(file, { uid: '' })),
      );
      const upload = uploadFiles(props.multiple ? files : files.slice(0, 1));
      inputKey.value = uid();
      return upload;
    };
    const onClick = (): void => {
      if (!props.disabled && props.openFileDialogOnClick) inputRef.value?.click();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' '))
        return;
      event.preventDefault();
      onClick();
    };
    const onDataTransferFiles = async (
      transfer: DataTransfer,
      onFiles?: () => void,
    ): Promise<void> => {
      if (!mounted || props.disabled) return;
      const version = transferVersion;
      const items = [...(transfer.items ?? [])];
      const files = [...(transfer.files ?? [])];
      if (files.length || items.some((item) => item.kind === 'file')) onFiles?.();
      const accepted = props.directory
        ? await traverseFileTree(items, (file) => filterFile(Object.assign(file, { uid: '' })))
        : files.filter((file) => filterFile(Object.assign(file, { uid: '' }), true));
      if (!mounted || props.disabled || transferVersion !== version) return;
      await uploadFiles(props.multiple || props.directory ? accepted : accepted.slice(0, 1));
    };
    const onFilePaste = (event: ClipboardEvent): void => {
      if (props.pastable && !props.disabled && event.clipboardData) {
        void onDataTransferFiles(event.clipboardData, () => event.preventDefault());
      }
    };
    const onDrop = (event: DragEvent): Promise<void> | undefined => {
      event.preventDefault();
      return event.dataTransfer ? onDataTransferFiles(event.dataTransfer) : undefined;
    };
    onMounted(() => {
      mounted = true;
    });
    watch(
      () => props.pastable && !props.disabled,
      (enabled) => {
        if (typeof document === 'undefined') return;
        document.removeEventListener('paste', onFilePaste);
        if (enabled) document.addEventListener('paste', onFilePaste);
      },
      { immediate: true },
    );
    onBeforeUnmount(() => {
      mounted = false;
      abort();
      document.removeEventListener('paste', onFilePaste);
    });
    expose({ abort, uploadFiles, getInputRef: () => inputRef.value } satisfies AjaxUploaderRef);

    const events = computed(() =>
      props.disabled
        ? {}
        : {
            onClick,
            onKeydown: onKeyDown,
            onDrop,
            onDragover: (event: DragEvent) => event.preventDefault(),
          },
    );
    return () =>
      h(
        props.component,
        mergeProps(attrs, {
          ...events.value,
          class: [
            props.prefixCls,
            props.className,
            { [`${props.prefixCls}-disabled`]: props.disabled },
          ],
          role: props.hasControlInside ? undefined : 'button',
          tabindex: props.hasControlInside
            ? attrs.tabindex
            : props.disabled
              ? -1
              : (attrs.tabindex ?? 0),
          'aria-disabled': !props.hasControlInside && props.disabled ? true : undefined,
        }),
        [
          h('input', {
            key: inputKey.value,
            ref: inputRef,
            id: props.id,
            name: props.name,
            disabled: props.disabled,
            type: 'file',
            onClick: (event: MouseEvent) => event.stopPropagation(),
            onChange,
            style: { display: 'none' },
            accept: typeof props.accept === 'string' ? props.accept : props.accept?.format,
            ...(props.directory
              ? { directory: 'directory', webkitdirectory: 'webkitdirectory' }
              : {}),
            multiple: props.multiple,
            ...(props.capture !== undefined && props.capture !== null && props.capture !== false
              ? { capture: props.capture === true ? '' : props.capture }
              : {}),
          }),
          slots.default?.(),
        ],
      );
  },
});
