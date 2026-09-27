/**
 * Upload 的类型定义（G2 产物）。
 *
 * 从 antd 6.6.4 的 `es/upload/interface.d.ts` **重新定义**（H2，不复制）：
 * React 类型（ReactNode / CSSProperties / ImgHTMLAttributes）按 D42/C19 映射为
 * Vue-native（VNodeChild / Record<string, string|number>）；Progress 的
 * ProgressAriaProps / ProgressProps 子集内联（P1：progress 未落地，见 analysis
 * §4 —— progress 落地后改回 import）。
 */

import type { AcceptConfigLike, RcFile } from './engine/AjaxUploader';
import type { UploadRequestOptionLike, UploadRequestReturnLike } from './engine/request';

export type { AcceptConfigLike, RcFile };

/** ListItem 进度条用到的 Progress aria 子集（upload 只消费这两个键）。 */
export interface ProgressAriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** UploadListProgressProps = Omit<ProgressProps, 'percent' | 'type'> 的实际消费面。 */
export interface UploadListProgressProps extends ProgressAriaProps {
  strokeColor?: string | Record<string, string>;
  strokeWidth?: number | string;
  showInfo?: boolean;
  size?: number | [number, number] | 'small' | 'default';
}

export type UploadFileStatus = 'error' | 'done' | 'uploading' | 'removed';

export interface HttpRequestHeader {
  [key: string]: string;
}

export interface UploadFile<T = unknown> extends ProgressAriaProps {
  uid: string;
  size?: number;
  name: string;
  fileName?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  url?: string;
  status?: UploadFileStatus;
  percent?: number;
  thumbUrl?: string;
  crossOrigin?: string | 'anonymous' | 'use-credentials' | null;
  originFileObj?: RcFile;
  response?: T;
  error?: unknown;
  linkProps?: unknown;
  type?: string;
  xhr?: T;
  preview?: string;
  [key: string]: unknown;
}

export interface InternalUploadFile<T = unknown> extends UploadFile<T> {
  originFileObj: RcFile;
}

export interface UploadChangeParam<T = UploadFile> {
  file: T;
  fileList: T[];
  event?: {
    percent: number;
  };
}

// Vue 官方 VNodeChild（含 VNode / 数组 / 原始值）—— 自造并集会有 VNode 不可赋值问题
import type { VNodeChild } from 'vue';

export type { VNodeChild };

// ⚠️ API 架构修正（H2）：原 `extra` / `removeIcon` / `downloadIcon` / `previewIcon`
// 是 antd 的 React `ReactNode | fn` 透传——属 React 心智，已改为 Upload 的
// scoped slot（`#extra` / `#removeIcon` / `#downloadIcon` / `#previewIcon`，
// 均带 `{ file }`）。此处只保留纯 boolean 展示开关。
export interface ShowUploadListInterface<T = unknown> {
  showRemoveIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showPreviewIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showDownloadIcon?: boolean | ((file: UploadFile<T>) => boolean);
}

export interface UploadLocale {
  uploading?: string;
  removeFile?: string;
  downloadFile?: string;
  uploadError?: string;
  previewFile?: string;
}

export type UploadType = 'drag' | 'select';
export type UploadListType = 'text' | 'picture' | 'picture-card' | 'picture-circle';

export type ItemRender<T = unknown> = (
  originNode: VNodeChild,
  file: UploadFile<T>,
  fileList: UploadFile<T>[],
  actions: {
    download: () => void;
    preview: () => void;
    remove: () => void;
  },
) => VNodeChild;

export type PreviewFileHandler = (file: File | Blob) => PromiseLike<string>;
// biome-ignore lint/suspicious/noConfusingVoidType: antd 的 `BeforeUploadValueType` 逐字对齐（语句体 beforeUpload 的推断返回类型是 void，换 undefined 会破坏用户代码）
export type BeforeUploadValueType = void | boolean | string | Blob | File;

export type UploadSemanticType = {
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
    trigger?: string;
  };
  styles?: {
    root?: Record<string, string | number>;
    list?: Record<string, string | number>;
    item?: Record<string, string | number>;
    trigger?: Record<string, string | number>;
  };
};

