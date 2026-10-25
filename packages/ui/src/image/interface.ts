/**
 * image 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/image/index.tsx`（ImageProps / PreviewConfig /
 * PlaceholderType / ImageSemanticType）+ rc-image 的 ImageProps 面。按本仓 Vue 化
 * 约定重新定义（H2）：classNames/styles 收窄为静态对象形态（函数式语义槽
 * PENDING，D36 同判）。
 */

import type { VNode, VNodeChild } from 'vue';

export type ImageStatus = 'normal' | 'loading' | 'error';

export type CoverPlacement = 'center' | 'top' | 'bottom';

/** antd 的 MaskType（preview.mask 的形态）。 */
export type MaskType =
  | boolean
  | {
      blur?: boolean;
      /** 其余 antd 的 mask 配置（v1 结构占位）。 */
      style?: Record<string, string | number>;
      className?: string;
    };

export type MaskNode = MaskType | VNodeChild;

/** Progress 的语义槽（antd Progress.tsx）。 */
export interface ProgressClassNames {
  root?: string;
  content?: string;
  rail?: string;
  indicator?: string;
}

export interface ProgressStyles {
  root?: Record<string, string | number>;
  content?: Record<string, string | number>;
  rail?: Record<string, string | number>;
  indicator?: Record<string, string | number>;
}

/** placeholder 的 progress 配置。 */
export interface ImageProgressConfig {
  percent?: number;
  render?: (progress: VNodeChild, percent: number) => VNodeChild;
}

export type PlaceholderType =
  | VNodeChild
  | {
      progress?: boolean | ImageProgressConfig;
    };

/** 预览的图标槽（antd PreviewGroup 的 icons）。 */
export interface PreviewIcons {
  rotateLeft?: VNodeChild;
  rotateRight?: VNodeChild;
  zoomIn?: VNodeChild;
  zoomOut?: VNodeChild;
  close?: VNodeChild;
  left?: VNodeChild;
  right?: VNodeChild;
  flipX?: VNodeChild;
  flipY?: VNodeChild;
}

/** 预览内容与行为配置；开合状态通过顶层Vue模型表达。 */
export interface PreviewConfig {
  src?: string;
  afterOpenChange?: (open: boolean) => void;
  /** 封面（hover 层）；`false` ⇒ 不渲染。 */
  cover?: MaskNode | { placement?: CoverPlacement; coverNode?: VNodeChild };
  mask?: MaskNode;
  maskClosable?: boolean;
  closable?: boolean;
  closeIcon?: VNodeChild;
  /** ⚠️ deprecated：用 `classNames.root`。 */
  rootClassName?: string;
  /** ⚠️ deprecated：用 `classNames.cover`。 */
  maskClassName?: string;
  /** ⚠️ deprecated：用 `actionsRender`。 */
  toolbarRender?: ActionsRender;
  /** ⚠️ 已移除（antd 不再支持）：预览始终在展示后渲染。 */
  forceRender?: boolean;
  /** ⚠️ 已移除：同上。 */
  destroyOnClose?: boolean;
  movable?: boolean;
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  zIndex?: number;
  getContainer?: () => HTMLElement;
  icons?: PreviewIcons;
  imageRender?: (info: { originNode: VNodeChild; src: string }) => VNodeChild;
  actionsRender?: ActionsRender;
  countRender?: (current: number, total: number) => VNodeChild;
}

export type ActionsRender = (
  originNode: VNodeChild,
  info: {
    icons: PreviewIcons;
    actions: Record<string, unknown>;
    transform: TransformInfo;
    current: number;
    total: number;
    image: { src: string; width?: number | string; height?: number | string; alt?: string };
    onAction: (action: unknown) => void;
  },
) => VNodeChild;

/** rc 的 transform（useImageTransform）。 */
export interface TransformInfo {
  rotate: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
  x: number;
  y: number;
}

export type GroupPreviewConfig = PreviewConfig;

/** antd 的 ImageSemanticType（5 组；popup/placeholder 是嵌套组）。 */
export interface ImageSemanticType {
  classNames?: {
    root?: string;
    image?: string;
    cover?: string;
    placeholder?: { progress?: ProgressClassNames };
    popup?: {
      root?: string;
      mask?: string;
      body?: string;
      footer?: string;
      actions?: string;
      close?: string;
    };
  };
  styles?: {
    root?: Record<string, string | number>;
    image?: Record<string, string | number>;
    cover?: Record<string, string | number>;
    placeholder?: { progress?: ProgressStyles };
    popup?: {
      root?: Record<string, string | number>;
      mask?: Record<string, string | number>;
      body?: Record<string, string | number>;
      footer?: Record<string, string | number>;
      actions?: Record<string, string | number>;
      close?: Record<string, string | number>;
    };
  };
}

/** rc-image 透传的 img 原生属性面（COMMON_PROPS 子集）。 */
export interface ImageCommonProps {
  alt?: string;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  decoding?: 'async' | 'auto' | 'sync';
  loading?: 'eager' | 'lazy';
  referrerPolicy?: string;
  sizes?: string;
  srcSet?: string;
  useMap?: string;
  draggable?: boolean;
}

export interface ImageProps extends ImageCommonProps {
  prefixCls?: string;
  src?: string;
  width?: number | string;
  height?: number | string;
  /** 加载失败兜底图（也可以是 URL）。 */
  fallback?: string;
  placeholder?: PlaceholderType;
  open?: boolean;
  defaultOpen?: boolean;
  preview?: boolean | PreviewConfig;
  /** ⚠️ deprecated：用 `styles.root`。 */
  wrapperStyle?: Record<string, string | number>;
  classNames?: ImageSemanticType['classNames'];
  styles?: ImageSemanticType['styles'];
  /** 标准Vue事件监听器注册，对应emits。 */
  onClick?: (e: MouseEvent) => void;
  onError?: (e: Event) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  onOpenChange?: (open: boolean, prevOpen: boolean) => void;
  onTransform?: (info: TransformInfo) => void;
  'onUpdate:open'?: (open: boolean) => void;
}

export interface ImageSlots {
  imageRender?: (info: ImageRenderInfo) => VNodeChild;
}

export interface ImageRenderInfo {
  originNode: VNode;
  /** 原图当前 src 属性，包含 fallback；未提供时为 undefined。 */
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  classNames: { image?: string };
}

export interface PreviewGroupProps {
  previewPrefixCls?: string;
  items?: Array<string | { src: string; [key: string]: unknown }>;
  preview?: boolean | GroupPreviewConfig;
  open?: boolean;
  defaultOpen?: boolean;
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number, prevCurrent: number) => void;
  onOpenChange?: (open: boolean, prevOpen: boolean) => void;
  onTransform?: (info: TransformInfo) => void;
  'onUpdate:open'?: (open: boolean) => void;
  'onUpdate:current'?: (current: number) => void;
  classNames?: ImageSemanticType['classNames'];
  styles?: ImageSemanticType['styles'];
}
