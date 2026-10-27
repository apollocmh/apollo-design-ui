import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** Four independently styled hosts; arbitrary content retains its own attributes. */
export interface EmptySemanticClassNames {
  root?: string;
  image?: string;
  description?: string;
  footer?: string;
}

export interface EmptySemanticStyles {
  root?: CSSProperties;
  image?: CSSProperties;
  description?: CSSProperties;
  footer?: CSSProperties;
}

/** Semantic factories receive the current local props. */
export type EmptySemanticValue<T> = T | ((info: { props: EmptyProps }) => T);

/** Provider configuration uses object semantics. */
export interface EmptySemanticType {
  classNames?: EmptySemanticClassNames;
  styles?: EmptySemanticStyles;
}

export interface EmptySemanticAllType {
  classNames: EmptySemanticClassNames;
  classNamesAndFn: EmptySemanticValue<EmptySemanticClassNames>;
  styles: EmptySemanticStyles;
  stylesAndFn: EmptySemanticValue<EmptySemanticStyles>;
}

/** A top-level string is a URL; VNodes, arrays, primitives and component definitions are Vue content. */
export type EmptyImage = VNodeChild | Component;

export interface EmptyProps {
  /** Full component prefix; defaults to ConfigProvider's root prefix plus `-empty`. */
  prefixCls?: string;
  /** @deprecated Please use `styles.image` instead. Both merge, with styles.image taking priority. */
  imageStyle?: CSSProperties;
  /** Only undefined uses the Provider/default illustration; explicit empty values hide its host. */
  image?: EmptyImage;
  /** Only undefined uses the current locale. A present description slot overrides this value. */
  description?: VNodeChild;
  classNames?: EmptySemanticValue<EmptySemanticClassNames>;
  styles?: EmptySemanticValue<EmptySemanticStyles>;
}

export interface EmptyRef {
  nativeElement: HTMLDivElement | null;
}

type EmptyConfigFields = ComponentStyleConfig & EmptySemanticType & { image?: EmptyImage };
/** Finite fields remain assignable to ConfigProvider's component configuration record. */
export type EmptyConfig = { [K in keyof EmptyConfigFields]: EmptyConfigFields[K] };

/** Present slots override their fallback, including intentional empty content. */
export interface EmptySlots {
  image?: () => VNodeChild;
  description?: () => VNodeChild;
  default?: () => VNodeChild;
}
