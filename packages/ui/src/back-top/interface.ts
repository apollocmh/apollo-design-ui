import type { VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** Scroll container getter; pending template refs may return null. */
export type BackTopTarget = () => HTMLElement | Window | Document | null;

export interface BackTopConfig extends ComponentStyleConfig {}

export interface BackTopSlots {
  /** Complete button content; an explicitly empty slot hides the control. */
  default?: () => VNodeChild;
}

export interface BackTopExpose {
  readonly nativeElement: HTMLButtonElement | null;
}

/**
 * @deprecated Please use `GetProps<typeof FloatButton.BackTop>` instead.
 */
export interface BackTopProps {
  /** 滚动超过该值才显示（px）。 */
  visibilityHeight?: number;
  /** Vue click event (emitted once after scrolling starts). */
  onClick?: (e: MouseEvent) => void;
  /** 滚动容器（默认按钮所属的 ownerDocument）。 */
  target?: BackTopTarget;
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-back-top`。 */
  prefixCls?: string;
  /** 回顶动画时长（ms；<=0 直落）。 */
  duration?: number;
}