export interface UploadProps<T = unknown> {
  type?: UploadType;
  name?: string;
  defaultFileList?: UploadFile<T>[];
  fileList?: UploadFile<T>[];
  action?: string | ((file: RcFile) => string) | ((file: RcFile) => PromiseLike<string>);
  directory?: boolean;
  data?:
    | Record<string, unknown>
    | ((file: UploadFile<T>) => Record<string, unknown> | Promise<Record<string, unknown>>);
  method?: 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';
  headers?: HttpRequestHeader;
  showUploadList?: boolean | ShowUploadListInterface<T>;
  multiple?: boolean;
  accept?: string | AcceptConfigLike;
  beforeUpload?: (
    file: RcFile,
    fileList: RcFile[],
  ) => BeforeUploadValueType | Promise<BeforeUploadValueType>;
  onChange?: (info: UploadChangeParam<UploadFile<T>>) => void;
  onDrop?: (event: DragEvent) => void;
  listType?: UploadListType;
  className?: string;
  classNames?:
    | UploadSemanticType['classNames']
    | ((info: { props: UploadProps<T> }) => UploadSemanticType['classNames']);
  styles?:
    | UploadSemanticType['styles']
    | ((info: { props: UploadProps<T> }) => UploadSemanticType['styles']);
  rootClassName?: string;
  onPreview?: (file: UploadFile<T>) => void;
  onDownload?: (file: UploadFile<T>) => void;
  // biome-ignore lint/suspicious/noConfusingVoidType: antd 逐字契约 —— 返回 void 视为「不否决」，语句体回调依赖它
  onRemove?: (file: UploadFile<T>) => void | boolean | Promise<void | boolean>;
  supportServerRender?: boolean;
  style?: Record<string, string | number>;
  disabled?: boolean;
  prefixCls?: string;
  customRequest?: (
    options: UploadRequestOptionLike,
    // biome-ignore lint/suspicious/noConfusingVoidType: antd 逐字契约 —— defaultRequest 允许返回 void（与 engine/AjaxUploader.ts 的 customRequest 同一契约）
    info: { defaultRequest: (option: UploadRequestOptionLike) => UploadRequestReturnLike | void },
    // biome-ignore lint/suspicious/noConfusingVoidType: antd 逐字契约 —— 语句体 customRequest 返回 void；换 undefined 会破坏用户代码
  ) => void | UploadRequestReturnLike;
  withCredentials?: boolean;
  openFileDialogOnClick?: boolean;
  locale?: UploadLocale;
  id?: string;
  previewFile?: PreviewFileHandler;
  isImageUrl?: (file: UploadFile<T>) => boolean;
  progress?: UploadListProgressProps;
  /** Config max count of `fileList`. Will replace current one when `maxCount` is 1 */
  maxCount?: number;
  /** 触发区内容（drag 容器 / select 按钮的子节点）—— 默认插槽 */
  children?: VNodeChild;
  capture?: string | 'user' | 'environment' | boolean | null;
  hasControlInside?: boolean;
  pastable?: boolean;
  styleAttrs?: Record<string, string | number>;
}

export interface UploadListProps<T = unknown> {
  classNames?: UploadSemanticType['classNames'];
  styles?: UploadSemanticType['styles'];
  listType?: UploadListType;
  onPreview?: (file: UploadFile<T>) => void;
  onDownload?: (file: UploadFile<T>) => void;
  onRemove?: // biome-ignore lint/suspicious/noConfusingVoidType: antd 逐字契约（同 UploadProps.onRemove）
  (file: UploadFile<T>) => void | boolean;
  items?: UploadFile<T>[];
  progress?: UploadListProgressProps;
  prefixCls?: string;
  className?: string;
  showRemoveIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showDownloadIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showPreviewIcon?: boolean | ((file: UploadFile<T>) => boolean);
  // 内部：由 Upload 的 scoped slot 包装而来的 fn（removeIcon/downloadIcon/previewIcon/extra）
  removeIcon?: VNodeChild | ((file: UploadFile<T>) => VNodeChild);
  downloadIcon?: VNodeChild | ((file: UploadFile<T>) => VNodeChild);
  previewIcon?: VNodeChild | ((file: UploadFile<T>) => VNodeChild);
  extra?: VNodeChild | ((file: UploadFile<T>) => VNodeChild);
  locale: UploadLocale;
  previewFile?: PreviewFileHandler;
  // 内部：由 Upload 的 scoped slot 包装而来（iconRender）
  iconRender?: (file: UploadFile<T>, listType?: UploadListType) => VNodeChild;
  isImageUrl?: (file: UploadFile<T>) => boolean;
  // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（appendAction）
  appendAction?: VNodeChild;
  appendActionVisible?: boolean;
  // 内部：由 Upload 的 scoped slot 包装而来（itemRender）
  itemRender?: ItemRender<T>;
  disabled?: boolean;
}
