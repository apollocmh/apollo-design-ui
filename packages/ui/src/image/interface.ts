/**
 * image 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/image/index.tsx`（ImageProps / PreviewConfig /
 * PlaceholderType / ImageSemanticType）+ rc-image 的 ImageProps 面。按本仓 Vue 化
 * 约定重新定义（H2）：classNames/styles 收窄为静态对象形态（函数式语义槽
 * PENDING，D36 同判）。
 */

import type { VNodeChild } from 'vue';

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

/** rc-image 的 preview 配置（antd 的 OriginPreviewConfig + deprecated 面）。 */
export interface PreviewConfig {
  src?: string;
  /** 受控开合（`v-model` 等价走 onOpenChange）。 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, prevOpen: boolean) => void;
  afterOpenChange?: (open: boolean) => void;
  /** 封面（hover 层）；`false` ⇒ 不渲染。 */
  cover?: MaskNode | { placement?: CoverPlacement; coverNode?: VNodeChild };
  mask?: MaskNode;
  maskClosable?: boolean;
  closable?: boolean;
  closeIcon?: VNodeChild;
  /** ⚠️ deprecated：用 `open`。 */
  visible?: boolean;
  /** ⚠️ deprecated：用 `classNames.root`。 */
  rootClassName?: string;
  /** ⚠️ deprecated：用 `classNames.cover`。 */
  maskClassName?: string;
  /** ⚠️ deprecated：用 `actionsRender`。 */
  toolbarRender?: ActionsRender;
  /** ⚠️ deprecated：用 `onOpenChange`。 */
  onVisibleChange?: (visible: boolean, prevVisible: boolean) => void;
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
  onTransform?: (info: TransformInfo) => void;
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

/** GroupPreviewConfig = PreviewConfig + 带 current 的回调。 */
export interface GroupPreviewConfig extends Omit<PreviewConfig, 'onVisibleChange'> {
  /** ⚠️ deprecated：用 `onOpenChange`。 */
  onVisibleChange?: (visible: boolean, prevVisible: boolean, current: number) => void;
}

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
  preview?: boolean | PreviewConfig;
  /** ⚠️ deprecated：用 `styles.root`。 */
  wrapperStyle?: Record<string, string | number>;
  classNames?: ImageSemanticType['classNames'];
  styles?: ImageSemanticType['styles'];
  onClick?: (e: MouseEvent) => void;
  onError?: (e: Event) => void;
  /** 自定义 img 渲染（antd demo/imageRender）。 */
  imageRender?: (info: ImageRenderInfo) => VNodeChild;
}

export interface ImageRenderInfo {
  originNode: VNodeChild;
  src: string;
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
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number, prevCurrent: number) => void;
  classNames?: ImageSemanticType['classNames'];
  styles?: ImageSemanticType['styles'];
}
