/** Native Vue Skeleton contracts. Root class/style are attributes; block configs are data. */
import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';

export interface SkeletonElementSemanticClassNames {
  root?: string;
  content?: string;
}
export interface SkeletonElementSemanticStyles {
  root?: CSSProperties;
  content?: CSSProperties;
}
export interface SkeletonElementSemanticType {
  classNames?: SkeletonElementSemanticClassNames;
  styles?: SkeletonElementSemanticStyles;
}
export type SkeletonShape = 'circle' | 'square' | 'round' | 'default';
export type SkeletonElementSize = SizeType | number | 'default';

/** Shared standalone shape props. Native class/style belong to the outer root. */
export interface SkeletonElementProps {
  prefixCls?: string;
  /** The existing 'default' size alias is deprecated in favor of 'medium'. */
  size?: SkeletonElementSize;
  shape?: SkeletonShape;
  active?: boolean;
  classNames?: SkeletonElementSemanticClassNames;
  styles?: SkeletonElementSemanticStyles;
}
export interface SkeletonAvatarOwnProps extends Omit<SkeletonElementProps, 'shape'> {
  shape?: 'circle' | 'square';
}
/** The avatar block is one element, rather than the standalone two-layer component. */
export interface SkeletonAvatarProps
  extends Pick<SkeletonAvatarOwnProps, 'prefixCls' | 'size' | 'shape'> {
  className?: string;
  style?: CSSProperties;
}
export interface SkeletonButtonProps extends Omit<SkeletonElementProps, 'size'> {
  /** @deprecated 'default' is an existing alias; use 'medium'. */
  size?: SizeType | 'default';
  block?: boolean;
}
export interface SkeletonInputProps extends Omit<SkeletonElementProps, 'size' | 'shape'> {
  /** @deprecated 'default' is an existing alias; use 'medium'. */
  size?: SizeType | 'default';
  block?: boolean;
}
export interface SkeletonNodeProps extends Omit<SkeletonElementProps, 'size' | 'shape'> {
  /** Content class override used by Skeleton.Image; an empty string uses the node class. */
  internalClassName?: string;
}
export type SkeletonImageProps = Omit<SkeletonNodeProps, 'internalClassName'>;

export type SkeletonWidthUnit = number | string;
export interface SkeletonTitleProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  width?: SkeletonWidthUnit;
}
export interface SkeletonParagraphProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  /** Arrays apply per row; a scalar applies to the last row. */
  width?: SkeletonWidthUnit | SkeletonWidthUnit[];
  /** Nonfinite/negative rows produce no lines; positive fractions are truncated. */
  rows?: number;
}

export interface SkeletonSemanticClassNames {
  root?: string;
  header?: string;
  section?: string;
  avatar?: string;
  title?: string;
  paragraph?: string;
}
export interface SkeletonSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  section?: CSSProperties;
  avatar?: CSSProperties;
  title?: CSSProperties;
  paragraph?: CSSProperties;
}
export type SkeletonSemanticValue<T> = T | ((info: { props: SkeletonProps }) => T);
export interface SkeletonSemanticType {
  classNames?: SkeletonSemanticClassNames;
  styles?: SkeletonSemanticStyles;
}
export interface SkeletonSemanticAllType {
  classNames: SkeletonSemanticClassNames;
  classNamesAndFn: SkeletonSemanticValue<SkeletonSemanticClassNames>;
  styles: SkeletonSemanticStyles;
  stylesAndFn: SkeletonSemanticValue<SkeletonSemanticStyles>;
}
export interface SkeletonProps {
  active?: boolean;
  /** Only false renders the unwrapped default slot. No value means loading. */
  loading?: boolean;
  prefixCls?: string;
  avatar?: SkeletonAvatarProps | boolean;
  title?: SkeletonTitleProps | boolean;
  paragraph?: SkeletonParagraphProps | boolean;
  round?: boolean;
  classNames?: SkeletonSemanticValue<SkeletonSemanticClassNames>;
  styles?: SkeletonSemanticValue<SkeletonSemanticStyles>;
}
/** Null while real content is shown or after unmount. */
export interface SkeletonRef {
  nativeElement: HTMLDivElement | null;
}
export type SkeletonSlot = () => VNodeChild;
/** Complete native content for Skeleton.Node and Skeleton.Image. */
export type SkeletonNodeSlot = () => VNodeChild;
export type SkeletonConfig = ComponentStyleConfig & Pick<SkeletonProps, 'classNames' | 'styles'>;
