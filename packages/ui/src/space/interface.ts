/** Apollo Space public contracts. Historical source references remain in docs/analysis/space.md. */
import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig, Variant } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { InputStatus } from './statusUtils';
import type { Orientation } from './useOrientation';

export type { InputStatus, Orientation };

export interface SpaceSemanticClassNames {
  root?: string;
  item?: string;
  separator?: string;
}
export interface SpaceSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
  separator?: CSSProperties;
}
export type SpaceSemanticValue<T> = T | ((info: { props: SpaceProps }) => T);
export interface SpaceSemanticType {
  classNames?: SpaceSemanticClassNames;
  styles?: SpaceSemanticStyles;
}
export interface SpaceSemanticAllType {
  classNames: SpaceSemanticClassNames;
  classNamesAndFn: SpaceSemanticValue<SpaceSemanticClassNames>;
  styles: SpaceSemanticStyles;
  stylesAndFn: SpaceSemanticValue<SpaceSemanticStyles>;
}
export type SpaceSize = SizeType | number;
export type SpaceAlign = 'start' | 'end' | 'center' | 'baseline';

export interface SpaceProps {
  prefixCls?: string;
  /** Current space.size configuration is used before the small fallback. Zero is valid. */
  size?: SpaceSize | [SpaceSize, SpaceSize];
  /** @deprecated Use orientation. */
  direction?: Orientation;
  /** Explicit false takes priority over legacy direction; orientation takes priority over both. */
  vertical?: boolean;
  orientation?: Orientation;
  /** Defaults to center horizontally; remains unset vertically. */
  align?: SpaceAlign;
  /** @deprecated Use separator data or the #separator slot. */
  split?: VNodeChild;
  /** Complete Vue content data. A present #separator slot wins, including empty content. */
  separator?: VNodeChild;
  /** Enables flex wrapping; vertical wrapping needs a bounded container height. */
  wrap?: boolean;
  classNames?: SpaceSemanticValue<SpaceSemanticClassNames>;
  styles?: SpaceSemanticValue<SpaceSemanticStyles>;
}
export type SpaceSlot = () => VNodeChild;
export interface SpaceRef {
  nativeElement: HTMLDivElement | null;
}

/** Reactive context shared by native controls; no DOM wrapper is introduced. */
export interface SpaceCompactItemContextType {
  compactSize?: SizeType;
  compactDirection?: Orientation;
  isFirstItem?: boolean;
  isLastItem?: boolean;
}
export interface SpaceCompactProps {
  prefixCls?: string;
  /** Uses current ConfigProvider.componentSize when omitted. */
  size?: SizeType;
  /** @deprecated Use orientation. */
  direction?: Orientation;
  orientation?: Orientation;
  vertical?: boolean;
  block?: boolean;
}
export interface SpaceCompactRef {
  nativeElement: HTMLDivElement | null;
}

export interface SpaceAddonProps {
  prefixCls?: string;
  variant?: Variant;
  /** Decorative state of this cell; descendant controls retain their own disabled state. */
  disabled?: boolean;
  status?: InputStatus;
}
export interface SpaceAddonRef {
  nativeElement: HTMLDivElement | null;
}
export interface SpaceConfig extends ComponentStyleConfig, SpaceSemanticType {
  size?: SpaceSize | [SpaceSize, SpaceSize];
}
