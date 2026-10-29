import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** Divider axis. Legacy title values belong to DividerProps.orientation only. */
export type Orientation = 'horizontal' | 'vertical';
/** Logical start/end, center, or physical left/right title placement. */
export type TitlePlacement = 'left' | 'right' | 'center' | 'start' | 'end';
export type DividerVariant = 'dashed' | 'dotted' | 'solid';
/** medium and middle select the same spacing tier. */
export type DividerSize = 'small' | 'medium' | 'middle' | 'large';

export interface DividerSemanticClassNames {
  root?: string;
  rail?: string;
  content?: string;
}
export interface DividerSemanticStyles {
  root?: CSSProperties;
  rail?: CSSProperties;
  content?: CSSProperties;
}
/** Callbacks receive the current effective axis, title placement and size. */
export type DividerSemanticValue<T> = T | ((info: { props: DividerProps }) => T);
export interface DividerSemanticType {
  classNames?: DividerSemanticClassNames;
  styles?: DividerSemanticStyles;
}
export interface DividerSemanticAllType {
  classNames: DividerSemanticClassNames;
  classNamesAndFn: DividerSemanticValue<DividerSemanticClassNames>;
  styles: DividerSemanticStyles;
  stylesAndFn: DividerSemanticValue<DividerSemanticStyles>;
}

/** Root class/style, dir, ARIA and native listeners are Vue attrs. */
export interface DividerProps {
  /** Complete component class prefix; otherwise resolved from ConfigProvider. */
  prefixCls?: string;
  /** @deprecated Use orientation for the axis. */
  type?: Orientation;
  /** Axis; legacy title positions remain accepted with a warning. */
  orientation?: Orientation | TitlePlacement;
  /** Explicit false overrides type. An omitted value stays undefined. */
  vertical?: boolean;
  titlePlacement?: TitlePlacement;
  /**
   * @deprecated Use styles.content.margin for new code.
   * Distance from the nearest edge at start/end. Decimal numeric strings use px.
   */
  orientationMargin?: string | number;
  /** Dashed fallback; an explicit dotted variant controls both titled and plain rails. */
  dashed?: boolean;
  /** @default 'solid' */
  variant?: DividerVariant;
  /** Horizontal spacing. Vertical dividers ignore size. */
  size?: DividerSize;
  /** Use body typography for a title. */
  plain?: boolean;
  classNames?: DividerSemanticValue<DividerSemanticClassNames>;
  styles?: DividerSemanticValue<DividerSemanticStyles>;
}

export interface DividerRef {
  nativeElement: HTMLDivElement | null;
}
/** Provider defaults; these fields are distinct from native component attrs. */
export type DividerConfig = ComponentStyleConfig & Pick<DividerProps, 'classNames' | 'styles'>;
/** Complete Vue title content; ignored with a warning in vertical mode. */
export type DividerSlot = () => VNodeChild;
