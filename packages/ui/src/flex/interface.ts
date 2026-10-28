import type { Component, VNodeChild } from 'vue';
import type { Orientation } from '../_internal/use-orientation';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';

export type { Orientation };
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';
export type FlexJustify =
  | 'flex-start'
  | 'flex-end'
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'normal'
  | 'left'
  | 'right';
export type FlexAlign =
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'baseline'
  | 'normal'
  | 'stretch';

/** Native tag or a Vue component forwarding attrs/default slot to its own host. */
export type FlexComponent = Component | string;

/** Root class/style, HTML attributes and native event listeners use Vue attrs. */
export interface FlexProps {
  prefixCls?: string;
  /** Explicit orientation wins; omission permits the current flex.vertical config. */
  vertical?: boolean;
  orientation?: Orientation;
  /** true means wrap; false/omission retains the normal single line. */
  wrap?: boolean | FlexWrap;
  justify?: FlexJustify;
  /** Defaults to flex-start horizontally and stretch vertically. */
  align?: FlexAlign;
  /** Unitless numbers or a CSS flex shorthand. */
  flex?: string | number;
  /** Four preset names (medium/middle share a tier), CSS length or pixel number. */
  gap?: SizeType | string | number;
  component?: FlexComponent;
}

/** Current component defaults; native local styles win over config.style. */
export interface FlexConfig extends ComponentStyleConfig {
  vertical?: boolean;
}

/** The actual single HTML host; null before mount, after unmount or without one. */
export interface FlexRef {
  nativeElement: HTMLElement | null;
}

/** Complete Vue content; no per-item wrapper or business scope. */
export type FlexSlot = () => VNodeChild;
