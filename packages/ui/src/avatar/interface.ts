import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { PopoverProps } from '../popover/interface';

export type AvatarShape = 'circle' | 'square';
export type ScreenSizeMap = Partial<Record<Breakpoint, number>>;
export type AvatarSize = SizeType | 'default' | number | ScreenSizeMap;
export interface AvatarContextType {
  size?: AvatarSize;
  shape?: AvatarShape;
}
export interface AvatarProps {
  prefixCls?: string;
  shape?: AvatarShape;
  /** Local size overrides Group, then ConfigProvider.componentSize. */
  size?: AvatarSize;
  /** Horizontal space reserved around scaled default content. */
  gap?: number;
  /** Image URL or complete VNode data. The image slot takes precedence. */
  src?: VNodeChild;
  srcSet?: string;
  draggable?: boolean | 'true' | 'false';
  /** Complete icon data. The icon slot takes precedence. */
  icon?: VNodeChild;
  /** Native image alternative; defaults to empty for decorative avatars. */
  alt?: string;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  /** Synchronous cancellation hook, after error; return false to retain the image. */
  // biome-ignore lint/suspicious/noConfusingVoidType: Accept existing void-returning side-effect functions and explicit boolean cancellation; undefined rejects valid void callbacks.
  beforeFallback?: (event: Event) => boolean | void;
}
export interface AvatarEmits {
  click: [event: MouseEvent];
  error: [event: Event];
}
export interface AvatarSlots {
  default?: () => VNodeChild;
  image?: () => VNodeChild;
  icon?: () => VNodeChild;
}
export interface AvatarRef {
  nativeElement: HTMLSpanElement | null;
}
export type AvatarSlot = () => VNodeChild;
export interface AvatarGroupMax {
  /** Number of visible children, excluding the indicator. Zero means unlimited. */
  count?: number;
  style?: CSSProperties;
  /** Popover content/configuration. rootClassName adds a class to its popup root. */
  popover?: PopoverProps & { rootClassName?: string };
}
export interface AvatarGroupProps {
  prefixCls?: string;
  max?: AvatarGroupMax;
  size?: AvatarSize;
  shape?: AvatarShape;
}
export interface AvatarGroupRef {
  nativeElement: HTMLDivElement | null;
}
export type AvatarGroupSlot = () => VNodeChild;
/** ConfigProvider.components.avatar. */
export type AvatarConfig = { [K in keyof ComponentStyleConfig]: ComponentStyleConfig[K] };
